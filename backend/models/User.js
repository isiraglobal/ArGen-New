const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['superadmin', 'teamadmin', 'member'],
    default: 'member'
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  companyName: String,
  jobRole: String, // Executive, Manager, IC, Other
  department: String, // Sales, Marketing, Product, Eng, Ops
  createdAt: {
    type: Date,
    default: Date.now
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  avgScore7d: { type: Number, default: 0 },
  difficultyLevel: { 
    type: String, 
    enum: ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Elite'],
    default: 'Intermediate'
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', UserSchema);
