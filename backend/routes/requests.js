const express = require('express');
const router = express.Router();
const PilotRequest = require('../models/PilotRequest');
const Company = require('../models/Company');
const crypto = require('crypto');

// @route   POST api/requests/submit
// @desc    Submit a new pilot request
// @access  Public
router.post('/submit', async (req, res) => {
  try {
    const { name, email, companyName, teamSize, useCase } = req.body;
    
    const newRequest = new PilotRequest({
      name,
      email,
      companyName,
      teamSize,
      useCase
    });

    await newRequest.save();
    res.json({ success: true, message: 'Request submitted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/requests/all
// @desc    Get all pilot requests
// @access  Private (In a real app, this should be admin-only)
router.get('/all', async (req, res) => {
  try {
    const requests = await PilotRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/requests/approve/:id
// @desc    Approve a request and generate a company code
// @access  Private (Admin)
router.post('/approve/:id', async (req, res) => {
  try {
    const request = await PilotRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (request.status === 'approved') {
      return res.status(400).json({ message: 'Request already approved' });
    }

    // Generate a unique 8-character code
    const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

    // Create Company
    const newCompany = new Company({
      name: request.companyName,
      inviteCode: inviteCode,
      adminEmail: request.email
    });

    await newCompany.save();

    // Update Request Status
    request.status = 'approved';
    await request.save();

    // 4. Send Welcome Email
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"ArGen Onboarding" <${process.env.EMAIL_USER}>`,
      to: request.email,
      subject: 'Welcome to the ArGen Pilot Program',
      text: `Hello ${request.name},\n\n` +
            `Your pilot request for ${request.companyName} has been approved!\n\n` +
            `Your unique Organization Invite Code is: ${inviteCode}\n\n` +
            `Share this code with your team members. They can join by logging in at https://argen.isira.club/login and entering this code during setup.\n\n` +
            `Best regards,\nThe ArGen Team`
    };

    try {
      await transporter.sendMail(mailOptions);
    } catch (mailErr) {
      console.error('Email sending failed:', mailErr);
      // We don't block the approval if email fails, but we log it
    }

    res.json({ 
      success: true, 
      message: 'Company approved and code generated',
      inviteCode: inviteCode,
      company: newCompany 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
