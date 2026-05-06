const express = require('express');
const router = express.Router();
const Evaluation = require('../models/Evaluation');
const auth = require('../middleware/auth');

// @route   GET api/benchmark
// @desc    Get aggregate benchmark data (anonymized)
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    // This is a mockup of the aggregate benchmarking logic
    // In production, this would use MongoDB aggregation on all completed evaluations
    const benchmarks = {
      globalAverage: 74.2,
      topPercentile: 91.5,
      industryBenchmarks: [
        { sector: 'Tech', avg: 78.5 },
        { sector: 'Finance', avg: 72.1 },
        { sector: 'Health', avg: 69.8 }
      ],
      dimensionAverages: {
        clarity: 76.4,
        constraints: 71.2,
        verification: 75.1
      }
    };

    res.json(benchmarks);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
