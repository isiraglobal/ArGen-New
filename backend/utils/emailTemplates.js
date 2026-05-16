const { createEmailTemplate } = require('./emailTemplate');

const generateWelcomeEmail = (companyName, linkUrl) => {
  return createEmailTemplate({
    title: 'Welcome to ArGen',
    preheader: `Your workspace for ${companyName} has been provisioned.`,
    bodyContent: `
      <h1>Welcome to ArGen, ${companyName}!</h1>
      <p>Your organization's workspace has been successfully provisioned. You can now register your Team Admin account and begin assigning AI-driven challenges to your team.</p>
    `,
    buttonText: 'Complete Admin Registration',
    buttonUrl: linkUrl
  });
};

const generatePasswordCodeEmail = (code) => {
  return createEmailTemplate({
    title: 'Your ArGen Security Code',
    preheader: 'Your secure verification code for ArGen.',
    bodyContent: `
      <h1>Security Verification</h1>
      <p>You requested a secure code to authenticate your ArGen session or reset your password.</p>
      <div class="code-block">
        ${code}
      </div>
      <p style="font-size: 14px; color: #888888;">This code will expire in 15 minutes. If you did not request this code, you can safely ignore this email.</p>
    `
  });
};

const generateUpdateEmail = (title, message, linkUrl = null, linkText = 'View Update') => {
  return createEmailTemplate({
    title: title,
    preheader: 'New update from ArGen.',
    bodyContent: `
      <h1>${title}</h1>
      <p>${message.replace(/\n/g, '<br>')}</p>
    `,
    buttonText: linkUrl ? linkText : null,
    buttonUrl: linkUrl
  });
};

module.exports = {
  generateWelcomeEmail,
  generatePasswordCodeEmail,
  generateUpdateEmail
};
