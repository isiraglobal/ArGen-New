const mongoose = require('mongoose');

const ResponseSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  evaluationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Evaluation',
    required: true
  },
  challenge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Challenge',
    required: true
  },
  responseText: {
    type: String,
    required: true
  },
  workflowApproach: {
    type: String,
    required: true
  },
  timeTaken: {
    type: String,
    required: true
  },
  baselineTime: {
    type: String
  },
  scoringStatus: {
    type: String,
    enum: ['Pending', 'Scored', 'Manual Review', 'Error'],
    default: 'Pending'
  },
  scores: {
    clarity: { type: Number, default: 0 },
    constraint_application: { type: Number, default: 0 },
    output_specificity: { type: Number, default: 0 },
    iteration_quality: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  justification: String,
  improvement: String,
  manualReviewFlag: {
    type: Boolean,
    default: false
  },
  flags: [String],
  modelUsed: String,
  apiCost: {
    type: Number,
    default: 0
  },
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Response', ResponseSchema);
