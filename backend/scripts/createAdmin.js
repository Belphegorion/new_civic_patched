// backend/scripts/createAdmin.js
const mongoose = require('mongoose');
const readline = require('readline');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/userModel');

const prompt = (query) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

(async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
    if (!mongoURI) {
      console.error('MONGODB_URI (or MONGO_URI) must be provided as an environment variable.');
      process.exit(1);
    }

    await mongoose.connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true });

    let email = process.env.ADMIN_EMAIL;
    let password = process.env.ADMIN_PASSWORD;

    if (!email) email = (await prompt('Admin email: ')).trim();
    if (!password) password = (await prompt('Admin password: ')).trim();

    if (!email || !password) {
      console.error('Email and password are required.');
      process.exit(1);
    }

    // Remove any existing user with this email (idempotent)
    await User.deleteMany({ email });

    // Hash password (if your model already hashes in pre-save hook, adjust accordingly)
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const admin = await User.create({
      email,
      password: hashed,
      role: 'admin',
      isActive: true,
    });

    console.log('Admin user created successfully.');
    console.log(`Email: ${admin.email}`);
    console.log('Password: (not displayed for security reasons)');
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message || err);
    process.exit(1);
  }
})();
