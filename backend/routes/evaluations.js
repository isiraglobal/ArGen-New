const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Challenge = require('../models/Challenge');
const { protect, authorize, isApproved } = require('../middleware/auth');

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
