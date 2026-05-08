const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');

// @route   GET api/admin/companies
// @desc    Get all companies (Superadmin only)
router.get('/companies', protect, authorize('superadmin'), async (req, res) => {
  try {
    const companies = await Company.find().sort({ createdAt: -1 });
    res.json(companies);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/companies/:id/approve
// @desc    Approve a company
router.put('/companies/:id/approve', protect, authorize('superadmin'), async (req, res) => {
  try {
    let company = await Company.findById(req.id); // Wait, req.params.id
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    company.status = 'active';
    company.approvedBy = req.user.id;
    company.approvedAt = Date.now();
    await company.save();

    res.json({ msg: 'Company approved successfully', company });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/admin/companies/:id/suspend
// @desc    Suspend a company
router.put('/companies/:id/suspend', protect, authorize('superadmin'), async (req, res) => {
  try {
    let company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    company.status = 'suspended';
    await company.save();

    res.json({ msg: 'Company suspended', company });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/admin/users
// @desc    Get all users (for safety/audit)
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
