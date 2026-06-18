const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const { contactRules, handleValidationErrors } = require('./middleware/validate');

const app = express();

// Security Middleware
try {
  const helmet = require('helmet');
  app.use(helmet({
    contentSecurityPolicy: false, // Disabled — frontend uses inline scripts and CDN assets
    crossOriginEmbedderPolicy: false
  }));
} catch (e) {
  console.warn('[server] helmet not installed, skipping security headers');
}

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
try {
  const rateLimit = require('express-rate-limit');
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many requests. Please try again in 15 minutes.' }
  });
  app.use('/api', limiter);
} catch (e) {
  console.warn('[server] express-rate-limit not installed, skipping rate limiting');
}

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

const { db } = require('./utils/supabase');
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
    database: global.MOCK_DB ? 'mock' : 'supabase-postgres',
    version: '1.0.0'
  });
});

// Serve client-side Supabase public keys (anon key only — never the service role key)
app.get('/api/config', (req, res) => {
  res.json({
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || ''
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
  'cookie-policy', 'gdpr', 'dpa', 'aup'
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

