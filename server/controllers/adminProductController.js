const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/response');

// Admin xem toàn bộ sản phẩm toàn nền tảng
exports.getAllProductsForAdmin = async (req, res) => {
    const { page = 1, limit = 20, isActive, seller, keyword } = req.query;

    const query = {};

    if (typeof isActive !== 'undefined') {
        query.isActive = isActive === 'true';
    }

    if (seller) {
        query.seller = seller;
    }

    if (keyword) {
        const regex = new RegExp(keyword, 'i');
        query.$or = [
            { name: regex },
            { description: regex },
            { tags: regex }
        ];
    }

    try {
        const products = await Product.find(query)
            .populate('seller', 'fullName email') // hiển thị seller
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Product.countDocuments(query);

        return successResponse(res, 'Lấy danh sách sản phẩm toàn hệ thống', {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách sản phẩm', 500, err.message);
    }
};
