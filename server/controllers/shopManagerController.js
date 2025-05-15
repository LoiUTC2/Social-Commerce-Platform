const Shop = require('../models/Shop');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// Duyệt tạo shop 
exports.approveCreateShop = async (req, res) => {
    const { shopId } = req.params;
    const { createNote } = req.body;

    try {
        // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Kiểm tra trạng thái
        if (shop.status.isApprovedCreate)
            return errorResponse(res, 'Shop đã được duyệt trước đó', 400);
        if (shop.status.approvalCreateStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt', 400);

        // Tìm chủ shop
        const ownerUser = await User.findById(shop.owner);
        if (!ownerUser) return errorResponse(res, 'Không tìm thấy người dùng sở hữu shop', 404);

        // Cập nhật thông tin shop
        shop.status.isApprovedCreate = true;
        shop.status.approvalCreateStatus = "approved";
        shop.status.createNote = createNote || 'Đã duyệt';
        shop.updatedAt = new Date();
        await shop.save();

        // Cập nhật user
        existingUser.roles.push('seller');
        await existingUser.save();

        return successResponse(res, 'Đã duyệt shop thành công', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi duyệt shop', 500, error.message);
    }
};

// Từ chối tạo shop 
exports.rejectCreateShop = async (req, res) => {
    const { shopId } = req.params;
    const { createNote } = req.body;
    try {
         // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);
        
        // Kiểm tra trạng thái
        if (shop.status.approvalCreateStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt', 400);

        // Cập nhật thông tin shop
        shop.status.isApprovedCreate = false;
        shop.status.approvalCreateStatus = "rejected";
        shop.status.createNote = createNote || 'Không đạt yêu cầu';
        shop.updatedAt = new Date();
        await shop.save();

        // Cập nhật thông tin user
        await User.findByIdAndUpdate(shop.owner, { $set: { shopId: null } });

        return successResponse(res, 'Đã từ chối tạo shop thành công', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi từ chối tạo shop', 500, error.message);
    }
};

// Duyệt xóa shop 
exports.approveDeleteShop = async (req, res) => {
    const { shopId } = req.params;
    const { deleteNote } = req.body;

    try {
        // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);
        
        // Kiểm tra trạng thái
        if (shop.status.approvalDeleteStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt xóa', 400);
            
        // Tìm chủ shop
        const ownerUser = await User.findById(shop.owner);
        if (!ownerUser) return errorResponse(res, 'Không tìm thấy người dùng sở hữu shop', 404);

        // Cập nhật trạng thái shop trước khi xóa
        shop.status.isApprovedDelete = true;
        shop.status.approvalDeleteStatus = "approved";
        shop.status.deleteNote = deleteNote || 'Đã duyệt xóa';
        shop.updatedAt = new Date();
        await shop.save();

        // Cập nhật thông tin người dùng
        ownerUser.shopId = null;
        ownerUser.role = 'buyer';
        ownerUser.isSellerActive = false;

        // Loại bỏ vai trò seller nếu có
        if (ownerUser.roles.includes('seller')) {
            ownerUser.roles = ownerUser.roles.filter(role => role !== 'seller');
        }

        await ownerUser.save();

        // Xóa shop khỏi hệ thống
        await Shop.deleteOne({ _id: shopId });

        return successResponse(res, 'Đã duyệt xóa shop và xóa shop khỏi nền tảng thành công', {shopId: shopId});
    } catch (error) {
        return errorResponse(res, 'Lỗi khi duyệt xóa shop', 500, error.message);
    }
};

// Từ chối xóa shop 
exports.rejectDeleteShop = async (req, res) => {
    const { shopId } = req.params;
    const { deleteNote } = req.body;
    try {
        // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);
        
        // Kiểm tra trạng thái
        if (shop.status.approvalDeleteStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt xóa', 400);

        // Cập nhật thông tin shop
        shop.status.isApprovedDelete = false;
        shop.status.approvalDeleteStatus = "rejected";
        shop.status.deleteNote = deleteNote || 'Từ chối xóa shop';
        shop.updatedAt = new Date();
        await shop.save();

        return successResponse(res, 'Đã từ chối xóa shop khỏi nền tảng', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi từ chối xóa shop', 500, error.message);
    }
};

// Lấy danh sách tất cả shop, có thể lọc theo trạng thái duyệt
exports.getAllShops = async (req, res) => {
    try {
        const {
            createStatus, // pending | approved | rejected
            deleteStatus, // pending | approved | rejected
            featureLevel, // normal | premium | vip
            page = 1,
            limit = 10
        } = req.query;

        const filter = {}; //ví dụ filter sẽ lưu như này: filter = { 'status.approvalCreateStatus': 'approved' }, nó sẽ lấy ra thế này: 'status.approvalCreateStatus': 'approved'

        // Lọc theo trạng thái duyệt tạo shop
        if (['pending', 'approved', 'rejected'].includes(createStatus)) {
            filter['status.approvalCreateStatus'] = createStatus;
        }

        // Lọc theo trạng thái duyệt xóa shop
        if (['pending', 'approved', 'rejected'].includes(deleteStatus)) {
            filter['status.approvalDeleteStatus'] = deleteStatus;
        }

        // Lọc theo cấp độ đặc quyền
        if (['normal', 'premium', 'vip'].includes(featureLevel)) {
            filter['status.featureLevel'] = featureLevel;
        }

        // Đếm tổng số shop thỏa điều kiện
        const total = await Shop.countDocuments(filter);

        // Lấy danh sách shop
        const shops = await Shop.find(filter)
            .populate('owner', 'fullName email avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return successResponse(res, 'Lấy danh sách shop thành công', {
            shops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop', 500, error.message);
    }
};

// Lấy danh sách shop đang chờ duyệt tạo
exports.getPendingCreateShops = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = { 'status.approvalCreateStatus': 'pending' };
        const total = await Shop.countDocuments(query);

        const pendingShops = await Shop.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('owner', 'fullName email avatar');

        return successResponse(res, 'Lấy danh sách shop đang chờ duyệt tạo thành công', {
            shops: pendingShops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop đang chờ duyệt tạo', 500, err.message);
    }
};

// Lấy danh sách shop đang chờ duyệt xóa
exports.getPendingDeleteShops = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = { 'status.approvalDeleteStatus': 'pending' };
        const total = await Shop.countDocuments(query);

        const pendingDeleteShops = await Shop.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('owner', 'fullName email avatar');

        return successResponse(res, 'Lấy danh sách shop đang chờ duyệt xóa thành công', {
            shops: pendingDeleteShops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop đang chờ duyệt xóa', 500, err.message);
    }
};

// Cập nhật cấp độ đặc quyền của shop (chỉ admin)
exports.updateShopFeatureLevel = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { featureLevel } = req.body;

        if (!['normal', 'premium', 'vip'].includes(featureLevel)) {
            return errorResponse(res, 'Cấp độ đặc quyền không hợp lệ', 400);
        }

        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        shop.status.featureLevel = featureLevel;
        shop.updatedAt = new Date();

        await shop.save();

        return successResponse(res, `Đã cập nhật cấp độ đặc quyền của shop thành ${featureLevel}`, shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật cấp độ đặc quyền của shop', 500, error.message);
    }
};

