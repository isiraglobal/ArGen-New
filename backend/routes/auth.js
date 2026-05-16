const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/User');
const Company = require('../models/Company');
const Invitation = require('../models/Invitation');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');

// @route   GET api/auth/invitation/:token
// @desc    Verify invitation token
// @access  Public
router.get('/invitation/:token', async (req, res) => {
  try {
    const invitation = await Invitation.findOne({ token: req.params.token, used: false });
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation link' });
    }
    res.json(invitation);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/register-company
// @desc    Register a new company and its admin
// @access  Public
router.post('/register-company', async (req, res) => {
  const { companyName, industry, size, country, name, email, password, token } = req.body;

  try {
    // If token provided, verify invitation
    let invitation = null;
    if (token) {
      invitation = await Invitation.findOne({ token, used: false });
      if (!invitation) {
        return res.status(400).json({ message: 'Invalid invitation token' });
      }
    }

    let company = await Company.findOne({ name: companyName });
    if (company) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    // Generate unique 8-char invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    company = new Company({
      name: companyName,
      industry,
      size,
      country,
      primaryContact: { name, email },
      inviteCode,
      status: invitation ? 'active' : 'pending' // Auto-approve if invited
    });

    await company.save();

    // Create Admin User
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

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

    // Mark invitation as used
    if (invitation) {
      invitation.used = true;
      invitation.usedBy = user._id;
      invitation.usedAt = Date.now();
      await invitation.save();
    }

    res.status(201).json({ 
      msg: 'Company registration successful. Pending App Admin approval.',
      companyId: company._id,
      inviteCode: company.inviteCode
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
    // 1. Check for Superadmin Bypass (via Environment Variables)
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@argen.ai';
    const adminPass = process.env.ADMIN_PASSWORD || 'ArGenAdmin2026';

    if (email === adminEmail && password === adminPass) {
      let user = await User.findOne({ email: adminEmail });
      
      // If admin doesn't exist in DB but matches Env Vars, create a temporary session user
      // or just use the one from DB if it exists (preferred for consistency)
      if (!user) {
        // Auto-create superadmin if it doesn't exist but env vars are provided
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPass, salt);
        user = new User({
          name: 'System Architect',
          email: adminEmail,
          password: hashedPassword,
          role: 'superadmin'
        });
        await user.save();
      }

      const payload = { user: { id: user.id, role: 'superadmin', companyId: null } };
      return jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '5d' }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'superadmin', companyId: null } });
      });
    }

    // 2. Normal Login Flow
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

// @route   POST api/auth/forgot-password
// @desc    Generate reset token and send email
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create reset token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to field
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins

    await user.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password.html?token=${resetToken}`;

    const html = createEmailTemplate({
        title: 'Password Reset - ArGen',
        preheader: 'Secure link to reset your ArGen password.',
        bodyContent: `
            <h1>Password Reset</h1>
            <p>You are receiving this email because a password reset was requested for your ArGen account.</p>
            <p>Click the secure link below to set a new password. This link will expire in 10 minutes.</p>
        `,
        buttonText: 'Reset Password',
        buttonUrl: resetUrl
    });

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset - ArGen',
        html
      });

      res.status(200).json({ message: 'Email sent' });
    } catch (err) {
      console.error(err);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      return res.status(500).json({ message: 'Email could not be sent' });
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  try {
    // Get hashed token
    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/auth/verify-passcode
// @desc    Verify team invite code for session access
// @access  Private
router.post('/verify-passcode', async (req, res) => {
  const { inviteCode } = req.body;

  try {
    const company = await Company.findOne({ inviteCode: inviteCode.toUpperCase() });
    
    if (!company) {
      return res.status(400).json({ valid: false, message: 'Invalid Passcode' });
    }

    res.json({ valid: true, companyName: company.name });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
