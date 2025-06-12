const { createClient } = require('redis');

// Tạo Redis client với cấu hình tối ưu
const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
        connectTimeout: 60000,
        lazyConnect: true,
        reconnectStrategy: (retries) => Math.min(retries * 50, 500)
    }
});

// Xử lý lỗi kết nối
redisClient.on('error', (err) => {
    console.error('❌ Redis Client Error:', err);
});

redisClient.on('connect', () => {
    console.log('🔄 Connecting to Redis...');
});

redisClient.on('ready', () => {
    console.log('✅ Redis client ready');
});

redisClient.on('end', () => {
    console.log('⚠️ Redis connection ended');
});

redisClient.on('reconnecting', () => {
    console.log('🔄 Redis reconnecting...');
});

// Kết nối Redis với error handling
let isConnected = false;

const connectRedis = async () => {
    if (!isConnected) {
        try {
            await redisClient.connect();
            isConnected = true;
            console.log('✅ Connected to Redis');
        } catch (err) {
            console.error('❌ Redis connection failed:', err);
            isConnected = false;

            // Retry after 5 seconds
            setTimeout(connectRedis, 5000);
        }
    }
};

// Wrapper functions để tương thích với cú pháp cũ
const redisWrapper = {
    // Wrapper cho setex (SET with EXpiration)
    setex: async (key, seconds, value) => {
        try {
            if (!isConnected) await connectRedis();
            return await redisClient.setEx(key, seconds, value);
        } catch (error) {
            console.error('❌ Redis setex error:', error);
            throw error;
        }
    },

    // Wrapper cho get
    get: async (key) => {
        try {
            if (!isConnected) await connectRedis();
            return await redisClient.get(key);
        } catch (error) {
            console.error('❌ Redis get error:', error);
            return null;
        }
    },

    // Wrapper cho set
    set: async (key, value) => {
        try {
            if (!isConnected) await connectRedis();
            return await redisClient.set(key, value);
        } catch (error) {
            console.error('❌ Redis set error:', error);
            throw error;
        }
    },

    // Wrapper cho del
    del: async (key) => {
        try {
            if (!isConnected) await connectRedis();
            return await redisClient.del(key);
        } catch (error) {
            console.error('❌ Redis del error:', error);
            throw error;
        }
    },

    // Wrapper cho exists
    exists: async (key) => {
        try {
            if (!isConnected) await connectRedis();
            return await redisClient.exists(key);
        } catch (error) {
            console.error('❌ Redis exists error:', error);
            return 0;
        }
    },

    // Wrapper cho expire
    expire: async (key, seconds) => {
        try {
            if (!isConnected) await connectRedis();
            return await redisClient.expire(key, seconds);
        } catch (error) {
            console.error('❌ Redis expire error:', error);
            throw error;
        }
    },

    // Wrapper cho ttl
    ttl: async (key) => {
        try {
            if (!isConnected) await connectRedis();
            return await redisClient.ttl(key);
        } catch (error) {
            console.error('❌ Redis ttl error:', error);
            return -1;
        }
    },

    // Thêm method để kiểm tra kết nối
    isReady: () => isConnected,

    // Method để disconnect
    disconnect: async () => {
        try {
            if (isConnected) {
                await redisClient.disconnect();
                isConnected = false;
                console.log('🔒 Redis disconnected');
            }
        } catch (error) {
            console.error('❌ Redis disconnect error:', error);
        }
    }
};

// Khởi tạo kết nối
connectRedis();

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🔄 Shutting down Redis connection...');
    await redisWrapper.disconnect();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('🔄 Shutting down Redis connection...');
    await redisWrapper.disconnect();
    process.exit(0);
});

module.exports = redisWrapper;