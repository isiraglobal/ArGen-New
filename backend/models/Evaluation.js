const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  team: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  scores: {
    clarity: { type: Number, default: 0 },
    constraints: { type: Number, default: 0 },
    verification: { type: Number, default: 0 },
    aggregate: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed'],
    default: 'Pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);
