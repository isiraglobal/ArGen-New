const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { auth, db } = require('../utils/firebase');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');
const { protect } = require('../middleware/auth');
const { registerRules, loginRules, handleValidationErrors } = require('../middleware/validate');

// Helper to authenticate user using Firebase Auth
const signInWithFirebase = async (email, password) => {
  return auth.signInWithPassword(email, password);
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
router.post('/register-company', registerRules, handleValidationErrors, async (req, res) => {
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

    // 4. Create Admin User in Supabase Auth
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

    // 5. Store user profile in Supabase DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const isInvitedAdmin = Boolean(invitationDoc);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: 'teamadmin',
      companyId: companyRef.id,
      companies: [{ companyId: companyRef.id, role: 'teamadmin', name: companyName, joinedAt: new Date().toISOString() }],
      jobRole: 'Workspace Administrator',
      department: 'Administration',
      phone: '',
      employeeId: '',
      departmentId: '',
      profileComplete: true,
      profileStatus: isInvitedAdmin ? 'approved' : 'pending_admin',
      isApproved: isInvitedAdmin,
      createdAt: new Date()
    };
    
    await db.collection('users').doc(userRecord.uid).set(userData);

    // Set role claims in Supabase Auth metadata
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
router.post('/login', loginRules, handleValidationErrors, async (req, res) => {
  const { email, password } = req.body;

  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPass = process.env.ADMIN_PASSWORD;

    // 1. Admin/Test User Bypass (only if explicitly configured in env)
    if (adminEmail && adminPass && email === adminEmail && password === adminPass) {
      const isSuperadmin = true;
      const mockUser = {
        uid: 'mock-uid',
        name: 'System Admin (Mock)',
        email,
        role: 'superadmin',
        companyId: 'admin-company'
      };
      
      return res.json({
        token: 'mock-token',
        user: {
          id: mockUser.uid,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          companyId: mockUser.companyId,
          profileComplete: true,
          profileStatus: 'approved'
        }
      });
    }

    // 2. Perform Firebase Auth Sign-in
    let fbSession;
    try {
      fbSession = await signInWithFirebase(email, password);
    } catch (authErr) {
      // 2a. If user exists in Firestore but not in Firebase Auth, create them
      if (!global.MOCK_DB) {
        const userSnapshot = await db.collection('users')
          .where('email', '==', email.toLowerCase())
          .limit(1)
          .get();
        if (!userSnapshot.empty) {
          const userDoc = userSnapshot.docs[0];
          const userData = userDoc.data();
          const storedHash = userData.password;
          if (storedHash && typeof storedHash === 'string' && storedHash.startsWith('$2')) {
            const match = await bcrypt.compare(password, storedHash);
            if (match) {
              try {
                await auth.createUser({
                  email: email.toLowerCase(),
                  password,
                  displayName: userData.name || 'User',
                  emailVerified: true
                });
                fbSession = await signInWithFirebase(email, password);
              } catch (createErr) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
              }
            } else {
              return res.status(400).json({ msg: 'Invalid Credentials' });
            }
          } else {
            return res.status(400).json({ msg: 'Invalid Credentials' });
          }
        } else {
          return res.status(400).json({ msg: 'Invalid Credentials' });
        }
      } else {
        return res.status(400).json({ msg: 'Invalid Credentials' });
      }
    }

    const uid = fbSession.user.id;
    const token = fbSession.session.access_token;

    // 3. Fetch User profile details from Supabase DB
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return res.status(400).json({ msg: 'User profile not found.' });
    }

    let user = userDoc.data();

    // Auto-assign superadmin role + ADMIN workspace to the platform owner
    if (email.toLowerCase() === 'isiraglobal@gmail.com') {
      user = { ...user, role: 'superadmin', companyId: user.companyId || 'admin-company', profileComplete: true, adminOwner: true };
      if (!global.MOCK_DB) {
        try { await auth.setCustomUserClaims(uid, { role: 'superadmin' }); } catch (e) {}
        try { await db.collection('users').doc(uid).update({ role: 'superadmin', companyId: 'admin-company', profileComplete: true, adminOwner: true }); } catch (e) {}
      }
    }

    // 4. Validate Company Status (non-superadmins)
    if (user.role !== 'superadmin' && user.companyId) {
      const companyDoc = await db.collection('companies').doc(user.companyId).get();
      if (!companyDoc.exists || companyDoc.data().status !== 'active') {
        return res.status(403).json({ 
          msg: 'Your company account is pending approval or has been suspended. Please contact the App Admin.' 
        });
      }
    }

    // Only send login alert for new devices (simple IP check)
    const currentIP = req.ip || req.connection?.remoteAddress;
    const lastIP = user.lastLoginIP;
    if (user.email && lastIP && currentIP && lastIP !== currentIP) {
      sendEmail({
        email: user.email,
        subject: 'Security Alert: New Login to ArGen',
        html: createEmailTemplate({
          title: 'New Login Detected - ArGen',
          preheader: 'A new login was detected on your ArGen account.',
          bodyContent: `
            <h1>New Login Detected</h1>
            <p>Hello ${user.name || 'User'},</p>
            <p>A new login was detected on your ArGen account from a different IP address.</p>
            <p>If this was you, you can safely ignore this email. If you did not log in, please secure your account immediately or contact ArGen support.</p>
          `,
          buttonText: 'Secure Account',
          buttonUrl: 'https://argen.isira.club/forgot-password'
        })
      }).catch(emailErr => console.error('Failed to send login alert email:', emailErr.message));
    }
    // Update last login IP regardless
    try { await userDoc.ref.update({ lastLoginIP: currentIP }); } catch {}

    res.json({
      token,
      user: {
        id: uid,
        name: user.name,
        email: user.email,
        role: user.role,
        companyId: user.companyId || null,
        phone: user.phone || '',
        jobRole: user.jobRole || '',
        department: user.department || '',
        departmentId: user.departmentId || '',
        employeeId: user.employeeId || '',
        profileComplete: user.profileComplete !== false,
        profileStatus: user.profileStatus || 'pending',
        isApproved: Boolean(user.isApproved)
      },
      redirect: user.role === 'superadmin' ? '/admin' : '/dashboard'
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
      weakestDimension: 'iteration_quality',
      profileComplete: true,
      profileStatus: 'approved'
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
          phone: '',
          employeeId: '',
          departmentId: '',
          profileComplete: false,
          profileStatus: 'pending',
          createdAt: new Date()
        };
        await db.collection('users').doc(req.user.id).set(userData);
        userDoc = await db.collection('users').doc(req.user.id).get();
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
  const {
    name,
    email,
    password,
    inviteCode,
    phone,
    jobRole,
    department,
    departmentId,
    employeeId,
    employmentType,
    manager,
    workLocation,
    startDate
  } = req.body;

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
    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ msg: 'Name, email, password, and team invite code are required' });
    }

    // 1. Validate Invite Code
    const normalizedCode = inviteCode.toUpperCase();

    // ADMIN invite code is restricted — only the owner or admin-assigned users can use it
    if (normalizedCode === 'ADMIN') {
      const callerEmail = email.toLowerCase();
      const isAdminOwner = callerEmail === 'isiraglobal@gmail.com';
      if (!isAdminOwner) {
        const isApproved = await db.collection('users')
          .where('email', '==', callerEmail)
          .where('adminInviteApproved', '==', true)
          .limit(1)
          .get();
        if (isApproved.empty) {
          return res.status(403).json({ msg: 'ADMIN invite code is restricted. Ask the platform admin for access.' });
        }
      }
    }

    const companySnapshot = await db.collection('companies')
      .where('inviteCode', '==', normalizedCode)
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

    // 2. Create User in Supabase Auth
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

    // 3. Hash password and store profile in Supabase DB
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: 'member',
      companyId: companyDoc.id,
      phone: phone || '',
      jobRole: jobRole || '',
      department: department || '',
      departmentId: departmentId || '',
      employeeId: employeeId || '',
      employmentType: employmentType || 'Full-time',
      manager: manager || '',
      workLocation: workLocation || '',
      startDate: startDate || '',
      profileComplete: true,
      profileStatus: 'pending',
      isApproved: false,
      createdAt: new Date()
    };

    await db.collection('users').doc(userRecord.uid).set(userData);

    // Set role claims in Supabase Auth metadata
    await auth.setCustomUserClaims(userRecord.uid, {
      role: 'member',
      companyId: companyDoc.id
    });

    // 4. Authenticate newly registered user to return session details
    const fbSession = await signInWithFirebase(email, password);

    res.json({
      token: fbSession.session.access_token,
      user: {
        id: userRecord.uid,
        name,
        email,
        role: 'member',
        companyId: companyDoc.id,
        phone: phone || '',
        jobRole: jobRole || '',
        department: department || '',
        departmentId: departmentId || '',
        employeeId: employeeId || '',
        profileComplete: true,
        profileStatus: 'pending',
        isApproved: false
      }
    });

  } catch (err) {
    console.error('Join Team Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/auth/forgot-password
// @desc    Generate reset link via Firebase Auth
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
          resetPasswordExpire: new Date(Date.now() + 3600000)
        });
      }
    }

    let resetUrl;
    if (global.MOCK_DB) {
      resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
    } else {
      // Check if user exists in Firebase Auth; create if missing but present in Firestore
      let fbUser = await auth.getUserByEmail(emailLower);
      if (!fbUser && userProfile) {
        const tempPassword = crypto.randomBytes(16).toString('hex') + 'A1!';
        const userRecord = await auth.createUser({
          email: emailLower,
          password: tempPassword,
          displayName: userProfile.name || 'User',
          emailVerified: true
        });
        const newUid = userRecord.uid;
        await auth.setCustomUserClaims(newUid, {
          role: userProfile.role || 'member',
          companyId: userProfile.companyId || null
        });
        if (userDocId !== newUid) {
          await db.collection('users').doc(userDocId).delete();
          await db.collection('users').doc(newUid).set({
            ...userProfile,
            resetPasswordToken: token,
            resetPasswordExpire: new Date(Date.now() + 3600000)
          });
        }
        fbUser = { uid: newUid, email: emailLower };
      }

      if (fbUser) {
        resetUrl = await auth.generatePasswordResetLink(emailLower, {
          url: `${req.protocol}://${req.get('host')}/reset-password`
        });
      } else {
        // User not found anywhere — silently succeed to avoid email enumeration
        return res.status(200).json({ message: 'Email sent' });
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

// @route   POST api/auth/complete-profile
// @desc    Employee completes profile after Supabase login
// @access  Private
router.post('/complete-profile', protect, async (req, res) => {
  const {
    name,
    phone,
    jobRole,
    department,
    departmentId,
    employeeId,
    inviteCode,
    employmentType,
    manager,
    workLocation,
    startDate
  } = req.body;

  if (global.MOCK_DB) {
    return res.json({
      user: { ...req.user, name, phone, profileComplete: true, profileStatus: 'approved' },
      redirect: '/dashboard'
    });
  }

  try {
    const userDoc = await db.collection('users').doc(req.user.id).get();
    const existingUser = userDoc.exists ? userDoc.data() : {};
    const normalizedInviteCode = inviteCode ? inviteCode.toUpperCase().trim() : '';
    const hasCompany = Boolean(existingUser.companyId || req.user.companyId);

    if (!name || !phone || !jobRole || !department || !employeeId) {
      return res.status(400).json({ msg: 'Name, phone, job role, department, and employee ID are required' });
    }

    if (!hasCompany && !normalizedInviteCode) {
      return res.status(400).json({ msg: 'Team invite code is required to attach your profile to a workspace' });
    }

    const updates = {
      name: name || req.user.email?.split('@')[0],
      phone: phone || '',
      jobRole: jobRole || '',
      department: department || '',
      departmentId: departmentId || '',
      employeeId: employeeId || '',
      employmentType: employmentType || existingUser.employmentType || 'Full-time',
      manager: manager || existingUser.manager || '',
      workLocation: workLocation || existingUser.workLocation || '',
      startDate: startDate || existingUser.startDate || '',
      profileComplete: true,
      profileStatus: (existingUser.role === 'teamadmin' || existingUser.role === 'superadmin') ? 'approved' : 'pending',
      updatedAt: new Date()
    };

    // Join company via invite code if provided
    if (normalizedInviteCode) {
      // ADMIN invite code is restricted — only the owner or admin-assigned users can use it
      if (normalizedInviteCode === 'ADMIN') {
        const callerEmail = (req.user.email || '').toLowerCase();
        const isAdminOwner = callerEmail === 'isiraglobal@gmail.com';
        const isApproved = await db.collection('users')
          .where('email', '==', callerEmail)
          .where('adminInviteApproved', '==', true)
          .limit(1)
          .get();
        if (!isAdminOwner && isApproved.empty) {
          return res.status(403).json({ msg: 'ADMIN invite code is restricted. Ask the platform admin for access.' });
        }
      }

      const companySnap = await db.collection('companies')
        .where('inviteCode', '==', normalizedInviteCode)
        .limit(1)
        .get();
      if (companySnap.empty) {
        return res.status(400).json({ msg: 'Invalid team invite code' });
      }
      const company = companySnap.docs[0].data();
      if (company.status !== 'active') {
        return res.status(403).json({ msg: 'This workspace is not active yet. Ask your HR admin to confirm approval.' });
      }
      updates.companyId = companySnap.docs[0].id;
      updates.role = existingUser.role === 'teamadmin' ? 'teamadmin' : 'member';
      // Add to companies array (append if not already a member)
      const companyName = company.name || 'Unknown';
      if (!existingUser.companies) existingUser.companies = [];
      if (!existingUser.companies.find(c => c.companyId === companySnap.docs[0].id)) {
        existingUser.companies.push({ companyId: companySnap.docs[0].id, role: updates.role, name: companyName, joinedAt: new Date().toISOString() });
        updates.companies = existingUser.companies;
      }
    }

    if (userDoc.exists) {
      await db.collection('users').doc(req.user.id).update(updates);
    } else {
      await db.collection('users').doc(req.user.id).set({
        email: req.user.email,
        role: updates.role || 'member',
        companyId: updates.companyId || null,
        createdAt: new Date(),
        ...updates
      });
    }

    const refreshed = await db.collection('users').doc(req.user.id).get();
    const userData = { id: refreshed.id, ...refreshed.data() };

    let redirect = '/dashboard';
    if (userData.role === 'teamadmin') redirect = '/connect';
    if (userData.role === 'superadmin') redirect = '/admin';

    res.json({ user: userData, redirect });
  } catch (err) {
    console.error('Complete Profile Error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// ── Google OAuth Login ────────────────────────────────
const jwt = require('jsonwebtoken');

// Redirect to Google OAuth consent screen
router.get('/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(501).json({ msg: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.' });
  }
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://argen.isira.club/api/auth/google/callback';
  const state = crypto.randomBytes(24).toString('hex');
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20email%20profile&state=${state}`;
  res.redirect(url);
});

// Google OAuth callback
router.get('/google/callback', async (req, res) => {
  const { code, state } = req.query;
  if (!code) {
    return res.redirect('/login?error=google_auth_failed');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || 'https://argen.isira.club/api/auth/google/callback';

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code, client_id: clientId, client_secret: clientSecret,
        redirect_uri: redirectUri, grant_type: 'authorization_code'
      })
    });
    const tokens = await tokenRes.json();
    if (!tokens.id_token) {
      return res.redirect('/login?error=google_token_failed');
    }

    // Decode ID token to get user info
    const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64url').toString());
    const { sub: googleId, email, name, picture } = payload;

    if (!email) {
      return res.redirect('/login?error=google_no_email');
    }

    // Find or create user
    let userDoc = await db.collection('users').where('email', '==', email).limit(1).get();
    let user;

    if (userDoc.empty) {
      // Register new user via Firebase Auth
      const autoPassword = crypto.randomBytes(16).toString('hex');
      let fbUser;

      try {
        if (!global.MOCK_DB) {
          const result = await auth.createUser({
            email, password: autoPassword, email_confirm: true,
            user_metadata: { name, picture, googleId, provider: 'google' }
          });
          fbUser = result;
        }
      } catch (e) {
        // User may already exist in Firebase Auth
      }

      const uid = fbUser?.uid || googleId || crypto.randomBytes(16).toString('hex');
      const isOwner = email.toLowerCase() === 'isiraglobal@gmail.com';
      const newUser = {
        email, name: name || email.split('@')[0],
        role: isOwner ? 'superadmin' : 'member', googleId, avatar: picture || '',
        profileComplete: isOwner ? true : false, createdAt: new Date(),
        ...(isOwner && { companyId: 'admin-company', adminOwner: true })
      };
      await db.collection('users').doc(uid).set(newUser);
      user = { id: uid, ...newUser };
    } else {
      const doc = userDoc.docs[0];
      user = { id: doc.id, ...doc.data() };
      // Auto-assign superadmin to platform owner on every login (fixes stale docs)
      if (email.toLowerCase() === 'isiraglobal@gmail.com') {
        const needsUpdate = user.role !== 'superadmin' || user.companyId !== 'admin-company';
        user = { ...user, role: 'superadmin', companyId: 'admin-company', profileComplete: true, adminOwner: true };
        if (!global.MOCK_DB && needsUpdate) {
          try { await db.collection('users').doc(doc.id).update({ role: 'superadmin', companyId: 'admin-company', profileComplete: true, adminOwner: true }); } catch (e) {}
        }
      }
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, companyId: user.companyId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const isOwner = user.email?.toLowerCase() === 'isiraglobal@gmail.com';
    const redirectUrl = (isOwner || user.role === 'superadmin') ? '/admin' :
      user.profileComplete === false ? '/onboarding' : '/dashboard';
    res.redirect(`/oauth?token=${token}&user=${encodeURIComponent(JSON.stringify(user))}&redirect=${redirectUrl}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('/login?error=google_server_error');
  }
});

// @route   GET api/auth/env-creds
// @desc    Return env-based login credentials (local dev only, requires x-dev-key header)
// @access  Public (only returns in non-production with matching dev key)
router.get('/env-creds', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.json({ email: '', password: '' });
  }
  // Require a simple dev-only secret to prevent casual exposure
  const devKey = req.headers['x-dev-key'];
  if (devKey !== 'argen-local-dev-2024') {
    return res.json({ email: '', password: '' });
  }
  const email = process.env.ADMIN_EMAIL || '';
  const password = process.env.ADMIN_PASSWORD || '';
  res.json({ email, password });
});

// @route   GET api/auth/my-companies
// @desc    List all companies the current user belongs to
// @access  Private
router.get('/my-companies', protect, async (req, res) => {
  try {
    if (global.MOCK_DB) {
      return res.json([{ companyId: 'mock-company-id', name: 'Mock Corp', role: 'superadmin' }]);
    }
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.json([]);
    const userData = userDoc.data();
    const companies = userData.companies || [];
    // Always include the primary companyId
    if (userData.companyId && !companies.find(c => c.companyId === userData.companyId)) {
      const companySnap = await db.collection('companies').doc(userData.companyId).get();
      companies.unshift({ companyId: userData.companyId, role: userData.role, name: companySnap.exists ? companySnap.data().name : 'Unknown', joinedAt: userData.createdAt });
    }
    // Enrich with full company data
    const enriched = [];
    for (const c of companies) {
      if (c.name && c.name !== 'Unknown') {
        enriched.push(c);
        continue;
      }
      const snap = await db.collection('companies').doc(c.companyId).get();
      enriched.push({ ...c, name: snap.exists ? snap.data().name : 'Unknown' });
    }
    res.json(enriched);
  } catch (err) {
    console.error('my-companies error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   POST api/auth/switch-company
// @desc    Switch active company for the current session
// @access  Private
router.post('/switch-company', protect, async (req, res) => {
  const { companyId } = req.body;
  if (!companyId) return res.status(400).json({ msg: 'companyId is required' });

  try {
    if (global.MOCK_DB) {
      return res.json({ companyId, switched: true });
    }
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.status(404).json({ msg: 'User not found' });

    const userData = userDoc.data();
    const companies = userData.companies || [];
    const match = companies.find(c => c.companyId === companyId);

    if (!match && userData.companyId !== companyId) {
      return res.status(403).json({ msg: 'You do not belong to this company' });
    }

    // Update active companyId in user doc
    await userDoc.ref.update({ companyId }).catch(() => {});
    res.json({ companyId, switched: true });
  } catch (err) {
    console.error('switch-company error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

// @route   GET api/auth/companies-stats
// @desc    Get comparison stats across all user's companies
// @access  Private
router.get('/companies-stats', protect, async (req, res) => {
  try {
    if (global.MOCK_DB) {
      return res.json([
        { companyId: 'mock-co-1', name: 'TechFlow Inc', employees: 12, activeUsers: 8, totalTx: 450, monthCost: 1240.50 },
        { companyId: 'mock-co-2', name: 'DataCore Labs', employees: 5, activeUsers: 3, totalTx: 180, monthCost: 520.75 }
      ]);
    }
    const userDoc = await db.collection('users').doc(req.user.id).get();
    if (!userDoc.exists) return res.json([]);
    const userData = userDoc.data();
    const companies = userData.companies || [];
    if (userData.companyId && !companies.find(c => c.companyId === userData.companyId)) {
      companies.unshift({ companyId: userData.companyId, role: userData.role });
    }

    const results = [];
    for (const c of companies) {
      const companySnap = await db.collection('companies').doc(c.companyId).get();
      if (!companySnap.exists) continue;
      const company = companySnap.data();
      
      const usersSnap = await db.collection('users').where('companyId', '==', c.companyId).get();
      const employeeCount = usersSnap.docs.filter(d => d.data().role !== 'superadmin').length;
      const activeUsers = usersSnap.docs.filter(d => d.data().lastActive || d.data().profileComplete).length;

      const today = new Date().toISOString().split('T')[0];
      const thisMonth = today.slice(0, 7);
      let monthTx = 0, monthCost = 0;

      const proxySnap = await db.collection('ai_proxy_transactions')
        .where('companyId', '==', c.companyId)
        .get();
      proxySnap.docs.forEach(d => {
        const d2 = d.data();
        if ((d2.date || '').startsWith(thisMonth)) {
          monthTx++;
          monthCost += d2.totalCost || 0;
        }
      });

      results.push({
        companyId: c.companyId,
        name: company.name || 'Unknown',
        role: c.role,
        employees: employeeCount,
        activeUsers,
        monthTx,
        monthCost: Math.round(monthCost * 100) / 100
      });
    }
    res.json(results);
  } catch (err) {
    console.error('companies-stats error:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
});

module.exports = router;
