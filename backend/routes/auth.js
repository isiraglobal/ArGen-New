const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');

// @route   POST api/auth/register-company
// @desc    Register a new company and its admin
// @access  Public
router.post('/register-company', async (req, res) => {
  const { companyName, industry, size, country, name, email, password } = req.body;

  try {
    // 1. Check if company exists
    let existingCompany = await Company.findOne({ name: companyName });
    if (existingCompany) {
      return res.status(400).json({ msg: 'Company name already registered' });
    }

    // 2. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User email already exists' });
    }

    // 3. Create Company (Status: Pending)
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const company = new Company({
      name: companyName,
      industry,
      size,
      country,
      primaryContact: { name, email },
      inviteCode,
      status: 'pending'
    });
    await company.save();

    // 4. Create User (Role: TeamAdmin)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'teamadmin',
      companyId: company._id
    });
    await user.save();

    res.status(201).json({ 
      msg: 'Company registration successful. Pending App Admin approval.',
      companyId: company._id 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email }).populate('companyId');
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    // Check Company Status (for non-superadmins)
    if (user.role !== 'superadmin') {
      if (!user.companyId || user.companyId.status !== 'active') {
        return res.status(403).json({ 
          msg: 'Your company account is pending approval or has been suspended. Please contact the App Admin.' 
        });
      }
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        companyId: user.companyId ? user.companyId._id : null
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId ? user.companyId._id : null
        }});
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/join-team
// @desc    Register a member via invite code
// @access  Public
router.post('/join-team', async (req, res) => {
  const { name, email, password, inviteCode, jobRole, department } = req.body;

  try {
    // 1. Validate Invite Code
    const company = await Company.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!company) {
      return res.status(400).json({ msg: 'Invalid Invite Code' });
    }

    if (company.status !== 'active') {
      return res.status(403).json({ msg: 'Company account is not active' });
    }

    // 2. Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    // 3. Create User (Role: Member)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword,
      role: 'member',
      companyId: company._id,
      jobRole,
      department
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role,
        companyId: user.companyId
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          companyId: user.companyId
        }});
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
