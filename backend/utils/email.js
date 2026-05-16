const sendEmail = async (to, subject, html) => {
    // In a real production environment, integrate SendGrid or Postmark here.
    // Example:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: 'noreply@argen.isira.club', subject, html });
    
    console.log(`[MOCK EMAIL] Sent to: ${to}`);
    console.log(`[MOCK EMAIL] Subject: ${subject}`);
    console.log(`[MOCK EMAIL] Body: ${html.substring(0, 50)}...`);
    
    return true;
};

module.exports = { sendEmail };
