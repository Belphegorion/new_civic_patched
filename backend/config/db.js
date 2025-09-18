// backend/config/db.js

const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // --- START OF DIAGNOSTIC CODE ---
        const mongoURI = process.env.MONGODB_URI;
        console.log('[Diagnostic] Mongoose is attempting to connect with this URI:', mongoURI);
        // --- END OF DIAGNOSTIC CODE ---
        
        // This is the line that was crashing
        const conn = await mongoose.connect(mongoURI);

        console.log(`[SUCCESS] MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[CRITICAL ERROR] Mongoose connection failed:`, error.message);
        process.exit(1); // Exit process with failure
    }
};

module.exports = connectDB;