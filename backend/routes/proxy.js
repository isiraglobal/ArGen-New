/**
 * AI API Proxy — Usage measurement proxy.
 * FORWARDING DISABLED: This proxy only records transaction metadata.
 * It does NOT forward requests to AI providers or use user API keys.
 * All measurement happens via passive extension capture (extensions + capture API).
 */
const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { protect } = require('../middleware/auth');

// FieldValue shim — works in real + mock DB
const increment = (n) => {
  try {
    const admin = require('firebase-admin');
    if (admin.firestore && admin.firestore.FieldValue) {
      return admin.firestore.FieldValue.increment(n);
    }
  } catch {}
  return { _increment: n };
};

// ArGen's own API keys — used ONLY for internal analysis, never user keys.
// These incur zero cost to the end user.
function getArgenApiKey(provider) {
  const keyMap = {
    openai: process.env.OPENAI_API_KEY,
    anthropic: process.env.ANTHROPIC_API_KEY,
    gemini: process.env.GEMINI_API_KEY
  };
  return keyMap[provider] || null;
}

const PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    costs: { 'gpt-4o': { input: 2.50, output: 10.00 }, 'gpt-4o-mini': { input: 0.15, output: 0.60 }, 'gpt-4-turbo': { input: 10.00, output: 30.00 }, 'gpt-3.5-turbo': { input: 0.50, output: 1.50 }, default: { input: 1.00, output: 2.00 } },
    headers: (key) => ({ 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' })
  },
  anthropic: {
    baseUrl: 'https://api.anthropic.com/v1',
    costs: { 'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 }, 'claude-3-haiku-20240307': { input: 0.25, output: 1.25 }, 'claude-3-opus-20240229': { input: 15.00, output: 75.00 }, default: { input: 3.00, output: 15.00 } },
    headers: (key) => ({ 'x-api-key': key, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' })
  },
  gemini: {
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
    costs: { 'gemini-2.0-flash': { input: 0.10, output: 0.40 }, 'gemini-1.5-pro': { input: 1.25, output: 5.00 }, default: { input: 0.10, output: 0.40 } },
    headers: (key) => ({ 'Content-Type': 'application/json' }),
    queryKey: 'key'  // Gemini passes API key as query param
  }
};

function estimateTokens(text) {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

function getCost(model, tokens, type, config) {
  const modelCost = config.costs[model] || config.costs.default;
  const rate = type === 'output' ? modelCost.output : modelCost.input;
  return (tokens / 1000) * rate;
}

function getTotalInputTokens(body, provider) {
  if (provider === 'openai') {
    return body.messages?.reduce((sum, m) => sum + estimateTokens(m.content || ''), 0) || estimateTokens(JSON.stringify(body));
  }
  if (provider === 'anthropic') {
    return body.messages?.reduce((sum, m) => {
      const text = m.content?.[0]?.text || m.content || '';
      return sum + estimateTokens(text);
    }, 0) || estimateTokens(JSON.stringify(body));
  }
  return estimateTokens(JSON.stringify(body));
}

// POST /api/proxy/:provider/:endpoint — Record transaction metadata (NO forwarding)
router.post('/:provider/:endpoint(*)', protect, async (req, res) => {
  const { provider, endpoint } = req.params;
  const config = PROVIDER_CONFIGS[provider];
  if (!config) return res.status(400).json({ error: `Unsupported provider: ${provider}. Supported: ${Object.keys(PROVIDER_CONFIGS).join(', ')}` });

  const companyId = req.user.companyId;
  const userId = req.user.id;

  // ArGen does NOT use user API keys. This proxy records transaction metadata
  // from the capture extensions — it never forwards requests to AI providers.
  // All measurement is passive and costs users nothing.
  const inputTokens = getTotalInputTokens(req.body, provider);
  const model = req.body.model || 'unknown';

  // Record the transaction in Firestore — passive usage tracking
  const txRef = await db.collection('ai_proxy_transactions').add({
    companyId,
    userId,
    provider,
    model,
    endpoint,
    inputTokens,
    outputTokens: 0,
    totalTokens: inputTokens,
    inputCost: 0,
    outputCost: 0,
    totalCost: 0,
    status: 'recorded',
    source: req.body.source || 'capture',
    timestamp: new Date().toISOString(),
    date: new Date().toISOString().split('T')[0]
  });

  // Update daily aggregate
  const dailyRef = db.collection('ai_usage_daily').doc(`${companyId}_${userId}_${new Date().toISOString().split('T')[0]}`);
  await dailyRef.set({
    companyId, userId, provider, model,
    date: new Date().toISOString().split('T')[0],
    transactions: increment(1),
    inputTokens: increment(inputTokens),
    outputTokens: increment(0),
    totalCost: increment(0),
    lastActivity: new Date().toISOString()
  }, { merge: true }).catch(() => {});

  res.json({
    recorded: true,
    txId: txRef.id,
    msg: 'Usage recorded. ArGen does not forward AI API calls — all measurement is passive and costs you nothing.',
    tokens: { input: inputTokens, total: inputTokens }
  });
});

// GET /api/proxy/stats — Get real-time usage stats for the user's company
router.get('/stats', protect, async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId) return res.json({ transactions: 0, users: 0, tokens: 0, cost: 0 });

  try {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const weekStart = startOfWeek.toISOString().split('T')[0];
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];

    // Today's stats
    const todaySnapshot = await db.collection('ai_proxy_transactions')
      .where('companyId', '==', companyId)
      .where('date', '==', today)
      .get();

    let todayTx = 0, todayTokens = 0, todayCost = 0;
    const userTx = {};
    const userTokens = {};
    const providerTx = {};

    todaySnapshot.docs.forEach(doc => {
      const d = doc.data();
      todayTx++;
      todayTokens += d.totalTokens || 0;
      todayCost += d.totalCost || 0;
      const uid = d.userId || 'unknown';
      userTx[uid] = (userTx[uid] || 0) + 1;
      userTokens[uid] = (userTokens[uid] || 0) + (d.totalTokens || 0);
      providerTx[d.provider] = (providerTx[d.provider] || 0) + 1;
    });

    // This week
    const weekSnapshot = await db.collection('ai_proxy_transactions')
      .where('companyId', '==', companyId)
      .where('date', '>=', weekStart)
      .get();
    const weekTx = weekSnapshot.size;

    // This month
    const monthSnapshot = await db.collection('ai_proxy_transactions')
      .where('companyId', '==', companyId)
      .where('date', '>=', startOfMonth)
      .get();
    const monthTx = monthSnapshot.size;
    let monthTokens = 0, monthCost = 0;
    monthSnapshot.docs.forEach(doc => {
      const d = doc.data();
      monthTokens += d.totalTokens || 0;
      monthCost += d.totalCost || 0;
    });

    // Active users (any transaction today)
    const activeUsers = Object.keys(userTx).length;

    // Top users
    const topUsers = Object.entries(userTx)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([uid, count]) => ({ userId: uid, transactions: count, tokens: userTokens[uid] || 0 }));

    res.json({
      today: {
        date: today,
        transactions: todayTx,
        tokens: todayTokens,
        cost: Math.round(todayCost * 100) / 100,
        activeUsers,
        topUsers,
        perProvider: providerTx
      },
      week: { transactions: weekTx },
      month: {
        transactions: monthTx,
        tokens: monthTokens,
        cost: Math.round(monthCost * 100) / 100
      },
      perUser: Object.entries(userTx).map(([uid, tx]) => ({
        userId: uid,
        transactions: tx,
        tokens: userTokens[uid] || 0
      }))
    });
  } catch (err) {
    console.error('[proxy/stats] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/proxy/transactions — List recent transactions
router.get('/transactions', protect, async (req, res) => {
  const companyId = req.user.companyId;
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const { provider, status, userId } = req.query;

  try {
    let query = db.collection('ai_proxy_transactions')
      .where('companyId', '==', companyId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    if (provider) query = query.where('provider', '==', provider);
    if (status) query = query.where('status', '==', status);
    if (userId) query = query.where('userId', '==', userId);

    const snapshot = await query.get();
    const transactions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ transactions, total: transactions.length });
  } catch (err) {
    console.error('[proxy/transactions] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;