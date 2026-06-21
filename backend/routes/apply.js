const express = require('express');
const router = express.Router();
const { db } = require('../utils/firebase');
const sendEmail = require('../utils/sendEmail');
const { createEmailTemplate } = require('../utils/emailTemplate');

const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_URL || '';

router.post('/', async (req, res) => {
  try {
    const { name, email, company, title, teamSize, website, referral, message } = req.body;

    if (!name || !email || !company || !title || !message) {
      return res.status(400).json({ msg: 'Name, email, company, title, and message are required' });
    }

    const application = {
      name, email, company, title,
      teamSize: teamSize || '',
      website: website || '',
      referral: referral || '',
      message,
      createdAt: new Date().toISOString(),
      status: 'new'
    };

    if (!global.MOCK_DB) {
      await db.collection('applications').add(application);
    }

    // Send Discord webhook (only if configured in env)
    if (DISCORD_WEBHOOK) {
      try {
        const embed = {
          embeds: [{
            title: 'New ArGen Application',
            color: 5814783,
            fields: [
              { name: 'Name', value: name, inline: true },
              { name: 'Email', value: email, inline: true },
              { name: 'Company', value: company, inline: true },
              { name: 'Title', value: title, inline: true },
              { name: 'Team Size', value: teamSize || 'Not specified', inline: true },
              { name: 'Website', value: website || 'Not specified', inline: true },
              { name: 'Referral', value: referral || 'Not specified', inline: false },
              { name: 'Message', value: message.length > 500 ? message.substring(0, 500) + '...' : message, inline: false }
            ],
            timestamp: new Date().toISOString()
          }]
        };
        await fetch(DISCORD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(embed)
        });
      } catch (discordErr) {
        console.error('Discord webhook error:', discordErr.message);
      }
    }

    // Send thank you email
    try {
      const html = createEmailTemplate({
        title: 'Application Received - ArGen',
        preheader: `Thanks for applying, ${name}!`,
        bodyContent: `
          <h1>Application Received</h1>
          <p>Hi ${name},</p>
          <p>Thank you for applying for early access to <strong>ArGen</strong> — AI Workflow Intelligence for teams.</p>
          <p>Our team will review your application and get back to you within 2 business days.</p>
          <p>In the meantime, feel free to explore our <a href="https://argen.isira.club/pricing" style="color: #00ff88;">pricing page</a> or <a href="https://argen.isira.club/about" style="color: #00ff88;">learn more</a> about what we do.</p>
          <br>
          <p style="color: #888;">— The ArGen Team</p>
        `,
        buttonText: 'Visit ArGen',
        buttonUrl: 'https://argen.isira.club'
      });
      await sendEmail({ email, subject: 'Your ArGen Application is Received', html });
    } catch (emailErr) {
      console.error('Thank you email error:', emailErr.message);
    }

    res.json({ msg: 'Application submitted successfully' });
  } catch (err) {
    console.error('Application error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
