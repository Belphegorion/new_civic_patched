const { validationResult } = require('express-validator');
const authService = require('../services/authService');

// Helper to handle common service errors and provide consistent responses
const handleServiceError = (res, error) => {
    if (error.message.includes('already exists')) {
        return res.status(409).json({ message: error.message });
    }
    if (error.message.includes('Invalid') || error.message.includes('token is required')) {
        return res.status(401).json({ message: error.message });
    }
    if (error.message.includes('locked')) {
        return res.status(423).json({ message: error.message });
    }
    if (error.message) { // Fallback for validation or other known service errors
        return res.status(400).json({ message: error.message });
    }
    throw error; // For unexpected errors, pass to the main error handler
};

const registerUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { user, token } = await authService.register(req.body);
        res.status(201).json({ user, accessToken: token });
    } catch (error) {
        handleServiceError(res, error);
    }
};

const loginUser = async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const { email, password } = req.body;
        const { user, token } = await authService.login(email, password);
        res.status(200).json({ user, accessToken: token });
    } catch (error) {
        handleServiceError(res, error);
    }
};

const googleAuth = async (req, res, next) => {
    try {
        const { token: googleToken } = req.body;
        const { user, token } = await authService.handleGoogleAuth(googleToken);
        res.status(200).json({ user, accessToken: token });
    } catch (error) {
        handleServiceError(res, error);
    }
};

const logoutUser = (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports = { registerUser, loginUser, logoutUser, googleAuth };