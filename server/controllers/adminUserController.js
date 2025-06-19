const User = require('../models/User');
const Shop = require('../models/Shop');
const Seller = require('../models/Seller');
const { successResponse, errorResponse } = require('../utils/response');

// Admin xem toàn bộ người dùng trên nền tảng
exports.getAllUsersForAdmin = async (req, res) => {
    const {
        page = 1,
        limit = 20,
        role,
        isActive,
        keyword,
        hasShop,
        shopStatus,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = req.query;

    const query = {};

    // Lọc theo role
    if (role && ['buyer', 'seller', 'admin'].includes(role)) {
        query.role = role;
    }

    // Lọc theo trạng thái active
    if (typeof isActive !== 'undefined') {
        query.isActive = isActive === 'true';
    }

    // Lọc theo có shop hay không
    if (typeof hasShop !== 'undefined') {
        if (hasShop === 'true') {
            query.shopId = { $exists: true, $ne: null };
        } else {
            query.shopId = { $exists: false };
        }
    }

    // Tìm kiếm theo từ khóa
    if (keyword) {
        const regex = new RegExp(keyword, 'i');
        query.$or = [
            { fullName: regex },
            { email: regex },
            { phone: regex },
            { slug: regex }
        ];
    }

    try {
        let userQuery = User.find(query)
            .populate('shopId', 'name slug avatar status contact stats')
            .populate('sellerId', 'legalName businessLicense')
            .select('-password -refreshToken')
            .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const users = await userQuery;
        const total = await User.countDocuments(query);

        // Lọc thêm theo trạng thái shop nếu có
        let filteredUsers = users;
        if (shopStatus && ['pending', 'approved', 'rejected'].includes(shopStatus)) {
            filteredUsers = users.filter(user =>
                user.shopId && user.shopId.status?.approvalCreateStatus === shopStatus
            );
        }

        // Tạo response data với thông tin đầy đủ
        const usersWithDetails = filteredUsers.map(user => {
            const userObj = user.toObject();

            // Thêm thông tin shop nếu có
            if (userObj.shopId) {
                userObj.shopDetails = {
                    ...userObj.shopId,
                    isApproved: userObj.shopId.status?.isApprovedCreate || false,
                    approvalStatus: userObj.shopId.status?.approvalCreateStatus || 'pending'
                };
            }

            return {
                ...userObj,
                // Tính toán một số thông tin bổ sung
                accountType: userObj.shopId ? 'seller' : 'buyer',
                joinedDays: Math.floor((Date.now() - new Date(userObj.createdAt).getTime()) / (1000 * 60 * 60 * 24))
            };
        });

        return successResponse(res, 'Lấy danh sách người dùng thành công', {
            users: usersWithDetails,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: shopStatus ? filteredUsers.length : total,
                totalPages: Math.ceil((shopStatus ? filteredUsers.length : total) / limit)
            },
            summary: {
                totalUsers: total,
                activeUsers: await User.countDocuments({ ...query, isActive: true }),
                inactiveUsers: await User.countDocuments({ ...query, isActive: false }),
                sellers: await User.countDocuments({ ...query, role: 'seller' }),
                buyers: await User.countDocuments({ ...query, role: 'buyer' }),
                usersWithShop: await User.countDocuments({ ...query, shopId: { $exists: true, $ne: null } })
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách người dùng', 500, err.message);
    }
};

// Admin xem chi tiết người dùng
exports.getUserDetails = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId)
            .populate('shopId')
            .populate('sellerId')
            .populate('savedPosts', 'content images createdAt')
            .populate('likedPosts', 'content images createdAt')
            .select('-password -refreshToken')
            .lean();

        if (!user) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        // Lấy thêm thông tin shop chi tiết nếu có
        let shopDetails = null;
        if (user.shopId) {
            shopDetails = await Shop.findById(user.shopId)
                .populate('productInfo.mainCategory', 'name slug')
                .populate('productInfo.subCategories', 'name slug')
                .lean();
        }

        // Thống kê hoạt động của user
        const stats = {
            totalPosts: 0, // Cần query từ Post model
            totalProducts: 0, // Cần query từ Product model nếu là seller
            totalOrders: 0, // Cần query từ Order model
            joinedDays: Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))
        };

        return successResponse(res, 'Chi tiết người dùng', {
            user: {
                ...user,
                shopDetails,
                stats,
                accountType: user.shopId ? 'seller' : 'buyer'
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy chi tiết người dùng', 500, err.message);
    }
};

// Admin cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const updateData = req.body;

        // Loại bỏ các trường không được phép cập nhật
        const allowedFields = [
            'fullName', 'avatar', 'coverImage', 'bio', 'phone',
            'gender', 'dateOfBirth', 'address', 'role', 'roles', 'isActive'
        ];

        const filteredUpdateData = {};
        Object.keys(updateData).forEach(key => {
            if (allowedFields.includes(key)) {
                filteredUpdateData[key] = updateData[key];
            }
        });

        // Cập nhật thời gian
        filteredUpdateData.updatedAt = new Date();

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            filteredUpdateData,
            {
                new: true,
                runValidators: true
            }
        ).select('-password -refreshToken');

        if (!updatedUser) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        return successResponse(res, 'Cập nhật người dùng thành công', updatedUser);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật người dùng', 500, err.message);
    }
};

// Admin vô hiệu hóa/kích hoạt tài khoản người dùng
exports.toggleUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive, reason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        user.isActive = isActive;
        user.updatedAt = new Date();

        // Nếu vô hiệu hóa user và user có shop, cần vô hiệu hóa shop
        if (!isActive && user.shopId) {
            await Shop.findByIdAndUpdate(user.shopId, {
                'status.isActive': false,
                updatedAt: new Date()
            });
        }

        await user.save();

        return successResponse(res,
            `Đã ${isActive ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản người dùng`,
            { userId, isActive, reason }
        );
    } catch (err) {
        return errorResponse(res, 'Lỗi khi thay đổi trạng thái người dùng', 500, err.message);
    }
};

// Admin xóa người dùng (soft delete)
exports.softDeleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;

        const user = await User.findById(userId);
        if (!user) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        // Soft delete user
        user.isActive = false;
        user.updatedAt = new Date();
        await user.save();

        // Nếu user có shop, cũng soft delete shop
        if (user.shopId) {
            await Shop.findByIdAndUpdate(user.shopId, {
                'status.isActive': false,
                updatedAt: new Date()
            });
        }

        return successResponse(res, 'Đã vô hiệu hóa tài khoản người dùng', { reason });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa người dùng', 500, err.message);
    }
};

// Admin xóa vĩnh viễn người dùng (cẩn thận sử dụng)
exports.deleteUserPermanently = async (req, res) => {
    try {
        const { userId } = req.params;
        const { confirmDelete } = req.body;

        if (!confirmDelete) {
            return errorResponse(res, 'Cần xác nhận xóa vĩnh viễn', 400);
        }

        const user = await User.findById(userId);
        if (!user) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        // Xóa shop nếu có
        if (user.shopId) {
            await Shop.findByIdAndDelete(user.shopId);
        }

        // Xóa seller info nếu có
        if (user.sellerId) {
            await Seller.findByIdAndDelete(user.sellerId);
        }

        // Xóa user
        await User.findByIdAndDelete(userId);

        return successResponse(res, 'Đã xóa vĩnh viễn người dùng và dữ liệu liên quan');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa vĩnh viễn người dùng', 500, err.message);
    }
};

// Admin thống kê tổng quan người dùng
exports.getUserStatistics = async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        // Tính toán thời gian bắt đầu dựa trên period
        let startDate = new Date();
        switch (period) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                break;
            case '1y':
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
        }

        const stats = await Promise.all([
            // Tổng số người dùng
            User.countDocuments(),
            // Người dùng active
            User.countDocuments({ isActive: true }),
            // Người dùng inactive
            User.countDocuments({ isActive: false }),
            // Số buyer
            User.countDocuments({ role: 'buyer' }),
            // Số seller
            User.countDocuments({ role: 'seller' }),
            // Số admin
            User.countDocuments({ role: 'admin' }),
            // Người dùng có shop
            User.countDocuments({ shopId: { $exists: true, $ne: null } }),
            // Người dùng mới trong khoảng thời gian
            User.countDocuments({ createdAt: { $gte: startDate } }),
            // Shop được duyệt
            Shop.countDocuments({ 'status.isApprovedCreate': true }),
            // Shop chờ duyệt
            Shop.countDocuments({ 'status.approvalCreateStatus': 'pending' })
        ]);

        return successResponse(res, 'Thống kê người dùng', {
            totalUsers: stats[0],
            activeUsers: stats[1],
            inactiveUsers: stats[2],
            buyers: stats[3],
            sellers: stats[4],
            admins: stats[5],
            usersWithShop: stats[6],
            newUsers: stats[7],
            approvedShops: stats[8],
            pendingShops: stats[9],
            period,
            generatedAt: new Date()
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thống kê người dùng', 500, err.message);
    }
};

// Admin tìm kiếm người dùng nâng cao
exports.advancedUserSearch = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            email,
            phone,
            fullName,
            role,
            hasShop,
            shopName,
            joinedFrom,
            joinedTo,
            isActive,
            minOrders,
            maxOrders
        } = req.query;

        const query = {};

        // Tìm kiếm theo email chính xác
        if (email) {
            query.email = new RegExp(email, 'i');
        }

        // Tìm kiếm theo phone
        if (phone) {
            query.phone = new RegExp(phone, 'i');
        }

        // Tìm kiếm theo tên
        if (fullName) {
            query.fullName = new RegExp(fullName, 'i');
        }

        // Lọc theo role
        if (role) {
            query.role = role;
        }

        // Lọc theo trạng thái active
        if (typeof isActive !== 'undefined') {
            query.isActive = isActive === 'true';
        }

        // Lọc theo có shop
        if (typeof hasShop !== 'undefined') {
            if (hasShop === 'true') {
                query.shopId = { $exists: true, $ne: null };
            } else {
                query.shopId = { $exists: false };
            }
        }

        // Lọc theo thời gian tham gia
        if (joinedFrom || joinedTo) {
            query.createdAt = {};
            if (joinedFrom) query.createdAt.$gte = new Date(joinedFrom);
            if (joinedTo) query.createdAt.$lte = new Date(joinedTo);
        }

        let users = await User.find(query)
            .populate('shopId', 'name slug avatar status')
            .select('-password -refreshToken')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .lean();

        // Lọc theo tên shop nếu có
        if (shopName) {
            users = users.filter(user =>
                user.shopId && user.shopId.name.toLowerCase().includes(shopName.toLowerCase())
            );
        }

        const total = await User.countDocuments(query);

        return successResponse(res, 'Tìm kiếm người dùng thành công', {
            users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi tìm kiếm người dùng', 500, err.message);
    }
};