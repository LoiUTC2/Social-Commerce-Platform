const ShopReview = require('../models/ShopReviews');
const Shop = require('../models/Shop');
const logUserInteraction = require('../utils/logUserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const updateShopRatingStats = require('../utils/updateShopRating');
const Order = require('../models/Order');


exports.createShopReview = async (req, res) => {
    try {
        const { _id: reviewerId } = req.actor;
        const reviewerType = req.actor.type === "shop" ? "Shop" : "User";
        const { shop, order, rating, title, content } = req.body;

        if (!shop || !order || !rating || !content) {
            return errorResponse(res, 'Thiếu dữ liệu đánh giá', 400);
        }

        // ✅ THÊM: Kiểm tra order có tồn tại và thuộc về reviewer
        const orderExists = await Order.findOne({
            _id: order,
            $or: [
                { "buyer._id": reviewerId }, // Nếu là User
                { shop: reviewerId }   // Nếu là Shop
            ]
        });

        if (!orderExists) {
            return errorResponse(res, 'Đơn hàng không tồn tại hoặc không thuộc về bạn', 400);
        }

        // ✅ THÊM: Kiểm tra đã review chưa
        const existingReview = await ShopReview.findOne({
            'reviewer._id': reviewerId,
            shop,
            order
        });

        if (existingReview) {
            return errorResponse(res, 'Bạn đã đánh giá shop này cho đơn hàng này rồi', 400);
        }

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return errorResponse(res, 'Rating phải là số nguyên từ 1 đến 5', 400);
        }

        const review = await ShopReview.create({
            reviewer: { _id: reviewerId, type: reviewerType },
            shop,
            order,
            rating,
            title,
            content,
            isVerified: true
        });

        // Ghi hành vi cho AI học
        await logUserInteraction(req.actor, {
            targetType: 'shop',
            targetId: shop,
            action: 'review',
            metadata: {
                rating,
                type: 'shop-review',
                orderId: order,
                hasTitle: !!title,
                contentLength: content.length,
                reviewId: review._id
            }
        });

        // Cập nhật avgRating cho shop
        await updateShopRatingStats(shop);

        return successResponse(res, 'Đánh giá thành công', review);
    } catch (err) {
        return errorResponse(res, 'Lỗi đánh giá shop', 500, err.message);
    }
};

exports.getReviewsByShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

        const reviews = await ShopReview.find({
            shop: shopId,
            status: 'active',
            isHidden: false
        })
            .populate({
                path: 'reviewer._id',
                select: 'fullName name avatar slug'
            })
            .populate({
                path: 'order',
                select: '_id totalAmount createdAt'
            })
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await ShopReview.countDocuments({
            shop: shopId,
            status: 'active',
            isHidden: false
        });

        return successResponse(res, 'Lấy đánh giá shop thành công', {
            reviews,
            pagination: {
                current: page,
                total: Math.ceil(total / limit),
                count: total
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy đánh giá shop', 500, err.message);
    }
};
exports.updateShopReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { _id: reviewerId } = req.actor;
        const { rating, title, content } = req.body;

        if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
            return errorResponse(res, 'Rating phải là số nguyên từ 1 đến 5', 400);
        }

        const review = await ShopReview.findById(id);
        if (!review || review.reviewer._id.toString() !== reviewerId.toString()) {
            return errorResponse(res, 'Không có quyền sửa đánh giá này', 403);
        }

        const shopId = review.shop;

        review.rating = rating;
        review.title = title;
        review.content = content;
        review.updatedAt = new Date();
        await review.save();

        await updateShopRatingStats(shopId);

        return successResponse(res, 'Cập nhật đánh giá thành công', review);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật đánh giá', 500, err.message);
    }
};

exports.deleteShopReview = async (req, res) => {
    try {
        const { id } = req.params;
        const { _id: reviewerId } = req.actor;

        const review = await ShopReview.findById(id);
        if (!review || review.reviewer._id.toString() !== reviewerId.toString()) {
            return errorResponse(res, 'Không có quyền xoá', 403);
        }

        review.status = 'deleted';
        review.updatedAt = new Date();
        await review.save();

        await updateShopRatingStats(review.shop);

        return successResponse(res, 'Xoá đánh giá thành công');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xoá đánh giá', 500, err.message);
    }
};

exports.getShopRatingStats = async (req, res) => {
    try {
        const { shopId } = req.params;
        
        const shop = await Shop.findById(shopId).select('stats.rating');
        if (!shop) {
            return errorResponse(res, 'Không tìm thấy shop', 404);
        }

        return successResponse(res, 'Lấy thống kê rating thành công', shop.stats.rating);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thống kê rating', 500, err.message);
    }
};