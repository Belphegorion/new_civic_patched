const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication Debug Tests', () => {
  beforeAll(async () => {
    // Connect to production database to test real data
    await mongoose.connect('mongodb://admin:SecureMongo123!@localhost:27018/civic-reporting?authSource=admin');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should check if user exists in database', async () => {
    const user = await User.findOne({ email: 'syedadnanmohd61@gmail.com' });
    console.log('User found:', user ? { email: user.email, role: user.role, hasPassword: !!user.password } : 'Not found');
    expect(user).toBeTruthy();
  });

  test('should test password comparison directly', async () => {
    const user = await User.findOne({ email: 'syedadnanmohd61@gmail.com' }).select('+password');
    if (user) {
      const isMatch = await user.matchPassword('987654321Adnan!');
      console.log('Password match result:', isMatch);
      expect(isMatch).toBe(true);
    }
  });

  test('should test login endpoint directly', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'syedadnanmohd61@gmail.com',
        password: '987654321Adnan!'
      });
    
    console.log('Login response status:', response.status);
    console.log('Login response body:', response.body);
    
    if (response.status === 200) {
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();
    }
  });

  test('should check user model password hashing', async () => {
    // Create a test user to verify password hashing works
    const testUser = new User({
      email: 'test@example.com',
      password: '987654321Adnan!',
      role: 'Citizen'
    });
    
    console.log('Password before save:', testUser.password);
    await testUser.save();
    console.log('Password after save (should be hashed):', testUser.password);
    
    const isMatch = await testUser.matchPassword('987654321Adnan!');
    console.log('Test user password match:', isMatch);
    
    // Cleanup
    await User.deleteOne({ email: 'test@example.com' });
    
    expect(isMatch).toBe(true);
  });
});