const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const Evaluation = require('../models/Evaluation');
const Challenge = require('../models/Challenge');
const { scoreResponse } = require('../utils/ai-agents');
const { protect, isApproved, authorize } = require('../middleware/auth');

// @route   POST api/responses/submit
// @desc    Submit a response for a challenge in a batch
// @access  Private (Member)
router.post('/submit', protect, isApproved, authorize('member', 'teamadmin', 'superadmin'), async (req, res) => {
  const { evaluationId, challengeId, promptText, modelOutput, workflowApproach, timeTaken, baselineTime, responseText: reqResponseText } = req.body;
  const responseText = reqResponseText || `Prompt: ${promptText}\n\nOutput: ${modelOutput}`;

  if (global.MOCK_DB) {
    return res.status(201).json({
      _id: 'mock-resp-' + Date.now(),
      challengeId,
      scores: { clarity: 82, constraint_application: 78, output_specificity: 85, iteration_quality: 71, total: 79 },
      justification: 'Strong clarity and output specificity. Focus on iteration quality for improvement.',
      improvement: 'Try breaking your prompt into numbered steps to improve constraint application scores.',
      flags: [],
      scoringStatus: 'Scored',
      createdAt: new Date()
    });
  }

  try {
    // 1. Verify evaluation and challenge
    const evaluation = await Evaluation.findOne({ _id: evaluationId, companyId: req.user.companyId });
    if (!evaluation) {
      return res.status(404).json({ msg: 'Evaluation batch not found' });
    }

    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ msg: 'Challenge not found' });
    }

    // 2. Check for duplicate submission today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const existing = await Response.findOne({
      user: req.user.id,
      challenge: challengeId,
      createdAt: { $gte: startOfDay }
    });
    if (existing) {
      if (process.env.NODE_ENV === 'production') {
        return res.status(400).json({ msg: 'You have already submitted a response for this challenge today.' });
      } else {
        console.log("Development Bypass: Allowing duplicate challenge submission for testing.");
      }
    }

    // 3. Call AI Scoring Agent
    const aiResult = await scoreResponse(challenge, responseText);
    
    const response = new Response({
      user: req.user.id,
      companyId: req.user.companyId,
      evaluationId,
      challenge: challengeId,
      responseText,
      workflowApproach,
      timeTaken,
      baselineTime,
      scores: {
        clarity: aiResult.clarity,
        constraint_application: aiResult.constraint_application,
        output_specificity: aiResult.output_specificity,
        iteration_quality: aiResult.iteration_quality,
        total: aiResult.total_score
      },
      justification: aiResult.justification,
      improvement: aiResult.improvement,
      flags: aiResult.flags || [],
      scoringStatus: aiResult.flags?.length > 0 ? 'Manual Review' : 'Scored',
      modelUsed: 'gpt-4o'
    });

    await response.save();

    // 4. Update User Streak
    const user = await require('../models/User').findById(req.user.id);
    if (user) {
      user.currentStreak += 1;
      if (user.currentStreak > user.longestStreak) {
        user.longestStreak = user.currentStreak;
      }
      // Update weakest dimension based on this score
      const dims = ['clarity', 'constraint_application', 'output_specificity', 'iteration_quality'];
      const scores = [aiResult.clarity, aiResult.constraint_application, aiResult.output_specificity, aiResult.iteration_quality];
      const minIndex = scores.indexOf(Math.min(...scores));
      user.weakestDimension = dims[minIndex];
      
      await user.save();
    }

    res.status(201).json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/responses/my
// @desc    Get current user's submissions
// @access  Private
router.get('/my', protect, isApproved, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      { _id: 'mock-r1', challengeId: { title: 'Strategic AI Deployment' }, overallScore: 82, createdAt: new Date(Date.now() - 86400000 * 1) },
      { _id: 'mock-r2', challengeId: { title: 'Constraint-First Prompting' }, overallScore: 75, createdAt: new Date(Date.now() - 86400000 * 2) },
      { _id: 'mock-r3', challengeId: { title: 'Adversarial Output Audit' }, overallScore: 91, createdAt: new Date(Date.now() - 86400000 * 3) }
    ]);
  }
  try {
    const responses = await Response.find({ user: req.user.id })
      .populate('challenge', 'title')
      .populate('evaluationId', 'title')
      .sort({ createdAt: -1 });
    res.json(responses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/responses/batch/:batchId
// @desc    Get all submissions for a batch (TeamAdmin audit)
// @access  Private (TeamAdmin)
router.get('/batch/:batchId', protect, isApproved, authorize('teamadmin'), async (req, res) => {
  try {
    const responses = await Response.find({ 
      evaluationId: req.params.batchId,
      companyId: req.user.companyId 
    }).populate('user', 'name email');
    
    res.json(responses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
