const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../backend/models/User');
const Company = require('../backend/models/Company');

async function test() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const email = 'admin@argen';
        const password = 'argen@admin';

        console.log(`Testing login for ${email}...`);

        // Mimic the bypass logic
        if (email === 'admin@argen' && password === 'argen@admin') {
            console.log('Bypass logic triggered.');
            let company = await Company.findOne({ name: 'ArGen Test Corp' });
            if (!company) {
                console.log('Creating ArGen Test Corp...');
                company = new Company({
                    name: 'ArGen Test Corp',
                    industry: 'Technology',
                    size: '1-10',
                    country: 'US',
                    primaryContact: { name: 'Test User', email: email },
                    inviteCode: 'TEST1234',
                    status: 'active'
                });
                await company.save();
            }
            console.log('Company:', company.name);

            let testUser = await User.findOne({ email });
            if (!testUser) {
                console.log('Creating System Admin...');
                testUser = new User({
                    name: 'System Admin',
                    email,
                    password: 'mockpassword',
                    role: 'teamadmin',
                    companyId: company._id
                });
                await testUser.save();
            }
            console.log('User:', testUser.email, 'Role:', testUser.role);

            const payload = { user: { id: testUser.id, role: testUser.role, companyId: testUser.companyId } };
            const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '5d' });
            console.log('Token generated:', token.substring(0, 20) + '...');
        } else {
            console.log('Bypass logic NOT triggered.');
        }

        process.exit(0);
    } catch (err) {
        console.error('Test Failed:', err);
        process.exit(1);
    }
}

test();
