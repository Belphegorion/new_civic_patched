// --- Core Node.js and Express Imports ---
const http = require('http');
const express = require('express');
const dotenv = require('dotenv');

// --- Middleware and Library Imports ---
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');

// --- Application-Specific Imports ---
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { initializeSocket } = require('./socket/socketHandler');
const logger = require('./utils/logger');
const { redis } = require('./utils/cache');

// --- Initial Configuration ---
dotenv.config();

// --- Database Connection ---
connectDB();

// --- Express App & HTTP Server Initialization ---
const app = express();
const server = http.createServer(app);

// --- Socket.IO Initialization ---
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  },
  transports: ['websocket', 'polling']
});
initializeSocket(io);

// Middleware to make the `io` instance accessible in route handlers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ====================================================================
// --- Middleware Pipeline (Order is important) ---
// ====================================================================

// 1. Core functionality middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 2. Logging middleware
const morganFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: { write: (message) => logger.info(message.trim()) } }));

// 3. Security middleware
app.use(helmet());
app.use(compression());
app.use(mongoSanitize());
app.use(xss());
app.use(hpp());

// 4. General API Rate Limiter
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 100 : 1000,
    message: { message: 'Too many requests from this IP, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', apiLimiter);

// ====================================================================
// --- Application Routes ---
// ====================================================================

// Health Check Endpoint
app.get('/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const redisStatus = await redis.ping().then(() => 'connected').catch(() => 'disconnected');
        const isHealthy = dbStatus === 'connected' && redisStatus === 'connected';
        
        const payload = {
            status: isHealthy ? 'OK' : 'SERVICE_UNAVAILABLE',
            timestamp: new Date().toISOString(),
            dependencies: { database: dbStatus, redis: redisStatus },
        };
        
        res.status(isHealthy ? 200 : 503).json(payload);
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(503).json({ status: 'ERROR', message: 'An error occurred during the health check.' });
    }
});

// API Routes
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/analytics', analyticsRoutes);

// ====================================================================
// --- Error Handling Middleware (Must be last) ---
// ====================================================================
app.use(notFound);
app.use(errorHandler);

// ====================================================================
// --- Server Startup & Graceful Shutdown ---
// ====================================================================
const PORT = process.env.BACKEND_PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Graceful shutdown logic
const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
        await mongoose.connection.close(false);
        logger.info('MongoDB connection closed.');
        redis.quit();
        logger.info('Redis connection closed.');
    } catch (err) {
        logger.error('Error during shutdown cleanup:', err);
    } finally {
        process.exit(0);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Application will shut down.', err);
  shutdown('unhandledRejection');
});

process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Application will shut down.', err);
  shutdown('uncaughtException');
});