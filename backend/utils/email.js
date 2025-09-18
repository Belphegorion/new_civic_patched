// backend/utils/email.js
const nodemailer = require('nodemailer');
require('dotenv').config();

const getTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (host && port && user && pass) {
    return nodemailer.createTransport({
      host,
      port: Number(port),
      secure: Number(port) === 465,
      auth: { user, pass }
    });
  }
  return null;
};

const sendEmail = async ({ to, subject, text, html }) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('SMTP not configured. Email content below:\n', { to, subject, text });
    return { ok: true, fallback: true };
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || `no-reply@${process.env.SMTP_DOMAIN || 'localhost'}`,
    to,
    subject,
    text,
    html
  });
  return { ok: true, info };
};

module.exports = { sendEmail };
