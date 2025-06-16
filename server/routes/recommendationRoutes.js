const express = require('express');
const router = express.Router();
const { successResponse, errorResponse } = require('../utils/response');
const redisClient = require('../config/redisClient');
const Product = require('../models/Product');
const Post = require('../models/Post');
const User = require('../models/User');
const Shop = require('../models/Shop');

const {
    loadMatrixFactorizationModel,
    getHybridRecommendations,
    getUserShopRecommendations,
    trainMatrixFactorization,
    prepareTfIdfMatrix,
    trainUserShopModel,

    debugGetCollaborativeRecommendations,
    debugGetHybridRecommendations
} = require('../services/recommendationService');

const { verifyToken, setActor } = require('../middleware/authMiddleware');
const { requestLogger } = require('../middleware/requestLogger ');
const UserInteraction = require('../models/UserInteraction');

// Route lấy gợi ý chung (có thể là post, product, user, shop)
router.get('/', requestLogger, setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        const recommendations = await getHybridRecommendations(userId, sessionId, parseInt(limit), role);
        return successResponse(res, 'Lấy gợi ý thành công', {
            recommendations,
            count: recommendations.length
        });
    } catch (err) {
        console.error('❌ API Error:', err);
        return errorResponse(
            res,
            'Lỗi server khi lấy gợi ý',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

// Route lấy gợi ý bài viết với error handling tốt hơn
router.get('/posts', requestLogger, setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';

        console.log(`🔍 Debug posts endpoint - userId: ${userId}, sessionId: ${sessionId}, role: ${role}`);

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        // Giảm timeout xuống 20 giây
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000);
        });

        // Gọi recommendation với error handling
        const recommendationPromise = (async () => {
            try {
                console.log('🚀 Bắt đầu lấy hybrid recommendations cho posts...');

                // Kiểm tra cache trước để tránh training không cần thiết
                const cacheKey = `recs:hybrid:${userId || sessionId}:${parseInt(limit) * 3}:${role}:posts`;
                const cached = await redisClient.get(cacheKey);

                let allRecommendations;

                if (cached) {
                    console.log('✅ Sử dụng cached recommendations cho posts');
                    allRecommendations = JSON.parse(cached);
                } else {
                    // Thực hiện recommendation với timeout nhỏ hơn
                    const recTimeout = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Recommendation timeout')), 18000); // 18 giây
                    });

                    const recPromise = getHybridRecommendations(
                        userId,
                        sessionId,
                        parseInt(limit) * 3,
                        role
                    );

                    allRecommendations = await Promise.race([recPromise, recTimeout]);
                }

                console.log(`📊 Tổng số recommendations: ${allRecommendations?.length || 0}`);

                if (!allRecommendations || !Array.isArray(allRecommendations)) {
                    console.warn('⚠️ allRecommendations không phải array hoặc null, fallback cho posts');
                    throw new Error('Invalid recommendations format');
                }

                // Filter chỉ lấy posts
                const postRecommendations = allRecommendations.filter(r =>
                    r && r.type === 'post' && r._id
                );
                console.log(`📊 Số posts sau khi filter: ${postRecommendations.length}`);

                // Nếu không có posts, thử fallback
                if (postRecommendations.length === 0) {
                    console.log('⚠️ Không có posts, thử fallback...');
                    const fallbackPosts = await Post.find({
                        privacy: 'public',
                        isActive: { $ne: false } // Assuming posts có trường isActive
                    })
                        .sort({
                            likesCount: -1,
                            commentsCount: -1,
                            sharesCount: -1,
                            createdAt: -1
                        })
                        .populate('author._id', 'fullName avatar')
                        .limit(parseInt(limit))
                        .lean();

                    const fallbackResult = fallbackPosts.map(p => ({ ...p, type: 'post' }));

                    return {
                        recommendations: fallbackResult,
                        count: fallbackResult.length,
                        isFallback: true,
                        reason: 'No posts in recommendations',
                        debug: {
                            totalRecommendations: allRecommendations.length,
                            postCount: 0,
                            types: allRecommendations.reduce((acc, item) => {
                                if (item && item.type) {
                                    acc[item.type] = (acc[item.type] || 0) + 1;
                                }
                                return acc;
                            }, {})
                        }
                    };
                }

                // Lấy limit items
                const finalResults = postRecommendations.slice(0, parseInt(limit));

                console.log(`✅ Trả về ${finalResults.length} posts`);
                return {
                    recommendations: finalResults,
                    count: finalResults.length,
                    debug: {
                        totalRecommendations: allRecommendations.length,
                        postCount: postRecommendations.length,
                        types: allRecommendations.reduce((acc, item) => {
                            if (item && item.type) {
                                acc[item.type] = (acc[item.type] || 0) + 1;
                            }
                            return acc;
                        }, {})
                    }
                };

            } catch (recError) {
                console.error('❌ Lỗi trong recommendation process cho posts:', recError);
                throw recError;
            }
        })();

        // Race between recommendation và timeout
        const result = await Promise.race([recommendationPromise, timeoutPromise]);

        return successResponse(res, 'Lấy gợi ý bài viết thành công', result);

    } catch (err) {
        console.error('❌ API Error:', err);

        // Fallback cho mọi loại lỗi
        console.log('🔄 Fallback to simple post recommendations...');

        try {
            // Fallback đơn giản: lấy bài viết phổ biến
            const fallbackPosts = await Post.find({
                privacy: 'public',
                isActive: { $ne: false },
                $or: [
                    { likesCount: { $gt: 0 } },
                    { commentsCount: { $gt: 0 } },
                    { sharesCount: { $gt: 0 } },
                    { createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } } // 7 ngày gần đây
                ]
            })
                .sort({
                    likesCount: -1,
                    commentsCount: -1,
                    sharesCount: -1,
                    createdAt: -1
                })
                .populate('author._id', 'fullName avatar')
                .limit(parseInt(req.query.limit) || 10)
                .lean();

            // Nếu vẫn không có, lấy bất kỳ posts nào
            if (fallbackPosts.length === 0) {
                const anyPosts = await Post.find({
                    privacy: 'public',
                    isActive: { $ne: false }
                })
                    .sort({ createdAt: -1 })
                    .populate('author._id', 'fullName avatar')
                    .limit(parseInt(req.query.limit) || 10)
                    .lean();

                const anyResult = anyPosts.map(p => ({ ...p, type: 'post' }));

                return successResponse(res, 'Lấy gợi ý bài viết thành công (fallback basic)', {
                    recommendations: anyResult,
                    count: anyResult.length,
                    isFallback: true,
                    reason: 'Basic fallback - any posts'
                });
            }

            const fallbackResult = fallbackPosts.map(p => ({ ...p, type: 'post' }));

            return successResponse(res, 'Lấy gợi ý bài viết thành công (fallback)', {
                recommendations: fallbackResult,
                count: fallbackResult.length,
                isFallback: true,
                reason: err.message.includes('timeout') ? 'Timeout' : 'Processing error'
            });

        } catch (fallbackError) {
            console.error('❌ Fallback cũng lỗi:', fallbackError);

            // Final fallback - trả về empty result
            return successResponse(res, 'Không thể lấy gợi ý bài viết', {
                recommendations: [],
                count: 0,
                isFallback: true,
                reason: 'All fallbacks failed',
                error: process.env.NODE_ENV === 'development' ? fallbackError.message : 'System error'
            });
        }
    }
});

// Route lấy gợi ý sản phẩm với error handling tốt hơn
router.get('/products', requestLogger, setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';

        console.log(`🔍 Debug products endpoint - userId: ${userId}, sessionId: ${sessionId}, role: ${role}`);

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        // Giảm timeout xuống 20 giây
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000);
        });

        // Gọi recommendation với error handling
        const recommendationPromise = (async () => {
            try {
                console.log('🚀 Bắt đầu lấy hybrid recommendations...');

                // Kiểm tra cache trước để tránh training không cần thiết
                const cacheKey = `recs:hybrid:${userId || sessionId}:${parseInt(limit) * 3}:${role}`;
                const cached = await redisClient.get(cacheKey);

                let allRecommendations;

                if (cached) {
                    console.log('✅ Sử dụng cached recommendations');
                    allRecommendations = JSON.parse(cached);
                } else {
                    // Thực hiện recommendation với timeout nhỏ hơn
                    const recTimeout = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Recommendation timeout')), 18000); // 18 giây
                    });

                    const recPromise = getHybridRecommendations(
                        userId,
                        sessionId,
                        parseInt(limit) * 3,
                        role
                    );

                    allRecommendations = await Promise.race([recPromise, recTimeout]);
                }

                console.log(`📊 Tổng số recommendations: ${allRecommendations?.length || 0}`);

                if (!allRecommendations || !Array.isArray(allRecommendations)) {
                    console.warn('⚠️ allRecommendations không phải array hoặc null, fallback');
                    throw new Error('Invalid recommendations format');
                }

                // Filter chỉ lấy products
                const productRecommendations = allRecommendations.filter(r =>
                    r && r.type === 'product' && r._id
                );
                console.log(`📊 Số products sau khi filter: ${productRecommendations.length}`);

                // Nếu không có products, thử fallback
                if (productRecommendations.length === 0) {
                    console.log('⚠️ Không có products, thử fallback...');
                    const fallbackProducts = await Product.find({ isActive: true })
                        .sort({ soldCount: -1, 'ratings.avg': -1, createdAt: -1 })
                        .limit(parseInt(limit))
                        .lean();

                    const fallbackResult = fallbackProducts.map(p => ({ ...p, type: 'product' }));

                    return {
                        recommendations: fallbackResult,
                        count: fallbackResult.length,
                        isFallback: true,
                        reason: 'No products in recommendations',
                        debug: {
                            totalRecommendations: allRecommendations.length,
                            productCount: 0,
                            types: allRecommendations.reduce((acc, item) => {
                                if (item && item.type) {
                                    acc[item.type] = (acc[item.type] || 0) + 1;
                                }
                                return acc;
                            }, {})
                        }
                    };
                }

                // Lấy limit items
                const finalResults = productRecommendations.slice(0, parseInt(limit));

                console.log(`✅ Trả về ${finalResults.length} products`);
                return {
                    recommendations: finalResults,
                    count: finalResults.length,
                    debug: {
                        totalRecommendations: allRecommendations.length,
                        productCount: productRecommendations.length,
                        types: allRecommendations.reduce((acc, item) => {
                            if (item && item.type) {
                                acc[item.type] = (acc[item.type] || 0) + 1;
                            }
                            return acc;
                        }, {})
                    }
                };

            } catch (recError) {
                console.error('❌ Lỗi trong recommendation process:', recError);
                throw recError;
            }
        })();

        // Race between recommendation và timeout
        const result = await Promise.race([recommendationPromise, timeoutPromise]);

        return successResponse(res, 'Lấy gợi ý sản phẩm thành công', result);

    } catch (err) {
        console.error('❌ API Error:', err);

        // Fallback cho mọi loại lỗi
        console.log('🔄 Fallback to simple recommendations...');

        try {
            // Fallback đơn giản: lấy sản phẩm phổ biến
            const fallbackProducts = await Product.find({
                isActive: true,
                $or: [
                    { soldCount: { $gt: 0 } },
                    { 'ratings.avg': { $gte: 4 } },
                    { createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
                ]
            })
                .sort({
                    soldCount: -1,
                    'ratings.avg': -1,
                    createdAt: -1
                })
                .limit(parseInt(req.query.limit) || 10)
                .lean();

            // Nếu vẫn không có, lấy bất kỳ products nào
            if (fallbackProducts.length === 0) {
                const anyProducts = await Product.find({ isActive: true })
                    .sort({ createdAt: -1 })
                    .limit(parseInt(req.query.limit) || 10)
                    .lean();

                const anyResult = anyProducts.map(p => ({ ...p, type: 'product' }));

                return successResponse(res, 'Lấy gợi ý sản phẩm thành công (fallback basic)', {
                    recommendations: anyResult,
                    count: anyResult.length,
                    isFallback: true,
                    reason: 'Basic fallback - any products'
                });
            }

            const fallbackResult = fallbackProducts.map(p => ({ ...p, type: 'product' }));

            return successResponse(res, 'Lấy gợi ý sản phẩm thành công (fallback)', {
                recommendations: fallbackResult,
                count: fallbackResult.length,
                isFallback: true,
                reason: err.message.includes('timeout') ? 'Timeout' : 'Processing error'
            });

        } catch (fallbackError) {
            console.error('❌ Fallback cũng lỗi:', fallbackError);

            // Final fallback - trả về empty result
            return successResponse(res, 'Không thể lấy gợi ý sản phẩm', {
                recommendations: [],
                count: 0,
                isFallback: true,
                reason: 'All fallbacks failed',
                error: process.env.NODE_ENV === 'development' ? fallbackError.message : 'System error'
            });
        }
    }
});

// Route lấy gợi ý cửa hàng/shop với pagination và filter
router.get('/shops', requestLogger, verifyToken, setActor, async (req, res) => {
    try {
        const {
            limit = 10,
            page = 1,
            search = '',
            category = '',
            location = '',
            sortBy = 'recommended', // recommended, rating, followers, newest, products
            sortOrder = 'desc'
        } = req.query;

        const userId = req.actor?._id?.toString();
        const sessionId = req.sessionId;

        const role = req.actor?.type || 'user';
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Giới hạn 1-50
        const offset = (pageNum - 1) * limitNum;

        console.log(`🔍 Debug shops endpoint - userId: ${userId}, sessionId: ${sessionId}, role: ${role}, page: ${pageNum}, limit: ${limitNum}`);

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        // Build cache key với các params
        const cacheKey = `shops:${userId || sessionId}:${pageNum}:${limitNum}:${search}:${category}:${location}:${sortBy}:${sortOrder}:${role}`;

        // Kiểm tra cache
        const cached = await redisClient.get(cacheKey);
        if (cached) {
            console.log('✅ Sử dụng cached shops result');
            return successResponse(res, 'Lấy gợi ý cửa hàng thành công (cached)', JSON.parse(cached));
        }

        // Giảm timeout xuống 20 giây
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000);
        });

        // Gọi recommendation với error handling
        const recommendationPromise = (async () => {
            try {
                console.log('🚀 Bắt đầu lấy hybrid recommendations cho shops...');

                let allRecommendations = [];
                let isRecommendationBased = false;

                // Nếu không có search/filter, sử dụng recommendation
                if (!search && !category && !location && sortBy === 'recommended') {
                    // Kiểm tra cache recommendations trước
                    const recCacheKey = `recs:hybrid:${userId || sessionId}:${limitNum * 5}:${role}`;
                    const cachedRecs = await redisClient.get(recCacheKey);

                    if (cachedRecs) {
                        console.log('✅ Sử dụng cached recommendations');
                        allRecommendations = JSON.parse(cachedRecs);
                        isRecommendationBased = true;
                    } else {
                        // Thực hiện recommendation với timeout nhỏ hơn
                        const recTimeout = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Recommendation timeout')), 18000);
                        });

                        const recPromise = getHybridRecommendations(
                            userId,
                            sessionId,
                            limitNum * 5, // Lấy nhiều hơn để có đủ shops sau khi filter
                            role
                        );

                        try {
                            allRecommendations = await Promise.race([recPromise, recTimeout]);
                            isRecommendationBased = true;
                        } catch (recError) {
                            console.warn('⚠️ Recommendation failed, fallback to query-based');
                            allRecommendations = [];
                            isRecommendationBased = false;
                        }
                    }
                }

                console.log(`📊 Tổng số recommendations: ${allRecommendations?.length || 0}`);

                let shopResults = [];
                let totalCount = 0;

                if (isRecommendationBased && allRecommendations && Array.isArray(allRecommendations)) {
                    // Filter chỉ lấy shops từ recommendations
                    const shopRecommendations = allRecommendations.filter(r =>
                        r && r.type === 'shop' && r._id
                    );

                    console.log(`📊 Số shops từ recommendations: ${shopRecommendations.length}`);

                    // Apply additional filters if any
                    let filteredShops = shopRecommendations;

                    if (search) {
                        const searchRegex = new RegExp(search, 'i');
                        filteredShops = filteredShops.filter(shop =>
                            searchRegex.test(shop.name) ||
                            searchRegex.test(shop.description || '')
                        );
                    }

                    if (category) {
                        filteredShops = filteredShops.filter(shop =>
                            shop.categories && shop.categories.includes(category)
                        );
                    }

                    if (location) {
                        filteredShops = filteredShops.filter(shop =>
                            shop.address && shop.address.includes(location)
                        );
                    }

                    totalCount = filteredShops.length;
                    shopResults = filteredShops.slice(offset, offset + limitNum);

                } else {
                    // Fallback: Query database trực tiếp với filters
                    console.log('🔄 Fallback to database query với filters...');

                    // Build query conditions
                    const queryConditions = {
                        'status.isActive': true,
                        'status.isApprovedCreate': true
                    };

                    // Apply filters
                    if (search) {
                        queryConditions.$or = [
                            { name: { $regex: search, $options: 'i' } },
                            { description: { $regex: search, $options: 'i' } }
                        ];
                    }

                    if (category) {
                        queryConditions.categories = category;
                    }

                    if (location) {
                        queryConditions.address = { $regex: location, $options: 'i' };
                    }

                    // Build sort conditions
                    let sortConditions = {};
                    switch (sortBy) {
                        case 'rating':
                            sortConditions = { 'stats.rating.avg': sortOrder === 'asc' ? 1 : -1 };
                            break;
                        case 'followers':
                            sortConditions = { 'stats.followers.length': sortOrder === 'asc' ? 1 : -1 };
                            break;
                        case 'newest':
                            sortConditions = { createdAt: sortOrder === 'asc' ? 1 : -1 };
                            break;
                        case 'products':
                            sortConditions = { 'stats.products.total': sortOrder === 'asc' ? 1 : -1 };
                            break;
                        default: // recommended or fallback
                            sortConditions = {
                                'stats.rating.avg': -1,
                                'stats.followers.length': -1,
                                'stats.products.total': -1,
                                createdAt: -1
                            };
                    }

                    // Get total count
                    totalCount = await Shop.countDocuments(queryConditions);

                    // Get paginated results
                    const shops = await Shop.find(queryConditions)
                        .sort(sortConditions)
                        .skip(offset)
                        .limit(limitNum)
                        .lean();

                    shopResults = shops.map(s => ({ ...s, type: 'shop' }));
                }

                // Nếu không có kết quả, thử fallback đơn giản
                if (shopResults.length === 0 && pageNum === 1) {
                    console.log('⚠️ Không có shops, thử fallback...');
                    const fallbackShops = await Shop.find({
                        'status.isActive': true,
                        'status.isApprovedCreate': true
                    })
                        .sort({
                            'stats.rating.avg': -1,
                            'stats.followers.length': -1,
                            'stats.products.total': -1,
                            createdAt: -1
                        })
                        .limit(limitNum)
                        .lean();

                    shopResults = fallbackShops.map(s => ({ ...s, type: 'shop' }));
                    totalCount = fallbackShops.length;
                }

                // Tính toán pagination metadata
                const totalPages = Math.ceil(totalCount / limitNum);
                const hasNext = pageNum < totalPages;
                const hasPrev = pageNum > 1;

                const result = {
                    shops: shopResults,
                    pagination: {
                        currentPage: pageNum,
                        totalPages,
                        totalCount,
                        limit: limitNum,
                        hasNext,
                        hasPrev,
                        nextPage: hasNext ? pageNum + 1 : null,
                        prevPage: hasPrev ? pageNum - 1 : null
                    },
                    filters: {
                        search: search || null,
                        category: category || null,
                        location: location || null,
                        sortBy,
                        sortOrder
                    },
                    metadata: {
                        isRecommendationBased,
                        isFallback: !isRecommendationBased,
                        reason: isRecommendationBased ? null : 'Query-based results',
                        timestamp: new Date().toISOString()
                    }
                };

                console.log(`✅ Trả về ${shopResults.length}/${totalCount} shops cho page ${pageNum}`);
                return result;

            } catch (recError) {
                console.error('❌ Lỗi trong recommendation process:', recError);
                throw recError;
            }
        })();

        // Race between recommendation và timeout
        const result = await Promise.race([recommendationPromise, timeoutPromise]);

        // Cache kết quả trong 10 phút
        await redisClient.setex(cacheKey, 600, JSON.stringify(result));

        return successResponse(res, 'Lấy gợi ý cửa hàng thành công', result);

    } catch (err) {
        console.error('❌ API Error:', err);

        // Fallback cho mọi loại lỗi
        console.log('🔄 Fallback to simple shop recommendations...');

        try {
            const pageNum = Math.max(1, parseInt(req.query.page) || 1);
            const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
            const offset = (pageNum - 1) * limitNum;

            // Fallback đơn giản: lấy shops phổ biến với pagination
            const queryConditions = {
                'status.isActive': true,
                'status.isApprovedCreate': true
            };

            // Apply basic search if provided
            if (req.query.search) {
                queryConditions.$or = [
                    { name: { $regex: req.query.search, $options: 'i' } },
                    { description: { $regex: req.query.search, $options: 'i' } }
                ];
            }

            const [fallbackShops, totalCount] = await Promise.all([
                Shop.find(queryConditions)
                    .sort({
                        'stats.rating.avg': -1,
                        'stats.followers.length': -1,
                        'stats.products.total': -1,
                        createdAt: -1
                    })
                    .skip(offset)
                    .limit(limitNum)
                    .lean(),
                Shop.countDocuments(queryConditions)
            ]);

            const totalPages = Math.ceil(totalCount / limitNum);
            const hasNext = pageNum < totalPages;
            const hasPrev = pageNum > 1;

            const fallbackResult = {
                shops: fallbackShops.map(s => ({ ...s, type: 'shop' })),
                pagination: {
                    currentPage: pageNum,
                    totalPages,
                    totalCount,
                    limit: limitNum,
                    hasNext,
                    hasPrev,
                    nextPage: hasNext ? pageNum + 1 : null,
                    prevPage: hasPrev ? pageNum - 1 : null
                },
                filters: {
                    search: req.query.search || null,
                    category: null,
                    location: null,
                    sortBy: 'recommended',
                    sortOrder: 'desc'
                },
                metadata: {
                    isRecommendationBased: false,
                    isFallback: true,
                    reason: err.message.includes('timeout') ? 'Timeout' : 'Processing error',
                    timestamp: new Date().toISOString()
                }
            };

            return successResponse(res, 'Lấy gợi ý cửa hàng thành công (fallback)', fallbackResult);

        } catch (fallbackError) {
            console.error('❌ Fallback cũng lỗi:', fallbackError);

            // Final fallback - trả về empty result với pagination structure
            const pageNum = Math.max(1, parseInt(req.query.page) || 1);
            const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));

            return successResponse(res, 'Không thể lấy gợi ý cửa hàng', {
                shops: [],
                pagination: {
                    currentPage: pageNum,
                    totalPages: 0,
                    totalCount: 0,
                    limit: limitNum,
                    hasNext: false,
                    hasPrev: false,
                    nextPage: null,
                    prevPage: null
                },
                filters: {
                    search: req.query.search || null,
                    category: req.query.category || null,
                    location: req.query.location || null,
                    sortBy: req.query.sortBy || 'recommended',
                    sortOrder: req.query.sortOrder || 'desc'
                },
                metadata: {
                    isRecommendationBased: false,
                    isFallback: true,
                    reason: 'All fallbacks failed',
                    error: process.env.NODE_ENV === 'development' ? fallbackError.message : 'System error',
                    timestamp: new Date().toISOString()
                }
            });
        }
    }
});

// Route lấy gợi ý người dùng với phân trang đầy đủ
router.get('/users', requestLogger, verifyToken, setActor, async (req, res) => {
    try {
        const {   
            limit = 10, 
            page = 1,
            offset,
            sortBy = 'score', // score, createdAt, followersCount
            sortOrder = 'desc' // asc, desc
        } = req.query;

        const userId = req.actor?._id?.toString();
        const sessionId = req.sessionId;

        const role = req.actor?.type || 'user';

        console.log(`🔍 Debug users endpoint - userId: ${userId}, sessionId: ${sessionId}, role: ${role}, page: ${page}, limit: ${limit}`);

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        // Validate pagination parameters
        const pageNum = Math.max(1, parseInt(page));
        const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 items per page
        const offsetNum = offset ? parseInt(offset) : (pageNum - 1) * limitNum;

        // Validate sort parameters
        const validSortFields = ['score', 'createdAt', 'followersCount', 'fullName'];
        const sortField = validSortFields.includes(sortBy) ? sortBy : 'score';
        const sortDirection = sortOrder === 'asc' ? 1 : -1;

        // Cache key bao gồm pagination params
        const cacheKey = `recs:hybrid:${userId || sessionId}:${limitNum}:${pageNum}:${sortField}:${sortOrder}:${role}`;
        const cached = await redisClient.get(cacheKey);

        if (cached) {
            console.log('✅ Sử dụng cached recommendations với pagination');
            return successResponse(res, 'Lấy gợi ý người dùng thành công', JSON.parse(cached));
        }

        // Giảm timeout xuống 20 giây
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout after 20 seconds')), 20000);
        });

        // Gọi recommendation với error handling
        const recommendationPromise = (async () => {
            try {
                console.log('🚀 Bắt đầu lấy hybrid recommendations cho users...');

                // Lấy nhiều hơn để có thể phân trang
                const totalItemsNeeded = offsetNum + limitNum;
                const fetchLimit = Math.max(totalItemsNeeded, limitNum * 3);

                // Thực hiện recommendation với timeout nhỏ hơn
                const recTimeout = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Recommendation timeout')), 18000);
                });

                const recPromise = getHybridRecommendations(
                    userId,
                    sessionId,
                    fetchLimit,
                    role
                );

                let allRecommendations = await Promise.race([recPromise, recTimeout]);

                console.log(`📊 Tổng số recommendations: ${allRecommendations?.length || 0}`);

                if (!allRecommendations || !Array.isArray(allRecommendations)) {
                    console.warn('⚠️ allRecommendations không phải array hoặc null, fallback');
                    throw new Error('Invalid recommendations format');
                }

                // Filter chỉ lấy users
                let userRecommendations = allRecommendations.filter(r =>
                    r && r.type === 'user' && r._id
                );
                console.log(`📊 Số users sau khi filter: ${userRecommendations.length}`);

                // Fallback nếu không có users - inline function
                if (userRecommendations.length === 0) {
                    console.log('⚠️ Không có users, thử fallback...');
                    try {
                        const fallbackUsers = await User.find({
                            isActive: true,
                            _id: { $ne: userId }
                        })
                            .select('fullName avatar bio createdAt')
                            .sort({ createdAt: -1 })
                            .limit(fetchLimit)
                            .lean();

                        userRecommendations = await Promise.all(
                            fallbackUsers.map(async (user) => {
                                const followersCount = await UserInteraction.countDocuments({
                                    targetType: 'user',
                                    targetId: user._id,
                                    action: 'follow'
                                });
                                return { ...user, type: 'user', followersCount };
                            })
                        );
                    } catch (error) {
                        console.error('❌ Lỗi trong fallback users:', error);
                        userRecommendations = [];
                    }
                }

                // Sorting - inline function
                userRecommendations = userRecommendations.sort((a, b) => {
                    let aValue, bValue;

                    switch (sortField) {
                        case 'followersCount':
                            aValue = a.followersCount || 0;
                            bValue = b.followersCount || 0;
                            break;
                        case 'createdAt':
                            aValue = new Date(a.createdAt || 0);
                            bValue = new Date(b.createdAt || 0);
                            break;
                        case 'fullName':
                            aValue = (a.fullName || '').toLowerCase();
                            bValue = (b.fullName || '').toLowerCase();
                            break;
                        case 'score':
                        default:
                            aValue = a.hybridScore || a.score || 0;
                            bValue = b.hybridScore || b.score || 0;
                            break;
                    }

                    if (aValue < bValue) return -sortDirection;
                    if (aValue > bValue) return sortDirection;
                    return 0;
                });

                // Pagination
                const totalCount = userRecommendations.length;
                const totalPages = Math.ceil(totalCount / limitNum);
                const hasNextPage = pageNum < totalPages;
                const hasPreviousPage = pageNum > 1;

                // Slice data for current page
                const paginatedResults = userRecommendations.slice(offsetNum, offsetNum + limitNum);

                const result = {
                    recommendations: paginatedResults,
                    pagination: {
                        currentPage: pageNum,
                        limit: limitNum,
                        totalCount,
                        totalPages,
                        hasNextPage,
                        hasPreviousPage,
                        offset: offsetNum
                    },
                    sorting: {
                        sortBy: sortField,
                        sortOrder: sortOrder
                    },
                    debug: {
                        totalRecommendations: allRecommendations.length,
                        userCount: userRecommendations.length,
                        types: allRecommendations.reduce((acc, item) => {
                            if (item && item.type) {
                                acc[item.type] = (acc[item.type] || 0) + 1;
                            }
                            return acc;
                        }, {})
                    }
                };

                // Cache result
                await redisClient.setex(cacheKey, 1800, JSON.stringify(result)); // 30 minutes

                return result;

            } catch (recError) {
                console.error('❌ Lỗi trong recommendation process:', recError);
                throw recError;
            }
        })();

        // Race between recommendation và timeout
        const result = await Promise.race([recommendationPromise, timeoutPromise]);

        return successResponse(res, 'Lấy gợi ý người dùng thành công', result);

    } catch (err) {
        console.error('❌ API Error:', err);

        // Fallback cho mọi loại lỗi
        console.log('🔄 Fallback to simple user recommendations...');

        try {
            const { limit = 10, page = 1, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
            const offsetNum = (pageNum - 1) * limitNum;

            // Fallback pagination query
            const sortField = sortBy === 'followersCount' ? 'createdAt' : 'createdAt'; // Simplified for fallback
            const sortDirection = sortOrder === 'asc' ? 1 : -1;

            // Get total count for pagination
            const totalCount = await User.countDocuments({
                isActive: true,
                _id: { $ne: req.query.userId }
            });

            // Get paginated users
            const fallbackUsers = await User.find({
                isActive: true,
                _id: { $ne: req.query.userId }
            })
                .select('fullName avatar bio createdAt')
                .sort({ [sortField]: sortDirection })
                .skip(offsetNum)
                .limit(limitNum)
                .lean();

            // Add followers count - inline processing
            const fallbackUsersWithStats = await Promise.all(
                fallbackUsers.map(async (user) => {
                    try {
                        const followersCount = await UserInteraction.countDocuments({
                            targetType: 'user',
                            targetId: user._id,
                            action: 'follow'
                        });
                        return { ...user, type: 'user', followersCount };
                    } catch (countError) {
                        console.warn(`⚠️ Lỗi khi đếm followers cho user ${user._id}:`, countError);
                        return { ...user, type: 'user', followersCount: 0 };
                    }
                })
            );

            const totalPages = Math.ceil(totalCount / limitNum);
            const result = {
                recommendations: fallbackUsersWithStats,
                pagination: {
                    currentPage: pageNum,
                    limit: limitNum,
                    totalCount,
                    totalPages,
                    hasNextPage: pageNum < totalPages,
                    hasPreviousPage: pageNum > 1,
                    offset: offsetNum
                },
                sorting: {
                    sortBy: sortField,
                    sortOrder: sortOrder
                },
                isFallback: true,
                reason: err.message.includes('timeout') ? 'Timeout' : 'Processing error'
            };

            return successResponse(res, 'Lấy gợi ý người dùng thành công (fallback)', result);

        } catch (fallbackError) {
            console.error('❌ Fallback cũng lỗi:', fallbackError);

            // Final fallback - empty result with pagination structure
            const pageNum = Math.max(1, parseInt(req.query.page || 1));
            const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit || 10)));

            return successResponse(res, 'Không thể lấy gợi ý người dùng', {
                recommendations: [],
                pagination: {
                    currentPage: pageNum,
                    limit: limitNum,
                    totalCount: 0,
                    totalPages: 0,
                    hasNextPage: false,
                    hasPreviousPage: false,
                    offset: 0
                },
                sorting: {
                    sortBy: req.query.sortBy || 'score',
                    sortOrder: req.query.sortOrder || 'desc'
                },
                isFallback: true,
                reason: 'All fallbacks failed',
                error: process.env.NODE_ENV === 'development' ? fallbackError.message : 'System error'
            });
        }
    }
});

// Route lấy gợi ý shops khi đã đăng nhập (dựa vào follow)
router.get('/shops-case-login', requestLogger, verifyToken, setActor, async (req, res) => {
    try {
        // 1. Parse query parameters với validation
        const { 
            limit = 10, 
            page = 1, 
            entityType = 'shop' // 'shop', 'user', 'all'
        } = req.query;
        
        const userId = req.actor?._id.toString();
        const sessionId = req.sessionId;
        const role = req.actor?.type || 'user';

        // Validation parameters
        const validatedLimit = Math.min(Math.max(parseInt(limit), 1), 50); // 1-50
        const validatedPage = Math.max(parseInt(page), 1);
        const validatedEntityType = ['shop', 'user', 'all'].includes(entityType) ? entityType : 'all';

        console.log("userId", userId);
        console.log("sessionId", sessionId);
        console.log("Pagination params:", { limit: validatedLimit, page: validatedPage, entityType: validatedEntityType });

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        // 2. Tính toán offset cho phân trang
        const offset = (validatedPage - 1) * validatedLimit;

        // 3. Lấy recommendations với số lượng lớn hơn để có thể phân trang
        const totalRecommendationsNeeded = validatedPage * validatedLimit;
        const recommendations = await getUserShopRecommendations(
            userId, 
            sessionId, 
            totalRecommendationsNeeded + validatedLimit, // Lấy thêm để check hasNextPage
            validatedEntityType, 
            role
        );

        // 4. Thực hiện phân trang
        const totalItems = recommendations.length;
        const paginatedRecommendations = recommendations.slice(offset, offset + validatedLimit);
        const totalPages = Math.ceil(totalItems / validatedLimit);
        const hasNextPage = validatedPage < totalPages;
        const hasPreviousPage = validatedPage > 1;

        // 5. Tạo response với đầy đủ thông tin phân trang
        const paginationInfo = {
            currentPage: validatedPage,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: validatedLimit,
            hasNextPage: hasNextPage,
            hasPreviousPage: hasPreviousPage,
            // Thông tin bổ sung cho frontend
            startItem: offset + 1,
            endItem: Math.min(offset + validatedLimit, totalItems)
        };

        // 6. Response success
        return successResponse(res, 'Lấy gợi ý shop thành công', {
            recommendations: paginatedRecommendations,
            pagination: paginationInfo,
            // Thêm thông tin filter hiện tại
            filters: {
                entityType: validatedEntityType,
                role: role
            }
        });

    } catch (err) {
        console.error('❌ API Error:', err);
        return errorResponse(
            res,
            'Lỗi server khi lấy gợi ý shop',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

// Route lấy gợi ý users khi đã đăng nhập (dựa vào follow)
router.get('/users-case-login', verifyToken, setActor, async (req, res) => {
    try {
        // 1. Parse query parameters với validation
        const { 
            limit = 10, 
            page = 1, 
            entityType = 'user' // default là 'user' vì đây là endpoint dành cho users
        } = req.query;
        
        const userId = req.actor?._id.toString();
        const sessionId = req.sessionId;
        const role = req.actor?.type || 'user';

        // Validation parameters
        const validatedLimit = Math.min(Math.max(parseInt(limit), 1), 50); // 1-50
        const validatedPage = Math.max(parseInt(page), 1);
        const validatedEntityType = ['user'].includes(entityType) ? entityType : 'user'; // Chỉ cho phép 'user'

        console.log("userId", userId);
        console.log("sessionId", sessionId);
        console.log("Pagination params:", { limit: validatedLimit, page: validatedPage, entityType: validatedEntityType });

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        // 2. Tính toán offset cho phân trang
        const offset = (validatedPage - 1) * validatedLimit;

        // 3. Lấy recommendations với số lượng lớn hơn để có thể phân trang
        const totalRecommendationsNeeded = validatedPage * validatedLimit;
        const recommendations = await getUserShopRecommendations(
            userId, 
            sessionId, 
            totalRecommendationsNeeded + validatedLimit, // Lấy thêm để check hasNextPage
            validatedEntityType, 
            role
        );

        // 4. Thực hiện phân trang
        const totalItems = recommendations.length;
        const paginatedRecommendations = recommendations.slice(offset, offset + validatedLimit);
        const totalPages = Math.ceil(totalItems / validatedLimit);
        const hasNextPage = validatedPage < totalPages;
        const hasPreviousPage = validatedPage > 1;

        // 5. Tạo response với đầy đủ thông tin phân trang
        const paginationInfo = {
            currentPage: validatedPage,
            totalPages: totalPages,
            totalItems: totalItems,
            itemsPerPage: validatedLimit,
            hasNextPage: hasNextPage,
            hasPreviousPage: hasPreviousPage,
            // Thông tin bổ sung cho frontend
            startItem: offset + 1,
            endItem: Math.min(offset + validatedLimit, totalItems)
        };

        // 6. Response success
        return successResponse(res, 'Lấy gợi ý người dùng thành công', {
            recommendations: paginatedRecommendations,
            pagination: paginationInfo,
            // Thêm thông tin filter hiện tại
            filters: {
                entityType: validatedEntityType,
                role: role
            }
        });

    } catch (err) {
        console.error('❌ API Error:', err);
        return errorResponse(
            res,
            'Lỗi server khi lấy gợi ý người dùng',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

// Route để huấn luyện mô hình User-Shop
router.post('/train-user-shop', async (req, res) => {
    try {
        console.log('🎯 Bắt đầu huấn luyện mô hình User/Shop...');
        const model = await trainUserShopModel();

        if (model) {
            return successResponse(res, 'Mô hình User/Shop đã được huấn luyện thành công', {
                modelInfo: {
                    users: model.users.length,
                    entities: model.entities.length,
                    factors: model.numFactors
                }
            });
        } else {
            return errorResponse(res, 'Không thể huấn luyện mô hình do thiếu dữ liệu', 400);
        }
    } catch (err) {
        console.error('❌ Training Error:', err);
        return errorResponse(
            res,
            'Lỗi khi huấn luyện mô hình User/Shop',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

// Route để huấn luyện lại model trainMatrixFactorization
router.post('/train-matrix', async (req, res) => {
    try {
        console.log('🎯 Bắt đầu huấn luyện model...');
        const model = await trainMatrixFactorization();

        if (model) {
            return successResponse(res, 'Model đã được huấn luyện thành công', {
                modelInfo: {
                    users: model.users.length,
                    items: model.entities.length,
                    factors: model.numFactors
                }
            });
        } else {
            return errorResponse(res, 'Không thể huấn luyện model do thiếu dữ liệu', 400);
        }
    } catch (err) {
        console.error('❌ Training Error:', err);
        return errorResponse(
            res,
            'Lỗi khi huấn luyện model',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

// Route để cập nhật TF-IDF matrix
router.post('/update-tfidf', async (req, res) => {
    try {
        console.log('🔄 Cập nhật TF-IDF matrix...');
        await prepareTfIdfMatrix();
        return successResponse(res, 'TF-IDF matrix đã được cập nhật');
    } catch (err) {
        console.error('❌ TF-IDF Update Error:', err);
        return errorResponse(
            res,
            'Lỗi khi cập nhật TF-IDF matrix',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

////////////////// DEBUG

// Route debug để kiểm tra model
router.get('/debug/model', async (req, res) => {
    try {
        const model = await loadMatrixFactorizationModel();

        if (!model) {
            return errorResponse(res, 'Không có model', 404);
        }

        const { users, entities } = model;

        return successResponse(res, 'Lấy thông tin model thành công', {
            totalUsers: users.length,
            totalEntities: entities.length,
            users: users.slice(0, 10), // Chỉ hiển thị 10 users đầu
            entities: entities.slice(0, 10), // Chỉ hiển thị 10 entities đầu
            entityTypes: {
                product: entities.filter(e => e.startsWith('product:')).length,
                post: entities.filter(e => e.startsWith('post:')).length,
                user: entities.filter(e => e.startsWith('user:')).length,
                shop: entities.filter(e => e.startsWith('shop:')).length,
                search: entities.filter(e => e.startsWith('search:')).length
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin model', 500, error.message);
    }
});

// Route debug để kiểm tra interactions của user
router.get('/debug/interactions', async (req, res) => {
    try {
        const { userId, sessionId } = req.query;
        const UserInteraction = require('../models/UserInteraction');

        const interactions = await UserInteraction.find({
            $or: [
                { 'author._id': userId },
                { sessionId: sessionId }
            ]
        }).sort({ timestamp: -1 }).limit(20);

        return successResponse(res, 'Lấy thông tin interactions thành công', {
            totalInteractions: interactions.length,
            interactions: interactions.map(i => ({
                action: i.action,
                targetType: i.targetType,
                targetId: i.targetId,
                weight: i.weight,
                timestamp: i.timestamp,
                searchSignature: i.searchSignature
            }))
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin interactions', 500, error.message);
    }
});

// Route debug collaborative recommendations
router.get('/debug/collaborative', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        const recommendations = await debugGetCollaborativeRecommendations(userId, sessionId, parseInt(limit), role);

        return successResponse(res, 'Debug collaborative recommendations thành công', {
            recommendations,
            count: recommendations.length,
            debug: {
                types: recommendations.reduce((acc, item) => {
                    acc[item.type] = (acc[item.type] || 0) + 1;
                    return acc;
                }, {})
            }
        });
    } catch (err) {
        console.error('❌ API Error:', err);
        return errorResponse(
            res,
            'Lỗi server khi debug collaborative recommendations',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

// Route debug hybrid recommendations
router.get('/debug/hybrid', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        const recommendations = await debugGetHybridRecommendations(userId, sessionId, parseInt(limit), role);

        return successResponse(res, 'Debug hybrid recommendations thành công', {
            recommendations,
            count: recommendations.length,
            debug: {
                types: recommendations.reduce((acc, item) => {
                    acc[item.type] = (acc[item.type] || 0) + 1;
                    return acc;
                }, {})
            }
        });
    } catch (err) {
        console.error('❌ API Error:', err);
        return errorResponse(
            res,
            'Lỗi server khi debug hybrid recommendations',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

// Route debug để test product filtering
router.get('/debug/products', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';

        console.log(`🔍 DEBUG products endpoint - userId: ${userId}, sessionId: ${sessionId}, role: ${role}`);

        if (!userId && !sessionId) {
            return errorResponse(res, 'Cần userId hoặc sessionId', 400);
        }

        // Sử dụng debug hybrid function
        const allRecommendations = await debugGetHybridRecommendations(userId, sessionId, parseInt(limit) * 3, role);
        console.log(`📊 Tổng số recommendations: ${allRecommendations.length}`);

        // Filter chỉ lấy products
        const productRecommendations = allRecommendations.filter(r => {
            console.log(`🔍 Checking item type: ${r.type}, id: ${r._id}`);
            return r.type === 'product';
        });
        console.log(`📊 Số products sau khi filter: ${productRecommendations.length}`);

        // Lấy limit items
        const finalResults = productRecommendations.slice(0, parseInt(limit));

        return successResponse(res, 'Debug products thành công', {
            recommendations: finalResults,
            count: finalResults.length,
            debug: {
                totalRecommendations: allRecommendations.length,
                productCount: productRecommendations.length,
                types: allRecommendations.reduce((acc, item) => {
                    acc[item.type] = (acc[item.type] || 0) + 1;
                    return acc;
                }, {}),
                allItems: allRecommendations.map(item => ({
                    id: item._id,
                    type: item.type,
                    name: item.name || item.content || item.username || item.shopName || 'Unknown'
                }))
            }
        });
    } catch (err) {
        console.error('❌ API Error:', err);
        return errorResponse(
            res,
            'Lỗi server khi debug products',
            500,
            process.env.NODE_ENV === 'development' ? err.message : undefined
        );
    }
});

module.exports = router;