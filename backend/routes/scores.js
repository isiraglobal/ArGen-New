const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const Response = require('../models/Response');
const auth = require('../middleware/auth');

// @route   GET api/scores/:teamId
// @desc    Get all scores for a team
// @access  Private
router.get('/:teamId', auth, async (req, res) => {
  try {
    const evaluations = await Evaluation.find({ team: req.params.teamId })
      .populate('challenge', ['title', 'type'])
      .sort({ createdAt: -1 });

    res.json(evaluations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/scores/user/:userId
// @desc    Get all scores for a specific user
// @access  Private
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const responses = await Response.find({ user: req.params.userId })
      .populate('challenge', ['title'])
      .sort({ createdAt: -1 });

    res.json(responses);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
