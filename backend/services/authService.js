const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const { verifyGoogleToken } = require('./googleAuthService');

// --- Token Management ---
const generateToken = (user) => {
    return jwt.sign(
        { id: user._id, role: user.role, email: user.email, name: user.name || user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
    );
};

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

// --- Core Authentication Logic ---
const register = async ({ email, password, role = 'Citizen', name = '' }) => {
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
        throw new Error('User with this email already exists');
    }

    const user = await User.create({
        email: email.toLowerCase(),
        password,
        role: ['Citizen', 'Admin'].includes(role) ? role : 'Citizen',
        name,
    });
    
    const token = generateToken(user);
    const userResponse = { id: user._id, email: user.email, role: user.role, name: user.name };

    return { user: userResponse, token };
};

const login = async (email, password) => {
    const user = await User.findOne({ email: email.toLowerCase(), isActive: true })
                         .select('+password +loginAttempts +lockUntil');

    if (!user || !(await user.matchPassword(password))) {
        if (user) await user.incLoginAttempts();
        throw new Error('Invalid email or password');
    }
    
    if (user.isLocked) {
        throw new Error('Account temporarily locked due to too many failed login attempts.');
    }

    if (user.loginAttempts > 0) {
        await user.resetLoginAttempts();
    }

    const token = generateToken(user);
    const userResponse = { id: user._id, email: user.email, role: user.role, name: user.name };

    return { user: userResponse, token };
};

const handleGoogleAuth = async (googleToken) => {
    if (!googleToken) {
        throw new Error('Google token is required.');
    }

    const googlePayload = await verifyGoogleToken(googleToken);
    let user = await User.findOne({ email: googlePayload.email.toLowerCase() });

    if (!user) {
        user = await User.create({
            email: googlePayload.email.toLowerCase(),
            name: googlePayload.name,
            googleId: googlePayload.googleId,
            profilePicture: googlePayload.picture,
            isEmailVerified: googlePayload.emailVerified,
            role: 'Citizen',
        });
    } else if (!user.googleId) {
        user.googleId = googlePayload.googleId;
        if (!user.profilePicture) user.profilePicture = googlePayload.picture;
        user.isEmailVerified = user.isEmailVerified || googlePayload.emailVerified;
        await user.save();
    }

    const token = generateToken(user);
    const userResponse = { id: user._id, email: user.email, role: user.role, name: user.name, profilePicture: user.profilePicture };

    return { user: userResponse, token };
};


module.exports = {
    generateToken,
    verifyToken,
    login,
    register,
    handleGoogleAuth,
};