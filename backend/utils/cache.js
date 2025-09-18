const Redis = require('ioredis');
const logger = require('./logger');

const redis = new Redis({
    host: process.env.REDIS_HOST || 'redis',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    retryStrategy: times => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3,
    lazyConnect: false // Connect immediately
});

redis.on('error', (err) => logger.error('Redis Client Error', err));
redis.on('connect', () => logger.info('Successfully connected to Redis.'));

const cache = {
    async get(key) {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            logger.error('Cache get error:', { key, error: error.message });
            return null;
        }
    },
    async set(key, value, ttl = 3600) {
        try {
            await redis.setex(key, ttl, JSON.stringify(value));
            return true;
        } catch (error) {
            logger.error('Cache set error:', { key, error: error.message });
            return false;
        }
    },
    async del(key) {
        try {
            await redis.del(key);
            return true;
        } catch (error) {
            logger.error('Cache delete error:', { key, error: error.message });
            return false;
        }
    }
};

module.exports = { cache, redis };