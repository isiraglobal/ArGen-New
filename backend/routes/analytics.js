const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { db } = require('../utils/supabase');

// GET /api/analytics/summary — company-wide AI usage summary (30 days)
router.get('/summary', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) {
      return res.json({
        summary: { totalCostUsd: '0.0000', totalRequests: 0, activeUsers: 0, period: '30d' },
        byProvider: {},
        byDay: []
      });
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];
    const dailyData = await db.collection('ai_usage_daily')
      .where('companyId', '==', companyId)
      .get();

    let totalCost = 0;
    let totalRequests = 0;
    const activeUsers = new Set();
    const byProvider = {};
    const byDay = {};

    for (const doc of dailyData.docs) {
      const d = doc.data();
      if (d.date < thirtyDaysAgo) continue;
      totalCost += parseFloat(d.totalCostUsd) || 0;
      totalRequests += d.totalRequests || 0;
      if (d.userId) activeUsers.add(d.userId);
      if (!byProvider[d.provider]) byProvider[d.provider] = { cost: 0, requests: 0 };
      byProvider[d.provider].cost += parseFloat(d.totalCostUsd) || 0;
      byProvider[d.provider].requests += d.totalRequests || 0;
      if (!byDay[d.date]) byDay[d.date] = { cost: 0, requests: 0 };
      byDay[d.date].cost += parseFloat(d.totalCostUsd) || 0;
      byDay[d.date].requests += d.totalRequests || 0;
    }

    res.json({
      summary: {
        totalCostUsd: totalCost.toFixed(4),
        totalRequests,
        activeUsers: activeUsers.size,
        period: '30d'
      },
      byProvider,
      byDay: Object.entries(byDay)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/users — per-user breakdown
router.get('/users', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) return res.json({ users: [] });

    const events = await db.collection('ai_usage_events')
      .where('companyId', '==', companyId)
      .get();

    const userMap = {};
    for (const doc of events.docs) {
      const d = doc.data();
      const userId = d.userId || d.metadata?.userEmail || 'unknown';
      if (!userMap[userId]) {
        userMap[userId] = { userId, requests: 0, cost: 0, providers: new Set() };
      }
      userMap[userId].requests++;
      userMap[userId].cost += parseFloat(d.costUsd) || 0;
      userMap[userId].providers.add(d.provider);
    }

    const users = Object.values(userMap)
      .map(u => ({
        ...u,
        providers: Array.from(u.providers),
        cost: u.cost.toFixed(4)
      }))
      .sort((a, b) => b.requests - a.requests);

    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/roi — cost vs estimated value
router.get('/roi', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) {
      return res.json({
        totalCostUsd: '0.00',
        estimatedHoursSaved: '0.0',
        estimatedValueUsd: '0.00',
        roiPercent: 0,
        requestsAnalyzed: 0
      });
    }

    const companyDoc = await db.collection('companies').doc(companyId).get();
    const metadata = companyDoc.exists ? (companyDoc.data().metadata || {}) : {};
    const avgSalary = metadata.avgSalary || 60000;
    const hourlyRate = avgSalary / 2080;

    const events = await db.collection('ai_usage_events')
      .where('companyId', '==', companyId)
      .get();

    const totalRequests = events.docs.length;
    const totalCost = events.docs.reduce((s, d) => s + (parseFloat(d.data().costUsd) || 0), 0);
    const estimatedHoursSaved = (totalRequests * 8) / 60;
    const estimatedValueUsd = estimatedHoursSaved * hourlyRate;
    const roi = totalCost > 0
      ? (((estimatedValueUsd - totalCost) / totalCost) * 100).toFixed(1)
      : 0;

    res.json({
      totalCostUsd: totalCost.toFixed(2),
      estimatedHoursSaved: estimatedHoursSaved.toFixed(1),
      estimatedValueUsd: estimatedValueUsd.toFixed(2),
      roiPercent: roi,
      requestsAnalyzed: totalRequests
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
