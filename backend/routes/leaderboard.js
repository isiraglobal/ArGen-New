const express = require('express');
const router = express.Router();
const { protect, isApproved } = require('../middleware/auth');
const User = require('../models/User');
const Response = require('../models/Response');

// @route   GET api/leaderboard
// @desc    Get weekly leaderboard for the user's company
// @access  Private
router.get('/', protect, isApproved, async (req, res) => {
  try {
    // 1. Get start of current week (Monday 00:00)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    // 2. Fetch all users in company
    const users = await User.find({ companyId: req.user.companyId }).select('name role currentStreak');
    
    // 3. Aggregate scores for each user since start of week
    const leaderboard = await Promise.all(users.map(async (u) => {
      const responses = await Response.find({
        user: u._id,
        createdAt: { $gte: startOfWeek }
      });

      const totalScore = responses.reduce((acc, r) => acc + (r.scores?.total || 0), 0);
      const daysCompleted = responses.length;

      return {
        id: u._id,
        name: u.name,
        score: totalScore,
        daysCompleted,
        streak: u.currentStreak,
        isMe: u._id.toString() === req.user.id
      };
    }));

    // 4. Sort: Total Score > Days Completed > Streak
    leaderboard.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.daysCompleted !== a.daysCompleted) return b.daysCompleted - a.daysCompleted;
      return b.streak - a.streak;
    });

    // 5. Apply visibility rules: Top 10 named, rest anonymised (if member)
    const finalLeaderboard = leaderboard.map((entry, index) => {
      const rank = index + 1;
      if (req.user.role === 'member' && rank > 10 && !entry.isMe) {
        return { ...entry, name: `Team Member #${rank}`, rank };
      }
      return { ...entry, rank };
    });

    res.json(finalLeaderboard);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
