const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Challenge = require('../models/Challenge');
const User = require('../models/User');
const Company = require('../models/Company');
const { generateChallenge } = require('../utils/ai-agents');
const { protect, authorize, isApproved } = require('../middleware/auth');

// @route   POST api/evaluations/generate-ai
// @desc    Trigger AI Intelligence Cycle to generate challenges
// @access  Private (TeamAdmin)
router.post('/generate-ai', protect, isApproved, authorize('teamadmin'), async (req, res) => {
  try {
    const company = await Company.findById(req.user.companyId);
    const users = await User.find({ companyId: req.user.companyId, role: 'member' });

    if (users.length === 0) {
      return res.status(400).json({ msg: 'No members found in this company to evaluate.' });
    }

    // Create a new evaluation batch
    const evaluation = new Evaluation({
      title: `AI Intelligence Cycle - ${new Date().toLocaleDateString()}`,
      description: 'Autonomously generated challenges based on team roles and performance history.',
      companyId: company._id,
      createdBy: req.user.id,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      status: 'active'
    });

    const challengeIds = [];

    // Generate challenges for the team (one per role type to start with, or per user)
    // For simplicity, we'll generate one for each member's role
    for (const member of users) {
      const challengeData = await generateChallenge(member, company);
      
      const challenge = new Challenge({
        challengeId: `CHG-${Date.now()}-${member._id.toString().substring(0,4)}`,
        name: challengeData.name,
        type: challengeData.type,
        difficulty: challengeData.difficulty,
        text: challengeData.text,
        wordLimit: challengeData.wordLimit,
        timeEstimate: challengeData.timeEstimate,
        dimensions: challengeData.dimensions
      });

      await challenge.save();
      challengeIds.push(challenge._id);
    }

    evaluation.challenges = challengeIds;
    await evaluation.save();

    res.status(201).json(evaluation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/evaluations
// @desc    Create a new evaluation batch
// @access  Private (TeamAdmin)
router.post('/', protect, isApproved, authorize('teamadmin'), async (req, res) => {
  const { title, description, challengeIds, deadline } = req.body;

  try {
    const evaluation = new Evaluation({
      title,
      description,
      companyId: req.user.companyId,
      createdBy: req.user.id,
      challenges: challengeIds,
      deadline,
      status: 'active'
    });

    await evaluation.save();
    res.status(201).json(evaluation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/evaluations
// @desc    Get all evaluations for the user's company
// @access  Private
router.get('/', protect, isApproved, async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ companyId: req.user.companyId })
      .populate('challenges', 'title difficulty category')
      .sort({ createdAt: -1 });
    res.json(evaluations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/evaluations/:id
// @desc    Get evaluation details
// @access  Private
router.get('/:id', protect, isApproved, async (req, res) => {
  try {
    const evaluation = await Evaluation.findOne({ 
      _id: req.params.id, 
      companyId: req.user.companyId 
    }).populate('challenges');

    if (!evaluation) {
      return res.status(404).json({ msg: 'Evaluation not found' });
    }

    res.json(evaluation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
