const Shop = require('../models/Shop');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// Duyệt shop (admin sử dụng)
exports.approveShop = async (req, res) => {
    const { shopId } = req.params;

    const shop = await Shop.findById(shopId);
    const ownerShop = shop.owner;

    const existingUser = await User.findById(ownerShop);
    if (!existingUser) return errorResponse(res, 'Người dùng không tồn tại', 404);

    try {
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);
        if (shop.isApproved) return errorResponse(res, 'Shop đã được duyệt trước đó', 400);

        shop.isApproved = true;
        shop.updatedAt = new Date();
        shop.approvalStatus = "approved";
        await shop.save();

        // Cập nhật user
        existingUser.role = 'seller';
        await existingUser.save();

        return successResponse(res, 'Shop đã được duyệt thành công', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi duyệt shop', 500, error.message);
    }
};

// Từ chối shop (admin có thể đánh dấu là không hoạt động hoặc xoá luôn)
exports.rejectShop = async (req, res) => {
    const { shopId } = req.params;
    try {
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Tuỳ chính sách bạn có thể xoá hoặc chỉ disable
        shop.isApproved = false;
        shop.approvalStatus = "reject"
        shop.updatedAt = new Date();
        await shop.save();

        return successResponse(res, 'Shop đã bị từ chối và vô hiệu hoá', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi từ chối shop', 500, error.message);
    }
};

// Lấy danh sách tất cả shop, có thể lọc theo trạng thái duyệt
exports.getAllShops = async (req, res) => {
    try {
        const { status } = req.query; // pending | approved | reject
        const filter = {};

        if (['pending', 'approved', 'reject'].includes(status)) {
            filter.approvalStatus = status;
        }

        const shops = await Shop.find(filter).populate('owner', 'fullName email role').sort({ createdAt: -1 });;

        return successResponse(res, 'Lấy danh sách shop thành công', shops);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop', 500, error.message);
    }
};
