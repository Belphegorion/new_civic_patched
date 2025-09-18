// backend/models/userModel.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Please provide an email'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email'],
        maxlength: [254, 'Email too long']
    },
    password: {
        type: String,
        required: function() { return !this.googleId; },
        minlength: [8, 'Password must be at least 8 characters'],
        maxlength: [128, 'Password too long'],
        select: false // Don't include password in queries by default
    },
    name: {
        type: String,
        trim: true,
        maxlength: [100, 'Name too long']
    },
    googleId: {
        type: String,
        sparse: true
    },
    profilePicture: {
        type: String
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        enum: {
            values: ['Citizen', 'Admin'],
            message: 'Role must be either Citizen or Admin'
        },
        default: 'Citizen',
    },
    isActive: {
        type: Boolean,
        default: true
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: Date,
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,

    // NEW: store bcrypt hash of admin ID (one-way). Only set for Admin accounts.
    adminIdHash: {
        type: String,
        select: false,
        default: ''
    }

}, { 
    timestamps: true,
    toJSON: { 
        transform: function(doc, ret) {
            delete ret.password;
            delete ret.passwordResetToken;
            delete ret.passwordResetExpires;
            delete ret.loginAttempts;
            delete ret.lockUntil;
            delete ret.adminIdHash; // remove adminIdHash from JSON output
            return ret;
        }
    }
});

// Indexes for performance and security
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ lockUntil: 1 });

// Virtual for account lock status
userSchema.virtual('isLocked').get(function() {
    return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Pre-save middleware for password hashing
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    // Hash password with cost of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set password changed timestamp
    if (!this.isNew) {
        this.passwordChangedAt = Date.now() - 1000;
    }
    
    next();
});

// Method to check password
userSchema.methods.matchPassword = async function(enteredPassword) {
    if (!enteredPassword || !this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

// NEW: Method to check admin ID
userSchema.methods.matchAdminId = async function (enteredAdminId) {
    if (!enteredAdminId || !this.adminIdHash) return false;
    return await bcrypt.compare(enteredAdminId, this.adminIdHash);
};

// Method to handle failed login attempts
userSchema.methods.incLoginAttempts = function() {
    // If we have a previous lock that has expired, restart at 1
    if (this.lockUntil && this.lockUntil < Date.now()) {
        return this.updateOne({
            $unset: { lockUntil: 1 },
            $set: { loginAttempts: 1 }
        });
    }
    
    const updates = { $inc: { loginAttempts: 1 } };
    
    // Lock account after 5 failed attempts for 2 hours
    if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
        updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
    }
    
    return this.updateOne(updates);
};

// Method to reset login attempts
userSchema.methods.resetLoginAttempts = function() {
    return this.updateOne({
        $unset: { loginAttempts: 1, lockUntil: 1 }
    });
};

// Method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
