const { body, validationResult } = require('express-validator');

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ msg: 'Validation failed', errors: errors.array().map(e => ({ field: e.path, message: e.msg })) });
  }
  next();
}

const registerRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('name').trim().isLength({ min: 1 }).withMessage('Name is required').escape(),
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').isLength({ min: 1 }).withMessage('Password is required'),
];

const challengeRules = [
  body('title').trim().isLength({ min: 1, max: 200 }).withMessage('Title is required (max 200 chars)').escape(),
  body('description').trim().isLength({ min: 1 }).withMessage('Description is required').escape(),
  body('companyId').optional().trim().escape(),
];

const evaluationRules = [
  body('responses').isArray({ min: 1 }).withMessage('Responses array required'),
  body('challengeId').optional().trim().escape(),
];

const contactRules = [
  body('name').trim().isLength({ min: 1, max: 200 }).withMessage('Name required').escape(),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('message').trim().isLength({ min: 1, max: 5000 }).withMessage('Message required (max 5000 chars)').escape(),
];

const invoiceRules = [
  body('clientName').trim().isLength({ min: 1, max: 200 }).withMessage('Client name required').escape(),
  body('clientContact').isEmail().withMessage('Valid client email required').normalizeEmail(),
  body('items').isArray({ min: 1 }).withMessage('At least one invoice item required'),
  body('items.*.description').trim().isLength({ min: 1 }).withMessage('Item description required').escape(),
  body('items.*.amount').isFloat({ min: 0 }).withMessage('Item amount must be a positive number'),
];

const teamCodeRules = [
  body('customCode').optional().trim()
    .matches(/^[A-Za-z0-9]{4,24}$/).withMessage('Team code must be 4-24 alphanumeric characters'),
];

module.exports = {
  handleValidationErrors,
  registerRules,
  loginRules,
  challengeRules,
  evaluationRules,
  contactRules,
  invoiceRules,
  teamCodeRules,
};
