const mongoose = require('mongoose');

const ChallengeSchema = new mongoose.Schema({
  challengeId: {
    type: String,
    required: true,
    unique: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['Strategy', 'Data', 'Communication', 'Research', 'Iteration', 'Ethics', 'Tone'],
    required: true
  },
  difficulty: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Elite'],
    default: 'Intermediate'
  },
  targetedRole: String, // Executive, Manager, IC
  targetedDept: String, // Sales, Marketing, Eng, etc.
  scenario: {
    type: String,
    required: true
  },
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
