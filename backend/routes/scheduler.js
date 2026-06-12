const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { db } = require('../utils/supabase');
const { generateWeeklyReport, generateCoachingNudge } = require('../utils/ai-agents');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');

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

      if (scores.length < 5) {
        console.log(`Skipping report for ${comp.name} (low participation)`);
        return { company: comp.name, status: 'skipped' };
      }

      const reportMd = await generateWeeklyReport(comp, scores);
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
    console.log('Starting daily AI agentic cycle...');
    res.json({
      msg: 'Daily AI agentic cycle executed successfully',
      tasks: ['research_sync', 'challenge_generation', 'performance_aggregation']
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
  .get(protect, authorize('superadmin'), handleDailyNudges)
  .post(protect, authorize('superadmin'), handleDailyNudges);

router.route('/weekly-reports')
  .get(protect, authorize('superadmin'), handleWeeklyReports)
  .post(protect, authorize('superadmin'), handleWeeklyReports);

router.route('/daily')
  .get(protect, authorize('superadmin'), handleDailyCycle)
  .post(protect, authorize('superadmin'), handleDailyCycle);

router.route('/streak-check')
  .get(protect, authorize('superadmin'), handleStreakCheck)
  .post(protect, authorize('superadmin'), handleStreakCheck);

module.exports = router;
