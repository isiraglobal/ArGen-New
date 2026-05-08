const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  challengeId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Strategy', 'Data', 'Communication', 'Research', 'Iteration'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Intermediate'
  },
  industryFocus: String,
  text: {
    type: String,
    required: true
  },
  wordLimit: Number,
  timeEstimate: Number,
  dimensions: {
    primary: String,
    secondary: String
  },
  active: {
    type: Boolean,
    default: true
  },
  usageCount: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Challenge', ChallengeSchema);
