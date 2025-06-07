const UserInteraction = require('../models/UserInteraction');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Post = require('../models/Post');
const Hashtag = require('../models/Hashtags');
const Category = require('../models/Category');
const geoip = require('geoip-lite');
const Comment = require('../models/Comment');
const Cart = require('../models/Cart');

// Kiểm tra Redis client - nếu không có thì bỏ qua cache
let client;
try {
    client = require('../config/redisClient');
} catch (err) {
    console.warn('Redis client not available, caching disabled');
    client = null;
}

// Middleware để đảm bảo có sessionId
const ensureSessionId = (req, res, next) => {
    if (!req.sessionId) {
        req.sessionId = req.headers['x-session-id'] ||
            req.cookies?.sessionId ||
            require('crypto').randomBytes(16).toString('hex');

        if (!req.cookies?.sessionId) {
            res.cookie('sessionId', req.sessionId, {
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production'
            });
        }
    }
    next();
};

// Middleware để track search behavior - FIXED VERSION
const trackSearch = async (req, res, next) => {
    try {
        const { q, hashtag, categoryId } = req.query;

        let searchQuery = q || hashtag || categoryId;

        // Nếu không có query search thì skip
        if (!searchQuery || searchQuery.toString().trim().length < 1) {
            console.log('❌ No search query or query too short, skipping tracking');
            console.log('❌ Query params:', { q, hashtag, categoryId });
            return next();
        }

        searchQuery = searchQuery.toString().trim();
        console.log(`🔍 Setting up search tracking for query: "${searchQuery}"`);
        console.log(`🔍 Query type: ${q ? 'text' : hashtag ? 'hashtag' : 'category'}`);

        // Lưu original res.json để intercept response
        const originalJson = res.json;

        res.json = function (data) {
            console.log(`📊 Intercepting response for search: "${searchQuery}"`);

            // Gọi trackSearchBehavior sau khi có kết quả (non-blocking)
            setImmediate(async () => {
                try {
                    await trackSearchBehavior(req, data);
                } catch (err) {
                    console.error('❌ Error in post-response search tracking:', err);
                }
            });

            // Gọi original response
            return originalJson.call(this, data);
        };

        next();
    } catch (err) {
        console.error('❌ Error in trackSearch middleware:', err);
        next();
    }
};

// Hàm helper để track search behavior - IMPROVED VERSION
const trackSearchBehavior = async (req, responseData) => {
    try {
        const { q, hashtag, categoryId } = req.query;

        // ✅ XÁC ĐỊNH LOẠI TÌM KIẾM VÀ GIÁ TRỊ
        let searchQuery, queryType, searchType;

        if (q) {
            searchQuery = q.trim();
            queryType = 'text';
            // Xác định search type từ path
            const path = req.path;
            if (path.includes('/products')) searchType = 'product';
            else if (path.includes('/shops')) searchType = 'shop';
            else if (path.includes('/users')) searchType = 'user';
            else if (path.includes('/posts')) searchType = 'post';
            else searchType = 'search';
        } else if (hashtag) {
            searchQuery = hashtag.trim().replace(/^#/, '');
            queryType = 'hashtag';
            searchType = 'hashtag';
        } else if (categoryId) {
            searchQuery = categoryId;
            queryType = 'category';
            searchType = 'category';
        } else {
            console.log('❌ Invalid search query in trackSearchBehavior');
            return;
        }

        console.log(`🔍 Processing search tracking:`, {
            searchQuery,
            queryType,
            searchType,
            path: req.path
        });

        console.log('📊 Response data structure:', {
            success: responseData?.success,
            hasData: !!responseData?.data,
            dataType: typeof responseData?.data
        });

        const sessionId = req.sessionId || require('crypto').randomBytes(16).toString('hex');
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // ✅ TÍNH TOÁN KỀT QUẢ TÌM KIẾM
        let resultsCount = 0;
        let hasResults = false;

        if (responseData?.success && responseData?.data) {
            // ✅ XỬ LÝ RIÊNG CHO TỪNG LOẠI RESPONSE
            if (queryType === 'hashtag' || queryType === 'category') {
                // Đối với hashtag và category search
                const data = responseData.data;
                resultsCount = (data.products?.length || 0) +
                    (data.shops?.length || 0) +
                    (data.posts?.length || 0);
                hasResults = resultsCount > 0;

                // Hoặc lấy từ pagination nếu có
                if (data.pagination?.totalItems) {
                    resultsCount = data.pagination.totalItems;
                    hasResults = resultsCount > 0;
                }
            } else if (req.path.includes('/all')) {
                // Tìm kiếm tổng hợp
                resultsCount = responseData.data.totalResults || 0;
                hasResults = resultsCount > 0;
            } else if (responseData.data.pagination) {
                // Tìm kiếm có pagination
                resultsCount = responseData.data.pagination.totalItems || 0;
                hasResults = resultsCount > 0;
            } else if (Array.isArray(responseData.data)) {
                // Response là array trực tiếp
                resultsCount = responseData.data.length;
                hasResults = resultsCount > 0;
            } else {
                // Fallback: đếm từ các key
                const dataKeys = ['products', 'shops', 'users', 'posts'];
                resultsCount = dataKeys.reduce((total, key) => {
                    if (responseData.data[key] && Array.isArray(responseData.data[key])) {
                        return total + responseData.data[key].length;
                    }
                    return total;
                }, 0);
                hasResults = resultsCount > 0;
            }
        }

        console.log(`📈 Results count: ${resultsCount}, Has results: ${hasResults}`);

        // ✅ XỬ LÝ HASHTAG
        let hashtags = [];
        if (queryType === 'hashtag') {
            hashtags.push(searchQuery.toLowerCase());
        } else if (q && q.startsWith('#')) {
            hashtags.push(q.toLowerCase().replace(/^#/, ''));
        } else if (q) {
            const foundHashtag = await Hashtag.findOne({ name: q.toLowerCase() });
            if (foundHashtag) hashtags.push(foundHashtag.name);
        }

        // ✅ XỬ LÝ CATEGORY
        let categoryName = null;
        if (queryType === 'category') {
            const category = await Category.findById(searchQuery).select('name');
            if (category) {
                categoryName = category.name;
                searchQuery = category.name; // Thay thế ID bằng tên để dễ hiểu
            }
        } else if (req.query.category) {
            const category = await Category.findById(req.query.category).select('name');
            if (category) categoryName = category.name;
        }

        // ✅ TẠO INTERACTION OBJECT
        const interaction = {
            targetType: 'search',
            action: 'search',
            sessionId,
            deviceInfo: {
                userAgent,
                ip,
                platform: req.headers['sec-ch-ua-platform'] || 'unknown',
                browser: req.headers['user-agent']?.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
            },
            location: geoip.lookup(ip) || {},
            targetDetails: {
                searchQuery,
                resultsCount,
                hasResults,
                category: categoryName,
                hashtags
            },
            metadata: {
                queryType, // 'text', 'hashtag', 'category'
                searchType, // 'product', 'shop', 'hashtag', 'category', etc.
                filters: extractFilters(req.query),
                referrer: req.headers.referer || 'direct',
                responseTime: req.startTime ? Date.now() - req.startTime : null,
                path: req.path,
                method: req.method
            }
        };

        // ✅ THÊM THÔNG TIN USER NẾU CÓ
        if (req.actor) {
            interaction.author = {
                type: req.actor.type === 'shop' ? 'Shop' : 'User',
                _id: req.actor._id
            };
            console.log(`👤 User logged in: ${req.actor.type} - ${req.actor._id}`);
        } else {
            console.log('👤 Anonymous user');
        }

        console.log('💾 Saving interaction to database...');
        console.log('💾 Interaction data:', JSON.stringify(interaction, null, 2));

        await UserInteraction.create(interaction);
        console.log(`✅ Successfully tracked ${queryType} search: "${searchQuery}" - ${resultsCount} results`);

    } catch (err) {
        console.error('❌ Error tracking search behavior:', err);
        console.error('❌ Error details:', {
            message: err.message,
            stack: err.stack,
            query: req.query,
            path: req.path
        });
    }
};

// Helper function để extract filters từ query
const extractFilters = (query) => {
    const filters = {};
    const filterKeys = [
        'category', 'minPrice', 'maxPrice', 'brand', 'condition',
        'minRating', 'role', 'authorType', 'privacy', 'sortBy', 'page', 'limit'
    ];

    filterKeys.forEach(key => {
        if (query[key] && query[key] !== '') {
            filters[key] = query[key];
        }
    });

    return filters;
};

// Middleware để track request timing (optional)
const trackTiming = (req, res, next) => {
    req.startTime = Date.now();
    next();
};

// Middleware để track interaction cho các hành vi như like, comment, share
const trackInteraction = async (req, res, next) => {
    try {
        const { targetType, targetId, action, metadata } = req.body || {};
        const actor = req.actor;
        const sessionId = req.sessionId || require('crypto').randomBytes(16).toString('hex');
        const ip = req.ip || req.connection?.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';

        // Kiểm tra điều kiện cần thiết
        if (!targetType || !targetId || !action) {
            console.log('❌ Missing required fields for interaction tracking:', { targetType, targetId, action });
            return next();
        }

        // Xác định targetDetails dựa trên targetType
        let targetDetails = {};
        if (targetType === 'post') {
            const post = await Post.findById(targetId)
                .select('content mainCategory hashtags author isSponsored likesCount commentsCount privacy')
                .populate('mainCategory', 'name')
                .lean();
            if (post) {
                targetDetails = extractMetadata('post', post);
            }
        } else if (targetType === 'comment') {
            const comment = await Comment.findById(targetId)
                .select('text author')
                .populate('author._id', 'fullName name')
                .lean();
            if (comment) {
                targetDetails = {
                    content: comment.text.substring(0, 50),
                    authorType: comment.author?.type || 'unknown',
                    authorName: comment.author?._id?.fullName || comment.author?._id?.name || 'Unknown'
                };
            }
        } else if (targetType === 'product') {
            const product = await Product.findById(targetId)
                .select('name mainCategory hashtags price discount stock isActive variants brand ratings soldCount')
                .populate({
                    path: 'mainCategory',
                    select: 'name'
                })
                .lean();
            if (product) {
                targetDetails = extractMetadata('product', product);
            }
        } else if (targetType === 'shop') {
            const shop = await Shop.findById(targetId)
                .select('name productInfo.mainCategory productInfo.subCategories hashtags stats.rating.avg contact.phone')
                .populate([
                    {
                        path: 'productInfo.mainCategory',
                        select: 'name'
                    }, {
                        path: 'productInfo.subCategories',
                        select: 'name'
                    }
                ]);
            if (shop) {
                targetDetails = extractMetadata('shop', shop)
            }
        }

        // Tạo interaction object
        const interaction = {
            targetType,
            targetId,
            action,
            sessionId,
            deviceInfo: {
                userAgent,
                ip,
                platform: req.headers['sec-ch-ua-platform'] || 'unknown',
                browser: req.headers['user-agent']?.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
            },
            location: geoip.lookup(ip) || {},
            targetDetails,
            metadata: metadata || {}
        };

        if (actor) {
            interaction.author = {
                type: actor.type === 'shop' ? 'Shop' : 'User',
                _id: actor._id
            };
            console.log(`👤 User logged in: ${actor.type} - ${actor._id}`);
        } else {
            console.log('👤 Anonymous user');
        }

        console.log('💾 Saving interaction to database...');
        console.log('💾 Interaction data:', JSON.stringify(interaction, null, 2));
        await UserInteraction.create(interaction);
        console.log(`✅ Successfully tracked ${action} for ${targetType} with ID ${targetId}`);

        next();
    } catch (err) {
        console.error('❌ Error tracking interaction:', err);
        console.error('❌ Error details:', {
            message: err.message,
            stack: err.stack,
            body: req.body,
            params: req.params
        });
        next();
    }
};

const trackView = (targetType) => async (req, res, next) => {
    try {
        req._trackedViews = req._trackedViews || new Map();

        let targetId;
        let targetDetails = {};
        const sessionId = req.sessionId || require('crypto').randomBytes(16).toString('hex');
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        console.log(`Processing trackView for ${targetType} with params:`, req.params);

        if (req[targetType]) {
            console.log(`Using pre-fetched ${targetType} from req`);
            targetId = req[targetType]._id;
            targetDetails = extractMetadata(targetType, req[targetType]);
        } else if (req.params.slug && ['product', 'shop', 'user'].includes(targetType)) {
            console.log(`Processing ${targetType} with slug: ${req.params.slug}`);
            const cacheKey = `${targetType}:slug:${req.params.slug}`;
            let entity;
            let cached = await client?.get(cacheKey);
            if (cached) {
                try {
                    entity = JSON.parse(cached);
                    console.log(`Cache hit for ${cacheKey}:`, entity);
                } catch (err) {
                    console.error(`Error parsing cache for ${cacheKey}:`, err);
                }
            } else {
                if (targetType === 'product') {
                    entity = await Product.findOne({ slug: req.params.slug })
                        .select('name mainCategory hashtags price discount stock isActive variants brand ratings soldCount')
                        .populate({
                            path: 'mainCategory',
                            select: 'name'
                        });
                } else if (targetType === 'shop') {
                    entity = await Shop.findOne({ slug: req.params.slug })
                        .select('name productInfo.mainCategory productInfo.subCategories hashtags stats.rating.avg contact.phone')
                        .populate([
                            {
                                path: 'productInfo.mainCategory',
                                select: 'name'
                            }, {
                                path: 'productInfo.subCategories',
                                select: 'name'
                            }
                        ]);
                } else if (targetType === 'user') {
                    entity = await User.findOne({ slug: req.params.slug })
                        .select('fullName roles followers following');
                }
                if (entity) {
                    await client?.setEx(cacheKey, 3600, JSON.stringify(entity));
                    console.log(`Cache set for ${cacheKey}:`, entity);
                }
            }
            if (entity) {
                targetId = entity._id;
                req[targetType] = entity;
                targetDetails = extractMetadata(targetType, entity);
            }
        } else if (req.params.id && targetType === 'post') {
            console.log(`Processing post with id: ${req.params.id}`);
            const cacheKey = `${targetType}:id:${req.params.id}`;
            let entity;
            let cached = await client?.get(cacheKey);
            if (cached) {
                try {
                    entity = JSON.parse(cached);
                    console.log(`Cache hit for ${cacheKey}:`, entity);
                } catch (err) {
                    console.error(`Error parsing cache for ${cacheKey}:`, err);
                }
            } else {
                entity = await Post.findById(req.params.id)
                    .select('content hashtags categories mainCategory author isSponsored likesCount commentsCount privacy')
                    .populate({
                        path: 'mainCategory',
                        select: 'name'
                    });
                if (entity) {
                    await client?.setEx(cacheKey, 3600, JSON.stringify(entity));
                    console.log(`Cache set for ${cacheKey}:`, entity);
                }
            }
            if (entity) {
                targetId = entity._id;
                req[targetType] = entity;
                targetDetails = extractMetadata(targetType, entity);
            }
        }

        if (targetId) {
            const viewKey = `${targetType}:${targetId}`;
            if (req._trackedViews.has(viewKey)) {
                console.log(`Skipping duplicate view for ${targetType} with ID ${targetId}`);
                return next();
            }
            req._trackedViews.set(viewKey, true);

            const interaction = {
                targetType,
                targetId,
                action: 'view',
                sessionId,
                deviceInfo: {
                    userAgent,
                    ip,
                    platform: req.headers['sec-ch-ua-platform'] || 'unknown',
                    browser: req.headers['user-agent'].match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
                },
                location: geoip.lookup(ip) || {},
                targetDetails,
                metadata: { via: targetDetails.via || 'unknown' } // Chỉ giữ via trong metadata
            };

            if (req.actor) {
                interaction.author = {
                    type: req.actor.type === 'shop' ? 'Shop' : 'User',
                    _id: req.actor._id
                };
            }

            console.log(`Recording view for ${targetType} with ID ${targetId}, targetDetails:`, targetDetails);
            await UserInteraction.create(interaction);
        } else {
            console.log(`No targetId found for ${targetType}`);
        }
        return next();
    } catch (err) {
        console.error('Error tracking view:', err);
        next();
    }
};

// Hàm trích xuất metadata từ entity
const extractMetadata = (targetType, entity) => {
    const metadata = { via: entity.slug ? 'slug' : entity._id ? 'id' : 'unknown' };
    if (targetType === 'product') {
        return {
            name: entity.name,
            category: entity.mainCategory?.name || null,
            hashtags: entity.hashtags?.map(h => h.toLowerCase()) || [],
            price: entity.price || 0,
            rating: entity?.ratings?.avg || 0,
            stock: entity.stock || 0,
            isActive: entity.isActive || false,
            soldCount: entity.soldCount || 0,
            variants: entity.variants ? entity.variants.map(v => ({ name: v.name, options: v.options })) : [],
            via: metadata.via
        };
    } else if (targetType === 'shop') {
        return {
            name: entity.name,
            category: entity.productInfo?.mainCategory?.name || null,
            subCategories: entity.productInfo?.subCategories?.map(s => s.name) || [],
            hashtags: entity.hashtags?.map(h => h.toLowerCase()) || [],
            rating: entity.stats?.rating?.avg || 0,
            phone: entity.contact?.phone,
            via: metadata.via
        };
    } else if (targetType === 'user') {
        return {
            name: entity.fullName,
            roles: entity.roles || [],
            followersCount: entity.followers?.length || 0,
            followingCount: entity.following?.length || 0,
            via: metadata.via
        };
    } else if (targetType === 'post') {
        return {
            content: entity.content.substring(0, 50), // Cắt ngắn để tiết kiệm không gian
            hashtags: entity.hashtags?.map(h => h.toLowerCase()) || [],
            category: entity.mainCategory?.name || null,
            authorType: entity.author?.type || 'unknown',
            isSponsored: entity.isSponsored || false,
            likesCount: entity.likesCount || 0,
            commentsCount: entity.commentsCount || 0,
            privacy: entity.privacy || 'public',
            via: metadata.via
        };
    }
    return metadata;
};

module.exports = {
    trackInteraction,
    trackView,
    trackSearch,
    ensureSessionId,
    trackTiming,
};