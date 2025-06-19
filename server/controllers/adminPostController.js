const Post = require('../models/Post');
const { successResponse, errorResponse } = require('../utils/response');

// Admin xem toàn bộ bài viết trên nền tảng
exports.getAllPostsForAdmin = async (req, res) => {
    const {
        page = 1,
        limit = 20,
        authorType,
        authorId,
        keyword,
        mainCategory,
        type,
        privacy,
        isSponsored,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Lọc theo loại tác giả (User hoặc Shop)
    // Chỉ áp dụng filter khi authorType có giá trị hợp lệ và không phải "all"
    if (authorType && authorType !== 'all' && ['User', 'Shop'].includes(authorType)) {
        query['author.type'] = authorType;
    }

    // Lọc theo ID tác giả cụ thể
    // Chỉ áp dụng khi authorId có giá trị và không phải "all"
    if (authorId && authorId !== 'all' && authorId.trim() !== '') {
        query['author._id'] = authorId;
    }

    // Tìm kiếm theo từ khóa
    // Chỉ áp dụng khi keyword có giá trị thực sự (không rỗng và không phải "all")
    if (keyword && keyword.trim() !== '' && keyword !== 'all') {
        const regex = new RegExp(keyword.trim(), 'i');
        query.$or = [
            { content: regex },
            { hashtags: regex },
            { tags: regex }
        ];
    }

    // Lọc theo danh mục chính
    // Chỉ áp dụng khi mainCategory có giá trị hợp lệ và không phải "all"
    if (mainCategory && mainCategory !== 'all' && mainCategory.trim() !== '') {
        query.mainCategory = mainCategory;
    }

    // Lọc theo loại bài viết
    // Chỉ áp dụng khi type có giá trị hợp lệ và không phải "all"
    if (type && type !== 'all' && ['normal', 'share'].includes(type)) {
        query.type = type;
    }

    // Lọc theo quyền riêng tư
    // Chỉ áp dụng khi privacy có giá trị hợp lệ và không phải "all"
    if (privacy && privacy !== 'all' && ['public', 'friends', 'private'].includes(privacy)) {
        query.privacy = privacy;
    }

    // Lọc theo bài viết được tài trợ
    // Chỉ áp dụng khi isSponsored có giá trị boolean hợp lệ và không phải "all"
    if (isSponsored && isSponsored !== 'all') {
        if (isSponsored === 'true' || isSponsored === true) {
            query.isSponsored = true;
        } else if (isSponsored === 'false' || isSponsored === false) {
            query.isSponsored = false;
        }
    }

    try {
        // Validate sortBy to prevent injection
        const allowedSortFields = ['createdAt', 'updatedAt', 'likesCount', 'commentsCount', 'sharesCount', 'aiScore'];
        const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
        const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';

        // Tạo sort object
        const sort = {};
        sort[validSortBy] = validSortOrder === 'desc' ? -1 : 1;

        // Validate pagination
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Giới hạn tối đa 100 items per page

        const posts = await Post.find(query)
            .populate('author._id', 'fullName avatar name') // populate author
            .populate('mainCategory', 'name slug')
            .populate('productIds', 'name slug price images')
            .populate({
                path: 'sharedPost',
                select: 'content author createdAt',
                populate: {
                    path: 'author._id',
                    select: 'fullName avatar name'
                }
            })
            .sort(sort)
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum);

        const total = await Post.countDocuments(query);

        return successResponse(res, 'Lấy danh sách bài viết toàn hệ thống', {
            posts,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            },
            filters: {
                applied: Object.keys(query).length > 0,
                query: query // Trả về query đã áp dụng để debug
            }
        });
    } catch (err) {
        console.error('Error in getAllPostsForAdmin:', err);
        return errorResponse(res, 'Lỗi khi lấy danh sách bài viết', 500, err.message);
    }
};

// Admin xem chi tiết bài viết
exports.getPostDetails = async (req, res) => {
    try {
        const { postId } = req.params;

        const post = await Post.findById(postId)
            .populate('author._id', 'fullName avatar name email')
            .populate('mainCategory', 'name slug')
            .populate('categories', 'name slug')
            .populate('productIds', 'name slug price images seller')
            .populate('sharedPost', 'content author createdAt')
            .lean();

        if (!post) return errorResponse(res, 'Không tìm thấy bài viết', 404);

        return successResponse(res, 'Chi tiết bài viết', post);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy chi tiết bài viết', 500, err.message);
    }
};

// Admin cập nhật bài viết
exports.updatePost = async (req, res) => {
    try {
        const { postId } = req.params;
        const updateData = req.body;

        // Không cho phép thay đổi một số trường nhạy cảm
        delete updateData.author;
        delete updateData.createdAt;
        delete updateData.likesCount;
        delete updateData.commentsCount;
        delete updateData.sharesCount;

        const updated = await Post.findByIdAndUpdate(postId, {
            ...updateData,
            updatedAt: new Date()
        }, {
            new: true,
            runValidators: true,
        }).populate('author._id', 'fullName avatar name')
            .populate('mainCategory', 'name slug');

        if (!updated) return errorResponse(res, 'Không tìm thấy bài viết', 404);

        return successResponse(res, 'Cập nhật bài viết thành công', updated);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật bài viết', 500, err.message);
    }
};

// Admin xóa bài viết vĩnh viễn
exports.deletePostPermanently = async (req, res) => {
    try {
        const { postId } = req.params;

        const result = await Post.findByIdAndDelete(postId);

        if (!result) return errorResponse(res, 'Không tìm thấy bài viết', 404);

        return successResponse(res, 'Đã xóa bài viết vĩnh viễn');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa bài viết', 500, err.message);
    }
};

// Admin thống kê bài viết
exports.getPostStatistics = async (req, res) => {
    try {
        const {
            startDate,
            endDate,
            authorType,
            mainCategory
        } = req.query;

        // Tạo query cho thống kê
        const matchQuery = {};

        if (startDate || endDate) {
            matchQuery.createdAt = {};
            if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
            if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
        }

        if (authorType) {
            matchQuery['author.type'] = authorType;
        }

        if (mainCategory) {
            matchQuery.mainCategory = mainCategory;
        }

        // Thống kê tổng quan
        const totalPosts = await Post.countDocuments(matchQuery);
        const totalNormalPosts = await Post.countDocuments({ ...matchQuery, type: 'normal' });
        const totalSharePosts = await Post.countDocuments({ ...matchQuery, type: 'share' });
        const totalSponsoredPosts = await Post.countDocuments({ ...matchQuery, isSponsored: true });

        // Thống kê theo loại tác giả
        const authorTypeStats = await Post.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$author.type', count: { $sum: 1 } } }
        ]);

        // Thống kê theo quyền riêng tư
        const privacyStats = await Post.aggregate([
            { $match: matchQuery },
            { $group: { _id: '$privacy', count: { $sum: 1 } } }
        ]);

        // Thống kê theo danh mục
        const categoryStats = await Post.aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'mainCategory',
                    foreignField: '_id',
                    as: 'categoryInfo'
                }
            },
            { $unwind: '$categoryInfo' },
            {
                $group: {
                    _id: '$mainCategory',
                    count: { $sum: 1 },
                    categoryName: { $first: '$categoryInfo.name' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);

        // Thống kê tương tác
        const interactionStats = await Post.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: null,
                    totalLikes: { $sum: '$likesCount' },
                    totalComments: { $sum: '$commentsCount' },
                    totalShares: { $sum: '$sharesCount' },
                    avgLikes: { $avg: '$likesCount' },
                    avgComments: { $avg: '$commentsCount' },
                    avgShares: { $avg: '$sharesCount' }
                }
            }
        ]);

        // Thống kê theo thời gian (7 ngày gần nhất)
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const timeStats = await Post.aggregate([
            {
                $match: {
                    ...matchQuery,
                    createdAt: { $gte: last7Days }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        return successResponse(res, 'Thống kê bài viết', {
            overview: {
                totalPosts,
                totalNormalPosts,
                totalSharePosts,
                totalSponsoredPosts
            },
            authorTypeStats,
            privacyStats,
            categoryStats,
            interactionStats: interactionStats[0] || {},
            timeStats
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thống kê bài viết', 500, err.message);
    }
};

// Admin cập nhật trạng thái tài trợ
exports.updateSponsoredStatus = async (req, res) => {
    try {
        const { postId } = req.params;
        const { isSponsored } = req.body;

        const post = await Post.findByIdAndUpdate(
            postId,
            {
                isSponsored: Boolean(isSponsored),
                updatedAt: new Date()
            },
            { new: true }
        ).populate('author._id', 'fullName avatar name');

        if (!post) return errorResponse(res, 'Không tìm thấy bài viết', 404);

        const message = isSponsored ? 'Đã đánh dấu bài viết là tài trợ' : 'Đã bỏ đánh dấu tài trợ';

        return successResponse(res, message, post);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái tài trợ', 500, err.message);
    }
};

// Admin tìm kiếm bài viết nâng cao
exports.advancedSearchPosts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            content,
            hashtags,
            tags,
            authorName,
            minLikes,
            maxLikes,
            minComments,
            maxComments,
            dateFrom,
            dateTo,
            hasProducts,
            hasMedia
        } = req.query;

        const query = {};
        const andConditions = [];

        // Tìm kiếm trong nội dung
        if (content) {
            andConditions.push({ content: new RegExp(content, 'i') });
        }

        // Tìm kiếm theo hashtags
        if (hashtags) {
            const hashtagArray = hashtags.split(',').map(tag => tag.trim());
            andConditions.push({ hashtags: { $in: hashtagArray } });
        }

        // Tìm kiếm theo tags
        if (tags) {
            const tagArray = tags.split(',').map(tag => tag.trim());
            andConditions.push({ tags: { $in: tagArray } });
        }

        // Lọc theo số lượng likes
        if (minLikes || maxLikes) {
            const likesCondition = {};
            if (minLikes) likesCondition.$gte = parseInt(minLikes);
            if (maxLikes) likesCondition.$lte = parseInt(maxLikes);
            andConditions.push({ likesCount: likesCondition });
        }

        // Lọc theo số lượng comments
        if (minComments || maxComments) {
            const commentsCondition = {};
            if (minComments) commentsCondition.$gte = parseInt(minComments);
            if (maxComments) commentsCondition.$lte = parseInt(maxComments);
            andConditions.push({ commentsCount: commentsCondition });
        }

        // Lọc theo thời gian
        if (dateFrom || dateTo) {
            const dateCondition = {};
            if (dateFrom) dateCondition.$gte = new Date(dateFrom);
            if (dateTo) dateCondition.$lte = new Date(dateTo);
            andConditions.push({ createdAt: dateCondition });
        }

        // Lọc bài viết có sản phẩm
        if (hasProducts === 'true') {
            andConditions.push({ productIds: { $exists: true, $ne: [] } });
        } else if (hasProducts === 'false') {
            andConditions.push({ $or: [{ productIds: { $exists: false } }, { productIds: [] }] });
        }

        // Lọc bài viết có media
        if (hasMedia === 'true') {
            andConditions.push({
                $or: [
                    { images: { $exists: true, $ne: [] } },
                    { videos: { $exists: true, $ne: [] } }
                ]
            });
        } else if (hasMedia === 'false') {
            andConditions.push({
                $and: [
                    { $or: [{ images: { $exists: false } }, { images: [] }] },
                    { $or: [{ videos: { $exists: false } }, { videos: [] }] }
                ]
            });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        // Pipeline cho aggregate nếu cần tìm kiếm theo tên author
        let posts;
        let total;

        if (authorName) {
            const aggregatePipeline = [
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author._id',
                        foreignField: '_id',
                        as: 'userAuthor'
                    }
                },
                {
                    $lookup: {
                        from: 'shops',
                        localField: 'author._id',
                        foreignField: '_id',
                        as: 'shopAuthor'
                    }
                },
                {
                    $match: {
                        ...query,
                        $or: [
                            { 'userAuthor.fullName': new RegExp(authorName, 'i') },
                            { 'shopAuthor.name': new RegExp(authorName, 'i') }
                        ]
                    }
                },
                { $sort: { createdAt: -1 } },
                { $skip: (page - 1) * limit },
                { $limit: parseInt(limit) }
            ];

            posts = await Post.aggregate(aggregatePipeline);

            // Đếm total cho aggregate
            const countPipeline = aggregatePipeline.slice(0, -2); // Bỏ skip và limit
            countPipeline.push({ $count: "total" });
            const countResult = await Post.aggregate(countPipeline);
            total = countResult[0]?.total || 0;
        } else {
            posts = await Post.find(query)
                .populate('author._id', 'fullName avatar name')
                .populate('mainCategory', 'name slug')
                .populate('productIds', 'name slug price images')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            total = await Post.countDocuments(query);
        }

        return successResponse(res, 'Kết quả tìm kiếm nâng cao', {
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (err) {
        return errorResponse(res, 'Lỗi khi tìm kiếm bài viết', 500, err.message);
    }
};