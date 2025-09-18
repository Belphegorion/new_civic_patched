// backend/controllers/authAdminController.js
const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const createToken = (user) => {
  const payload = { id: user._id, email: user.email, role: user.role };
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' });
};

/**
 * POST /api/auth/admin-login
 * Body: { email, password, adminId }
 */
const adminLogin = asyncHandler(async (req, res) => {
  const { email, password, adminId } = req.body;
  if (!email || !password || !adminId) {
    return res.status(400).json({ message: 'email, password and adminId are required' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +adminIdHash');
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });

  if (user.role !== 'Admin') return res.status(403).json({ message: 'Not an admin' });

  const passwordMatch = await user.matchPassword(password);
  if (!passwordMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const adminIdMatch = await user.matchAdminId(adminId);
  if (!adminIdMatch) return res.status(401).json({ message: 'Invalid admin ID' });

  const token = createToken(user);

  res.json({
    token,
    user: { id: user._id, email: user.email, role: user.role }
  });
});

module.exports = { adminLogin };
