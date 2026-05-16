const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const Response = require('../models/Response');
const { generateWeeklyReport, generateCoachingNudge } = require('../utils/ai-agents');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');

// @route   POST api/scheduler/daily-nudges
// @desc    Trigger Agent 5 — Coaching Nudges (Simulated Cron)
router.post('/daily-nudges', protect, authorize('superadmin'), async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Get all responses from today
    const responses = await Response.find({ createdAt: { $gte: startOfDay } }).populate('user');
    
    const nudges = await Promise.all(responses.map(async (resp) => {
      const nudge = await generateCoachingNudge(resp.user, resp.scores, resp.user.currentStreak);
      const html = createEmailTemplate({
        title: 'Your Daily Coaching Nudge',
        preheader: 'A quick tip to improve your AI engineering skills.',
        bodyContent: `
            <h1>Daily Nudge</h1>
            <p>${nudge.replace(/\n/g, '<br>')}</p>
        `,
        buttonText: 'View Dashboard',
        buttonUrl: 'https://argen.isira.club/dashboard.html'
      });
      await sendEmail({
        email: resp.user.email,
        subject: 'Your Daily Coaching Nudge',
        html
      });
      return { email: resp.user.email, nudge };
    }));

    res.json({ msg: `${nudges.length} nudges generated`, nudges });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/scheduler/weekly-reports
// @desc    Trigger Agent 4 — Weekly Reports (Simulated Cron)
router.post('/weekly-reports', protect, authorize('superadmin'), async (req, res) => {
  try {
    const companies = await Company.find({ status: 'active' });
    
    const reports = await Promise.all(companies.map(async (comp) => {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - 7);
      
      const scores = await Response.find({
        companyId: comp._id,
        createdAt: { $gte: startOfWeek }
      }).populate('user', 'name role department');

      if (scores.length < 5) {
         console.log(`Skipping report for ${comp.name} (low participation)`);
         return { company: comp.name, status: 'skipped' };
      }

      const reportMd = await generateWeeklyReport(comp, scores);
      const html = createEmailTemplate({
        title: \`Weekly Report: \${comp.name}\`,
        preheader: \`Your team's weekly performance summary is ready.\`,
        bodyContent: \`
            <h1>Weekly Performance Report</h1>
            <p>Your team's performance metrics for the past week have been analyzed.</p>
            <div class="code-block" style="text-align: left; font-size: 14px; color: #ccc;">
              \${reportMd.replace(/\\n/g, '<br>')}
            </div>
        \`,
        buttonText: 'View Full Details',
        buttonUrl: 'https://argen.isira.club/team-detail.html'
      });
      // Send report email
      await sendEmail({
        email: comp.email,
        subject: \`Weekly Report: \${comp.name}\`,
        html
      });
      return { company: comp.name, status: 'generated' };
    }));

    res.json({ msg: 'Weekly reports processing complete', reports });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/scheduler/streak-check
// @desc    Daily midnight streak reset (Simulated Cron)
router.post('/streak-check', protect, authorize('superadmin'), async (req, res) => {
  try {
    const users = await User.find({ role: 'member' });
    const startOfYesterday = new Date();
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    startOfYesterday.setHours(0, 0, 0, 0);

    let resetCount = 0;
    for (const user of users) {
      const submission = await Response.findOne({
        user: user._id,
        createdAt: { $gte: startOfYesterday }
      });

      if (!submission) {
        user.currentStreak = 0;
        await user.save();
        resetCount++;
      }
    }

    res.json({ msg: `Streak check complete. ${resetCount} streaks reset.` });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
