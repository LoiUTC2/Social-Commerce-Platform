const { createClient } = require('redis');

// Tạo Redis client
const redisClient = createClient({
    url: 'redis://localhost:6379' || 'redis://redis:6379'
});

// Xử lý lỗi kết nối
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

// Kết nối Redis
(async () => {
    try {
        await redisClient.connect();
        console.log('✅ Connected to Redis');
    } catch (err) {
        console.error('❌ Redis connection failed:', err);
        process.exit(1);
    }
})();

module.exports = redisClient;