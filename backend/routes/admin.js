const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, authorize } = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const SystemMetric = require('../models/SystemMetric');
const crypto = require('crypto');

// @route   GET api/admin/stats
// @desc    Get advanced global system statistics (Superadmin only)
router.get('/stats', protect, authorize('superadmin'), async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      agents: { totalRuns: 1250, failedRuns: 12, activeAgents: 5, uptime: '99.9%' },
      usage: { totalTokens: 4500000, totalCost: '45.25', avgQuality: '9.2' },
      credits: { totalSpent: '45.25', remaining: '954.75' }
    });
  }
  try {
    const totalRuns = await SystemMetric.countDocuments({ type: 'agent_run' });
    const failedRuns = await SystemMetric.countDocuments({ type: 'agent_run', status: 'failed' });
    
    const usage = await SystemMetric.aggregate([
      { $match: { type: { $in: ['agent_run', 'api_call'] } } },
      { $group: {
          _id: null,
          totalTokens: { $sum: '$tokensUsed' },
          totalCost: { $sum: '$cost' },
          avgQuality: { $avg: '$qualityScore' }
      }}
    ]);

    const stats = usage[0] || { totalTokens: 0, totalCost: 0, avgQuality: 100 };

    res.json({
      agents: {
        totalRuns,
        failedRuns,
        activeAgents: 5,
        uptime: '99.9%'
      },
      usage: {
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost.toFixed(4),
        avgQuality: stats.avgQuality ? stats.avgQuality.toFixed(1) : 'N/A'
      },
      credits: {
        totalSpent: stats.totalCost.toFixed(4),
        remaining: (1000 - stats.totalCost).toFixed(4)
      }
    });
  } catch (err) {
    console.error('Admin Stats Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/company-dashboard-stats
// @desc    Get stats for the 12-panel team admin dashboard
router.get('/company-dashboard-stats', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      avgScore: 78.5,
      totalSubmissions: 42,
      dimensions: { clarity: 82, constraints: 75, specificity: 88, iteration: 68 },
      benchmark: {
        team: [82, 75, 88, 68, 85],
        median: [70, 70, 75, 70, 80]
      },
      trend: [7.2, 7.5, 7.1, 7.8, 8.2, 8.0, 8.4, 78.5]
    });
  }
  try {
    const companyId = req.user.companyId;
    if (!companyId && req.user.role !== 'superadmin') {
      return res.status(403).json({ msg: 'Access denied' });
    }

    // If superadmin but no companyId in query, maybe they want global or a specific one?
    // For now, let's assume this is for the current company
    const effectiveCompanyId = companyId || req.query.companyId;
    if (!effectiveCompanyId) return res.status(400).json({ msg: 'Company ID required' });

    const Response = require('../models/Response');
    
    // Aggregate team performance
    const teamStats = await Response.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(effectiveCompanyId) } },
      { $group: {
          _id: null,
          avgScore: { $avg: '$overallScore' },
          totalSubmissions: { $count: {} },
          // Heatmap dimensions
          clarity: { $avg: '$dimensionScores.clarity' },
          constraints: { $avg: '$dimensionScores.constraints' },
          specificity: { $avg: '$dimensionScores.specificity' },
          iteration: { $avg: '$dimensionScores.iteration' }
      }}
    ]);

    const stats = teamStats[0] || { avgScore: 0, totalSubmissions: 0 };

    res.json({
      avgScore: stats.avgScore || 0,
      totalSubmissions: stats.totalSubmissions || 0,
      dimensions: {
        clarity: stats.clarity || 0,
        constraints: stats.constraints || 0,
        specificity: stats.specificity || 0,
        iteration: stats.iteration || 0
      },
      benchmark: {
        team: [stats.clarity || 0, stats.constraints || 0, stats.specificity || 0, stats.iteration || 0, 85],
        median: [70, 70, 75, 70, 80]
      },
      trend: [7.2, 7.5, 7.1, 7.8, 8.2, 8.0, 8.4, (stats.avgScore || 0).toFixed(1)]
    });
  } catch (err) {
    console.error('Company Dashboard Stats Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/agent-logs
// @desc    Get recent global agent activities (Superadmin only)
router.get('/agent-logs', protect, authorize('superadmin'), async (req, res) => {
  try {
    const logs = await SystemMetric.find({ type: 'agent_run' })
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(logs);
  } catch (err) {
    console.error('Agent Logs Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/companies
// @desc    Get all companies (Superadmin only)
router.get('/companies', protect, authorize('superadmin'), async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    console.error('Companies List Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/my-company
// @desc    Get current user's company details
router.get('/my-company', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      _id: 'mock-company-id',
      name: 'ArGen Mock Corp',
      industry: 'AI & Data Science',
      status: 'active',
      inviteCode: 'MOCK1234'
    });
  }
  try {
    if (!req.user.companyId) {
      return res.status(404).json({ msg: 'No company associated with this account' });
    }
    const company = await Company.findById(req.user.companyId);
    res.json(company);
  } catch (err) {
    console.error('My Company Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/admin/invitations
// @desc    Create a registration invitation
router.post('/invitations', protect, authorize('superadmin'), async (req, res) => {
  const { email, companyName } = req.body;
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const invitation = new Invitation({
      email,
      companyName,
      token
    });
    await invitation.save();
    
    // The link format requested by user
    const link = `https://argen.isira.club/registration?approval=true&team_id=${token}`;
    
    // Send email notification
    const sendEmail = require('../utils/sendEmail');
    const { createEmailTemplate } = require('../utils/emailTemplate');
    
    const html = createEmailTemplate({
        title: 'ArGen Workspace Invitation',
        preheader: `You have been invited to set up ${companyName} on ArGen.`,
        bodyContent: `
            <h1>Workspace Approved</h1>
            <p>Your workspace request for <strong>${companyName}</strong> has been approved by our administrators.</p>
            <p>Please click the button below to complete your TeamAdmin registration and set up your workspace.</p>
        `,
        buttonText: 'Complete Registration',
        buttonUrl: link
    });

    await sendEmail({
      email,
      subject: 'Your ArGen Registration Invitation',
      html
    });
    
    res.json({ link, invitation });
  } catch (err) {
    console.error('Invitation Creation Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

const { researchCompany } = require('../utils/ai-agents');

// @route   PATCH api/admin/companies/:id/status
// @desc    Update company status
router.patch('/companies/:id/status', protect, authorize('superadmin'), async (req, res) => {
  const { status } = req.body;
  try {
    let company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    company.status = status;
    if (status === 'active' && !company.approvedAt) {
      company.approvedBy = req.user.id;
      company.approvedAt = Date.now();
      
      // Trigger Agent 1 — Research Agent (Async)
      researchCompany(company.name, company.domain || company.name + '.com').then(async profile => {
         company.industry = profile.industry;
         company.primary_ai_tools = profile.primary_ai_tools;
         company.language_tone = profile.language_tone;
         company.competitor_names = profile.competitor_names;
         company.challenge_themes = profile.challenge_themes;
         company.profileGeneratedAt = Date.now();
         await company.save();
         console.log(`Research Agent completed for ${company.name}`);
      }).catch(err => console.error('Research Agent failed:', err));
    }
    await company.save();

    res.json({ msg: `Company status updated to ${status}`, company });
  } catch (err) {
    console.error('Company Status Update Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/users
// @desc    Get all users (for safety/audit)
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error('Users List Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/admin/flagged
// @desc    Get flagged submissions for a company
// @access  Private (TeamAdmin)
router.get('/flagged', protect, authorize('teamadmin'), async (req, res) => {
  try {
    const Response = require('../models/Response');
    const flaggedResponses = await Response.find({ 
      companyId: req.user.companyId,
      scoringStatus: 'Manual Review' 
    }).populate('user', 'name');
    
    const formatted = flaggedResponses.map(r => ({
      userName: r.user ? r.user.name : 'Unknown User',
      flags: r.flags || []
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error('Flagged Responses Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
