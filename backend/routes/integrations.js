const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { db } = require('../utils/firebase');
const { protect, authorize } = require('../middleware/auth');
const { analyzeCaptureData } = require('../utils/ai-agents');

// ─────────────────────────────────────────────────────────
// INTEGRATIONS API — System-level + User-level integration
// management for VS Code, Browser, and AI Agent extensions.
// ─────────────────────────────────────────────────────────

const INTEGRATION_TYPES = {
  vscode: { name: 'VS Code Extension', category: 'ide', icon: 'code', platforms: ['mac', 'windows', 'linux'] },
  browser_chrome: { name: 'Chrome Extension', category: 'browser', icon: 'chrome', platforms: ['chrome'] },
  browser_firefox: { name: 'Firefox Add-on', category: 'browser', icon: 'firefox', platforms: ['firefox'] },
  browser_safari: { name: 'Safari Extension', category: 'browser', icon: 'safari', platforms: ['safari'] },
  ai_agents: { name: 'AI Workflow Agents', category: 'ai', icon: 'brain', platforms: ['all'] }
};

// ───────────────────────────────────────────────────────
// SYSTEM-LEVEL — Company-wide integration settings
// ───────────────────────────────────────────────────────

// GET /api/integrations — Get all available integrations + company config
router.get('/', protect, async (req, res) => {
  const companyId = req.user.companyId;
  try {
    let companyConfig = {};
    if (companyId) {
      const doc = await db.collection('integration_configs').doc(companyId).get();
      if (doc.exists) companyConfig = doc.data();
    }

    const result = {};
    for (const [key, meta] of Object.entries(INTEGRATION_TYPES)) {
      result[key] = {
        ...meta,
        enabled: companyConfig[key]?.enabled !== false,
        config: companyConfig[key]?.config || {}
      };
    }

    res.json({
      integrations: result,
      globalEnabled: companyConfig.globalEnabled !== false
    });
  } catch (err) {
    console.error('[integrations] list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/integrations/:type — Update system-level integration config
router.put('/:type', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const { type } = req.params;
  const companyId = req.user.companyId;

  if (!INTEGRATION_TYPES[type]) {
    return res.status(400).json({ error: `Invalid integration type. Valid: ${Object.keys(INTEGRATION_TYPES).join(', ')}` });
  }
  if (!companyId) {
    return res.status(400).json({ error: 'No company associated' });
  }

  const { enabled, config } = req.body;

  try {
    const ref = db.collection('integration_configs').doc(companyId);
    const update = {};
    if (typeof enabled === 'boolean') update[`${type}.enabled`] = enabled;
    if (config) update[`${type}.config`] = config;

    await ref.set(update, { merge: true });

    res.json({ type, enabled: enabled !== false, config: config || {}, msg: 'Integration updated' });
  } catch (err) {
    console.error('[integrations] update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ───────────────────────────────────────────────────────
// USER-LEVEL — Individual user integration settings
// ───────────────────────────────────────────────────────

// GET /api/integrations/user — Get current user's integration prefs
router.get('/user', protect, async (req, res) => {
  try {
    const doc = await db.collection('user_integrations').doc(req.user.id).get();
    res.json(doc.exists ? doc.data() : { integrations: {}, connectedPlatforms: [] });
  } catch (err) {
    console.error('[integrations] user get error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/integrations/user — Update current user's integration prefs
router.put('/user', protect, async (req, res) => {
  const { integrations, connectedPlatforms } = req.body;

  try {
    const ref = db.collection('user_integrations').doc(req.user.id);
    const data = {
      integrations: integrations || {},
      connectedPlatforms: connectedPlatforms || [],
      updatedAt: new Date().toISOString(),
      userId: req.user.id
    };
    await ref.set(data, { merge: true });
    res.json({ msg: 'Integration preferences saved', ...data });
  } catch (err) {
    console.error('[integrations] user update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ───────────────────────────────────────────────────────
// EXTENSION DOWNLOADS — Serve extension files
// ───────────────────────────────────────────────────────

function getExtensionDir() {
  return path.join(__dirname, '../../extensions');
}

// GET /api/integrations/download/:type — Download extension file
router.get('/download/:type', protect, async (req, res) => {
  const { type } = req.params;
  const extDir = getExtensionDir();

  const downloadMap = {
    vscode: {
      dir: path.join(extDir, 'vscode-argen-capture'),
      file: 'argen-capture.vsix',
      name: 'ArGen VS Code Extension',
      buildRequired: true
    },
    browser_chrome: {
      dir: path.join(extDir, 'browser-argen-capture'),
      file: 'argen-capture-chrome.zip',
      name: 'ArGen Chrome Extension',
      buildRequired: false
    },
    browser_firefox: {
      dir: path.join(extDir, 'browser-argen-capture'),
      file: 'argen-capture-firefox.zip',
      name: 'ArGen Firefox Add-on',
      buildRequired: false
    },
    browser_safari: {
      dir: path.join(extDir, 'safari-argen-capture'),
      file: 'argen-capture-safari.zip',
      name: 'ArGen Safari Extension',
      buildRequired: false
    }
  };

  const info = downloadMap[type];
  if (!info) return res.status(400).json({ error: 'Invalid extension type' });

  const filePath = path.join(info.dir, info.file);

  // If build is required and file doesn't exist, provide instructions
  if (info.buildRequired && !fs.existsSync(filePath)) {
    return res.json({
      downloadUrl: null,
      name: info.name,
      buildRequired: true,
      instructions: `Run \`npm install && npx vsce package\` in ${info.dir} to build the extension package.`,
      sourceDir: info.dir
    });
  }

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      error: 'Extension package not built yet',
      instructions: `Run build script in ${info.dir} first.`
    });
  }

  res.download(filePath, info.file);
});

// GET /api/integrations/instructions/:type — Get install instructions
router.get('/instructions/:type', async (req, res) => {
  const { type } = req.params;

  const instructions = {
    vscode: {
      title: 'VS Code Extension',
      steps: [
        'Open VS Code → Extensions sidebar (Cmd+Shift+X)',
        'Click "..." → "Install from VSIX..."',
        'Select the downloaded .vsix file',
        'Press Cmd+Shift+P → "ArGen: Configure API Key"',
        'Enter your API key from Settings → API Keys'
      ],
      autoCapture: 'Automatically detects AI-generated code patterns on paste. Disable in VS Code settings.',
      manualCapture: 'Select text → Cmd+Shift+P → "ArGen: Capture AI Selection"'
    },
    browser_chrome: {
      title: 'Chrome Extension',
      steps: [
        'Download the extension zip file above',
        'Unzip to a folder on your computer',
        'Open Chrome → chrome://extensions',
        'Enable "Developer mode" (top right)',
        'Click "Load unpacked" → select the unzipped folder',
        'Click the extension icon → enter your API key'
      ],
      autoCapture: 'Automatically captures prompts and completions on ChatGPT, Claude, and other AI platforms.',
      manualCapture: 'Click the ArGen extension icon → "Capture This Page"'
    },
    browser_firefox: {
      title: 'Firefox Add-on',
      steps: [
        'Download the extension zip file above',
        'Open Firefox → about:debugging',
        'Click "This Firefox" → "Load Temporary Add-on"',
        'Select the manifest.json file from the unzipped folder',
        'Click the extension icon → enter your API key'
      ],
      autoCapture: 'Same as Chrome — auto-captures from supported AI platforms.',
      manualCapture: 'Click the ArGen extension icon → "Capture This Page"'
    },
    browser_safari: {
      title: 'Safari Extension',
      steps: [
        'Download the extension zip file above',
        'Unzip to a folder on your computer',
        'Open Safari → Settings → Extensions',
        'Enable "Developer mode" in the Extensions tab',
        'Click the "+" button → select the unzipped .app bundle',
        'Click the extension toolbar icon → enter your API key'
      ],
      autoCapture: 'Automatically captures prompts and completions on ChatGPT, Claude, and other AI platforms.',
      manualCapture: 'Click the ArGen extension icon → "Capture This Page"'
    }
  };

  const info = instructions[type];
  if (!info) return res.status(400).json({ error: 'Invalid type' });

  res.json(info);
});

// ───────────────────────────────────────────────────────
// AI AGENTS INTEGRATION — Connect AI agents to capture data
// ───────────────────────────────────────────────────────

// GET /api/integrations/agents — Get AI agent integration status
router.get('/agents', protect, async (req, res) => {
  const companyId = req.user.companyId;
  try {
    let config = {};
    if (companyId) {
      const doc = await db.collection('integration_configs').doc(companyId).get();
      if (doc.exists) config = doc.data().ai_agents || {};
    }

    res.json({
      agents: {
        research: { enabled: config.research !== false, status: 'ready', description: 'Profiles company industry, AI tools, tone, competitors' },
        challengeGenerator: { enabled: config.challengeGenerator !== false, status: 'ready', description: 'Creates personalized daily AI challenges per role' },
        scorer: { enabled: config.scorer !== false, status: 'ready', description: 'Scores submissions 0-100 across 4 dimensions' },
        reportWriter: { enabled: config.reportWriter !== false, status: 'ready', description: 'Generates weekly Markdown exec reports with ROI' },
        coach: { enabled: config.coach !== false, status: 'ready', description: 'Writes personalized nudges based on performance + streak' }
      },
      capturePipeline: config.capturePipeline || 'auto'
    });
  } catch (err) {
    console.error('[integrations] agents error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/integrations/agents/:agentName — Enable/disable specific agent
router.put('/agents/:agentName', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const { agentName } = req.params;
  const companyId = req.user.companyId;
  const { enabled } = req.body;

  const validAgents = ['research', 'challengeGenerator', 'scorer', 'reportWriter', 'coach'];
  if (!validAgents.includes(agentName)) {
    return res.status(400).json({ error: `Invalid agent. Valid: ${validAgents.join(', ')}` });
  }
  if (!companyId) return res.status(400).json({ error: 'No company associated' });

  try {
    const ref = db.collection('integration_configs').doc(companyId);
    await ref.set({
      [`ai_agents.${agentName}`]: enabled !== false
    }, { merge: true });

    res.json({
      agent: agentName,
      enabled: enabled !== false,
      msg: `${agentName} agent ${enabled !== false ? 'enabled' : 'disabled'}`
    });
  } catch (err) {
    console.error('[integrations] agent update error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/integrations/agents/analyze — Send captured data to AI agents for analysis
router.post('/agents/analyze', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const { agentName, interactionIds } = req.body;
  const companyId = req.user.companyId;

  if (!agentName || !interactionIds || !Array.isArray(interactionIds)) {
    return res.status(400).json({ error: 'agentName and interactionIds array required' });
  }

  try {
    // Fetch the interactions from Firestore
    const events = [];
    for (const id of interactionIds) {
      const doc = await db.collection('ai_usage_events').doc(id).get();
      if (doc.exists) events.push({ id: doc.id, ...doc.data() });
    }

    if (events.length === 0) {
      return res.status(404).json({ error: 'No interactions found' });
    }

    // Run through AI agent pipeline for deep analysis
    let agentResult = null;
    try {
      agentResult = await analyzeCaptureData(events, companyId);
    } catch (agentErr) {
      console.error('[integrations] Agent analysis failed:', agentErr.message);
    }

    const analysisPayload = agentResult || {
      companyId,
      agentName,
      eventCount: events.length,
      totalTokens: events.reduce((sum, e) => sum + (e.inputTokens || 0) + (e.outputTokens || 0), 0),
      totalCost: events.reduce((sum, e) => sum + (e.costUsd || 0), 0),
      providers: [...new Set(events.map(e => e.provider))],
      models: [...new Set(events.map(e => e.model))],
      timeRange: {
        start: events[events.length - 1]?.createdAt,
        end: events[0]?.createdAt
      },
      analyzedAt: new Date().toISOString()
    };

    // Store the analysis in Firestore
    const analysisRef = await db.collection('agent_analyses').add({
      ...analysisPayload,
      companyId,
      agentName,
      createdBy: req.user.id,
      interactionIds,
      analyzedAt: new Date().toISOString()
    });

    res.status(201).json({
      id: analysisRef.id,
      ...analysisPayload,
      msg: `Analysis completed for ${events.length} events via ${agentName} agent`
    });
  } catch (err) {
    console.error('[integrations] analyze error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/integrations/agents/analyses — List recent agent analyses
router.get('/agents/analyses', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const companyId = req.user.companyId;
  try {
    const snapshot = await db.collection('agent_analyses')
      .where('companyId', '==', companyId)
      .orderBy('analyzedAt', 'desc')
      .limit(20)
      .get();

    const analyses = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(analyses);
  } catch (err) {
    console.error('[integrations] analyses list error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;