const mongoose = require('mongoose');

const EvaluationSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  batchId: String, // EVAL-COMP0001-001
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Scoring', 'Complete', 'Delivered'],
    default: 'Scheduled'
  },
  challengeSet: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge'
  }],
  scores: {
    averageTotal: { type: Number, default: 0 },
    clarityAvg: { type: Number, default: 0 },
    constraintAvg: { type: Number, default: 0 },
    specificityAvg: { type: Number, default: 0 },
    iterationAvg: { type: Number, default: 0 }
  },
  expectedCompletionDate: Date,
  actualCompletionDate: Date,
  reportDeliveredDate: Date,
  reportUrl: String,
  revenue: { type: Number, default: 0 },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Evaluation', EvaluationSchema);
