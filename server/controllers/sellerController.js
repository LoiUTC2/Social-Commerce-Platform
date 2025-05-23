const Seller = require('../models/Seller');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

// [POST] Đăng ký thông tin người bán
exports.registerSeller = async (req, res) => {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    const shopId = user.shopId;

    try {
        const seller = new Seller({ user: userId, shop: shopId, ...req.body });

        const savedSeller = await seller.save();

        // Populate user và shop để trả về dữ liệu đầy đủ
        const populatedSeller = await Seller.findById(savedSeller._id)
            .populate('user', '-password')
            .populate('shop');

        return successResponse(res, 'Đăng ký người bán thành công', populatedSeller);
    } catch (error) {
        return errorResponse(res, 'Lỗi đăng ký người bán', 500, error.message);
    }
};

// [GET] Lấy thông tin người bán theo ID
exports.getSellerById = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const seller = await Seller.findById(sellerId).populate('user');
        if (!seller) {
            return errorResponse(res, 'Không tìm thấy người bán', 404);
        }
        return successResponse(res, 'Lấy thông tin người bán thành công', seller);
    } catch (error) {
        return errorResponse(res, 'Lỗi lấy thông tin người bán', 500, error.message);
    }
};

// [PUT] Cập nhật thông tin người bán
exports.updateSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const updatedSeller = await Seller.findByIdAndUpdate(sellerId, req.body, { new: true })
            .populate('user', '-password')
            .populate('shop');
        if (!updatedSeller) {
            return errorResponse(res, 'Không tìm thấy người bán', 404);
        }
        return successResponse(res, 'Cập nhật thông tin người bán thành công', updatedSeller);
    } catch (error) {
        return errorResponse(res, 'Lỗi cập nhật thông tin người bán', 500, error.message);
    }
};

// [DELETE] Xóa người bán (Cẩn trọng khi dùng)
exports.deleteSeller = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const deletedSeller = await Seller.findByIdAndDelete(sellerId);
        if (!deletedSeller) {
            return errorResponse(res, 'Không tìm thấy người bán', 404);
        }
        return successResponse(res, 'Xóa người bán thành công');
    } catch (error) {
        return errorResponse(res, 'Lỗi xóa người bán', 500, error.message);
    }
};

// [GET] Lấy danh sách tất cả người bán (có thể thêm phân trang/lọc)
exports.getAllSellers = async (req, res) => {
    try {
        const sellers = await Seller.find().populate('user', '-password');
        return successResponse(res, 'Lấy danh sách người bán thành công', sellers);
    } catch (error) {
        return errorResponse(res, 'Lỗi lấy danh sách người bán', 500, error.message);
    }
};

// [GET] Lấy thông tin người bán của chính tôi (người đang truy cập)
exports.getMySellerInfo = async (req, res) => {
    try {
        const userId = req.user.userId;

        const seller = await Seller.findOne({ user: userId }).populate('user', '-password');

        if (!seller) {
            return errorResponse(res, 'Bạn chưa đăng ký làm người bán', 404);
        }

        return successResponse(res, 'Lấy thông tin người bán thành công', seller);
    } catch (error) {
        return errorResponse(res, 'Lỗi lấy thông tin người bán', 500, error.message);
    }
};


// Các hàm xử lý nghiệp vụ phức tạp hơn (ví dụ: KYC)
exports.updateKycLevel = async (req, res) => {
    try {
        const { sellerId } = req.params;
        const { kycLevel, kycDetails } = req.body;

        const updatedSeller = await Seller.findByIdAndUpdate(
            sellerId,
            { kycLevel, kycDetails },
            { new: true }
        );

        if (!updatedSeller) {
            return errorResponse(res, 'Không tìm thấy người bán', 404);
        }

        return successResponse(res, 'Cập nhật cấp độ KYC thành công', updatedSeller);

    } catch (error) {
        return errorResponse(res, 'Lỗi cập nhật cấp độ KYC', 500, error.message);
    }
};