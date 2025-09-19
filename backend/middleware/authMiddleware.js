// backend/middleware/authMiddleware.js
const User = require('../models/userModel');
const authService = require('../services/authService');

const protect = async (req, res, next) => {
  try {
    let token;

    // 1) Prefer Authorization header Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // 2) Fallbacks (some clients/tests might send token differently)
    if (!token && req.cookies && req.cookies.token) token = req.cookies.token;
    if (!token && req.body && req.body.token) token = req.body.token;
    if (!token && req.query && req.query.token) token = req.query.token;

    if (!token) {
      return res.status(401).json({
        message: 'Access denied. No token provided.'
      });
    }

    let decoded;
    try {
      decoded = authService.verifyToken(token);
    } catch (jwtError) {
      // Keep JWT-specific handling
      console.error('JWT verification error:', jwtError && jwtError.stack ? jwtError.stack : jwtError);
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

    // Defensive: decoded may use different field names
    const userId = decoded && (decoded.id || decoded._id || decoded.userId || decoded.uid);
    const tokenIat = decoded && decoded.iat;
    const tokenExp = decoded && decoded.exp;

    // Optional: check expiry (authService may already throw this)
    if (typeof tokenExp === 'number' && tokenExp * 1000 < Date.now()) {
      return res.status(401).json({
        message: 'Token has expired. Please login again.'
      });
    }

    // Load user from DB and exclude sensitive fields
    let user;
    try {
      user = await User.findById(userId).select('-password -adminIdHash');
    } catch (dbErr) {
      console.error('[protect] DB error while fetching user:', dbErr && dbErr.stack ? dbErr.stack : dbErr);
      return res.status(500).json({ message: 'Server error while validating user' });
    }

    if (!user) {
      return res.status(401).json({
        message: 'User no longer exists. Please login again.'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        message: 'Account has been deactivated. Please contact support.'
      });
    }

    // Defensive: some schemas may not define changedPasswordAfter; check before calling
    if (typeof user.changedPasswordAfter === 'function') {
      try {
        if (tokenIat && user.changedPasswordAfter(tokenIat)) {
          return res.status(401).json({
            message: 'Password was recently changed. Please login again.'
          });
        }
      } catch (fnErr) {
        // If the method exists but throws, log and deny access safely
        console.error('[protect] Error while checking changedPasswordAfter:', fnErr && fnErr.stack ? fnErr.stack : fnErr);
        return res.status(500).json({ message: 'Server error during authentication' });
      }
    }

    // Attach user and move on
    req.user = user;
    return next();

  } catch (error) {
    // Ensure we log full stack trace for debugging
    console.error('Auth middleware error:', error && error.stack ? error.stack : error);
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
    console.error('Admin middleware error:', error && error.stack ? error.stack : error);
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

    if (req.user.role === 'Admin') {
      return next();
    }

    // Safely extract resource owner id candidates
    const resourceUserId = req.params.userId || req.body.userId || req.body.citizen || req.query.userId;
    if (resourceUserId) {
      // compare as strings; handle ObjectId too
      if (req.user._id && req.user._id.toString() === resourceUserId.toString()) {
        return next();
      }
    }

    return res.status(403).json({
      message: 'Access denied. You can only access your own resources.'
    });

  } catch (error) {
    console.error('Owner/Admin middleware error:', error && error.stack ? error.stack : error);
    return res.status(500).json({
      message: 'Server error during authorization'
    });
  }
};

module.exports = { protect, admin, ownerOrAdmin };
