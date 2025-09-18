// backend/controllers/adminInviteController.js
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const AdminInvite = require('../models/adminInviteModel');
const User = require('../models/userModel');
const { sendEmail } = require('../utils/email');
require('dotenv').config();

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

/**
 * POST /api/admin/invite
 * Protected route (admin only).
 * Body: { email, expiresHours? }
 */
const inviteAdmin = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Forbidden' });

    const email = (req.body.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ message: 'email is required' });

    const expiresHours = Number(req.body.expiresHours) || 72;
    const expiresAt = new Date(Date.now() + expiresHours * 3600 * 1000);

    // generate raw token and hash
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(rawToken);

    // mark old invites unused -> used (optional)
    await AdminInvite.updateMany({ email, used: false }, { used: true }).catch(() => {});

    const invite = await AdminInvite.create({
      email,
      tokenHash,
      createdBy: req.user._id,
      expiresAt
    });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:3000';
    const acceptUrl = `${frontend.replace(/\/$/, '')}/admin/accept-invite?token=${rawToken}&email=${encodeURIComponent(email)}`;

    const subject = 'Admin invite: Accept to create your account';
    const text = `You were invited to join as an admin. Click the link to accept and set a password:\n\n${acceptUrl}\n\nExpires: ${expiresAt.toISOString()}`;

    await sendEmail({ to: email, subject, text }).catch((err) => console.warn('sendEmail error:', err && err.message ? err.message : err));

    return res.status(201).json({ message: 'Invite created and emailed (or logged).' });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/accept-invite
 * Body: { email, token, password }
 */
const acceptInvite = async (req, res, next) => {
  try {
    const email = (req.body.email || '').toLowerCase().trim();
    const token = req.body.token;
    const password = req.body.password;

    if (!email || !token || !password) return res.status(400).json({ message: 'email, token and password are required' });

    const tokenHash = hashToken(token);
    const invite = await AdminInvite.findOne({ email, tokenHash });
    if (!invite) return res.status(400).json({ message: 'Invalid or expired invite token' });

    if (invite.used) return res.status(400).json({ message: 'Invite already used' });
    if (invite.expiresAt < new Date()) return res.status(400).json({ message: 'Invite expired' });

    let user = await User.findOne({ email });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    if (user) {
      user.password = hashed;
      user.role = 'admin';
      user.isActive = true;
      await user.save();
    } else {
      user = await User.create({ email, password: hashed, role: 'admin', isActive: true });
    }

    invite.used = true;
    await invite.save();

    // Optionally return auth token if you want to auto-login; otherwise instruct client to login.
    return res.status(201).json({ message: 'Admin account created/activated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { inviteAdmin, acceptInvite };
