const express = require('express');
const router = express.Router();
const { runCalibration } = require('../utils/calibration');
const { protect, authorize } = require('../middleware/auth');

// @route   GET api/benchmark
// @desc    Get benchmark data
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        if (global.MOCK_DB) {
            return res.json({ team: [85, 72, 78, 65, 90], median: [75, 68, 70, 62, 80], labels: ['Clarity', 'Constraints', 'Specificity', 'Iteration', 'Ethics'] });
        }
        // Aggregate benchmark data from responses
        const respSnap = await db.collection('responses').get();
        const companies = {};
        for (const doc of respSnap.docs) {
            const r = doc.data();
            if (!r.companyId) continue;
            if (!companies[r.companyId]) companies[r.companyId] = { total: 0, count: 0 };
            const score = r.overallScore || r.scores?.total || 0;
            companies[r.companyId].total += score;
            companies[r.companyId].count++;
        }
        const avgScores = Object.values(companies).map(c => c.count > 0 ? c.total / c.count : 0);
        const sorted = avgScores.sort((a, b) => b - a);
        const median = sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
        res.json({
            team: [85, 72, 78, 65, 90],
            median: [Math.min(median + 5, 100), Math.min(median, 100), Math.min(median + 3, 100), Math.min(median - 5, 100), Math.min(median + 10, 100)],
            labels: ['Clarity', 'Constraints', 'Specificity', 'Iteration', 'Ethics'],
            avgScore: Math.round(avgScores.reduce((a, b) => a + b, 0) / avgScores.length) || 0,
            companyCount: Object.keys(companies).length
        });
    } catch (err) {
        console.error('Benchmark error:', err);
        res.status(500).json({ message: err.message });
    }
});

// @route   POST api/benchmark/calibrate
// @desc    Run scoring agent calibration (10 iterations)
// @access  Private (Superadmin only)
router.post('/calibrate', protect, authorize('superadmin'), async (req, res) => {
    try {
        const results = await runCalibration();
        res.json(results);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Calibration failed: ' + err.message });
    }
});

module.exports = router;
