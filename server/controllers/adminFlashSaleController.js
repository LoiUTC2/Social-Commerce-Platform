const FlashSale = require('../models/FlashSale');
const { successResponse, errorResponse } = require('../utils/response');
const Product = require('../models/Product');

// ✅ Duyệt Flash Sale
exports.approveFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.actor?._id;

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        flashSale.approvalStatus = 'approved';
        flashSale.isActive = true;
        flashSale.isHidden = false;
        flashSale.updatedBy = adminId;
        flashSale.updatedAt = new Date();

        await flashSale.save();
        return successResponse(res, 'Duyệt Flash Sale thành công');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi duyệt Flash Sale', 500, err.message);
    }
};

// ❌ Từ chối Flash Sale
exports.rejectFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.actor?._id;

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        flashSale.approvalStatus = 'rejected';
        flashSale.isActive = false;
        flashSale.isHidden = true;
        flashSale.updatedBy = adminId;
        flashSale.updatedAt = new Date();

        await flashSale.save();
        return successResponse(res, 'Từ chối Flash Sale thành công');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi từ chối Flash Sale', 500, err.message);
    }
};

//admin lọc danh sách các Flash Sale theo trạng thái duyệt
exports.getFlashSalesByApprovalStatus = async (req, res) => {
    try {
        const { approvalStatus } = req.query;
        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const filter = {};
        if (approvalStatus) {
            const allowedStatuses = ['pending', 'approved', 'rejected'];
            if (!allowedStatuses.includes(approvalStatus)) {
                return errorResponse(res, 'Trạng thái không hợp lệ', 400);
            }
            filter.approvalStatus = approvalStatus;
        }

        const [flashSales, total] = await Promise.all([
            FlashSale.find(filter)
                .populate('createdBy', 'fullName email role')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            FlashSale.countDocuments(filter)
        ]);

        return successResponse(res, 'Lấy danh sách Flash Sale thành công', {
            items: flashSales,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách Flash Sale', 500, err.message);
    }
};


//xem chi tiết một Flash Sale bất kỳ
exports.getFlashSaleDetailsByAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        const flashSale = await FlashSale.findById(id)
            .populate('createdBy', 'fullName email role')
            .lean();

        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        // Lấy chi tiết sản phẩm
        const productIds = flashSale.products.map(p => p.product);
        const products = await Product.find({ _id: { $in: productIds } })
            .select('name images price discount stock slug ratings seller isActive')
            .populate('seller', 'fullName avatar');

        const productMap = {};
        flashSale.products.forEach(p => {
            productMap[p.product.toString()] = {
                salePrice: p.salePrice,
                stockLimit: p.stockLimit,
                soldCount: p.soldCount
            };
        });

        const saleProducts = products.map(p => ({
            ...p.toObject(),
            flashSale: productMap[p._id.toString()]
        }));

        return successResponse(res, 'Chi tiết Flash Sale (admin)', {
            ...flashSale,
            saleProducts
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy chi tiết Flash Sale cho admin', 500, err.message);
    }
};
