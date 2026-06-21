const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { db } = require('../utils/firebase');
const { generateWeeklyReport, generateCoachingNudge } = require('../utils/ai-agents');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');

// CRON secret middleware — allows Vercel CRON jobs to bypass JWT auth
function allowCron(req, res, next) {
  if (req.query.cron_secret === process.env.CRON_SECRET) {
    req.user = { role: 'superadmin' };
    return next();
  }
  next();
}

// ── Webhook/Cron Handlers ─────────────────────────────────────

// Trigger Agent 5 — Coaching Nudges
const handleDailyNudges = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get all responses from today (filter in-memory)
    const respSnap = await db.collection('responses').get();
    const responses = respSnap.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => r.createdAt && new Date(r.createdAt) >= startOfDay);

    const nudges = await Promise.all(responses.map(async (resp) => {
      // Fetch user details
      const userDoc = await db.collection('users').doc(resp.user).get();
      if (!userDoc.exists) return null;
      const user = { id: userDoc.id, ...userDoc.data() };

      const nudge = await generateCoachingNudge(user, resp.scores, user.currentStreak || 0);
      const html = createEmailTemplate({
        title: 'Your Daily Coaching Nudge',
        preheader: 'A quick tip to improve your AI engineering skills.',
        bodyContent: `
            <h1>Daily Nudge</h1>
            <p>${nudge.replace(/\n/g, '<br>')}</p>
        `,
        buttonText: 'View Dashboard',
        buttonUrl: 'https://argen.isira.club/dashboard'
      });
      await sendEmail({
        email: user.email,
        subject: 'Your Daily Coaching Nudge',
        html
      });
      return { email: user.email, nudge };
    }));

    const sent = nudges.filter(Boolean);
    res.json({ msg: `${sent.length} nudges generated`, nudges: sent });
  } catch (err) {
    console.error('Daily Nudges Error:', err.message);
    res.status(500).send('Server error');
  }
};

// Trigger Agent 4 — Weekly Reports
const handleWeeklyReports = async (req, res) => {
  try {
    const companiesSnap = await db.collection('companies')
      .where('status', '==', 'active')
      .get();

    const companies = companiesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const reports = await Promise.all(companies.map(async (comp) => {
      const scoresSnap = await db.collection('responses')
        .where('companyId', '==', comp.id)
        .get();

      const scores = scoresSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(r => r.createdAt && new Date(r.createdAt) >= startOfWeek);

      const usageSnap = await db.collection('ai_usage_events')
        .where('companyId', '==', comp.id)
        .get();
      const usageEvents = usageSnap.docs
        .map(doc => doc.data())
        .filter(e => e.eventTimestamp && new Date(e.eventTimestamp) >= startOfWeek);

      if (scores.length < 5 && usageEvents.length < 5) {
        // Skipping report for this company (low participation)
        return { company: comp.name, status: 'skipped' };
      }

      const reportContext = { ...comp, usageEvents, usageSummary: {
        totalRequests: usageEvents.length,
        totalCost: usageEvents.reduce((s, e) => s + (parseFloat(e.costUsd) || 0), 0).toFixed(2),
        providers: [...new Set(usageEvents.map(e => e.provider))]
      }};

      const reportMd = await generateWeeklyReport(reportContext, scores);
      const html = createEmailTemplate({
        title: `Weekly Report: ${comp.name}`,
        preheader: `Your team's weekly performance summary is ready.`,
        bodyContent: `
            <h1>Weekly Performance Report</h1>
            <p>Your team's performance metrics for the past week have been analyzed.</p>
            <div style="text-align: left; font-size: 14px; color: #ccc;">
              ${reportMd.replace(/\n/g, '<br>')}
            </div>
        `,
        buttonText: 'View Full Details',
        buttonUrl: 'https://argen.isira.club/team-detail'
      });

      const contactEmail = comp.primaryContact?.email || comp.email || '';
      if (contactEmail) {
        await sendEmail({
          email: contactEmail,
          subject: `Weekly Report: ${comp.name}`,
          html
        });
      }
      return { company: comp.name, status: 'generated' };
    }));

    res.json({ msg: 'Weekly reports processing complete', reports });
  } catch (err) {
    console.error('Weekly Reports Error:', err.message);
    res.status(500).send('Server error');
  }
};

// Trigger all daily agentic tasks
const handleDailyCycle = async (req, res) => {
  try {
    // Starting daily AI agentic cycle
    const { syncAllConnections } = require('../utils/ai-providers');
    const syncResult = await syncAllConnections().catch(err => {
      console.error('Daily cycle sync error:', err.message);
      return { synced: 0, total: 0, error: err.message };
    });
    res.json({
      msg: 'Daily AI agentic cycle executed successfully',
      tasks: ['usage_sync', 'performance_aggregation'],
      syncResult
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
};

// Daily midnight streak reset
const handleStreakCheck = async (req, res) => {
  try {
    const usersSnap = await db.collection('users')
      .where('role', '==', 'member')
      .get();

    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    let resetCount = 0;
    for (const doc of usersSnap.docs) {
      const user = { id: doc.id, ...doc.data() };
      
      const respSnap = await db.collection('responses')
        .where('user', '==', user.id)
        .get();

      const hasRecent = respSnap.docs.some(r => {
        const data = r.data();
        return data.createdAt && new Date(data.createdAt) >= startOfYesterday;
      });

      if (!hasRecent) {
        await db.collection('users').doc(user.id).update({ currentStreak: 0 });
        resetCount++;
      }
    }

    res.json({ msg: `Streak check complete. ${resetCount} streaks reset.` });
  } catch (err) {
    console.error('Streak Check Error:', err.message);
    res.status(500).send('Server error');
  }
};

// ── Route Bindings (Supports both Vercel Cron GET and Dashboard POST) ──

router.route('/daily-nudges')
  .get(allowCron, protect, authorize('superadmin'), handleDailyNudges)
  .post(protect, authorize('superadmin'), handleDailyNudges);

router.route('/weekly-reports')
  .get(allowCron, protect, authorize('superadmin'), handleWeeklyReports)
  .post(protect, authorize('superadmin'), handleWeeklyReports);

router.route('/daily')
  .get(allowCron, protect, authorize('superadmin'), handleDailyCycle)
  .post(protect, authorize('superadmin'), handleDailyCycle);

router.route('/streak-check')
  .get(allowCron, protect, authorize('superadmin'), handleStreakCheck)
  .post(protect, authorize('superadmin'), handleStreakCheck);

const handleSyncConnections = async (req, res) => {
  try {
    const { syncAllConnections } = require('../utils/ai-providers');
    const result = await syncAllConnections();
    res.json({ msg: 'AI usage sync complete', ...result });
  } catch (err) {
    console.error('Sync Connections Error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

router.route('/sync-connections')
  .get(allowCron, protect, authorize('superadmin'), handleSyncConnections)
  .post(protect, authorize('superadmin'), handleSyncConnections);

module.exports = router;
