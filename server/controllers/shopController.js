const Shop = require('../models/Shop');
const User = require('../models/User');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');

// Bật chế độ seller + tạo shop mới nếu chưa có
exports.activateSellerMode = async (req, res) => {
    try {
        const userId = req.user.userId;

        // Kiểm tra người dùng
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng' });

        // Nếu đã có shop, không tạo lại
        if (user.isSellerActive && user.shopId) {
            return res.status(400).json({ message: 'Bạn đã là người bán' });
        }

        // Cập nhật user
        user.isSellerActive = true;
        user.role = 'seller';
        await user.save();

        res.status(201).json({ message: 'Kích hoạt người bán thành công', shop: newShop });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Tạo shop mới (chưa duyệt), trạng thái chờ admin duyệt
exports.createShop = async (req, res) => {
    try {
        const userId = req.user.userId;
        const existingUser = await User.findById(userId);
        if (!existingUser) return errorResponse(res, 'Người dùng không tồn tại', 404);

        if (existingUser.shopId) return errorResponse(res, 'Bạn đã đăng ký shop rồi', 400);

        // Kiểm tra user đã có shop chưa
        const existingShop = await Shop.findOne({ owner: userId });
        if (existingShop) return res.status(400).json({ message: 'Bạn đã tạo yêu cầu mở shop trước đó, đang đợi duyệt' });

        const { name, slug, description, avatar, logo, coverImage, contact, tags } = req.body;

        const newShop = new Shop({
            owner: userId,
            name,
            slug,
            description,
            avatar,
            logo,
            coverImage,
            contact,
            tags,
            isApproved: false, // Chờ duyệt
            approvalStatus: 'pending', // Chờ duyệt
        });

        const savedShop = await newShop.save();

        // Cập nhật user
        existingUser.shopId = savedShop._id;
        await existingUser.save();

        return successResponse(res, 'Tạo shop thành công, vui lòng chờ admin duyệt', savedShop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi tạo shop', 500, error.message);
    }
};

// Cập nhật thông tin shop (phải là chủ shop)
exports.updateShop = async (req, res) => {
    try {
        const userId = req.user.userId;
        const shop = await Shop.findOne({ owner: userId });
        if (!shop) return errorResponse(res, 'Bạn chưa có shop', 404);

        const { name, description, avatar, logo, coverImage, contact, tags } = req.body;

        shop.name = name ?? shop.name;
        shop.description = description ?? shop.description;
        shop.avatar = avatar ?? shop.avatar;
        shop.logo = logo ?? shop.logo;
        shop.coverImage = coverImage ?? shop.coverImage;
        shop.contact = contact ?? shop.contact;
        shop.tags = tags ?? shop.tags;
        shop.updatedAt = new Date();

        const updatedShop = await shop.save();

        return successResponse(res, 'Cập nhật shop thành công', updatedShop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật shop', 500, error.message);
    }
};

// Xoá mềm shop (người dùng vô hiệu hóa shop) và xóa cứng
exports.deleteShop = async (req, res) => {
    const { shopId } = req.params;
    const forceDelete = req.query.force === 'true';

    try {
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        if (forceDelete) {
            // XÓA CỨNG
            await Shop.deleteOne({ _id: shopId });

            // Cập nhật user
            await User.updateOne(
                { _id: shop.owner },
                {
                    $set: { role: 'buyer', isSellerActive: false, shopId: null },
                }
            );

            return successResponse(res, 'Đã xóa cứng shop khỏi hệ thống');
        } else {
            // XÓA MỀM
            shop.isActive = false;
            shop.updatedAt = new Date();
            await shop.save();
            return successResponse(res, 'Đã xóa mềm shop thành công', { shop });
        }
    } catch (err) {
        return errorResponse(res, 'Xóa shop thất bại', 500, err.message);
    }
};

// Khôi phục shop bị xoá mềm
exports.restoreShop = async (req, res) => {
    try {
        const userId = req.user.userId;
        const shop = await Shop.findOne({ owner: userId });
        if (!shop) return errorResponse(res, 'Bạn chưa có shop', 404);

        if (shop.isActive) return errorResponse(res, 'Shop của bạn đang hoạt động', 400);

        shop.isActive = true;
        shop.updatedAt = new Date();
        await shop.save();

        return successResponse(res, 'Shop đã được khôi phục', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi khôi phục shop', 500, error.message);
    }
};

//Follow hoặc UnFollow
exports.toggleFollowShop = async (req, res) => {
    const shopId = req.params.shopId;
    const userId = req.user.userId;

    try {
        const shop = await Shop.findById(shopId);
        if (!shop || !shop.isActive || !shop.isApproved) {
            return errorResponse(res, 'Cửa hàng không tồn tại hoặc chưa được duyệt', 404);
        }

        const alreadyFollowing = shop.followers.includes(userId);

        if (alreadyFollowing) {
            // Hủy theo dõi
            shop.followers.pull(userId);
            await shop.save();

            await UserInteraction.create({
                userId,
                targetType: 'shop',
                targetId: shopId,
                action: alreadyFollowing ? 'unfollow' : 'follow',
                timestamp: new Date()
            });

            return successResponse(res, 'Đã hủy theo dõi shop');
        } else {
            // Theo dõi
            shop.followers.push(userId);
            await shop.save();

            await UserInteraction.create({
                userId,
                targetType: 'shop',
                targetId: shopId,
                action: alreadyFollowing ? 'unfollow' : 'follow',
                timestamp: new Date()
            });

            return successResponse(res, 'Đã theo dõi shop');
        }

    } catch (err) {
        return errorResponse(res, 'Lỗi hệ thống khi theo dõi/hủy theo dõi', 500, err.message);
    }
};

exports.getShopById = async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user?.userId || null;

    try {
        const shop = await Shop.findOne({ _id: shopId, isApproved: true })
            .populate('owner', 'fullName avatar') // Nếu muốn lấy thông tin chủ shop

        if (!shop) {
            return errorResponse(res, 'Cửa hàng không tồn tại hoặc chưa được duyệt', 404);
        }

        // Ghi lại hành vi xem shop để AI học (nếu đã đăng nhập)
        if (userId) {
            await UserInteraction.create({
                userId,
                targetType: 'shop',
                targetId: shop._id,
                action: 'view',
                metadata: { source: 'shop_detail' },
                timestamp: new Date()
            });
        }

        return successResponse(res, 'Lấy thông tin cửa hàng thành công', shop);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thông tin cửa hàng', 500, err.message);
    }
};
