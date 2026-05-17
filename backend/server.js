const express = require('express');
const mongoose = require('mongoose');
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
// app.use('/api/whop', require('./routes/whop'));

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

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    version: '1.0.0'
  });
});

app.get('/', (req, res) => {
  res.send('ArGen API is running...');
});

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/argen';

// Database connection logic for serverless
global.MOCK_DB = false;
let isConnected = false;
const connectDB = async () => {
    if (isConnected) return;
    try {
        console.log('Attempting MongoDB Connection...');
        // Set a timeout for the connection attempt to avoid hanging
        await mongoose.connect(MONGO_URI, { 
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 5000 
        });
        isConnected = true;
        global.MOCK_DB = false;
        console.log('MongoDB Connected');
    } catch (err) {
        if (err.message.includes('querySrv')) {
            console.error('--- DNS RESOLUTION FAILURE ---');
            console.error('Could not resolve MongoDB Atlas SRV record. This often happens on restricted networks.');
            console.error('Workaround: Use a standard connection string (mongodb://) instead of (mongodb+srv://).');
        } else {
            console.error('MongoDB Connection Error:', err.message);
        }
        console.log('--- CRITICAL: RUNNING IN MOCK DB MODE ---');
        global.MOCK_DB = true;
        isConnected = true; // Set to true to stop repeated failing attempts during this process
    }
};

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    await connectDB();
    next();
});

// For local development
if (process.env.NODE_ENV !== 'production') {
    const PORT = parseInt(process.env.PORT) || 3001;
    app.listen(PORT, '127.0.0.1', () => console.log(`Server running on http://127.0.0.1:${PORT}`));
}

module.exports = app;
