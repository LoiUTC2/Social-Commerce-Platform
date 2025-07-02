const redisClient = require('../config/redisClient');

class OptimizedCacheManager {
    constructor() {
        this.cacheKeys = {
            tfidf: 'tfidf_matrix',
            flashSaleRecs: (userId, sessionId, limit) => `recs:flashsale:${userId || sessionId}:${limit}:v2`,
            productPricing: (productId) => `pricing:${productId}`,
            activeFlashSales: 'active_flashsales'
        };

        this.cacheDurations = {
            tfidf: 600, // 30 phút - stable data
            flashSaleRecs: 180, // 3 phút - dynamic data
            productPricing: 300, // 5 phút - pricing data
            activeFlashSales: 60 // 1 phút - real-time data
        };
    }

    // Cache hiệu quả cho AI recommendations
    async getCachedRecommendations(key, fetchFunction, duration) {
        try {
            const cached = await redisClient.get(key);
            if (cached) {
                return JSON.parse(cached);
            }

            const fresh = await fetchFunction();
            await redisClient.setex(key, duration, JSON.stringify(fresh));
            return fresh;

        } catch (error) {
            console.error(`Cache error for key ${key}:`, error);
            return await fetchFunction(); // Fallback to direct fetch
        }
    }

    // Invalidate cache khi Flash Sale thay đổi
    async invalidateFlashSaleCache(flashSaleId) {
        try {
            const keys = await redisClient.keys('recs:flashsale:*');
            if (keys.length > 0) {
                await redisClient.del(...keys);
            }

            // Invalidate related caches
            await redisClient.del(this.cacheKeys.activeFlashSales);
            await redisClient.del(this.cacheKeys.tfidf);

            console.log(`✅ Invalidated cache for flash sale ${flashSaleId}`);
        } catch (error) {
            console.error('Error invalidating flash sale cache:', error);
        }
    }

    // Smart cache warming
    async warmupCache() {
        try {
            // Warm up TF-IDF matrix
            const { prepareTfIdfMatrix } = require('./aiRecommendations');
            await prepareTfIdfMatrix();

            // Warm up active flash sales
            const { FlashSale } = require('../models');
            const activeFlashSales = await FlashSale.find({
                isActive: true,
                startTime: { $lte: new Date() },
                endTime: { $gt: new Date() }
            }).lean();

            await redisClient.setex(
                this.cacheKeys.activeFlashSales,
                this.cacheDurations.activeFlashSales,
                JSON.stringify(activeFlashSales)
            );

            console.log('✅ Cache warmed up successfully');
        } catch (error) {
            console.error('Error warming up cache:', error);
        }
    }
}

module.exports = new OptimizedCacheManager();