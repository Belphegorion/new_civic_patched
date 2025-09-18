const User = require('../models/userModel');
const authService = require('../services/authService');

const protect = async (req, res, next) => {
    try {
        let token;
        
        // Check for token in Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        
        // Check if token exists
        if (!token) {
            return res.status(401).json({ 
                message: 'Access denied. No token provided.' 
            });
        }
        
        try {
            // Verify token
            const decoded = authService.verifyToken(token);
            
            // Check if token is expired
            if (decoded.exp * 1000 < Date.now()) {
                return res.status(401).json({ 
                    message: 'Token has expired. Please login again.' 
                });
            }
            
            // Get user from database
            const user = await User.findById(decoded.id).select('-password');
            if (!user) {
                return res.status(401).json({ 
                    message: 'User no longer exists. Please login again.' 
                });
            }
            
            // Check if user is active
            if (!user.isActive) {
                return res.status(401).json({ 
                    message: 'Account has been deactivated. Please contact support.' 
                });
            }
            
            // Check if password was changed after token was issued
            if (user.changedPasswordAfter(decoded.iat)) {
                return res.status(401).json({ 
                    message: 'Password was recently changed. Please login again.' 
                });
            }
            
            // Add user to request object
            req.user = user;
            next();
            
        } catch (jwtError) {
            console.error('JWT verification error:', jwtError.message);
            
            if (jwtError.name === 'TokenExpiredError') {
                return res.status(401).json({ 
                    message: 'Token has expired. Please login again.' 
                });
            } else if (jwtError.name === 'JsonWebTokenError') {
                return res.status(401).json({ 
                    message: 'Invalid token. Please login again.' 
                });
            } else {
                return res.status(401).json({ 
                    message: 'Token verification failed. Please login again.' 
                });
            }
        }
        
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ 
            message: 'Server error during authentication' 
        });
    }
};

const admin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentication required' 
            });
        }
        
        if (req.user.role !== 'Admin') {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }
        
        next();
    } catch (error) {
        console.error('Admin middleware error:', error);
        return res.status(500).json({ 
            message: 'Server error during authorization' 
        });
    }
};

// Middleware to check if user is the owner of a resource or admin
const ownerOrAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({ 
                message: 'Authentication required' 
            });
        }
        
        // Allow if user is admin
        if (req.user.role === 'Admin') {
            return next();
        }
        
        // Allow if user is the owner (check userId in params or body)
        const resourceUserId = req.params.userId || req.body.userId || req.body.citizen;
        if (resourceUserId && req.user._id.toString() === resourceUserId.toString()) {
            return next();
        }
        
        return res.status(403).json({ 
            message: 'Access denied. You can only access your own resources.' 
        });
        
    } catch (error) {
        console.error('Owner/Admin middleware error:', error);
        return res.status(500).json({ 
            message: 'Server error during authorization' 
        });
    }
};

module.exports = { protect, admin, ownerOrAdmin };