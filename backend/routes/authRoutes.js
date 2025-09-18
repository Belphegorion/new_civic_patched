const express = require('express');
const rateLimit = require('express-rate-limit');
const { body } = require('express-validator');
const { registerUser, loginUser, logoutUser, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Production-ready rate limiting for authentication routes.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 auth requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' }
});

// Validation middleware
const registerValidation = [
    body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
        .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('name').optional().trim().escape(),
    body('role').optional().isIn(['Citizen', 'Admin']).withMessage('Role must be either Citizen or Admin')
];

const loginValidation = [
    body('email').isEmail().withMessage('Please provide a valid email address').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
];

// Apply limiter to auth-sensitive routes
router.post('/register', authLimiter, registerValidation, registerUser);
router.post('/login', authLimiter, loginValidation, loginUser);
router.post('/google', authLimiter, googleAuth);

router.post('/logout', protect, logoutUser);

module.exports = router;