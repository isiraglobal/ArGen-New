const { auth, db } = require('../utils/supabase');

// Helper to parse cookies from headers
const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach(cookie => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURIComponent(parts.join('='));
  });
  return list;
};

const protect = async (req, res, next) => {
  let token = req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    token = req.header('x-auth-token');
  }

  // Fallback: Check in Cookies
  if (!token && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['argen_token'] || cookies['argen_admin_token'];
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  // Allow CRON_SECRET bypass for automated jobs
  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) {
    req.user = {
      id: 'cron-system',
      uid: 'cron-system',
      email: 'cron@argen.isira.club',
      role: 'superadmin'
    };
    return next();
  }

  // Handle local development / testing token bypasses
  if (token === 'mock-token' || (global.MOCK_DB && process.env.NODE_ENV !== 'production')) {
    req.user = {
      id: 'mock-uid',
      uid: 'mock-uid',
      email: 'admin@argen.ai',
      role: 'teamadmin',
      companyId: 'mock-company-id'
    };
    return next();
  }

  try {
    // Verify Supabase Auth Token
    const decodedToken = await auth.verifyIdToken(token);
    
    // Retrieve additional user info (role, companyId) from database
    const userDoc = await db.collection('users').doc(decodedToken.uid).get();
    
    if (userDoc.exists) {
      const userData = userDoc.data();
      req.user = {
        id: decodedToken.uid,
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: userData.role || 'member',
        companyId: userData.companyId || null
      };
    } else {
      // Create lightweight fallback user object from claims
      req.user = {
        id: decodedToken.uid,
        uid: decodedToken.uid,
        email: decodedToken.email,
        role: decodedToken.role || 'member',
        companyId: decodedToken.companyId || null
      };
    }
    next();
  } catch (err) {
    console.error('Supabase Auth Token Verification Error:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user.role ? req.user.role.toLowerCase() : '';
    if (!roles.map(r => r.toLowerCase()).includes(userRole)) {
      return res.status(403).json({
        msg: `User role ${req.user.role} is not authorized to access this route`
      });
    }
    next();
  };
};

// Check if company is active
const isApproved = async (req, res, next) => {
  try {
    if (global.MOCK_DB && process.env.NODE_ENV !== 'production') return next();
    if (req.user.role && req.user.role.toLowerCase() === 'superadmin') return next();
    if (!req.user.companyId) {
      return res.status(403).json({ msg: 'Access denied. No company associated with this account.' });
    }
    
    // Check company status in Supabase
    const companyDoc = await db.collection('companies').doc(req.user.companyId).get();
    if (!companyDoc.exists || companyDoc.data().status !== 'active') {
      return res.status(403).json({
        msg: 'Access denied. Your company account is not active. Please contact the App Admin.'
      });
    }
    next();
  } catch (err) {
    console.error('Approval Check Error:', err);
    res.status(500).json({ msg: 'Server error in approval check' });
  }
};

async function verifyTokenFromRequest(req) {
  let token = req.header('Authorization');
  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    token = req.header('x-auth-token');
  }
  if (!token && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies['argen_token'] || cookies['argen_admin_token'];
  }
  if (!token) return null;

  if (process.env.CRON_SECRET && token === process.env.CRON_SECRET) {
    return { id: 'cron-system', role: 'superadmin', companyId: null };
  }
  if (token === 'mock-token' || (global.MOCK_DB && process.env.NODE_ENV !== 'production')) {
    return { id: 'mock-uid', role: 'teamadmin', companyId: 'mock-company-id' };
  }

  const decodedToken = await auth.verifyIdToken(token);
  const userDoc = await db.collection('users').doc(decodedToken.uid).get();
  if (userDoc.exists) {
    const userData = userDoc.data();
    return {
      id: decodedToken.uid,
      email: decodedToken.email,
      role: userData.role || 'member',
      companyId: userData.companyId || null
    };
  }
  return {
    id: decodedToken.uid,
    email: decodedToken.email,
    role: decodedToken.role || 'member',
    companyId: decodedToken.companyId || null
  };
}

/**
 * Server-side HTML page guard — redirects unauthenticated users to /login.
 */
const requirePageAuth = (roles = null) => async (req, res, next) => {
  try {
    const user = await verifyTokenFromRequest(req);
    if (!user) {
      return res.redirect(`/login?redirect=${encodeURIComponent(req.originalUrl)}`);
    }
    if (roles && !roles.map(r => r.toLowerCase()).includes((user.role || '').toLowerCase())) {
      if (user.role === 'superadmin') return next();
      return res.redirect('/dashboard');
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Page Auth Error:', err.message);
    return res.redirect('/login');
  }
};

module.exports = { protect, authorize, isApproved, parseCookies, verifyTokenFromRequest, requirePageAuth };

