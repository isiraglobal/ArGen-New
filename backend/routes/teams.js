const express = require('express');
const router = express.Router();
const Team = require('../models/Team');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/teams
// @desc    Create a team
// @access  Private
router.post('/', auth, async (req, res) => {
  const { name, company } = req.body;

  try {
    const newTeam = new Team({
      name,
      company,
      admin: req.user.id
    });

    const team = await newTeam.save();
    res.json(team);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/teams
// @desc    Get all teams for a company/user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const teams = await Team.find({ admin: req.user.id }).sort({ createdAt: -1 });
    res.json(teams);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/teams/:id
// @desc    Get team by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);

    if (!team) {
      return res.status(404).json({ msg: 'Team not found' });
    }

    res.json(team);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Team not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
