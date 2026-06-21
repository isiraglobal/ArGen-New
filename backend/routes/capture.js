const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');

// ─────────────────────────────────────────────────────────
// CAPTURE API — The single ingestion endpoint for all
// extensions, IDE plugins, browser agents, and proxy
// forwarders to report AI interactions in real-time.
// ─────────────────────────────────────────────────────────

const VALID_PROVIDERS = ['openai', 'anthropic', 'gemini', 'github', 'microsoft', 'copilot', 'cursor', 'claude', 'chatgpt', 'perplexity', 'replit', 'windsurf'];
const VALID_EVENT_TYPES = ['completion', 'chat', 'code_suggestion', 'image_gen', 'embedding', 'search', 'document_edit', 'debug', 'review'];

// Auth via API key header (for extensions) OR JWT (for dashboard)
async function resolveCompany(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const bearer = req.headers['authorization'];

  try {
    if (apiKey) {
      // Find company by API key
      const keys = await db.collection('api_keys')
        .where('key', '==', apiKey)
        .where('active', '==', true)
        .limit(1)
        .get();

      if (keys.empty) {
        return res.status(401).json({ error: 'Invalid API key' });
      }

      const keyData = keys.docs[0].data();
      req.companyId = keyData.companyId;
      req.userId = req.headers['x-user-id'] || null;
      req.departmentId = req.headers['x-department-id'] || null;
      req.apiKeyName = keyData.name;
      req.clientInfo = {
        source: req.headers['x-source'] || 'api_key',
        version: req.headers['x-agent-version'] || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      };

      // Update last used timestamp (fire-and-forget)
      keys.docs[0].ref.update({ lastUsedAt: new Date().toISOString() }).catch(() => {});

      return next();
    }

    if (bearer && bearer.startsWith('Bearer ')) {
      const token = bearer.slice(7);

      // Allow mock-token for local development only
      if (process.env.NODE_ENV !== 'production' && (token === 'mock-token' || global.MOCK_DB)) {
        req.companyId = 'mock-company-id';
        req.userId = 'mock-uid';
        req.departmentId = req.headers['x-department-id'] || null;
        req.clientInfo = {
          source: req.headers['x-source'] || 'dashboard',
          version: req.headers['x-agent-version'] || 'unknown',
          userAgent: req.headers['user-agent'] || ''
        };
        return next();
      }

      const { auth } = require('../utils/firebase');
      const decoded = await auth.verifyIdToken(token);
      req.companyId = decoded.companyId;
      req.userId = decoded.uid;
      req.departmentId = req.headers['x-department-id'] || null;
      req.clientInfo = {
        source: req.headers['x-source'] || 'dashboard',
        version: req.headers['x-agent-version'] || 'unknown',
        userAgent: req.headers['user-agent'] || ''
      };
      return next();
    }

    return res.status(401).json({ error: 'Authentication required. Provide x-api-key or Authorization: Bearer <token>' });
  } catch (err) {
    return res.status(401).json({ error: 'Authentication failed: ' + err.message });
  }
}

// Validate interaction payload
function validateInteraction(req, res, next) {
  const { provider, model, eventType, inputTokens, outputTokens, costUsd, prompt, completion, context } = req.body;

  if (!provider) return res.status(400).json({ error: 'provider is required' });
  if (!VALID_PROVIDERS.includes(provider.toLowerCase())) {
    return res.status(400).json({ error: `Invalid provider. Valid: ${VALID_PROVIDERS.join(', ')}` });
  }

  req.parsed = {
    provider: provider.toLowerCase(),
    model: model || 'unknown',
    eventType: eventType && VALID_EVENT_TYPES.includes(eventType.toLowerCase()) ? eventType.toLowerCase() : 'completion',
    inputTokens: Math.max(0, parseInt(inputTokens) || 0),
    outputTokens: Math.max(0, parseInt(outputTokens) || 0),
    costUsd: parseFloat(costUsd) || 0,
    prompt: prompt ? prompt.slice(0, 50000) : '',
    completion: completion ? completion.slice(0, 50000) : '',
    context: {
      filePath: context?.filePath || '',
      language: context?.language || '',
      framework: context?.framework || '',
      repo: context?.repo || '',
      branch: context?.branch || '',
      project: context?.project || '',
      ticketId: context?.ticketId || '',
      sprintId: context?.sprintId || '',
      departmentId: req.departmentId || context?.departmentId || '',
      teamId: context?.teamId || '',
      workflowChainId: context?.workflowChainId || '',
      parentInteractionId: context?.parentInteractionId || '',
      url: context?.url || '',
      intent: context?.intent || '',
      duration: Math.max(0, parseInt(context?.durationMs) || 0)
    },
    rawTimestamp: req.body.timestamp || new Date().toISOString()
  };

  next();
}

// ─────────────────────────────────────────────────────────
// POST /api/capture/interaction — Report a single AI interaction
// Used by: Browser extensions, IDE plugins, CLI agents
// ─────────────────────────────────────────────────────────
router.post('/interaction', resolveCompany, validateInteraction, async (req, res) => {
  try {
    const { parsed, companyId, userId, clientInfo } = req;

    const event = {
      companyId,
      userId: userId || null,
      provider: parsed.provider,
      model: parsed.model,
      eventType: parsed.eventType,
      inputTokens: parsed.inputTokens,
      outputTokens: parsed.outputTokens,
      costUsd: parsed.costUsd,
      promptHash: hashString(parsed.prompt),
      promptLength: parsed.prompt.length,
      completionLength: parsed.completion.length,
      context: parsed.context,
      source: clientInfo.source,
      agentVersion: clientInfo.version,
      userAgent: clientInfo.userAgent,
      eventTimestamp: parsed.rawTimestamp,
      createdAt: new Date().toISOString()
    };

    const docRef = await db.collection('ai_usage_events').add(event);

    // Fire-and-forget: update daily aggregates
    updateDailyAgg(companyId, parsed.provider, parsed.inputTokens, parsed.outputTokens, parsed.costUsd, userId || 'unknown')
      .catch(() => {});

    res.status(201).json({
      id: docRef.id,
      status: 'captured',
      provider: parsed.provider,
      tokens: parsed.inputTokens + parsed.outputTokens,
      cost: parsed.costUsd
    });
  } catch (err) {
    res.status(500).json({ error: 'Capture failed: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/capture/batch — Report multiple interactions at once
// Used by: Proxy forwarders, batch sync from provider APIs
// ─────────────────────────────────────────────────────────
router.post('/batch', resolveCompany, async (req, res) => {
  try {
    const { interactions } = req.body;
    if (!Array.isArray(interactions) || interactions.length === 0) {
      return res.status(400).json({ error: 'interactions array is required' });
    }

    if (interactions.length > 500) {
      return res.status(400).json({ error: 'Batch limit is 500 interactions per request' });
    }

    const batch = db.collection('ai_usage_events');
    const results = [];
    const aggUpdates = {};

    for (const item of interactions) {
      const event = {
        companyId: req.companyId,
        userId: item.userId || req.userId || null,
        provider: (item.provider || '').toLowerCase(),
        model: item.model || 'unknown',
        eventType: item.eventType || 'completion',
        inputTokens: Math.max(0, parseInt(item.inputTokens) || 0),
        outputTokens: Math.max(0, parseInt(item.outputTokens) || 0),
        costUsd: parseFloat(item.costUsd) || 0,
        promptHash: hashString(item.prompt || ''),
        promptLength: (item.prompt || '').length,
        completionLength: (item.completion || '').length,
        context: item.context || {},
        source: req.clientInfo?.source || 'batch',
        eventTimestamp: item.timestamp || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };

      const docRef = await batch.add(event);
      results.push(docRef.id);

      // Aggregate key for daily update
      const aggKey = `${event.provider}_${(event.userId || 'unknown')}`;
      if (!aggUpdates[aggKey]) {
        aggUpdates[aggKey] = { inputTokens: 0, outputTokens: 0, cost: 0 };
      }
      aggUpdates[aggKey].inputTokens += event.inputTokens;
      aggUpdates[aggKey].outputTokens += event.outputTokens;
      aggUpdates[aggKey].cost += event.costUsd;
    }

    // Update aggregates (fire-and-forget)
    for (const [key, vals] of Object.entries(aggUpdates)) {
      const [provider, userId] = key.split('_');
      updateDailyAgg(req.companyId, provider, vals.inputTokens, vals.outputTokens, vals.cost, userId)
        .catch(() => {});
    }

    res.status(201).json({ captured: results.length, ids: results });
  } catch (err) {
    res.status(500).json({ error: 'Batch capture failed: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────
// POST /api/capture/session — Start/end a workflow session
// Tracks multi-step AI workflows across departments
// ─────────────────────────────────────────────────────────
router.post('/session', resolveCompany, async (req, res) => {
  try {
    const { action, workflowChainId, departmentId, teamId, ticketId, intent, project } = req.body;

    if (!action || !['start', 'end'].includes(action)) {
      return res.status(400).json({ error: 'action must be "start" or "end"' });
    }

    const sessionId = workflowChainId || `wf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    if (action === 'start') {
      await db.collection('workflow_sessions').doc(sessionId).set({
        companyId: req.companyId,
        userId: req.userId,
        departmentId: departmentId || req.departmentId || '',
        teamId: teamId || '',
        ticketId: ticketId || '',
        intent: intent || '',
        project: project || '',
        status: 'active',
        interactionCount: 0,
        totalTokens: 0,
        totalCost: 0,
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });

      res.status(201).json({ sessionId, status: 'started' });
    } else {
      const sessionDoc = await db.collection('workflow_sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        return res.status(404).json({ error: 'Session not found' });
      }

      const sessionData = sessionDoc.data();
      const endTime = new Date().toISOString();
      const startTime = new Date(sessionData.startedAt).getTime();
      const duration = Date.now() - startTime;

      await db.collection('workflow_sessions').doc(sessionId).update({
        status: 'completed',
        durationMs: duration,
        completedAt: endTime
      });

      // Copy session summary to analytics
      const sessionSummary = {
        companyId: req.companyId,
        userId: sessionData.userId,
        departmentId: sessionData.departmentId,
        teamId: sessionData.teamId,
        sessionId,
        intent: sessionData.intent,
        project: sessionData.project,
        ticketId: sessionData.ticketId,
        interactionCount: sessionData.interactionCount,
        totalTokens: sessionData.totalTokens,
        totalCost: sessionData.totalCost,
        durationMs: duration,
        startedAt: sessionData.startedAt,
        completedAt: endTime
      };

      await db.collection('workflow_analytics').add(sessionSummary);

      res.json({ sessionId, status: 'completed', summary: sessionSummary });
    }
  } catch (err) {
    res.status(500).json({ error: 'Session error: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────
// GET /api/capture/events — Query captured events (paginated)
// ─────────────────────────────────────────────────────────
router.get('/events', resolveCompany, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const provider = req.query.provider;
    const userId = req.query.userId;
    const from = req.query.from;
    const to = req.query.to;

    let query = db.collection('ai_usage_events')
      .where('companyId', '==', req.companyId);

    if (provider) query = query.where('provider', '==', provider.toLowerCase());
    if (userId) query = query.where('userId', '==', userId);
    if (from) query = query.where('eventTimestamp', '>=', from);
    if (to) query = query.where('eventTimestamp', '<=', to);

    query = query.orderBy('eventTimestamp', 'desc').limit(limit);

    const snapshot = await query.get();
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Strip prompt/completion content for non-admin — return only metadata
      promptHash: req.clientInfo?.source === 'api_key' ? doc.data().promptHash : undefined,
      promptLength: doc.data().promptLength,
      completionLength: doc.data().completionLength,
      prompt: undefined,
      completion: undefined
    }));

    res.json({ events, count: events.length });
  } catch (err) {
    res.status(500).json({ error: 'Query failed: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────
// Helper: update daily aggregate counters
// ─────────────────────────────────────────────────────────
async function updateDailyAgg(companyId, provider, inputTokens, outputTokens, cost, userId) {
  const today = new Date().toISOString().split('T')[0];
  const aggId = `${companyId}_${provider}_${userId}_${today}`;

  const existing = await db.collection('ai_usage_daily').doc(aggId).get();

  if (existing.exists) {
    const data = existing.data();
    await existing.ref.update({
      totalRequests: (data.totalRequests || 0) + 1,
      totalInputTokens: (data.totalInputTokens || 0) + inputTokens,
      totalOutputTokens: (data.totalOutputTokens || 0) + outputTokens,
      totalCostUsd: parseFloat(data.totalCostUsd || 0) + cost,
      activeMinutes: data.activeMinutes || 0
    });
  } else {
    await db.collection('ai_usage_daily').doc(aggId).set({
      companyId,
      userId,
      provider,
      date: today,
      totalRequests: 1,
      totalInputTokens: inputTokens,
      totalOutputTokens: outputTokens,
      totalCostUsd: cost,
      avgQualityScore: null,
      activeMinutes: 0
    });
  }
}

// Helper: deterministic hash for prompt deduplication
function hashString(str) {
  if (!str) return '';
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

module.exports = router;
