const jwt = require('jsonwebtoken');
const Company = require('../models/Company');

const protect = async (req, res, next) => {
  let token = req.header('Authorization');

  if (token && token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    token = req.header('x-auth-token');
  }

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = decoded.user;
    next();
  } catch (err) {
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
    // MOCK_DB bypass: skip DB check entirely in offline/mock mode
    if (global.MOCK_DB) return next();
    if (req.user.role && req.user.role.toLowerCase() === 'superadmin') return next();
    
    const company = await Company.findById(req.user.companyId);
    if (!company || company.status !== 'active') {
      return res.status(403).json({
        msg: 'Access denied. Your company account is not active. Please contact the App Admin.'
      });
    }
    next();
  } catch (err) {
    res.status(500).json({ msg: 'Server error in approval check' });
  }
};

module.exports = { protect, authorize, isApproved };
