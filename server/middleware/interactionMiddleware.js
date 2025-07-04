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
const FlashSale = require('../models/FlashSale');

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
            searchSignature: {
                query: searchQuery,
                category: categoryName,
                hashtags: hashtags // ✅ Đảm bảo hashtags được điền đầy đủ
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

        // await UserInteraction.create(interaction);
        await UserInteraction.recordInteraction(interaction);
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
                targetDetails = await extractMetadata('post', post);
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
                targetDetails = await extractMetadata('product', product);
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
                targetDetails = await extractMetadata('shop', shop)
            }
        } else if (targetType === 'flashsale') {
            const flashSale = await FlashSale.findById(targetId)
                .select('name products startTime endTime')
                .populate({
                    path: 'products.product',
                    select: 'name mainCategory hashtags',
                    populate: { path: 'mainCategory', select: 'name' }
                })
                .lean();
            if (flashSale) {
                targetDetails = {
                    name: flashSale.name,
                    productCount: flashSale.products?.length || 0,
                    products: flashSale.products?.map(p => ({
                        name: p.product?.name,
                        category: p.product?.mainCategory?.name,
                        hashtags: p.product?.hashtags || []
                    })) || [],
                    startTime: flashSale.startTime,
                    endTime: flashSale.endTime
                };
                // Nếu action là purchase, sử dụng targetDetails từ req.body (nếu có)
                if (action === 'purchase' && req.body.targetDetails) {
                    targetDetails = req.body.targetDetails;
                }
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
        // await UserInteraction.create(interaction);
        await UserInteraction.recordInteraction(interaction);
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
        console.log(`🔍 trackView middleware called for ${targetType}`);
        console.log(`📋 Request params:`, req.params);
        console.log(`📋 Request path:`, req.path);

        req._trackedViews = req._trackedViews || new Map();

        let targetId;
        let targetDetails = {};
        const sessionId = req.sessionId || require('crypto').randomBytes(16).toString('hex');
        const ip = req.ip;
        const userAgent = req.headers['user-agent'] || 'unknown';

        console.log(`Processing trackView for ${targetType} with params:`, req.params);

        if (req[targetType]) {
            console.log(`✅ Using pre-fetched ${targetType} from req`);
            targetId = req[targetType]._id;
            targetDetails = await extractMetadata(targetType, req[targetType]);
        } else if (req.params.slug && ['product', 'shop', 'user'].includes(targetType)) {
            console.log(`🔍 Processing ${targetType} with slug: ${req.params.slug}`);
            const cacheKey = `${targetType}:slug:${req.params.slug}`;
            let entity;
            let cached = await client?.get(cacheKey);
            if (cached) {
                try {
                    entity = JSON.parse(cached);
                    console.log(`✅ Cache hit for ${cacheKey}`);
                } catch (err) {
                    console.error(`❌ Error parsing cache for ${cacheKey}:`, err);
                }
            } else {
                console.log(`🔍 Fetching ${targetType} from database...`);
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
                    await client?.setex(cacheKey, 3600, JSON.stringify(entity));
                    console.log(`✅ Cache set for ${cacheKey}`);
                }
            }
            if (entity) {
                targetId = entity._id;
                req[targetType] = entity;
                targetDetails = await extractMetadata(targetType, entity);
                console.log(`✅ Found ${targetType} with ID: ${targetId}`);
            } else {
                console.log(`❌ No ${targetType} found with slug: ${req.params.slug}`);
            }
        } else if (req.params.id && targetType === 'post') {
            console.log(`🔍 Processing post with id: ${req.params.id}`);

            // Validate ObjectId format
            if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                console.log(`❌ Invalid ObjectId format: ${req.params.id}`);
                return next();
            }

            const cacheKey = `${targetType}:id:${req.params.id}`;
            let entity;
            let cached = await client?.get(cacheKey);
            if (cached) {
                try {
                    entity = JSON.parse(cached);
                    console.log(`✅ Cache hit for ${cacheKey}`);
                } catch (err) {
                    console.error(`❌ Error parsing cache for ${cacheKey}:`, err);
                }
            } else {
                console.log(`🔍 Fetching post from database with ID: ${req.params.id}`);
                entity = await Post.findById(req.params.id)
                    .select('content hashtags categories mainCategory author isSponsored likesCount commentsCount privacy')
                    .populate({
                        path: 'mainCategory',
                        select: 'name'
                    });

                if (entity) {
                    await client?.setex(cacheKey, 3600, JSON.stringify(entity));
                    console.log(`✅ Cache set for ${cacheKey}, found post: ${entity._id}`);
                } else {
                    console.log(`❌ No post found with ID: ${req.params.id}`);
                }
            }
            if (entity) {
                targetId = entity._id;
                req[targetType] = entity;
                targetDetails = await extractMetadata(targetType, entity);
                console.log(`✅ Found post with ID: ${targetId}`);
            }
        } else if ((req.params.slug || req.params.id) && targetType === 'flashsale') {
            console.log(`🔍 Processing flashsale with slug: ${req.params.slug} or id: ${req.params.id}`);

            // Ưu tiên slug trước, sau đó mới đến id
            const identifier = req.params.slug || req.params.id;
            const isId = !req.params.slug && req.params.id;

            // Validate ObjectId format nếu dùng id
            if (isId && !identifier.match(/^[0-9a-fA-F]{24}$/)) {
                console.log(`❌ Invalid ObjectId format: ${identifier}`);
                return next();
            }

            const cacheKey = `${targetType}:${isId ? 'id' : 'slug'}:${identifier}`;
            let entity;
            let cached = await client?.get(cacheKey);

            if (cached) {
                try {
                    entity = JSON.parse(cached);
                    console.log(`✅ Cache hit for ${cacheKey}`);
                } catch (err) {
                    console.error(`❌ Error parsing cache for ${cacheKey}:`, err);
                }
            } else {
                console.log(`🔍 Fetching flashsale from database...`);
                const query = isId
                    ? FlashSale.findById(identifier)
                    : FlashSale.findOne({ slug: identifier });

                entity = await query
                    .select('name description products startTime endTime banner isFeatured stats isActive')
                    .populate({
                        path: 'products.product',
                        select: 'name mainCategory price hashtags',
                        populate: { path: 'mainCategory', select: 'name' }
                    });

                if (entity) {
                    await client?.setex(cacheKey, 3600, JSON.stringify(entity));
                    console.log(`✅ Cache set for ${cacheKey}`);
                }
            }

            if (entity) {
                targetId = entity._id;
                req[targetType] = entity;
                targetDetails = await extractMetadata(targetType, entity);
                console.log(`✅ Found flashsale with ID: ${targetId}`);
            } else {
                console.log(`❌ No flashsale found with ${isId ? 'id' : 'slug'}: ${identifier}`);
            }
        }

        if (targetId) {
            const viewKey = `${targetType}:${targetId}`;
            if (req._trackedViews.has(viewKey)) {
                console.log(`⏭️ Skipping duplicate view for ${targetType} with ID ${targetId}`);
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
                    // Fix potential error when user-agent is undefined
                    browser: (userAgent !== 'unknown' && userAgent) ?
                        (userAgent.match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown') : 'unknown'
                },
                location: geoip.lookup(ip) || {},
                targetDetails,
                metadata: { via: targetDetails.via || 'unknown' }
            };

            if (req.actor) {
                interaction.author = {
                    type: req.actor.type === 'shop' ? 'Shop' : 'User',
                    _id: req.actor._id
                };
                console.log(`👤 Logged in ${req.actor.type}: ${req.actor._id}`);
            } else {
                console.log(`👤 Anonymous user`);
            }

            console.log(`💾 Recording view for ${targetType} with ID ${targetId}`);
            console.log(`💾 Target details:`, targetDetails);

            // await UserInteraction.create(interaction);
            await UserInteraction.recordInteraction(interaction);
            console.log(`✅ Successfully tracked view for ${targetType} ID: ${targetId}`);
        } else {
            console.log(`❌ No targetId found for ${targetType} - skipping tracking`);
        }

        return next();
    } catch (err) {
        console.error(`❌ Error in trackView middleware for ${targetType}:`, err);
        console.error(`❌ Error stack:`, err.stack);
        console.error(`❌ Request params:`, req.params);
        console.error(`❌ Request path:`, req.path);
        // Continue to next middleware even if tracking fails
        next();
    }
};

// Hàm trích xuất metadata từ entity
const extractMetadata = async (targetType, entity) => {
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
    } else if (targetType === 'user' || targetType === 'shop') { // Nếu là user hoặc shop — xử lý follower count
        const isUser = targetType === 'user';
        const targetId = entity._id;

        const [followersCount, followingCount] = await Promise.all([
            UserInteraction.countDocuments({
                action: 'follow',
                targetType,
                targetId
            }),
            UserInteraction.countDocuments({
                action: 'follow',
                'author.type': isUser ? 'User' : 'Shop',
                'author._id': targetId
            })
        ]);

        // Gộp các thuộc tính tuỳ theo loại entity
        if (isUser) {
            return {
                name: entity.fullName,
                roles: entity.roles || [],
                followersCount,
                followingCount,
                via: metadata.via
            };
        } else {
            return {
                name: entity.name,
                category: entity.productInfo?.mainCategory?.name || null,
                subCategories: entity.productInfo?.subCategories?.map(s => s.name) || [],
                hashtags: entity.hashtags?.map(h => h.toLowerCase()) || [],
                rating: entity.stats?.rating?.avg || 0,
                phone: entity.contact?.phone || null,
                followersCount,
                followingCount,
                via: metadata.via
            };
        }
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
    } else if (targetType === 'flashsale') {
        const now = new Date();
        const isActive = entity.isActive && now >= new Date(entity.startTime) && now <= new Date(entity.endTime);

        return {
            name: entity.name,
            description: entity.description ? entity.description.substring(0, 100) : null,
            totalProducts: entity.products?.length || 0,
            products: entity.products?.map(p => ({
                name: p.product?.name,
                category: p.product?.mainCategory?.name,
                hashtags: p.product?.hashtags?.map(h => h.toLowerCase()) || []
            })) || [],
            isActive: isActive,
            isFeatured: entity.isFeatured || false,
            startTime: entity.startTime,
            endTime: entity.endTime,
            totalViews: entity.stats?.totalViews || 0,
            totalPurchases: entity.stats?.totalPurchases || 0,
            totalRevenue: entity.stats?.totalRevenue || 0,
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