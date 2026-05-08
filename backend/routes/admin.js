const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Company = require('../models/Company');
const User = require('../models/User');
const Invitation = require('../models/Invitation');
const crypto = require('crypto');

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

// @route   POST api/admin/invitations
// @desc    Create a registration invitation
router.post('/invitations', protect, authorize('superadmin'), async (req, res) => {
  const { email, companyName } = req.body;
  try {
    const token = crypto.randomBytes(16).toString('hex');
    const invitation = new Invitation({
      email,
      companyName,
      token
    });
    await invitation.save();
    
    // The link format requested by user
    const link = `https://argen.isira.club/registration.html?approval=true&team_id=${token}`;
    
    res.json({ link, invitation });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PATCH api/admin/companies/:id/status
// @desc    Update company status
router.patch('/companies/:id/status', protect, authorize('superadmin'), async (req, res) => {
  const { status } = req.body;
  try {
    let company = await Company.findById(req.params.id);
    if (!company) return res.status(404).json({ msg: 'Company not found' });

    company.status = status;
    if (status === 'active' && !company.approvedAt) {
      company.approvedBy = req.user.id;
      company.approvedAt = Date.now();
    }
    await company.save();

    res.json({ msg: `Company status updated to ${status}`, company });
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
