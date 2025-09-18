const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Quick Integration Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://admin:SecureMongo123!@localhost:27018/civic-reporting?authSource=admin');
  }, 10000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. Database & Admin User Check', async () => {
    console.log('=== QUICK DATABASE CHECK ===');
    
    const admin = await User.findOne({ email: 'syedadnanmohd61@gmail.com' }).select('+password');
    console.log('Admin exists:', !!admin);
    console.log('Admin role:', admin?.role);
    console.log('Has password:', !!admin?.password);
    
    if (admin) {
      const passwordMatch = await admin.matchPassword('987654321Adnan!');
      console.log('Password matches:', passwordMatch);
      expect(passwordMatch).toBe(true);
    }
    
    expect(admin).toBeTruthy();
    expect(admin.role).toBe('Admin');
  });

  test('2. Login API Test', async () => {
    console.log('=== QUICK LOGIN TEST ===');
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'syedadnanmohd61@gmail.com',
        password: '987654321Adnan!'
      });
    
    console.log('Login status:', response.status);
    console.log('Has user:', !!response.body.user);
    console.log('Has token:', !!response.body.accessToken);
    
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
  });

  test('3. Environment Check', () => {
    console.log('=== ENVIRONMENT CHECK ===');
    console.log('JWT_SECRET exists:', !!process.env.JWT_SECRET);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    expect(process.env.JWT_SECRET).toBeDefined();
  });
});