import Redis from "ioredis";

// Connect to Upstash
export const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
    console.log('🔌 Connected to Upstash Redis!');
});

redis.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

