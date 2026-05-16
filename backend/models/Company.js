const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  industry: String,
  size: String,
  country: String,
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended'],
    default: 'pending'
  },
  primaryContact: {
    name: String,
    email: String
  },
  inviteCode: {
    type: String,
    unique: true
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  // AI Researched Profile
  primary_ai_tools: [String],
  language_tone: String,
  competitor_names: [String],
  challenge_themes: [String],
  profileGeneratedAt: Date,
  whopUserId: { type: String },
  plan: { type: String, enum: ['starter', 'growth', 'enterprise', 'pilot'] },
  seatLimit: { type: Number, default: 15 },
  subscriptionStatus: { type: String, enum: ['active', 'past_due', 'cancelled', 'pilot'] },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Company', CompanySchema);
