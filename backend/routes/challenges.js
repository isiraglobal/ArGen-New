const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const { protect } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

function validateSubmission(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: 'Validation failed', errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
}

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
    
    // Fetch challenges for the user's company that are active
    const challengesRef = db.collection('challenges');
    const snapshot = await challengesRef
      .where('companyId', '==', user.companyId)
      .where('active', '==', true)
      .get();
      
    let challenges = [];
    snapshot.forEach(doc => {
      challenges.push({ _id: doc.id, ...doc.data() });
    });
    
    // Filter personalized role/dept matching in memory
    challenges = challenges.filter(ch => {
      return !ch.targetedRole || 
             ch.targetedRole === 'All' || 
             ch.targetedRole === user.jobRole || 
             ch.targetedDept === user.department;
    });

    res.json(challenges);
  } catch (err) {
    console.error('Fetch Active Challenges Error:', err);
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
    const challengesRef = db.collection('challenges');
    const snapshot = await challengesRef.orderBy('createdAt', 'desc').get();
    
    const challenges = [];
    snapshot.forEach(doc => {
      challenges.push({ _id: doc.id, ...doc.data() });
    });
    
    res.json(challenges);
  } catch (err) {
    console.error('Fetch Challenges Error:', err);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/challenges/:id/submit
// @desc    Submit a response to a challenge
// @access  Private
router.post('/:id/submit', protect, [
  body('promptText').trim().isLength({ min: 1 }).withMessage('Prompt text is required').escape(),
  body('modelOutput').optional().trim().escape(),
], validateSubmission, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      _id: 'mock-response-id',
      scoringStatus: 'Pending',
      msg: 'MOCK MODE: Submission received successfully.'
    });
  }
  
  const { promptText, modelOutput, evaluationId } = req.body;

  try {
    const responseData = {
      user: req.user.id,
      challenge: req.params.id,
      evaluation: evaluationId || null,
      promptText,
      modelOutput,
      createdAt: new Date(),
      status: 'Pending'
    };

    const docRef = await db.collection('responses').add(responseData);
    res.json({ _id: docRef.id, ...responseData });
  } catch (err) {
    console.error('Submit Response Error:', err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
