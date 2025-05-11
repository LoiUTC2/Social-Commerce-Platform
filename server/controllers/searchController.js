const Product = require('../models/Product');
const Post = require('../models/Post');
const Shop = require('../models/Shop');
const User = require('../models/User');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');

exports.search = async (req, res) => {
    const { q, type } = req.query;
    const userId = req.user?.userId || null;

    if (!q || !type) {
        return errorResponse(res, "Thiếu từ khóa hoặc loại tìm kiếm", 400);
    }

    try {
        let results = [];

        const keyword = new RegExp(q, 'i'); // Regex không phân biệt hoa thường

        switch (type) {
            case 'product':
                results = await Product.find({ name: keyword, isDeleted: false, isApproved: true });
                break;
            case 'post':
                results = await Post.find({ content: keyword, isDeleted: false });
                break;
            case 'shop':
                results = await Shop.find({ name: keyword, isDeleted: false, isApproved: true });
                break;
            case 'user':
                results = await User.find({ fullName: keyword, isActive: true });
                break;
            default:
                return errorResponse(res, "Loại tìm kiếm không hợp lệ", 400);
        }

        // Ghi lại hành vi tìm kiếm để phục vụ AI (nếu người dùng đã đăng nhập)
        if (userId) {
            await UserInteraction.create({
                userId,
                targetType: type,
                action: 'search',
                metadata: { keyword: q },
                timestamp: new Date()
            });
        }

        return successResponse(res, "Tìm kiếm thành công", results);
    } catch (err) {
        return errorResponse(res, "Lỗi khi tìm kiếm", 500, err.message);
    }
};
