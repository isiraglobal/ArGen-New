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

    const email = process.env.ADMIN_EMAIL || 'admin@argen.ai';
    const password = process.env.ADMIN_PASSWORD || 'ArGenAdmin2026';
    const name = 'System Architect';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let admin = await User.findOne({ role: 'superadmin' });
    
    if (admin) {
      console.log('Updating existing Superadmin...');
      admin.email = email;
      admin.password = hashedPassword;
      admin.name = name;
    } else {
      console.log('Creating new Superadmin...');
      admin = new User({
        name,
        email,
        password: hashedPassword,
        role: 'superadmin'
      });
    }

    await admin.save();
    console.log('Superadmin synchronized successfully');
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}`);
    
    process.exit();
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

initAdmin();
