const express = require('express');
const router = express.Router();
const Response = require('../models/Response');
const Evaluation = require('../models/Evaluation');
const { protect, isApproved, authorize } = require('../middleware/auth');

// @route   POST api/responses/submit
// @desc    Submit a response for a challenge in a batch
// @access  Private (Member)
router.post('/submit', protect, isApproved, authorize('member', 'teamadmin'), async (req, res) => {
  const { evaluationId, challengeId, promptText } = req.body;

  try {
    // 1. Verify evaluation belongs to company
    const evaluation = await Evaluation.findOne({ _id: evaluationId, companyId: req.user.companyId });
    if (!evaluation) {
      return res.status(404).json({ msg: 'Evaluation batch not found' });
    }

    // 2. Create Response (Mock AI scoring for now)
    const mockScores = {
      clarity: Math.floor(Math.random() * 10) + 1,
      constraint: Math.floor(Math.random() * 10) + 1,
      specificity: Math.floor(Math.random() * 10) + 1,
      iteration: Math.floor(Math.random() * 10) + 1
    };
    
    const overallScore = Object.values(mockScores).reduce((a, b) => a + b, 0) / 4;

    const response = new Response({
      userId: req.user.id,
      companyId: req.user.companyId,
      evaluationId,
      challengeId,
      promptText,
      scores: mockScores,
      overallScore,
      aiFeedback: "This is a placeholder for AI-generated feedback based on the 4-dimension scoring rubric."
    });

    await response.save();

    // 3. Update evaluation average if needed (optional)
    
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
  try {
    const responses = await Response.find({ userId: req.user.id })
      .populate('challengeId', 'title')
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
    }).populate('userId', 'name email');
    
    res.json(responses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
