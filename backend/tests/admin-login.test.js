const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Admin Login Tests', () => {
  beforeAll(async () => {
    // Connect to production database
    await mongoose.connect('mongodb://admin:SecureMongo123!@localhost:27018/civic-reporting?authSource=admin');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('should verify admin user exists with correct credentials', async () => {
    const user = await User.findOne({ email: 'syedadnanmohd61@gmail.com' }).select('+password');
    
    console.log('=== ADMIN USER VERIFICATION ===');
    console.log('User exists:', !!user);
    if (user) {
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Has password:', !!user.password);
      console.log('Is active:', user.isActive);
      console.log('Login attempts:', user.loginAttempts);
      console.log('Is locked:', user.isLocked);
      
      const passwordMatch = await user.matchPassword('987654321Adnan!');
      console.log('Password matches:', passwordMatch);
    }
    
    expect(user).toBeTruthy();
    expect(user.role).toBe('Admin');
    expect(user.password).toBeTruthy();
  });

  test('should successfully login admin user via API', async () => {
    console.log('\n=== API LOGIN TEST ===');
    
    const loginData = {
      email: 'syedadnanmohd61@gmail.com',
      password: '987654321Adnan!'
    };
    
    console.log('Attempting login with:', loginData.email);
    
    const response = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));
    
    if (response.status !== 200) {
      console.log('Response headers:', response.headers);
    }
    
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('syedadnanmohd61@gmail.com');
    expect(response.body.user.role).toBe('Admin');
    expect(response.body.accessToken).toBeDefined();
    
    // Verify token structure
    const token = response.body.accessToken;
    const tokenParts = token.split('.');
    expect(tokenParts).toHaveLength(3);
    
    console.log('✅ Login successful with valid JWT token');
  });

  test('should reject invalid credentials', async () => {
    console.log('\n=== INVALID CREDENTIALS TEST ===');
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'syedadnanmohd61@gmail.com',
        password: 'wrongpassword'
      });
    
    console.log('Invalid login response status:', response.status);
    console.log('Invalid login response body:', response.body);
    
    expect(response.status).toBe(401);
    expect(response.body.message).toContain('Invalid');
  });

  test('should test registration endpoint', async () => {
    console.log('\n=== REGISTRATION TEST ===');
    
    // Clean up test user first
    await User.deleteOne({ email: 'test@example.com' });
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'TestPassword123!',
        role: 'Citizen'
      });
    
    console.log('Registration response status:', response.status);
    console.log('Registration response body:', JSON.stringify(response.body, null, 2));
    
    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
    expect(response.body.accessToken).toBeDefined();
    
    // Clean up
    await User.deleteOne({ email: 'test@example.com' });
    
    console.log('✅ Registration successful');
  });
});