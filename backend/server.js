const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
// const helmet = require('helmet');
// const mongoSanitize = require('express-mongo-sanitize');
// const rateLimit = require('express-rate-limit');

const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();

// Security Middleware
// app.use(helmet()); 
// app.use(mongoSanitize()); 

// Rate Limiting
/*
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api', limiter);
*/

// Middleware
app.use(cors());

// Whop Webhook needs raw body, mount it before express.json
app.use('/api/whop', require('./routes/whop'));

app.use(express.json());
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

const { db } = require('./utils/supabase');

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    database: global.MOCK_DB ? 'mock' : 'supabase-postgres',
    version: '1.0.0'
  });
});

// Serve client-side Supabase keys securely
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

// Root landing page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

// Clean URLs handler mapping to HTML files
app.get('/:page', (req, res, next) => {
  const page = req.params.page;
  if (page.includes('.') || page === 'api') return next();
  const filePath = path.join(__dirname, `../frontend/html/${page}.html`);
  res.sendFile(filePath, (err) => {
    if (err) next();
  });
});


// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = parseInt(process.env.PORT) || 3001;
    app.listen(PORT, '127.0.0.1', () => console.log(`Server running on port ${PORT} (local loopback)`));
}

module.exports = app;
