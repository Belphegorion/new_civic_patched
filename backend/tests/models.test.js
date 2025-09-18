const User = require('../models/userModel');

describe('User Model', () => {
  test('should validate email format', () => {
    const user = new User({
      email: 'invalid-email',
      password: 'Password123'
    });
    
    const error = user.validateSync();
    expect(error.errors.email).toBeDefined();
  });

  test('should require password for non-Google users', () => {
    const user = new User({
      email: 'test@example.com'
    });
    
    const error = user.validateSync();
    expect(error.errors.password).toBeDefined();
  });

  test('should validate password length', () => {
    const user = new User({
      email: 'test@example.com',
      password: 'short'
    });
    
    const error = user.validateSync();
    expect(error.errors.password).toBeDefined();
  });

  test('should set default role to Citizen', () => {
    const user = new User({
      email: 'test@example.com',
      password: 'Password123'
    });
    
    expect(user.role).toBe('Citizen');
  });
});