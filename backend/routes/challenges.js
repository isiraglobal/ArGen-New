const express = require('express');
const router = express.Router();
const Challenge = require('../models/Challenge');
const Evaluation = require('../models/Evaluation');
const Response = require('../models/Response');
const auth = require('../middleware/auth');

// @route   GET api/challenges
// @desc    Get all challenges
// @access  Private
router.get('/', auth, async (req, res) => {
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
router.post('/:id/submit', auth, async (req, res) => {
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
