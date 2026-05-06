const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/teams', require('./routes/teams'));
app.use('/api/challenges', require('./routes/challenges'));
app.use('/api/scores', require('./routes/scores'));
app.use('/api/benchmark', require('./routes/benchmark'));

app.get('/', (req, res) => {
  res.send('ArGen API is running...');
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB (Placeholder URI)
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/argen';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.log(err));
