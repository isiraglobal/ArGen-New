const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// @route   POST api/auth/signup
// @desc    Register user
router.post('/signup', async (req, res) => {
  const { name, email, password, company, role } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    user = new User({
      name,
      email,
      password,
      company,
      role
    });

    await user.save();

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/mojoauth-verify
// @desc    Verify MojoAuth token and create session
router.post('/mojoauth-verify', async (req, res) => {
  const { mojoauth_token } = req.body;
  const token = mojoauth_token; // Alias for internal use
  const MojoAuthSDK = require('mojoauth-sdk');
  const mojoauth = new MojoAuthSDK(process.env.MOJOAUTH_API_KEY || "YOUR_MOJOAUTH_API_KEY");

  try {
    const response = await mojoauth.mojoAPI.verifyToken(token);
    
    if (response.authenticated) {
      let user = await User.findOne({ email: response.user.identifier });
      
      if (!user) {
        // Return a special response for new users to prompt for invite code on frontend
        return res.json({ 
          needsOnboarding: true,
          email: response.user.identifier,
          mojoToken: token // Send it back so it can be used for the join-team call
        });
      }

      const payload = {
        user: {
          id: user.id,
          role: user.role
        }
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '5d' },
        (err, token) => {
          if (err) throw err;
          res.json({ token, user });
        }
      );
    } else {
      res.status(401).json({ message: 'MojoAuth Verification Failed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during MojoAuth verification' });
  }
});

// @route   POST api/auth/join-team
// @desc    Join a company using an invite code
// @access  Public (Requires MojoAuth token for verification)
router.post('/join-team', async (req, res) => {
  const { name, mojoToken, inviteCode } = req.body;
  const MojoAuthSDK = require('mojoauth-sdk');
  const mojoauth = new MojoAuthSDK(process.env.MOJOAUTH_API_KEY || "YOUR_MOJOAUTH_API_KEY");

  try {
    // 1. Verify MojoAuth token again to be sure
    const response = await mojoauth.mojoAPI.verifyToken(mojoToken);
    if (!response.authenticated) {
      return res.status(401).json({ message: 'Authentication expired' });
    }

    const email = response.user.identifier;

    // 2. Validate Invite Code
    const Company = require('../models/Company');
    const company = await Company.findOne({ inviteCode: inviteCode.toUpperCase() });
    if (!company) {
      return res.status(400).json({ message: 'Invalid Invite Code. Please contact your admin.' });
    }

    // 3. Create User
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({
      name: name,
      email: email,
      password: crypto.randomBytes(16).toString('hex'), // Random password since we use MojoAuth
      companyId: company._id,
      companyName: company.name,
      role: 'User'
    });

    await user.save();

    // 4. Generate Session Token
    const payload = {
      user: {
        id: user.id,
        role: user.role
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '5d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during team join' });
  }
});

module.exports = router;
