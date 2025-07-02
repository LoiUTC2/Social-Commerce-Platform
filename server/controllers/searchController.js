const Product = require('../models/Product');
const Post = require('../models/Post');
const Shop = require('../models/Shop');
const User = require('../models/User');
const UserInteraction = require('../models/UserInteraction');
const Hashtag = require('../models/Hashtags');
const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');

// Thêm gợi ý sản phẩm/bài viết liên quan vào kết quả tìm kiếm
const { getHybridRecommendations } = require('../services/recommendationService'); 

// Tìm kiếm sản phẩm - ĐÃ LOẠI BỎ trackSearchBehavior
exports.searchProducts = async (req, res) => {
    try {
        const {
            q,
            category,
            minPrice,
            maxPrice,
            brand,
            condition,
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        if (!q || q.trim().length < 2) {
            return errorResponse(res, "Từ khóa tìm kiếm phải có ít nhất 2 ký tự", 400);
        }

        const keyword = q.trim();
        const skip = (page - 1) * limit;

        // Xây dựng query
        let query = {
            isActive: true,
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { hashtags: { $in: [new RegExp(keyword, 'i')] } },
                { brand: { $regex: keyword, $options: 'i' } }
            ]
        };

        // Thêm filters
        if (category) query.mainCategory = category;
        if (minPrice) query.price = { ...query.price, $gte: parseFloat(minPrice) };
        if (maxPrice) query.price = { ...query.price, $lte: parseFloat(maxPrice) };
        if (brand) query.brand = { $regex: brand, $options: 'i' };
        if (condition) query.condition = condition;

        // Xây dựng sort
        let sort = {};
        switch (sortBy) {
            case 'price_asc':
                sort.price = 1;
                break;
            case 'price_desc':
                sort.price = -1;
                break;
            case 'newest':
                sort.createdAt = -1;
                break;
            case 'popular':
                sort.soldCount = -1;
                break;
            case 'rating':
                sort['ratings.avg'] = -1;
                break;
            default:
                sort.createdAt = -1;
        }

        const [products, total] = await Promise.all([
            Product.find(query)
                .populate('seller', 'name slug avatar stats.rating')
                .populate('mainCategory', 'name slug')
                .populate('categories', 'name slug')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Product.countDocuments(query)
        ]);

        const result = {
            products,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            filters: { category, minPrice, maxPrice, brand, condition },
            sortBy
        };

        const relatedRecommendations = await getHybridRecommendations(req.user?.userId, req.sessionId, 5);
        result.relatedRecommendations = relatedRecommendations;

        return successResponse(res, "Tìm kiếm sản phẩm thành công", result);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm sản phẩm", 500, err.message);
    }
};

// Tìm kiếm shop - ĐÃ LOẠI BỎ trackSearchBehavior
exports.searchShops = async (req, res) => {
    try {
        const {
            q,
            category,
            minRating,
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        if (!q || q.trim().length < 2) {
            return errorResponse(res, "Từ khóa tìm kiếm phải có ít nhất 2 ký tự", 400);
        }

        const keyword = q.trim();
        const skip = (page - 1) * limit;

        let query = {
            'status.isActive': true,
            'status.isApprovedCreate': true,
            $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } },
                { hashtags: { $in: [new RegExp(keyword, 'i')] } }
            ]
        };

        if (category) query['productInfo.mainCategory'] = category;
        if (minRating) query['stats.rating.avg'] = { $gte: parseFloat(minRating) };

        let sort = {};
        switch (sortBy) {
            case 'rating':
                sort['stats.rating.avg'] = -1;
                break;
            case 'followers':
                sort['stats.followers'] = -1;
                break;
            case 'newest':
                sort.createdAt = -1;
                break;
            default:
                sort['stats.rating.avg'] = -1;
        }

        const [shops, total] = await Promise.all([
            Shop.find(query)
                .populate('owner', 'fullName avatar')
                .populate('productInfo.mainCategory', 'name slug')
                .populate('productInfo.subCategories', 'name slug')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Shop.countDocuments(query)
        ]);

        const result = {
            shops,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            filters: { category, minRating },
            sortBy
        };

        return successResponse(res, "Tìm kiếm shop thành công", result);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm shop", 500, err.message);
    }
};

// Tìm kiếm người dùng - ĐÃ LOẠI BỎ trackSearchBehavior
exports.searchUsers = async (req, res) => {
    try {
        const {
            q,
            role,
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        if (!q || q.trim().length < 2) {
            return errorResponse(res, "Từ khóa tìm kiếm phải có ít nhất 2 ký tự", 400);
        }

        const keyword = q.trim();
        const skip = (page - 1) * limit;

        let query = {
            isActive: true,
            $or: [
                { fullName: { $regex: keyword, $options: 'i' } },
                { bio: { $regex: keyword, $options: 'i' } }
            ]
        };

        if (role) query.role = role;

        let sort = {};
        switch (sortBy) {
            case 'followers':
                sort.followers = -1;
                break;
            case 'newest':
                sort.createdAt = -1;
                break;
            default:
                sort.followers = -1;
        }

        const [users, total] = await Promise.all([
            User.find(query)
                .populate('shopId', 'name slug avatar')
                .select('fullName slug avatar bio followers following roles reviewStats')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            User.countDocuments(query)
        ]);

        const result = {
            users,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            filters: { role },
            sortBy
        };

        return successResponse(res, "Tìm kiếm người dùng thành công", result);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm người dùng", 500, err.message);
    }
};

// Tìm kiếm bài viết - ĐÃ LOẠI BỎ trackSearchBehavior
exports.searchPosts = async (req, res) => {
    try {
        const {
            q,
            authorType,
            privacy = 'public',
            sortBy = 'relevance',
            page = 1,
            limit = 20
        } = req.query;

        if (!q || q.trim().length < 2) {
            return errorResponse(res, "Từ khóa tìm kiếm phải có ít nhất 2 ký tự", 400);
        }

        const keyword = q.trim();
        const skip = (page - 1) * limit;

        let query = {
            privacy: privacy,
            $or: [
                { content: { $regex: keyword, $options: 'i' } },
                { hashtags: { $in: [new RegExp(keyword, 'i')] } },
                { tags: { $in: [new RegExp(keyword, 'i')] } },
                { categories: { $in: [new RegExp(keyword, 'i')] } }
            ]
        };

        if (authorType) query['author.type'] = authorType;

        let sort = {};
        switch (sortBy) {
            case 'likes':
                sort.likesCount = -1;
                break;
            case 'comments':
                sort.commentsCount = -1;
                break;
            case 'newest':
                sort.createdAt = -1;
                break;
            default:
                sort.createdAt = -1;
        }

        const [posts, total] = await Promise.all([
            Post.find(query)
                .populate('author._id', 'fullName avatar name')
                .populate('productIds', 'name slug price images')
                .populate('sharedPost', 'content author images')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Post.countDocuments(query)
        ]);

        const result = {
            posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                itemsPerPage: parseInt(limit)
            },
            filters: { authorType, privacy },
            sortBy
        };

        return successResponse(res, "Tìm kiếm bài viết thành công", result);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm bài viết", 500, err.message);
    }
};

// Tìm kiếm theo hashtag
exports.searchByHashtag = async (req, res) => {
    try {
        const { hashtag, sortBy = 'relevance', page = 1, limit = 20 } = req.query;

        if (!hashtag || hashtag.trim().length < 1) {
            return errorResponse(res, "Hashtag không được để trống", 400);
        }

        const cleanHashtag = hashtag.trim().toLowerCase().replace(/^#/, ''); // Bỏ dấu # nếu có
        const skip = (page - 1) * limit;

        const [products, shops, posts, totalProducts, totalShops, totalPosts] = await Promise.all([
            // Tìm sản phẩm
            Product.find({
                isActive: true,
                hashtags: cleanHashtag
            })
                .populate('seller', 'name slug avatar')
                .populate('mainCategory', 'name slug')
                .sort({ soldCount: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            // Tìm shop
            Shop.find({
                'status.isActive': true,
                'status.isApprovedCreate': true,
                hashtags: cleanHashtag
            })
                .populate('owner', 'fullName avatar')
                .populate('productInfo.mainCategory', 'name slug')
                .sort({ 'stats.rating.avg': -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            // Tìm bài viết
            Post.find({
                privacy: 'public',
                hashtags: cleanHashtag
            })
                .populate('author._id', 'fullName avatar name')
                .populate('productIds', 'name slug price images')
                .sort({ likesCount: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            // Đếm tổng số
            Product.countDocuments({ isActive: true, hashtags: cleanHashtag }),
            Shop.countDocuments({ 'status.isActive': true, 'status.isApprovedCreate': true, hashtags: cleanHashtag }),
            Post.countDocuments({ privacy: 'public', hashtags: cleanHashtag })
        ]);

        const totalItems = totalProducts + totalShops + totalPosts;

        const result = {
            products,
            shops,
            posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: parseInt(limit)
            },
            hashtag: cleanHashtag,
            sortBy
        };

        return successResponse(res, `Tìm kiếm theo hashtag "${cleanHashtag}" thành công`, result);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm theo hashtag", 500, err.message);
    }
};

// Tìm kiếm theo danh mục
exports.searchByCategory = async (req, res) => {
    try {
        const { categoryId, sortBy = 'relevance', page = 1, limit = 20 } = req.query;

        if (!categoryId) {
            return errorResponse(res, "Danh mục không được để trống", 400);
        }

        const category = await Category.findById(categoryId).select('name');
        if (!category) {
            return errorResponse(res, "Danh mục không tồn tại", 404);
        }

        const skip = (page - 1) * limit;

        const [products, shops, posts, totalProducts, totalShops, totalPosts] = await Promise.all([
            // Tìm sản phẩm
            Product.find({
                isActive: true,
                categories: categoryId
            })
                .populate('seller', 'name slug avatar')
                .populate('mainCategory', 'name slug')
                .sort({ soldCount: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            // Tìm shop
            Shop.find({
                'status.isActive': true,
                'status.isApprovedCreate': true,
                $or: [
                    { 'productInfo.mainCategory': categoryId },
                    { 'productInfo.subCategories': categoryId }
                ]
            })
                .populate('owner', 'fullName avatar')
                .populate('productInfo.mainCategory', 'name slug')
                .sort({ 'stats.rating.avg': -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            // Tìm bài viết
            Post.find({
                privacy: 'public',
                categories: categoryId
            })
                .populate('author._id', 'fullName avatar name')
                .populate('productIds', 'name slug price images')
                .sort({ likesCount: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            // Đếm tổng số
            Product.countDocuments({ isActive: true, mainCategory: categoryId }),
            Shop.countDocuments({
                'status.isActive': true,
                'status.isApprovedCreate': true,
                $or: [
                    { 'productInfo.mainCategory': categoryId },
                    { 'productInfo.subCategories': categoryId }
                ]
            }),
            Post.countDocuments({ privacy: 'public', mainCategory: categoryId })
        ]);

        const totalItems = totalProducts + totalShops + totalPosts;

        const result = {
            products,
            shops,
            posts,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalItems / limit),
                totalItems,
                itemsPerPage: parseInt(limit)
            },
            category: category.name,
            categoryId,
            sortBy
        };

        return successResponse(res, `Tìm kiếm theo danh mục "${category.name}" thành công`, result);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm theo danh mục", 500, err.message);
    }
};

// Tìm kiếm tổng hợp (tất cả loại)
exports.searchAll = async (req, res) => {
    try {
        const { q, hashtag, categoryId, limit = 5 } = req.query;

        if (!q && !hashtag && !categoryId) {
            return errorResponse(res, "Cần cung cấp từ khóa, hashtag hoặc danh mục để tìm kiếm", 400);
        }

        const searchLimit = parseInt(limit);
        let products = [], shops = [], users = [], posts = [], totalResults = 0;

        // Tìm kiếm theo hashtag
        if (hashtag) {
            const cleanHashtag = hashtag.trim().toLowerCase().replace(/^#/, '');
            const [hashtagProducts, hashtagShops, hashtagPosts] = await Promise.all([
                Product.find({ isActive: true, hashtags: cleanHashtag })
                    .populate('seller', 'name slug avatar')
                    .populate('mainCategory', 'name slug')
                    .limit(searchLimit)
                    .lean(),
                Shop.find({ 'status.isActive': true, 'status.isApprovedCreate': true, hashtags: cleanHashtag })
                    .populate('owner', 'fullName avatar')
                    .limit(searchLimit)
                    .lean(),
                Post.find({ privacy: 'public', hashtags: cleanHashtag })
                    .populate('author._id', 'fullName avatar name')
                    .limit(searchLimit)
                    .lean()
            ]);
            products = hashtagProducts;
            shops = hashtagShops;
            posts = hashtagPosts;
            totalResults = products.length + shops.length + posts.length;
        }
        // Tìm kiếm theo danh mục
        else if (categoryId) {
            const category = await Category.findById(categoryId).select('name');
            if (!category) {
                return errorResponse(res, "Danh mục không tồn tại", 404);
            }
            const [categoryProducts, categoryShops, categoryPosts] = await Promise.all([
                Product.find({ isActive: true, mainCategory: categoryId })
                    .populate('seller', 'name slug avatar')
                    .populate('mainCategory', 'name slug')
                    .limit(searchLimit)
                    .lean(),
                Shop.find({ 'status.isActive': true, 'status.isApprovedCreate': true, 'productInfo.mainCategory': categoryId })
                    .populate('owner', 'fullName avatar')
                    .limit(searchLimit)
                    .lean(),
                Post.find({ privacy: 'public', mainCategory: categoryId })
                    .populate('author._id', 'fullName avatar name')
                    .limit(searchLimit)
                    .lean()
            ]);
            products = categoryProducts;
            shops = categoryShops;
            posts = categoryPosts;
            totalResults = products.length + shops.length + posts.length;
        }
        // Tìm kiếm theo từ khóa
        else {
            const keyword = q.trim();
            if (keyword.length < 2) {
                return errorResponse(res, "Từ khóa tìm kiếm phải có ít nhất 2 ký tự", 400);
            }
            const [keywordProducts, keywordShops, keywordUsers, keywordPosts] = await Promise.all([
                Product.find({
                    isActive: true,
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { hashtags: { $in: [new RegExp(keyword, 'i')] } }
                    ]
                })
                    .populate('seller', 'name slug avatar')
                    .populate('mainCategory', 'name slug')
                    .limit(searchLimit)
                    .lean(),
                Shop.find({
                    'status.isActive': true,
                    'status.isApprovedCreate': true,
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { hashtags: { $in: [new RegExp(keyword, 'i')] } }
                    ]
                })
                    .populate('owner', 'fullName avatar')
                    .limit(searchLimit)
                    .lean(),
                User.find({
                    isActive: true,
                    fullName: { $regex: keyword, $options: 'i' }
                })
                    .select('fullName slug avatar bio followers')
                    .limit(searchLimit)
                    .lean(),
                Post.find({
                    privacy: 'public',
                    $or: [
                        { content: { $regex: keyword, $options: 'i' } },
                        { hashtags: { $in: [new RegExp(keyword, 'i')] } }
                    ]
                })
                    .populate('author._id', 'fullName avatar name')
                    .limit(searchLimit)
                    .lean()
            ]);
            products = keywordProducts;
            shops = keywordShops;
            users = keywordUsers;
            posts = keywordPosts;
            totalResults = products.length + shops.length + users.length + posts.length;
        }

        const result = {
            products,
            shops,
            users,
            posts,
            totalResults,
            keyword: q || hashtag || categoryId
        };

        return successResponse(res, "Tìm kiếm tổng hợp thành công", result);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm tổng hợp", 500, err.message);
    }
};

// Lấy từ khóa tìm kiếm phổ biến với phân trang
exports.getPopularSearches = async (req, res) => {
    try {
        const { 
            limit = 10, 
            timeRange = '7d',
            page = 1,
            offset
        } = req.query;

        const limitNum = parseInt(limit);
        const pageNum = parseInt(page);
        
        // Tính toán skip: ưu tiên offset nếu có, không thì dùng page
        let skip;
        if (offset !== undefined) {
            skip = parseInt(offset);
        } else {
            skip = (pageNum - 1) * limitNum;
        }

        let dateFilter = {};
        const now = new Date();

        switch (timeRange) {
            case '1d':
                dateFilter = { $gte: new Date(now - 24 * 60 * 60 * 1000) };
                break;
            case '7d':
                dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
                break;
            case '30d':
                dateFilter = { $gte: new Date(now - 30 * 24 * 60 * 60 * 1000) };
                break;
            default:
                dateFilter = { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) };
        }

        // Pipeline để đếm tổng số từ khóa unique
        const countPipeline = [
            {
                $match: {
                    action: 'search',
                    timestamp: dateFilter,
                    'targetDetails.searchQuery': { $exists: true, $ne: '' }
                }
            },
            {
                $group: {
                    _id: '$targetDetails.searchQuery'
                }
            },
            {
                $count: "totalCount"
            }
        ];

        // Pipeline để lấy dữ liệu với phân trang
        const dataPipeline = [
            {
                $match: {
                    action: 'search',
                    timestamp: dateFilter,
                    'targetDetails.searchQuery': { $exists: true, $ne: '' }
                }
            },
            {
                $group: {
                    _id: '$targetDetails.searchQuery',
                    count: { $sum: 1 },
                    lastSearched: { $max: '$timestamp' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limitNum
            },
            {
                $project: {
                    keyword: '$_id',
                    count: 1,
                    lastSearched: 1,
                    _id: 0
                }
            }
        ];

        // Thực hiện cả 2 pipeline song song
        const [countResult, popularSearches] = await Promise.all([
            UserInteraction.aggregate(countPipeline),
            UserInteraction.aggregate(dataPipeline)
        ]);

        // Lấy tổng số từ countResult
        const totalCount = countResult.length > 0 ? countResult[0].totalCount : 0;

        // Tính toán thông tin phân trang
        const totalPages = Math.ceil(totalCount / limitNum);
        const hasNextPage = pageNum < totalPages;
        const hasPrevPage = pageNum > 1;

        const paginationInfo = {
            currentPage: pageNum,
            totalPages,
            totalCount,
            limit: limitNum,
            hasNextPage,
            hasPrevPage,
            nextPage: hasNextPage ? pageNum + 1 : null,
            prevPage: hasPrevPage ? pageNum - 1 : null,
            timeRange
        };

        const responseData = {
            searches: popularSearches,
            pagination: paginationInfo,
            timeRange,
            generatedAt: new Date()
        };

        return successResponse(res, "Lấy từ khóa phổ biến thành công", responseData);
    } catch (err) {
        return errorResponse(res, "Lỗi khi lấy từ khóa phổ biến", 500, err.message);
    }
};

// Gợi ý tìm kiếm (autocomplete)
exports.searchSuggestions = async (req, res) => {
    try {
        const { q, type = 'all', limit = 10 } = req.query;

        if (!q || q.trim().length < 1) {
            return successResponse(res, "Gợi ý tìm kiếm", []);
        }

        const keyword = q.trim();
        const searchLimit = parseInt(limit);
        let suggestions = [];

        if (type === 'all' || type === 'product') {
            const productSuggestions = await Product.find({
                isActive: true,
                name: { $regex: `^${keyword}`, $options: 'i' }
            })
                .select('name')
                .limit(searchLimit)
                .lean();

            suggestions.push(...productSuggestions.map(p => ({
                text: p.name,
                type: 'product'
            })));
        }

        if (type === 'all' || type === 'shop') {
            const shopSuggestions = await Shop.find({
                'status.isActive': true,
                'status.isApprovedCreate': true,
                name: { $regex: `^${keyword}`, $options: 'i' }
            })
                .select('name')
                .limit(searchLimit)
                .lean();

            suggestions.push(...shopSuggestions.map(s => ({
                text: s.name,
                type: 'shop'
            })));
        }

        // Lấy từ lịch sử tìm kiếm phổ biến
        const historicalSuggestions = await UserInteraction.aggregate([
            {
                $match: {
                    action: 'search',
                    'targetDetails.searchQuery': { $regex: `^${keyword}`, $options: 'i' }
                }
            },
            {
                $group: {
                    _id: '$targetDetails.searchQuery',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 5
            }
        ]);

        suggestions.push(...historicalSuggestions.map(h => ({
            text: h._id,
            type: 'history',
            count: h.count
        })));

        // Loại bỏ trùng lặp và giới hạn kết quả
        const uniqueSuggestions = suggestions
            .filter((item, index, self) =>
                index === self.findIndex(t => t.text.toLowerCase() === item.text.toLowerCase())
            )
            .slice(0, searchLimit);

        return successResponse(res, "Gợi ý tìm kiếm thành công", uniqueSuggestions);
    } catch (err) {
        return errorResponse(res, "Lỗi khi lấy gợi ý tìm kiếm", 500, err.message);
    }
};