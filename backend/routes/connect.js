const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { db } = require('../utils/supabase');
const providers = require('../utils/ai-providers');
const { encrypt, decrypt } = providers;

const clientUrl = process.env.CLIENT_URL || 'https://argen.isira.club';

// GET /api/connect — list connections for company
router.get('/', protect, async (req, res) => {
  try {
    if (!req.user.companyId) {
      return res.json({ connections: [] });
    }
    const connections = await db.collection('ai_connections')
      .where('companyId', '==', req.user.companyId)
      .get();
    const data = connections.docs.map(d => {
      const row = d.data();
      return {
        id: d.id,
        provider: row.provider,
        status: row.connectionStatus,
        connectedAt: row.connectedAt,
        lastSynced: row.lastSyncedAt
      };
    });
    res.json({ connections: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/connect/oauth/:provider — initiate OAuth
router.get('/oauth/:provider', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const { provider } = req.params;
  // Generate random nonce and store in DB for CSRF validation
  const stateNonce = crypto.randomBytes(24).toString('hex');
  try {
    await db.collection('oauth_states').add({
      nonce: stateNonce,
      companyId: req.user.companyId,
      provider,
      createdAt: new Date().toISOString()
    });
  } catch {}
  const authUrl = providers.getOAuthUrl(provider, stateNonce);
  if (!authUrl) return res.status(400).json({ error: 'Provider not supported or not configured' });
  res.json({ url: authUrl });
});

// GET /api/connect/oauth/:provider/callback — OAuth callback
router.get('/oauth/:provider/callback', async (req, res) => {
  const { provider } = req.params;
  const { code, state } = req.query;
  if (!code || !state) {
    return res.redirect(`${clientUrl}/connect?error=missing_params&provider=${provider}`);
  }
  try {
    // Validate state nonce to prevent CSRF
    const states = await db.collection('oauth_states')
      .where('nonce', '==', state)
      .where('provider', '==', provider)
      .limit(1)
      .get();
    if (states.empty) {
      return res.redirect(`${clientUrl}/connect?error=invalid_state&provider=${provider}`);
    }
    const stateData = states.docs[0].data();
    const companyId = stateData.companyId;
    // Clean up used nonce
    await db.collection('oauth_states').doc(states.docs[0].id).delete();
    
    const tokens = await providers.exchangeCode(provider, code);
    const orgId = await providers.getOrgId(provider, tokens.access_token);

    await db.collection('ai_connections').add({
      companyId,
      provider,
      connectionStatus: 'active',
      accessToken: encrypt(tokens.access_token),
      refreshToken: encrypt(tokens.refresh_token) || null,
      orgId,
      connectedAt: new Date().toISOString()
    });

    providers.syncUsage(provider, companyId, tokens.access_token).catch(err => {
      console.error(`[ArGen] Background sync failed for ${provider}:`, err.message);
    });

    res.redirect(`${clientUrl}/connect?connected=${provider}`);
  } catch (err) {
    console.error(`OAuth callback error for ${provider}:`, err);
    res.redirect(`${clientUrl}/connect?error=connection_failed&provider=${provider}`);
  }
});

// POST /api/connect/apikey — manual API key connection
router.post('/apikey', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const { provider, apiKey, orgId } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'provider and apiKey required' });
  }
  if (!req.user.companyId) {
    return res.status(403).json({ error: 'No company associated with this account' });
  }

  try {
    const valid = await providers.validateApiKey(provider, apiKey);
    if (!valid) return res.status(400).json({ error: 'API key invalid or insufficient permissions' });

    // Remove existing connection for same provider
    const existing = await db.collection('ai_connections')
      .where('companyId', '==', req.user.companyId)
      .where('provider', '==', provider)
      .get();
    for (const doc of existing.docs) {
      await doc.ref.delete();
    }

    await db.collection('ai_connections').add({
      companyId: req.user.companyId,
      provider,
      connectionStatus: 'active',
      accessToken: encrypt(apiKey),
      orgId: orgId || null,
      connectedAt: new Date().toISOString()
    });

    providers.syncUsage(provider, req.user.companyId, apiKey).catch(err => {
      console.error(`[ArGen] Background sync failed for ${provider}:`, err.message);
    });

    res.json({ success: true, provider });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/connect/sync/:provider — manual sync trigger
router.post('/sync/:provider', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const { provider } = req.params;
  try {
    const conn = await db.collection('ai_connections')
      .where('companyId', '==', req.user.companyId)
      .where('provider', '==', provider)
      .limit(1)
      .get();
    if (conn.empty) return res.status(404).json({ error: 'Connection not found' });
    const row = conn.docs[0].data();
    const accessToken = decrypt(row.accessToken);
    const result = await providers.syncUsage(provider, req.user.companyId, accessToken);
    res.json({ success: true, message: 'Sync complete', ...result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/connect/:connectionId
router.delete('/:connectionId', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    const doc = await db.collection('ai_connections').doc(req.params.connectionId).get();
    if (!doc.exists) return res.status(404).json({ error: 'Connection not found' });
    if (doc.data().companyId !== req.user.companyId && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    await db.collection('ai_connections').doc(req.params.connectionId).delete();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
