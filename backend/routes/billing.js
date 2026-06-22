const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { protect, authorize } = require('../middleware/auth');
const { PLAN_LIMITS, DEFAULT_PLAN } = require('../middleware/billing');

// @route   GET api/billing/plan
// @desc    Get current company billing plan and usage
// @access  Private (teamadmin, superadmin)
router.get('/plan', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId && req.user.role !== 'superadmin') {
    return res.status(400).json({ error: 'No company associated' });
  }

  try {
    const doc = await db.collection('billing').doc(companyId).get();
    const billing = doc.exists ? doc.data() : { plan: DEFAULT_PLAN };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    let usageCount = 0;
    try {
      const snapshot = await db.collection('ai_usage_events')
        .where('companyId', '==', companyId)
        .where('createdAt', '>=', startOfMonth)
        .get();
      usageCount = snapshot.size;
    } catch { /* ignore */ }

    const limit = PLAN_LIMITS[billing.plan] || PLAN_LIMITS[DEFAULT_PLAN];

    res.json({
      companyId,
      plan: billing.plan || DEFAULT_PLAN,
      monthlyLimit: limit,
      currentUsage: usageCount,
      remaining: Math.max(0, limit - usageCount),
      resetDate: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      isOverLimit: usageCount >= limit
    });
  } catch (err) {
    console.error('[billing] get plan error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// @route   PUT api/billing/plan
// @desc    Update company billing plan
// @access  Private (superadmin only)
router.put('/plan', protect, authorize('superadmin'), async (req, res) => {
  const { companyId, plan } = req.body;
  if (!companyId) return res.status(400).json({ error: 'companyId is required' });
  if (!plan) return res.status(400).json({ error: 'plan is required' });

  const normalizedPlan = plan.toLowerCase();
  if (!PLAN_LIMITS[normalizedPlan]) {
    return res.status(400).json({
      error: `Invalid plan. Valid: ${Object.keys(PLAN_LIMITS).join(', ')}`
    });
  }

  try {
    await db.collection('billing').doc(companyId).set({
      plan: normalizedPlan,
      monthlyLimit: PLAN_LIMITS[normalizedPlan],
      updatedAt: new Date().toISOString(),
      updatedBy: req.user.id
    }, { merge: true });

    res.json({
      companyId,
      plan: normalizedPlan,
      monthlyLimit: PLAN_LIMITS[normalizedPlan],
      message: `Plan updated to ${normalizedPlan}`
    });
  } catch (err) {
    console.error('[billing] update plan error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

// @route   GET api/billing/usage
// @desc    Get per-day usage breakdown for current month
// @access  Private (teamadmin, superadmin)
router.get('/usage', protect, authorize('teamadmin', 'superadmin'), async (req, res) => {
  const companyId = req.user.companyId;
  if (!companyId && req.user.role !== 'superadmin') {
    return res.status(400).json({ error: 'No company associated' });
  }

  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const snapshot = await db.collection('ai_usage_events')
      .where('companyId', '==', companyId)
      .where('createdAt', '>=', startOfMonth)
      .get();

    // Aggregate by day
    const dailyCounts = {};
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const day = data.createdAt ? data.createdAt.slice(0, 10) : startOfMonth.slice(0, 10);
      dailyCounts[day] = (dailyCounts[day] || 0) + 1;

      // Also aggregate by provider
      if (!dailyCounts[day]) dailyCounts[day] = {};
    });

    res.json({
      companyId,
      period: { start: startOfMonth, end: now.toISOString() },
      totalEvents: snapshot.size,
      daily: dailyCounts
    });
  } catch (err) {
    console.error('[billing] usage error:', err);
    res.status(500).json({ error: 'Server error', message: err.message });
  }
});

module.exports = router;