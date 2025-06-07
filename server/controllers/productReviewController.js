const ProductReview = require('../models/ProductReviews');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/response');
const { updateProductRatingStats } = require('../utils/updateProductRating');
const logUserInteraction = require('../utils/logUserInteraction');
const { trackInteraction } = require('../middleware/interactionMiddleware');

exports.createReview = async (req, res) => {
    try {
        const { _id: reviewerId} = req.actor;
        const reviewerType = req.actor.type === "shop" ? "Shop" : "User";
        const { product, order, shop, rating, title, content, images = [], videos = [] } = req.body;

        console.log("type ", reviewerType);

        // Validation cơ bản
        if (!product || !order || !shop || !rating || !content) {
            return errorResponse(res, 'Thiếu dữ liệu bắt buộc', 400);
        }

        // Validation rating
        if (rating < 1 || rating > 5) {
            return errorResponse(res, 'Đánh giá phải từ 1 đến 5 sao', 400);
        }

        // ✅ Kiểm tra order có tồn tại và thuộc về user không
        const orderExists = await Order.findOne({
            _id: order,
            buyer: {
                type: reviewerType,
                _id: reviewerId
            },
            status: 'delivered' // Chỉ cho phép review khi đơn hàng đã hoàn thành
        });

        if (!orderExists) {
            return errorResponse(res, 'Đơn hàng không tồn tại hoặc chưa hoàn thành', 404);
        }

        // ✅ Kiểm tra user đã review sản phẩm này chưa
        const existingReview = await ProductReview.findOne({
            'reviewer._id': reviewerId,
            product: product,
            status: { $ne: 'deleted' }
        });

        if (existingReview) {
            return errorResponse(res, 'Bạn đã đánh giá sản phẩm này rồi', 400);
        }

        // ✅ Kiểm tra product có thuộc về shop không
        const productExists = await Product.findOne({
            _id: product,
            seller: shop,
            isActive: true
        });

        if (!productExists) {
            return errorResponse(res, 'Sản phẩm không tồn tại hoặc không thuộc về shop này', 404);
        }

        // Tạo review
        const review = await ProductReview.create({
            reviewer: {
                type: reviewerType,
                _id: reviewerId
            },
            product,
            order,
            shop,
            rating,
            title,
            content,
            images,
            videos,
            isVerified: true
        });

        // Populate thông tin reviewer
        await review.populate('reviewer._id', 'fullName avatar');

        // Ghi nhận hành vi review
        req.body = {
            targetType: 'product',
            targetId: product,
            action: 'review',
            metadata: { 
                type: 'product-review',
                rating,
                orderId: order,
                shopId: shop
            }
        };
        await trackInteraction(req, res, () => {});

        // Cập nhật avgRating cho product
        await updateProductRatingStats(product);

        return successResponse(res, 'Gửi đánh giá thành công', review);
    } catch (err) {
        console.error('Error creating review:', err);
        return errorResponse(res, 'Lỗi khi gửi đánh giá', 500, err.message);
    }
};
exports.getReviewsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10, rating, sortBy = 'newest' } = req.query;

        // ✅ Thêm filter và pagination
        const filter = {
            product: productId,
            status: 'active',
            isHidden: false
        };

        if (rating) {
            filter.rating = parseInt(rating);
        }

        // Sort options
        let sortOptions = { createdAt: -1 }; // Default: newest first
        if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
        else if (sortBy === 'highest') sortOptions = { rating: -1, createdAt: -1 };
        else if (sortBy === 'lowest') sortOptions = { rating: 1, createdAt: -1 };
        else if (sortBy === 'most_liked') sortOptions = { 'likes.length': -1, createdAt: -1 };

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            ProductReview.find(filter)
                .populate('reviewer._id', 'fullName name avatar')
                .sort(sortOptions)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            ProductReview.countDocuments(filter)
        ]);

        // ✅ Thêm thông tin likes count cho từng review
        const reviewsWithStats = reviews.map(review => ({
            ...review,
            likesCount: review.likes?.length || 0,
            isLiked: req.actor ? review.likes?.includes(req.actor._id) : false
        }));

        return successResponse(res, 'Lấy danh sách đánh giá thành công', {
            reviews: reviewsWithStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalReviews: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });
    } catch (err) {
        console.error('Error getting reviews:', err);
        return errorResponse(res, 'Lỗi khi lấy đánh giá', 500, err.message);
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { _id: reviewerId } = req.actor;
        const reviewerType = req.actor.type === "shop" ? "Shop" : "User"
        const { rating, title, content, images, videos } = req.body;

        // Validation rating
        if (rating && (rating < 1 || rating > 5)) {
            return errorResponse(res, 'Đánh giá phải từ 1 đến 5 sao', 400);
        }

        const review = await ProductReview.findById(reviewId);
        if (!review) return errorResponse(res, 'Không tìm thấy đánh giá', 404);

        if (review.reviewer._id.toString() !== reviewerId.toString()) {
            return errorResponse(res, 'Bạn không thể sửa đánh giá này', 403);
        }

        // ✅ Kiểm tra thời gian cho phép sửa (ví dụ: 7 ngày)
        const daysSinceCreated = Math.floor((Date.now() - review.createdAt) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated > 7) {
            return errorResponse(res, 'Không thể sửa đánh giá sau 7 ngày', 403);
        }

        const oldRating = review.rating;
        
        Object.assign(review, { 
            rating: rating || review.rating,
            title: title !== undefined ? title : review.title,
            content: content || review.content,
            images: images !== undefined ? images : review.images,
            videos: videos !== undefined ? videos : review.videos,
            updatedAt: new Date() 
        });
        
        await review.save();

        // ✅ Sửa lỗi: dùng review.product thay vì product
        await updateProductRatingStats(review.product);

        // Ghi nhận hành vi update nếu rating thay đổi
        if (oldRating !== review.rating) {
            req.body = {
                targetType: 'product',
                targetId: review.product,
                action: 'update',
                metadata: { 
                    type: 'review-rating-update',
                    oldRating,
                    newRating: review.rating
                }
            };
            await trackInteraction(req, res, () => {});
        }

        return successResponse(res, 'Cập nhật đánh giá thành công', review);
    } catch (err) {
        console.error('Error updating review:', err);
        return errorResponse(res, 'Lỗi khi cập nhật đánh giá', 500, err.message);
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { _id: reviewerId } = req.actor;

        const review = await ProductReview.findById(reviewId);
        if (!review) return errorResponse(res, 'Không tìm thấy đánh giá', 404);

        if (review.reviewer._id.toString() !== reviewerId.toString()) {
            return errorResponse(res, 'Bạn không có quyền xoá đánh giá này', 403);
        }

        // ✅ Kiểm tra thời gian cho phép xóa
        const daysSinceCreated = Math.floor((Date.now() - review.createdAt) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated > 30) {
            return errorResponse(res, 'Không thể xóa đánh giá sau 30 ngày', 403);
        }

        review.status = 'deleted';
        review.updatedAt = new Date();
        await review.save();

        // ✅ Sửa lỗi: dùng review.product thay vì product
        await updateProductRatingStats(review.product);

        // Ghi nhận hành vi delete
        req.body = {
            targetType: 'product',
            targetId: review.product,
            action: 'delete',
            metadata: { type: 'review-delete' }
        };
        await trackInteraction(req, res, () => {});

        return successResponse(res, 'Xoá đánh giá thành công');
    } catch (err) {
        console.error('Error deleting review:', err);
        return errorResponse(res, 'Lỗi khi xoá đánh giá', 500, err.message);
    }
};

exports.likeReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const { _id: userId } = req.actor;

        const review = await ProductReview.findById(reviewId);
        if (!review) return errorResponse(res, 'Không tìm thấy đánh giá', 404);

        const hasLiked = review.likes.includes(userId);
        if (hasLiked) {
            review.likes.pull(userId);
        } else {
            review.likes.push(userId);
        }

        await review.save();

        // Ghi nhận hành vi like/unlike
        req.body = {
            targetType: 'review',
            targetId: reviewId,
            action: hasLiked ? 'unlike' : 'like',
            metadata: { type: 'review-interaction' }
        };
        await trackInteraction(req, res, () => {});

        return successResponse(res, hasLiked ? 'Bỏ thích' : 'Đã thích', {
            isLiked: !hasLiked,
            likesCount: review.likes.length
        });
    } catch (err) {
        console.error('Error liking review:', err);
        return errorResponse(res, 'Lỗi khi tương tác đánh giá', 500, err.message);
    }
};

exports.getReviewById = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const review = await ProductReview.findById(reviewId)
            .populate('reviewer._id', 'fullName avatar')
            .populate('product', 'name images price')
            .populate('shop', 'name avatar')
            .lean();

        if (!review || review.status === 'deleted') {
            return errorResponse(res, 'Không tìm thấy đánh giá', 404);
        }

        // ✅ Thêm thông tin bổ sung
        const reviewWithStats = {
            ...review,
            likesCount: review.likes?.length || 0,
            isLiked: req.actor ? review.likes?.includes(req.actor._id) : false
        };

        return successResponse(res, 'Chi tiết đánh giá', reviewWithStats);
    } catch (err) {
        console.error('Error getting review detail:', err);
        return errorResponse(res, 'Lỗi khi lấy chi tiết đánh giá', 500, err.message);
    }
};

// ✅ Thêm API mới: Lấy reviews của user
exports.getMyReviews = async (req, res) => {
    try {
        const { _id: userId } = req.actor;
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            ProductReview.find({
                'reviewer._id': userId,
                status: { $ne: 'deleted' }
            })
                .populate('product', 'name images price')
                .populate('shop', 'name avatar')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            ProductReview.countDocuments({
                'reviewer._id': userId,
                status: { $ne: 'deleted' }
            })
        ]);

        return successResponse(res, 'Lấy danh sách đánh giá của tôi thành công', {
            reviews,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalReviews: total
            }
        });
    } catch (err) {
        console.error('Error getting my reviews:', err);
        return errorResponse(res, 'Lỗi khi lấy đánh giá của bạn', 500, err.message);
    }
};
