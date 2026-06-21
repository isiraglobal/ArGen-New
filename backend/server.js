const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load .env first (local overrides), then .env.vercel (pulled from Vercel dashboard)
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.vercel') });

// Validate required env vars at startup
const REQUIRED_ENV = [
  'JWT_SECRET',
  'TOKEN_ENCRYPTION_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_WEB_API_KEY'
];
const optionalWarn = ['ADMIN_EMAIL', 'ADMIN_PASSWORD'];
const missing = REQUIRED_ENV.filter(k => !process.env[k]);
if (missing.length > 0) {
  console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
  if (process.env.NODE_ENV === 'production') process.exit(1);
}
const missingOptional = optionalWarn.filter(k => !process.env[k]);
if (missingOptional.length > 0 && process.env.NODE_ENV === 'production') {
  console.warn(`⚠️  Production warning: optional env vars not set: ${missingOptional.join(', ')} (admin login bypass won't work)`);
}

const { contactRules, handleValidationErrors } = require('./middleware/validate');

const app = express();

// Security Middleware
const helmet = require('helmet');
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// CORS — only accept requests from the production domain and local dev
const allowedOrigins = [
  'https://argen.isira.club',
  'https://www.argen.isira.club',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:3003',
  'http://127.0.0.1:3003'
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, Postman, Vercel serverless internal calls)
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error(`CORS: Origin '${origin}' not allowed`));
  },
  credentials: true
}));

// Rate Limiting — applied to all API routes
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Too many requests. Please try again in 15 minutes.' }
});
app.use('/api', limiter);

// Whop Webhook — needs raw body so mount before express.json()
try {
  app.use('/api/whop', require('./routes/whop'));
} catch (e) {
  console.warn('[server] Whop route not available:', e.message);
}

app.use(express.json({ limit: '2mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/evaluations', require('./routes/evaluations'));
app.use('/api/responses', require('./routes/responses'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/scheduler', require('./routes/scheduler'));
app.use('/api/benchmark', require('./routes/benchmark'));
app.use('/api/leaderboard', require('./routes/leaderboard'));
app.use('/api/connect', require('./routes/connect'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/apply', require('./routes/apply'));
app.use('/api/capture', require('./routes/capture'));
app.use('/api/keys', require('./routes/apikeys'));
app.use('/api/warehouse', require('./routes/warehouse'));

// Contact form (public)
app.post('/api/contact', contactRules, handleValidationErrors, async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    // Store contact submission or send email
    if (!global.MOCK_DB) {
      await db.collection('contact_submissions').add({
        name, email, subject: subject || 'General Inquiry', message,
        createdAt: new Date().toISOString()
      });
    }
    res.json({ message: 'Message received. We will get back to you shortly.' });
  } catch (err) {
    console.error('Contact form error:', err);
    res.status(500).json({ message: 'Failed to submit message' });
  }
});

const { db } = require('./utils/firebase');
const { requirePageAuth } = require('./middleware/auth');

const frontendDir = path.join(__dirname, '../frontend/html');
const memberPages = ['dashboard', 'challenges', 'take-evaluation', 'teams', 'team-detail'];
const teamadminPages = ['connect'];
const onboardingPages = ['onboarding'];
const superadminPages = ['admin-portal', 'admin-access'];

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    version: '1.0.0'
  });
});

// Serve client-side Firebase config for frontend SDK init
app.get('/api/config', (req, res) => {
  res.json({
    firebaseApiKey: process.env.FIREBASE_API_KEY || '',
    firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
    firebaseProjectId: process.env.FIREBASE_PROJECT_ID || '',
    firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
    firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
    firebaseAppId: process.env.FIREBASE_APP_ID || ''
  });
});

// Serve static assets (css, js, images)
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/images', express.static(path.join(__dirname, '../frontend/images')));

// Root landing page (public)
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

// Protected pages — server-side auth before serving HTML
superadminPages.forEach(page => {
  app.get(`/${page}`, requirePageAuth(['superadmin']), (req, res) => {
    res.sendFile(path.join(frontendDir, `${page}.html`));
  });
});

teamadminPages.forEach(page => {
  app.get(`/${page}`, requirePageAuth(['teamadmin', 'superadmin']), (req, res) => {
    res.sendFile(path.join(frontendDir, `${page}.html`));
  });
});

onboardingPages.forEach(page => {
  app.get(`/${page}`, requirePageAuth(['member', 'teamadmin', 'superadmin']), (req, res) => {
    res.sendFile(path.join(frontendDir, `${page}.html`));
  });
});

memberPages.forEach(page => {
  app.get(`/${page}`, requirePageAuth(['member', 'teamadmin', 'superadmin']), (req, res) => {
    res.sendFile(path.join(frontendDir, `${page}.html`));
  });
});

// Team detail with dynamic id
app.get('/team/:id', requirePageAuth(['member', 'teamadmin', 'superadmin']), (req, res) => {
  res.sendFile(path.join(frontendDir, 'team-detail.html'));
});

// Public pages — clean URL handler
const publicPages = [
  'about', 'pricing', 'contact', 'login', 'oauth', 'forgot-password',
  'reset-password', 'privacy', 'terms', 'waitlist', 'registration',
  'invoice', 'evaluate', 'payment-success', 'payment-failed',
  'cookie-policy', 'gdpr', 'dpa', 'aup', 'apply'
];

publicPages.forEach(page => {
  app.get(`/${page}`, (req, res) => {
    res.sendFile(path.join(frontendDir, `${page}.html`));
  });
});

// For local development
if (process.env.NODE_ENV !== 'production') {
  const PORT = parseInt(process.env.PORT) || 3001;
  app.listen(PORT, '127.0.0.1', () => console.log(`[server] Running on http://127.0.0.1:${PORT}`));
}

module.exports = app;

