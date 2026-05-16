const express = require('express');
const router = express.Router();
const { runCalibration } = require('../utils/calibration');
const { protect, authorize } = require('../middleware/auth');

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
