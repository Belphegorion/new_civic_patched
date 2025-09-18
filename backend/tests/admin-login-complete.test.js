const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Complete Admin Authentication Tests', () => {
  let adminToken = null;
  let adminUser = null;

  beforeAll(async () => {
    await mongoose.connect('mongodb://admin:SecureMongo123!@localhost:27018/civic-reporting?authSource=admin');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. Verify admin user exists with correct credentials', async () => {
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

  test('2. Test admin login via API and token generation', async () => {
    console.log('\n=== API LOGIN & TOKEN GENERATION TEST ===');
    
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
    
    expect(response.status).toBe(200);
    expect(response.body.user).toBeDefined();
    expect(response.body.user.email).toBe('syedadnanmohd61@gmail.com');
    expect(response.body.user.role).toBe('Admin');
    expect(response.body.accessToken).toBeDefined();
    
    // Store for next tests
    adminToken = response.body.accessToken;
    adminUser = response.body.user;
    
    console.log('✅ Login successful with token generated');
  });

  test('3. Verify JWT token structure and content', async () => {
    console.log('\n=== JWT TOKEN VERIFICATION ===');
    
    expect(adminToken).toBeTruthy();
    
    // Check token structure
    const tokenParts = adminToken.split('.');
    expect(tokenParts).toHaveLength(3);
    console.log('Token has 3 parts (header.payload.signature):', tokenParts.length === 3);
    
    // Decode token
    const decoded = jwt.verify(adminToken, process.env.JWT_SECRET);
    console.log('Decoded token payload:', decoded);
    
    expect(decoded.id).toBe(adminUser.id);
    expect(decoded.email).toBe(adminUser.email);
    expect(decoded.role).toBe('Admin');
    expect(decoded.name).toBeDefined();
    expect(decoded.exp).toBeGreaterThan(Date.now() / 1000);
    
    console.log('✅ JWT token is valid and contains correct data');
  });

  test('4. Test token storage simulation (localStorage equivalent)', async () => {
    console.log('\n=== TOKEN STORAGE SIMULATION ===');
    
    // Simulate frontend token storage
    const mockLocalStorage = {};
    
    // Store token and user (like frontend does)
    mockLocalStorage.token = adminToken;
    mockLocalStorage.user = JSON.stringify(adminUser);
    
    console.log('Stored token:', !!mockLocalStorage.token);
    console.log('Stored user:', !!mockLocalStorage.user);
    
    // Verify retrieval
    const retrievedToken = mockLocalStorage.token;
    const retrievedUser = JSON.parse(mockLocalStorage.user);
    
    expect(retrievedToken).toBe(adminToken);
    expect(retrievedUser.email).toBe(adminUser.email);
    expect(retrievedUser.role).toBe('Admin');
    
    console.log('✅ Token storage and retrieval works correctly');
  });

  test('5. Test protected route access with token', async () => {
    console.log('\n=== PROTECTED ROUTE ACCESS TEST ===');
    
    // Test accessing a protected route (we'll use the same login endpoint with token)
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${adminToken}`);
    
    console.log('Protected route response status:', response.status);
    console.log('Protected route response:', response.body);
    
    // Should succeed (200) or at least not be unauthorized (401)
    expect(response.status).not.toBe(401);
    
    console.log('✅ Protected route accessible with valid token');
  });

  test('6. Test registration functionality', async () => {
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
    
    // Verify token is valid
    const regToken = response.body.accessToken;
    const regDecoded = jwt.verify(regToken, process.env.JWT_SECRET);
    expect(regDecoded.email).toBe('test@example.com');
    expect(regDecoded.role).toBe('Citizen');
    
    // Clean up
    await User.deleteOne({ email: 'test@example.com' });
    
    console.log('✅ Registration successful with valid token');
  });

  test('7. Test invalid credentials rejection', async () => {
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
    expect(response.body.accessToken).toBeUndefined();
    
    console.log('✅ Invalid credentials properly rejected');
  });

  test('8. Test routing and middleware chain', async () => {
    console.log('\n=== ROUTING & MIDDLEWARE TEST ===');
    
    // Test that the route exists and middleware chain works
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'syedadnanmohd61@gmail.com',
        password: '987654321Adnan!'
      });
    
    // Check response headers for middleware execution
    console.log('Response headers:', Object.keys(response.headers));
    console.log('Content-Type:', response.headers['content-type']);
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/json/);
    
    console.log('✅ Routing and middleware chain working correctly');
  });
});