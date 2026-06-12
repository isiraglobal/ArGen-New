const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { auth, db, supabase } = require('../utils/supabase');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');
const { protect } = require('../middleware/auth');

// Helper to authenticate user using Supabase Auth
const signInWithSupabase = async (email, password) => {
  if (!supabase) throw new Error('Supabase not initialized');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data; // { user, session }
};

// @route   GET api/auth/invitation/:token
// @desc    Verify invitation token
// @access  Public
router.get('/invitation/:token', async (req, res) => {
  try {
    if (global.MOCK_DB) {
      return res.json({
        token: req.params.token,
        email: 'test@example.com',
        role: 'member',
        companyName: 'Mock Corp'
      });
    }

    const invitationsRef = db.collection('invitations');
    const snapshot = await invitationsRef
      .where('token', '==', req.params.token)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ message: 'Invalid or expired invitation link' });
    }

    const doc = snapshot.docs[0];
    res.json({ id: doc.id, ...doc.data() });
  } catch (err) {
    console.error('Invitation Verification Error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @route   POST api/auth/register-company
// @desc    Register a new company and its admin
// @access  Public
router.post('/register-company', async (req, res) => {
  const { companyName, industry, size, country, name, email, password, token } = req.body;

  if (global.MOCK_DB) {
    return res.status(201).json({ 
      msg: 'MOCK MODE: Company registration successful.',
      companyId: 'mock-company-id',
      inviteCode: 'MOCK1234'
    });
  }

  try {
    // 1. Verify token if provided
    let invitationDoc = null;
    if (token) {
      const snapshot = await db.collection('invitations')
        .where('token', '==', token)
        .where('used', '==', false)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return res.status(400).json({ message: 'Invalid invitation token' });
      }
      invitationDoc = snapshot.docs[0];
    }

    // 2. Check if company exists
    const companySnapshot = await db.collection('companies')
      .where('name', '==', companyName)
      .limit(1)
      .get();

    if (!companySnapshot.empty) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    // 3. Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Create Company Doc
    const companyData = {
      name: companyName,
      industry,
      size,
      country,
      primaryContact: { name, email },
      inviteCode,
      status: invitationDoc ? 'active' : 'pending',
      createdAt: new Date()
    };
    
    const companyRef = await db.collection('companies').add(companyData);

    // 4. Create Admin User in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true
      });
    } catch (authErr) {
      // Rollback company creation if auth fails
      await companyRef.delete();
      return res.status(400).json({ message: authErr.message });
    }

    // 5. Store user profile in Firestore
    const userData = {
      name,
      email,
      role: 'teamadmin',
      companyId: companyRef.id,
      createdAt: new Date()
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData);

    // Set Custom User Claims for role-based security
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'teamadmin',
      companyId: companyRef.id
    });

    // Mark invitation as used
    if (invitationDoc) {
      await invitationDoc.ref.update({
        used: true,
        usedBy: userRecord.uid,
        usedAt: new Date()
      });
    }

    res.status(201).json({ 
      msg: 'Company registration successful. Pending App Admin approval.',
      companyId: companyRef.id,
      inviteCode: inviteCode
    });

  } catch (err) {
    console.error('Company Registration Error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@argen';
    const adminPass = process.env.ADMIN_PASSWORD || 'argen@admin';

    // 1. Admin/Test User Bypasses
    if ((email === 'test@argen' && password === adminPass) || (email === adminEmail && password === adminPass)) {
      const isSuperadmin = email === adminEmail;
      const mockUser = {
        uid: 'mock-uid',
        name: isSuperadmin ? 'System Admin (Mock)' : 'Test User (Mock)',
        email,
        role: isSuperadmin ? 'superadmin' : 'teamadmin',
        companyId: 'mock-company-id'
      };
      
      return res.json({
        token: 'mock-token',
        user: {
          id: mockUser.uid,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          companyId: mockUser.companyId
        }
      });
    }

    // 2. Perform Supabase Auth Sign-in
    let supabaseSession;
    try {
      supabaseSession = await signInWithSupabase(email, password);
    } catch (authErr) {
      return res.status(400).json({ msg: 'Invalid Credentials' });
    }

    const uid = supabaseSession.user.id;
    const token = supabaseSession.session.access_token;

    // 3. Fetch User profile details from Supabase DB
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(400).json({ msg: 'User profile not found.' });
    }

    const user = userDoc.data();

    // 4. Validate Company Status (non-superadmins)
    if (user.role !== 'superadmin' && user.companyId) {
      const companyDoc = await db.collection('companies').doc(user.companyId).get();
      if (!companyDoc.exists || companyDoc.data().status !== 'active') {
        return res.status(403).json({ 
          msg: 'Your company account is pending approval or has been suspended. Please contact the App Admin.' 
        });
      }
    }

    if (user.email && user.email.includes('.')) {
      sendEmail({
        email: user.email,
        subject: 'Security Alert: New Login to ArGen',
        html: createEmailTemplate({
          title: 'New Login Detected - ArGen',
          preheader: 'A new login was detected on your ArGen account.',
          bodyContent: `
            <h1>New Login Detected</h1>
            <p>Hello ${user.name || 'User'},</p>
            <p>A new login was detected on your ArGen account on ${new Date().toUTCString()}.</p>
            <p>If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately or contact ArGen support.</p>
          `,
          buttonText: 'Secure Account',
          buttonUrl: 'https://argen.isira.club/forgot-password'
        })
      }).catch(emailErr => console.error('Failed to send login alert email:', emailErr.message));
    }

    res.json({
      token,
      user: {
        id: uid,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId || null
      }
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/auth/me
// @desc    Get current authenticated user's profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  if (global.MOCK_DB) {
    return res.json({
      id: req.user.id || 'mock-user-id',
      name: 'Demo User',
      email: 'demo@argen.io',
      role: req.user.role || 'member',
      companyId: req.user.companyId || 'mock-company-id',
      currentStreak: 3,
      longestStreak: 7,
      weakestDimension: 'iteration_quality'
    });
  }
  
  try {
    let userDoc = await db.collection('users').doc(req.user.id).get();
    
    if (!userDoc.exists) {
      // Check if a user with the same email exists in the database
      const emailSnapshot = await db.collection('users')
        .where('email', '==', req.user.email)
        .limit(1)
        .get();
        
      if (!emailSnapshot.empty) {
        // Link existing user profile with the new Supabase Auth UID
        const existingDoc = emailSnapshot.docs[0];
        const existingData = existingDoc.data();
        
        // Delete old document and create/set new one with correct ID
        await existingDoc.ref.delete();
        await db.collection('users').doc(req.user.id).set(existingData);
        
        userDoc = await db.collection('users').doc(req.user.id).get();
        console.log(`Linked profile for email ${req.user.email} with new Supabase UID ${req.user.id}`);
      } else {
        // Auto-create a default profile for new Google OAuth sign-ups
        const defaultName = req.user.email ? req.user.email.split('@')[0] : 'User';
        const userData = {
          name: defaultName.charAt(0).toUpperCase() + defaultName.slice(1),
          email: req.user.email,
          role: 'member',
          companyId: null,
          jobRole: '',
          department: '',
          createdAt: new Date()
        };
        await db.collection('users').doc(req.user.id).set(userData);
        userDoc = await db.collection('users').doc(req.user.id).get();
        console.log(`Created new default profile for Google login: ${req.user.email}`);
      }
    }
    
    res.json({ id: userDoc.id, ...userDoc.data() });
  } catch (err) {
    console.error('Get Me Error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST api/auth/join-team
// @desc    Register a member via invite code
// @access  Public
router.post('/join-team', async (req, res) => {
  const { name, email, password, inviteCode, jobRole, department } = req.body;

  if (global.MOCK_DB) {
    return res.json({ 
      token: 'mock-token', 
      user: {
        id: 'mock-member-id',
        name,
        email,
        role: 'member',
        companyId: 'mock-company-id'
      }
    });
  }

  try {
    // 1. Validate Invite Code
    const companySnapshot = await db.collection('companies')
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1)
      .get();

    if (companySnapshot.empty) {
      return res.status(400).json({ msg: 'Invalid Invite Code' });
    }

    const companyDoc = companySnapshot.docs[0];
    const company = companyDoc.data();

    if (company.status !== 'active') {
      return res.status(403).json({ msg: 'Company account is not active' });
    }

    // 2. Create User in Firebase Auth
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true
      });
    } catch (authErr) {
      return res.status(400).json({ msg: authErr.message });
    }

    // 3. Store profile details in Firestore
    const userData = {
      name,
      email,
      role: 'member',
      companyId: companyDoc.id,
      jobRole: jobRole || '',
      department: department || '',
      createdAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Set Custom Claims for role checks
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'member',
      companyId: companyDoc.id
    });

    // 4. Authenticate newly registered user to return session details
    const supabaseSession = await signInWithSupabase(email, password);

    res.json({
      token: supabaseSession.session.access_token,
      user: {
        id: userRecord.uid,
        name,
        email,
        role: 'member',
        companyId: companyDoc.id
      }
    });

  } catch (err) {
    console.error('Join Team Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Generate reset link via Supabase Auth
// @access  Public
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const emailLower = email.toLowerCase();

  try {
    const token = crypto.randomBytes(20).toString('hex');
    let userProfile = null;
    let userDocId = null;

    if (!global.MOCK_DB) {
      const snapshot = await db.collection('users')
        .where('email', '==', emailLower)
        .limit(1)
        .get();
      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        userProfile = doc.data();
        userDocId = doc.id;
        await doc.ref.update({
          resetPasswordToken: token,
          resetPasswordExpire: new Date(Date.now() + 3600000) // 1 hour
        });
      }
    }

    let resetUrl;
    if (global.MOCK_DB) {
      resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
    } else {
      try {
        resetUrl = await auth.generatePasswordResetLink(emailLower, {
          url: `${req.protocol}://${req.get('host')}/reset-password`
        });
      } catch (supabaseErr) {
        console.log(`[Forgot Password] Supabase generateLink failed: ${supabaseErr.message}`);
        
        // If the user is not found in Supabase Auth but exists in our users collection,
        // we create the user in Supabase Auth and link their profile!
        if (userProfile && (supabaseErr.message.includes('User not found') || supabaseErr.message.includes('user_not_found') || supabaseErr.status === 404 || supabaseErr.message.includes('not found'))) {
          console.log(`[Forgot Password] User exists in database but not in Supabase Auth. Auto-linking...`);
          
          // Generate a secure random password for initial creation
          const tempPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
          
          // Create the user in Supabase Auth
          const userRecord = await auth.createUser({
            email: emailLower,
            password: tempPassword,
            displayName: userProfile.name || 'User',
            emailVerified: true
          });
          
          const newUid = userRecord.uid;
          
          // Set custom user claims/metadata
          await auth.setCustomUserClaims(newUid, {
            role: userProfile.role || 'member',
            companyId: userProfile.companyId || null
          });
          
          // Link the database profile by rewriting it with the new Supabase UID
          // Delete old profile doc if its ID is different from the new Supabase UID
          if (userDocId !== newUid) {
            await db.collection('users').doc(userDocId).delete();
            // Update the reset tokens in the linked profile data
            const updatedProfile = {
              ...userProfile,
              resetPasswordToken: token,
              resetPasswordExpire: new Date(Date.now() + 3600000)
            };
            await db.collection('users').doc(newUid).set(updatedProfile);
          }
          
          console.log(`[Forgot Password] Successfully linked DB profile to new Supabase Auth user ${newUid}`);
          
          // Retry generating the reset link
          resetUrl = await auth.generatePasswordResetLink(emailLower, {
            url: `${req.protocol}://${req.get('host')}/reset-password`
          });
        } else {
          // Re-throw if it's a different error
          throw supabaseErr;
        }
      }
    }

    const html = createEmailTemplate({
      title: 'Password Reset - ArGen',
      preheader: 'Secure link to reset your ArGen password.',
      bodyContent: `
          <h1>Password Reset</h1>
          <p>You are receiving this email because a password reset was requested for your ArGen account.</p>
          <p>Click the secure link below to set a new password.</p>
      `,
      buttonText: 'Reset Password',
      buttonUrl: resetUrl
    });

    await sendEmail({
      email: emailLower,
      subject: 'Password Reset - ArGen',
      html
    });

    res.status(200).json({ message: 'Email sent' });
  } catch (err) {
    console.error('Forgot Password Error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @route   POST api/auth/reset-password/:token
// @desc    Reset password in database-only mode
// @access  Public
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (global.MOCK_DB) {
    return res.json({ message: 'Password reset successful (Mock Mode)' });
  }

  try {
    const snapshot = await db.collection('users')
      .where('resetPasswordToken', '==', token)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    if (userData.resetPasswordExpire && new Date(userData.resetPasswordExpire) < new Date()) {
      return res.status(400).json({ message: 'Token has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await userDoc.ref.update({
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpire: null
    });

    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset Password Error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

// @route   POST api/auth/verify-passcode
// @desc    Verify team invite code for session access
// @access  Private
router.post('/verify-passcode', async (req, res) => {
  const { inviteCode } = req.body;

  if (global.MOCK_DB) {
    return res.json({ valid: true, companyName: 'Mock Corporation' });
  }

  try {
    const snapshot = await db.collection('companies')
      .where('inviteCode', '==', inviteCode.toUpperCase())
      .limit(1)
      .get();
    
    if (snapshot.empty) {
      return res.status(400).json({ valid: false, message: 'Invalid Passcode' });
    }

    const companyDoc = snapshot.docs[0];
    res.json({ valid: true, companyName: companyDoc.data().name });
  } catch (err) {
    console.error('Passcode Verification Error:', err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
