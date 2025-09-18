// backend/controllers/adminManagementController.js
const bcrypt = require('bcryptjs');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

/**
 * POST /api/admin/create
 * Protected: only existing admins via protect + admin middleware
 * Body: { email, password, adminId }
 */
const createAdminByAdmin = asyncHandler(async (req, res) => {
  const { email, password, adminId } = req.body;
  if (!email || !password || !adminId) {
    return res.status(400).json({ message: 'email, password and adminId are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Hash adminId using bcrypt
  const adminIdSalt = await bcrypt.genSalt(12);
  const adminIdHash = await bcrypt.hash(adminId, adminIdSalt);

  let user = await User.findOne({ email: normalizedEmail }).select('+password +adminIdHash').catch(() => null);

  if (user) {
    user.password = password; // will be hashed in pre-save hook
    user.role = 'Admin';
    user.isActive = true;
    user.adminIdHash = adminIdHash;
    await user.save();
    return res.status(200).json({ message: 'Existing user upgraded to Admin' });
  } else {
    const newUser = new User({
      email: normalizedEmail,
      password,
      role: 'Admin',
      isActive: true,
      adminIdHash
    });
    await newUser.save();
    return res.status(201).json({ message: 'Admin created successfully' });
  }
});

module.exports = { createAdminByAdmin };
