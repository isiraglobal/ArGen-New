const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const Evaluation = require('../models/Evaluation');
const Response = require('../models/Response');
const { protect } = require('../middleware/auth');

// @route   GET api/challenges/active
// @desc    Get active/personalized challenges for the user
// @access  Private
router.get('/active', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      {
        _id: 'mock-ch-1',
        name: 'Strategic Reasoning Challenge',
        type: 'analysis',
        difficulty: 'Advanced',
        text: 'Analyze the impact of agentic workflows on enterprise SaaS procurement...',
        wordLimit: 500,
        timeEstimate: 15
      },
      {
        _id: 'mock-ch-2',
        name: 'Technical Constraint Optimization',
        type: 'technical',
        difficulty: 'Expert',
        text: 'Refactor the following Python code to minimize memory usage in a serverless environment...',
        wordLimit: 1000,
        timeEstimate: 30
      }
    ]);
  }
  try {
    const user = req.user;
    
    // Find challenges for this user's company and matching role/dept
    // Or general ones
    const challenges = await Challenge.find({
      companyId: user.companyId,
      $or: [
        { targetedRole: user.jobRole },
        { targetedDept: user.department },
        { targetedRole: 'All' },
        { targetedRole: { $exists: false } }
      ],
      active: true
    }).sort({ createdAt: -1 });

    // In a real agentic flow, we might trigger generation if 0 found
    // For now, return what we have
    res.json(challenges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/challenges
// @desc    Get all challenges
// @access  Private
router.get('/', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      {
        _id: 'mock-ch-1',
        title: 'Strategic AI Deployment',
        scenario: 'Your enterprise client has tasked you with deploying an AI-powered customer service solution across 5 regional offices. Draft a phased rollout plan addressing data privacy, change management, and ROI measurement.',
        type: 'Strategy',
        difficulty: 'Advanced',
        active: true
      },
      {
        _id: 'mock-ch-2',
        title: 'Constraint-First Prompting',
        scenario: 'Rewrite the following bloated prompt to be 50% shorter while maintaining full output quality. Identify the 3 redundant clauses and explain your removal decisions.',
        type: 'Technical',
        difficulty: 'Expert',
        active: true
      },
      {
        _id: 'mock-ch-3',
        title: 'Adversarial Output Audit',
        scenario: 'Review this AI-generated financial analysis for hallucinations, logical gaps, and unsupported claims. Provide a structured audit report with severity ratings.',
        type: 'Audit',
        difficulty: 'Intermediate',
        active: true
      }
    ]);
  }
  try {
    const challenges = await Challenge.find().sort({ createdAt: -1 });
    res.json(challenges);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/challenges/:id/submit
// @desc    Submit a response to a challenge
// @access  Private
router.post('/:id/submit', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      _id: 'mock-response-id',
      scoringStatus: 'Pending',
      msg: 'MOCK MODE: Submission received successfully.'
    });
  }
  const { promptText, modelOutput, evaluationId } = req.body;

  try {
    const newResponse = new Response({
      user: req.user.id,
      challenge: req.params.id,
      evaluation: evaluationId,
      promptText,
      modelOutput
    });

    const response = await newResponse.save();
    res.json(response);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
