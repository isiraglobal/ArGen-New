const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  whopMembershipId: { type: String, required: true, unique: true },
  whopUserId: { type: String, required: true },
  plan: { type: String, enum: ['starter', 'growth', 'enterprise'], required: true },
  seatLimit: { type: Number, required: true },
  seatCount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['active', 'past_due', 'cancelled', 'paused'],
    default: 'active'
  },
  currentPeriodEnd: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Subscription', subscriptionSchema);
