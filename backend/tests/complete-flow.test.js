const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/userModel');
const authRoutes = require('../routes/authRoutes');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Complete Authentication Flow Tests', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://admin:SecureMongo123!@localhost:27018/civic-reporting?authSource=admin');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  test('1. Admin Login Flow', async () => {
    console.log('\n=== ADMIN LOGIN FLOW ===');
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'syedadnanmohd61@gmail.com',
        password: '987654321Adnan!'
      });
    
    console.log('Status:', response.status);
    console.log('User:', response.body.user);
    console.log('Token exists:', !!response.body.accessToken);
    
    expect(response.status).toBe(200);
    expect(response.body.user.role).toBe('Admin');
    expect(response.body.accessToken).toBeDefined();
  });

  test('2. Citizen Registration Flow', async () => {
    console.log('\n=== CITIZEN REGISTRATION FLOW ===');
    
    // Clean up test user
    await User.deleteOne({ email: 'testcitizen@test.com' });
    
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'testcitizen@test.com',
        password: 'TestPassword123!',
        role: 'Citizen'
      });
    
    console.log('Registration Status:', response.status);
    console.log('User Role:', response.body.user?.role);
    
    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('Citizen');
    
    // Test citizen login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'testcitizen@test.com',
        password: 'TestPassword123!'
      });
    
    console.log('Citizen Login Status:', loginResponse.status);
    expect(loginResponse.status).toBe(200);
    
    // Cleanup
    await User.deleteOne({ email: 'testcitizen@test.com' });
  });

  test('3. Multiple Login Attempts', async () => {
    console.log('\n=== MULTIPLE LOGIN ATTEMPTS ===');
    
    for (let i = 1; i <= 3; i++) {
      console.log(`Attempt ${i}:`);
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'syedadnanmohd61@gmail.com',
          password: '987654321Adnan!'
        });
      
      console.log(`  Status: ${response.status}`);
      console.log(`  User Role: ${response.body.user?.role}`);
      expect(response.status).toBe(200);
    }
  });
});