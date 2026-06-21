const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { protect, authorize } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────
// WAREHOUSE ENGINE — Cross-department AI intelligence
// Aggregates all captured data into actionable insights.
// Tracks:
//   - AI spend per department / team / user
//   - Workflow chains spanning departments
//   - Cross-department communication efficiency
//   - Prompt quality benchmarks per role
//   - ROI per department (cost vs estimated time saved)
// ─────────────────────────────────────────────────────────

// GET /api/warehouse/overview — Company-wide AI intelligence overview
router.get('/overview', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) return res.status(400).json({ error: 'No company' });

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split('T')[0];

    // Get all daily aggregates for this company
    const dailySnap = await db.collection('ai_usage_daily')
      .where('companyId', '==', companyId)
      .get();

    let totalCost = 0;
    let totalRequests = 0;
    let totalTokens = 0;
    const users = new Set();
    const providers = {};
    const departments = {};
    const dailyTrend = [];

    for (const doc of dailySnap.docs) {
      const d = doc.data();
      if (d.date < thirtyDaysAgo) continue;

      totalCost += parseFloat(d.totalCostUsd) || 0;
      totalRequests += d.totalRequests || 0;
      totalTokens += (d.totalInputTokens || 0) + (d.totalOutputTokens || 0);
      if (d.userId) users.add(d.userId);

      if (!providers[d.provider]) providers[d.provider] = { cost: 0, requests: 0, tokens: 0 };
      providers[d.provider].cost += parseFloat(d.totalCostUsd) || 0;
      providers[d.provider].requests += d.totalRequests || 0;
      providers[d.provider].tokens += (d.totalInputTokens || 0) + (d.totalOutputTokens || 0);

      // Group by department (from user profile lookup)
      const dept = d.department || 'unassigned';
      if (!departments[dept]) departments[dept] = { cost: 0, requests: 0, users: new Set() };
      departments[dept].cost += parseFloat(d.totalCostUsd) || 0;
      departments[dept].requests += d.totalRequests || 0;
      if (d.userId) departments[dept].users.add(d.userId);

      if (!dailyTrend[d.date]) dailyTrend[d.date] = { cost: 0, requests: 0 };
      dailyTrend[d.date].cost += parseFloat(d.totalCostUsd) || 0;
      dailyTrend[d.date].requests += d.totalRequests || 0;
    }

    // Convert departments Sets to counts
    const deptSummary = {};
    for (const [name, data] of Object.entries(departments)) {
      deptSummary[name] = { cost: data.cost, requests: data.requests, activeUsers: data.users.size };
    }

    res.json({
      period: '30d',
      totalCost: totalCost.toFixed(4),
      totalRequests,
      totalTokens,
      activeUsers: users.size,
      providers,
      departments: deptSummary,
      dailyTrend: Object.entries(dailyTrend)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => ({ date, ...data }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warehouse/departments/:deptId — Per-department deep dive
router.get('/departments/:deptId', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    const { deptId } = req.params;

    if (!companyId) return res.status(400).json({ error: 'No company' });

    // Get users in this department
    const usersSnap = await db.collection('users')
      .where('companyId', '==', companyId)
      .where('department', '==', deptId)
      .get();

    const userIds = usersSnap.docs.map(d => d.id);

    // Get all usage events for these users
    const events = [];
    for (const uid of userIds) {
      const userEvents = await db.collection('ai_usage_events')
        .where('companyId', '==', companyId)
        .where('userId', '==', uid)
        .limit(500)
        .get();
      userEvents.docs.forEach(doc => events.push({ id: doc.id, ...doc.data() }));
    }

    // Group by user
    const byUser = {};
    for (const e of events) {
      if (!byUser[e.userId]) {
        const userDoc = usersSnap.docs.find(d => d.id === e.userId);
        const userName = userDoc ? userDoc.data().name : 'Unknown';
        byUser[e.userId] = { userId: e.userId, name: userName, requests: 0, cost: 0, tokens: 0, providers: new Set() };
      }
      byUser[e.userId].requests++;
      byUser[e.userId].cost += parseFloat(e.costUsd) || 0;
      byUser[e.userId].tokens += (e.inputTokens || 0) + (e.outputTokens || 0);
      byUser[e.userId].providers.add(e.provider);
    }

    // Top workflows for this department
    const workflowsSnap = await db.collection('workflow_sessions')
      .where('companyId', '==', companyId)
      .where('departmentId', '==', deptId)
      .get();

    const workflows = workflowsSnap.docs.map(d => {
      const w = d.data();
      return {
        id: d.id,
        intent: w.intent,
        project: w.project,
        ticketId: w.ticketId,
        interactionCount: w.interactionCount,
        totalTokens: w.totalTokens,
        totalCost: w.totalCost,
        durationMs: w.durationMs,
        status: w.status,
        startedAt: w.startedAt,
        completedAt: w.completedAt
      };
    });

    const userList = Object.values(byUser).map(u => ({
      ...u,
      providers: Array.from(u.providers),
      cost: u.cost.toFixed(4)
    }));

    res.json({
      departmentId: deptId,
      memberCount: usersSnap.size,
      totalRequests: events.length,
      totalCost: events.reduce((s, e) => s + (parseFloat(e.costUsd) || 0), 0).toFixed(4),
      topUsers: userList.sort((a, b) => b.requests - a.requests).slice(0, 20),
      recentWorkflows: workflows.filter(w => w.status === 'completed').slice(0, 10),
      activeSessions: workflows.filter(w => w.status === 'active').length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warehouse/workflows — Cross-department workflow analysis
router.get('/workflows', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) return res.status(400).json({ error: 'No company' });

    const sessionsSnap = await db.collection('workflow_sessions')
      .where('companyId', '==', companyId)
      .where('status', '==', 'completed')
      .get();

    const workflows = sessionsSnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // Group by intent
    const byIntent = {};
    const byDepartment = {};

    for (const w of workflows) {
      if (!byIntent[w.intent || 'unknown']) {
        byIntent[w.intent || 'unknown'] = { count: 0, totalTokens: 0, totalCost: 0, avgDuration: 0 };
      }
      byIntent[w.intent || 'unknown'].count++;
      byIntent[w.intent || 'unknown'].totalTokens += w.totalTokens || 0;
      byIntent[w.intent || 'unknown'].totalCost += parseFloat(w.totalCost) || 0;

      if (w.departmentId) {
        if (!byDepartment[w.departmentId]) {
          byDepartment[w.departmentId] = { count: 0, totalTokens: 0, totalCost: 0, avgDuration: 0, crossDeptCount: 0 };
        }
        byDepartment[w.departmentId].count++;
        byDepartment[w.departmentId].totalTokens += w.totalTokens || 0;
        byDepartment[w.departmentId].totalCost += parseFloat(w.totalCost) || 0;
      }
    }

    // Calculate cross-department workflows
    let crossDeptCount = 0;
    for (const w of workflows) {
      if (w.crossDepartment) crossDeptCount++;
    }

    res.json({
      totalWorkflows: workflows.length,
      averageDuration: workflows.length > 0
        ? Math.round(workflows.reduce((s, w) => s + (w.durationMs || 0), 0) / workflows.length)
        : 0,
      totalTokens: workflows.reduce((s, w) => s + (w.totalTokens || 0), 0),
      totalCost: workflows.reduce((s, w) => s + (parseFloat(w.totalCost) || 0), 0).toFixed(4),
      crossDepartmentCount: crossDeptCount,
      byIntent,
      byDepartment
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warehouse/efficiency — Efficiency benchmarks
router.get('/efficiency', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) return res.status(400).json({ error: 'No company' });

    const sessionsSnap = await db.collection('workflow_sessions')
      .where('companyId', '==', companyId)
      .where('status', '==', 'completed')
      .get();

    const workflows = sessionsSnap.docs.map(d => d.data());

    // Benchmarks by intent type
    const benchmarks = {};
    for (const w of workflows) {
      const intent = w.intent || 'unknown';
      if (!benchmarks[intent]) benchmarks[intent] = { durations: [], tokens: [], costs: [], counts: 0 };
      benchmarks[intent].durations.push(w.durationMs || 0);
      benchmarks[intent].tokens.push(w.totalTokens || 0);
      benchmarks[intent].costs.push(parseFloat(w.totalCost) || 0);
      benchmarks[intent].counts++;
    }

    // Calculate percentiles
    const result = {};
    for (const [intent, data] of Object.entries(benchmarks)) {
      data.durations.sort((a, b) => a - b);
      data.tokens.sort((a, b) => a - b);
      data.costs.sort((a, b) => a - b);

      result[intent] = {
        count: data.counts,
        p50_duration_ms: data.durations[Math.floor(data.durations.length * 0.5)] || 0,
        p90_duration_ms: data.durations[Math.floor(data.durations.length * 0.9)] || 0,
        p50_tokens: data.tokens[Math.floor(data.tokens.length * 0.5)] || 0,
        p90_tokens: data.tokens[Math.floor(data.tokens.length * 0.9)] || 0,
        p50_cost: data.costs[Math.floor(data.costs.length * 0.5)] || 0,
        p90_cost: data.costs[Math.floor(data.costs.length * 0.9)] || 0
      };
    }

    res.json({ benchmarks: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/warehouse/communication — Cross-department communication flow
router.get('/communication', protect, async (req, res) => {
  try {
    const { companyId } = req.user;
    if (!companyId) return res.status(400).json({ error: 'No company' });

    // Analyze workflow sessions for cross-department patterns
    const sessionsSnap = await db.collection('workflow_sessions')
      .where('companyId', '==', companyId)
      .get();

    const deptLinks = {};
    const deptMap = {};

    for (const doc of sessionsSnap.docs) {
      const w = doc.data();
      if (!w.departmentId) continue;
      if (!deptMap[w.departmentId]) deptMap[w.departmentId] = { sessions: 0, users: new Set() };
      deptMap[w.departmentId].sessions++;
      if (w.userId) deptMap[w.departmentId].users.add(w.userId);
    }

    // Analyze interactions for cross-department collaboration
    const eventsSnap = await db.collection('ai_usage_events')
      .where('companyId', '==', companyId)
      .limit(1000)
      .get();

    const deptInteraction = {};
    for (const doc of eventsSnap.docs) {
      const e = doc.data();
      const ctx = e.context || {};
      const sourceDept = ctx.departmentId || 'unknown';
      if (!deptInteraction[sourceDept]) deptInteraction[sourceDept] = { count: 0, cost: 0, users: new Set() };
      deptInteraction[sourceDept].count++;
      deptInteraction[sourceDept].cost += parseFloat(e.costUsd) || 0;
      if (e.userId) deptInteraction[sourceDept].users.add(e.userId);
    }

    const departments = {};
    for (const [deptId, data] of Object.entries(deptInteraction)) {
      departments[deptId] = {
        totalInteractions: data.count,
        totalCost: data.cost.toFixed(4),
        activeUsers: data.users.size
      };
    }

    res.json({
      departmentCount: Object.keys(departments).length,
      departments,
      totalCrossDepartmentSessions: Object.values(deptMap).filter(d => d.sessions > 0).length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
