const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing admin if exists
        await User.deleteOne({ email: 'admin@civic.com' });
        await User.deleteOne({ email: 'syedadnanmohd61@gmail.com' });

        // Create admin user
        const admin = await User.create({
            email: 'syedadnanmohd61@gmail.com',
            password: '987654321Adnan!',
            role: 'Admin'
        });

        console.log('Admin user created successfully:');
        console.log('Email: syedadnanmohd61@gmail.com');
        console.log('Password: 987654321Adnan!');
        console.log('Role: Admin');
        
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin();