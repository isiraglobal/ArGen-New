const express = require('express');
const router = express.Router();
const { protect, isApproved } = require('../middleware/auth');
const { db } = require('../utils/supabase');

// @route   GET api/leaderboard
// @desc    Get weekly leaderboard for the user's company
// @access  Private
router.get('/', protect, isApproved, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json([
      { id: 'mock-1', userId: 'mock-1', name: 'Alex Chen', totalScore: 94.2, currentStreak: 7, daysCompleted: 5, rank: 1 },
      { id: 'mock-2', userId: 'mock-2', name: 'Sarah Kim', totalScore: 88.5, currentStreak: 5, daysCompleted: 5, rank: 2 },
      { id: 'mock-3', userId: 'mock-3', name: 'James Okafor', totalScore: 81.0, currentStreak: 3, daysCompleted: 4, rank: 3 },
      { id: 'mock-4', userId: 'mock-4', name: 'Priya Nair', totalScore: 75.4, currentStreak: 2, daysCompleted: 4, rank: 4 },
      { id: 'mock-5', userId: 'mock-5', name: 'Marcus T.', totalScore: 68.0, currentStreak: 1, daysCompleted: 3, rank: 5 }
    ]);
  }

  try {
    // 1. Get start of current week (Monday 00:00)
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diff));
    startOfWeek.setHours(0, 0, 0, 0);

    // 2. Fetch all users in company
    const usersSnap = await db.collection('users')
      .where('companyId', '==', req.user.companyId)
      .get();

    const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // 3. Aggregate scores for each user since start of week
    const leaderboard = await Promise.all(users.map(async (u) => {
      const respSnap = await db.collection('responses')
        .where('user', '==', u.id)
        .get();

      // Filter in-memory for this week (Supabase adapter doesn't support date comparisons yet)
      const weeklyResponses = respSnap.docs.filter(doc => {
        const data = doc.data();
        const createdAt = data.createdAt ? new Date(data.createdAt) : new Date(0);
        return createdAt >= startOfWeek;
      });

      const totalScore = weeklyResponses.reduce((acc, doc) => {
        const r = doc.data();
        return acc + (r.scores?.total || 0);
      }, 0);

      return {
        id: u.id,
        name: u.name,
        score: totalScore,
        daysCompleted: weeklyResponses.length,
        streak: u.currentStreak || 0,
        isMe: u.id === req.user.id
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
    console.error('Leaderboard Error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
