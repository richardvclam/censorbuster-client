const nodemailer = require('nodemailer');

/**
 * Returns a promise indicating whether sending the email was successful or not.
 * Sends an email using SMTP SSL using our Gmail account.
 */
function sendMail(mailProtocol, message, credentials) {
  const transporter = nodemailer.createTransport({
    host: mailProtocol.host, // smtp.gmail.com
    port: mailProtocol.port, // 465
    secure: mailProtocol.port === 465, // true
    auth: {
      user: credentials.username,
      pass: credentials.password,
    },
  });

  const mailOptions = {
    from: message.from,
    to: 'censorbustorstest1@gmail.com',
    subject: message.subject,
    text: message.text,
  };

  return new Promise((success, fail) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) fail(error);

      //success(`Message ${info.messageId} sent: ${info.response}`);
      success(credentials);
    });
  });
}

/**
 * Return SMTP settings that contain the hostname and port number
 * for the respective email provider.
 * @param {String} provider - Email provider name
 */
function getSMTPSettings(provider) {
  switch (provider) {
    case 'exchange.com':
      return { host: 'smtp.office365.com', port: 587 };
    case 'gmail.com':
      return { host: 'smtp.gmail.com', port: 465 };
    case 'icloud.com':
      return { host: 'smtp.mail.me.com', port: 587 };
    case 'yahoo.com':
      return { host: 'smtp.mail.yahoo.com', port: 465 };
    default:
      return false;
  }
}

module.exports = {
  getSMTPSettings,
  sendMail,
};
