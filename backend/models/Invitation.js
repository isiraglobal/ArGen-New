const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  companyName: {
    type: String,
    required: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  used: {
    type: Boolean,
    default: false
  },
  usedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 2592000 // 30 days
  }
});

module.exports = mongoose.model('Invitation', InvitationSchema);
