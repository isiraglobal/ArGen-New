const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load .env first (local overrides), then .env.vercel (pulled from Vercel dashboard)
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../.env.vercel') });

// Check critical env vars (log warnings, don't crash in production)
const criticalEnv = ['JWT_SECRET', 'FIREBASE_PROJECT_ID', 'FIREBASE_CLIENT_EMAIL', 'FIREBASE_WEB_API_KEY'];
const optionalEnv = ['TOKEN_ENCRYPTION_KEY', 'ADMIN_EMAIL', 'ADMIN_PASSWORD', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_PRIVATE_KEY_BASE64'];
criticalEnv.forEach(k => { if (!process.env[k]) console.warn(`⚠️  Missing critical env var: ${k}`); });
optionalEnv.forEach(k => { if (!process.env[k]) console.warn(`  ⚠️  Missing optional env var: ${k}`); });

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
app.use('/api/whop', require('./routes/whop'));

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
app.use('/api/billing', require('./routes/billing'));
app.use('/api/integrations', require('./routes/integrations'));
app.use('/api/proxy', require('./routes/proxy'));

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
const superadminPages = ['admin'];

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
  'cookie-policy', 'gdpr', 'dpa', 'aup', 'apply',
  'integrations', 'extensions'
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

// Seed ADMIN company on startup (invite-code-only, no public registration)
(async () => {
  try {
    if (global.MOCK_DB) return;
    const { db } = require('./utils/firebase');
    const snapshot = await db.collection('companies')
      .where('inviteCode', '==', 'ADMIN')
      .limit(1)
      .get();
    if (snapshot.empty) {
      await db.collection('companies').doc('admin-company').set({
        name: 'ArGen Platform',
        industry: 'Platform',
        status: 'active',
        inviteCode: 'ADMIN',
        ownerEmail: 'isiraglobal@gmail.com',
        createdAt: new Date()
      });
      console.log('✅ ADMIN company seeded with owner isiraglobal@gmail.com');
    } else {
      // Ensure ownerEmail is set even if company already exists
      const existing = snapshot.docs[0];
      if (!existing.data().ownerEmail) {
        await existing.ref.update({ ownerEmail: 'isiraglobal@gmail.com' });
        console.log('✅ ADMIN company ownerEmail updated');
      }
    }
  } catch (e) {
    console.error('⚠️  ADMIN seed skipped:', e.message);
  }
})();

module.exports = app;

