const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../utils/firebase');
const { protect, authorize } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────
// API KEY MANAGEMENT — For MNC integrations
// Companies generate API keys for their internal systems
// to push AI usage data directly to ArGen warehouse.
// ─────────────────────────────────────────────────────────

function generateApiKey() {
  return 'ag_' + crypto.randomBytes(32).toString('hex');
}

// GET /api/keys — list all keys for user's company
router.get('/', protect, async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.json({ keys: [] });

    const snapshot = await db.collection('api_keys')
      .where('companyId', '==', companyId)
      .get();

    const keys = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        key: data.key.slice(0, 12) + '...' + data.key.slice(-4),
        active: data.active,
        createdBy: data.createdBy,
        lastUsedAt: data.lastUsedAt || null,
        createdAt: data.createdAt
      };
    });

    res.json({ keys });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/keys — create new API key
router.post('/', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    const companyId = req.user.companyId;
    if (!companyId) return res.status(400).json({ error: 'No company associated' });

    const { name, permissions } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const key = generateApiKey();

    await db.collection('api_keys').add({
      companyId,
      key,
      name,
      permissions: permissions || ['capture:write', 'capture:read'],
      active: true,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      lastUsedAt: null
    });

    // Return full key once (never stored in plaintext after this)
    res.status(201).json({
      key,
      name,
      warning: 'Save this key now. It will not be shown again.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/keys/:id — revoke an API key
router.delete('/:id', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  try {
    const doc = await db.collection('api_keys').doc(req.params.id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Key not found' });

    const data = doc.data();
    if (data.companyId !== req.user.companyId && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await doc.ref.update({ active: false });
    res.json({ success: true, message: 'Key revoked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
