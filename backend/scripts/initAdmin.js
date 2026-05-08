const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const initAdmin = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/argen';
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected...');

    const email = 'admin@argen.ai';
    const password = 'AdminPassword123!'; // User should change this
    const name = 'App Admin';

    let admin = await User.findOne({ email });
    if (admin) {
      console.log('Admin already exists');
      process.exit();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new User({
      name,
      email,
      password: hashedPassword,
      role: 'superadmin'
    });

    await admin.save();
    console.log('Superadmin created successfully');
    console.log('Email: admin@argen.ai');
    console.log('Password: AdminPassword123!');
    
    process.exit();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

initAdmin();
