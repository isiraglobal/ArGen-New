const sendEmail = require('./utils/sendEmail');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const testEmail = async () => {
    try {
        console.log('Attempting to send test email to: lakshitsinghvi@gmail.com');
        await sendEmail({
            email: 'lakshitsinghvi@gmail.com',
            subject: 'ArGen - System Connectivity Test',
            message: 'This is a test email to verify that the ArGen SMTP configuration is working correctly.',
            html: '<h1>ArGen Connectivity Test</h1><p>This is a test email to verify that the ArGen SMTP configuration is working correctly.</p>'
        });
        console.log('Test email sent successfully!');
    } catch (err) {
        console.error('Failed to send test email:', err);
    }
};

testEmail();
