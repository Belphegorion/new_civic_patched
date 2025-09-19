// backend/scripts/createAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../models/userModel'); // adjust path
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error('MONGODB_URI not set in env');
  process.exit(1);
}

async function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans); }));
}

async function run() {
  await mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

  const emailArg = process.argv.find(a => a.startsWith('--email='));
  const passwordArg = process.argv.find(a => a.startsWith('--password='));
  const adminIdArg = process.argv.find(a => a.startsWith('--adminId='));

  const email = emailArg ? emailArg.split('=')[1] : (await ask('Admin email: '));
  let password = passwordArg ? passwordArg.split('=')[1] : (await ask('Admin password (min 8 chars): '));
  const adminId = adminIdArg ? adminIdArg.split('=')[1] : (await ask('Admin ID (e.g. ADC5252): '));

  if (!email || !password || !adminId) {
    console.error('email, password and adminId are required');
    process.exit(1);
  }

  // Upsert user and mark as Admin
  let user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password +adminIdHash').catch(() => null);
  if (user) {
    user.password = password;
    user.role = 'Admin';
    user.adminIdHash = await bcrypt.hash(adminId, 12);
    user.isActive = true;
    await user.save();
    console.log('Existing user updated to Admin:', email);
  } else {
    user = new User({
      email: email.toLowerCase().trim(),
      password,
      role: 'Admin',
      isActive: true,
      adminIdHash: await bcrypt.hash(adminId, 12)
    });
    await user.save();
    console.log('New admin created:', email);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
