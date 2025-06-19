const { trackInteraction } = require('../middleware/interactionMiddleware');
const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');
const flashSaleService = require('../services/flashSaleService');
const { successResponse, errorResponse } = require('../utils/response');

exports.createFlashSale = async (req, res) => {
    try {
        const actor = req.actor;
        if (!actor) return errorResponse(res, 'Không xác định được người dùng', 403);

        const {
            name,
            description,
            hashtags,
            products, // [{ product, salePrice, stockLimit }]
            startTime,
            endTime,
            banner,
            isFeatured
        } = req.body;

        if (!name || !startTime || !endTime || !products?.length) {
            return errorResponse(res, 'Thiếu dữ liệu bắt buộc', 400);
        }

        const flashSale = await FlashSale.create({
            name,
            description,
            hashtags,
            products,
            startTime,
            endTime,
            banner,
            isFeatured,
            createdBy: actor._id,
            updatedBy: actor._id,
            approvalStatus: actor.type === 'admin' ? 'approved' : 'pending'
        });

        return successResponse(res, 'Tạo flash sale thành công', flashSale);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi tạo flash sale', 500, err.message);
    }
};

exports.updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const actor = req.actor;

        if (!actor) return errorResponse(res, 'Không xác định được người dùng', 403);

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        const isAdmin = req.user.role === 'admin';
        const isOwner = flashSale.createdBy?.toString() === actor._id.toString();

        if (!isAdmin && !isOwner) {
            return errorResponse(res, 'Bạn không có quyền sửa Flash Sale này', 403);
        }

        // Chuẩn bị dữ liệu cập nhật
        const allowedFields = [
            'name', 'description', 'hashtags', 'products', 'startTime', 'endTime',
            'banner', 'isFeatured', 'isHidden', 'isActive'
        ];
        const updateData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) updateData[field] = req.body[field];
        });

        updateData.updatedBy = actor._id;
        updateData.updatedAt = new Date();

        const updated = await FlashSale.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });

        return successResponse(res, 'Cập nhật Flash Sale thành công', updated);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật Flash Sale', 500, err.message);
    }
};

exports.softDeleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const actor = req.actor;

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        const isAdmin = req.user.role === 'admin';
        const isOwner = flashSale.createdBy?.toString() === actor._id.toString();

        if (!isAdmin && !isOwner) {
            return errorResponse(res, 'Bạn không có quyền xóa Flash Sale này', 403);
        }

        flashSale.isActive = false;
        flashSale.isHidden = true;
        flashSale.updatedBy = actor._id;
        flashSale.updatedAt = new Date();

        await flashSale.save();

        return successResponse(res, 'Đã xóa Flash Sale (mềm) thành công');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa Flash Sale', 500, err.message);
    }
};

exports.hardDeleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const actor = req.actor;

        const flashSale = await FlashSale.findById(id);
        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        const isAdmin = req.user.role === 'admin';
        const isOwner = flashSale.createdBy?.toString() === actor._id.toString();

        if (!isAdmin && !isOwner) {
            return errorResponse(res, 'Bạn không có quyền xóa Flash Sale này', 403);
        }

        await FlashSale.findByIdAndDelete(id);

        return successResponse(res, 'Đã xóa Flash Sale (mềm) thành công');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa Flash Sale', 500, err.message);
    }
};

//lấy danh sách các Flash Sale đang diễn ra
exports.getActiveFlashSales = async (req, res) => {
    try {
        const { page = 1, limit = 10, populateProducts = 'true' } = req.query;

        const result = await flashSaleService.getActiveFlashSales({
            page,
            limit,
            populateProducts: populateProducts === 'true'
        });

        return successResponse(res, 'Lấy danh sách Flash Sale đang hoạt động thành công', result);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy Flash Sale đang hoạt động', 500, err.message);
    }
};

//lấy danh sách các Flash Sale sắp diễn ra
exports.getUpcomingFlashSales = async (req, res) => {
    try {
        const { page = 1, limit = 10, populateProducts = 'true' } = req.query;

        const result = await flashSaleService.getUpcomingFlashSales({
            page,
            limit,
            populateProducts: populateProducts === 'true'
        });

        return successResponse(res, 'Lấy danh sách Flash Sale sắp diễn ra thành công', result);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy Flash Sale sắp diễn ra', 500, err.message);
    }
};

// Lấy tất cả Flash Sale cho trang chủ (NEW)
exports.getAllFlashSalesForHomepage = async (req, res) => {
    try {
        const { page = 1, limit = 20, populateProducts = 'true' } = req.query;

        const result = await flashSaleService.getAllFlashSalesForHomepage({
            page,
            limit,
            populateProducts: populateProducts === 'true'
        });

        return successResponse(res, 'Lấy danh sách Flash Sale cho trang chủ thành công', result);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy Flash Sale cho trang chủ', 500, err.message);
    }
};

// Lấy Flash Sale đã kết thúc (NEW)
exports.getEndedFlashSales = async (req, res) => {
    try {
        const { page = 1, limit = 10, populateProducts = 'false' } = req.query;

        const result = await flashSaleService.getEndedFlashSales({
            page,
            limit,
            populateProducts: populateProducts === 'true'
        });

        return successResponse(res, 'Lấy danh sách Flash Sale đã kết thúc thành công', result);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy Flash Sale đã kết thúc', 500, err.message);
    }
};

// Lấy top Flash Sale hot nhất (NEW)
exports.getHotFlashSales = async (req, res) => {
    try {
        const { limit = 5 } = req.query;

        const hotFlashSales = await flashSaleService.getHotFlashSales(parseInt(limit));

        return successResponse(res, 'Lấy danh sách Flash Sale hot thành công', {
            items: hotFlashSales,
            count: hotFlashSales.length
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy Flash Sale hot', 500, err.message);
    }
};

// ghi nhận hành vi mua Flash Sale
exports.trackFlashSalePurchase = async (req, res) => {
    try {
        const { id: flashSaleId } = req.params;
        const { purchasedProducts = [], totalAmount = 0 } = req.body; //totalAmount: tổng tiên mua hàng
        const actor = req.actor;

        if (!Array.isArray(purchasedProducts) || purchasedProducts.length === 0) {
            return errorResponse(res, 'Danh sách sản phẩm mua không hợp lệ', 400);
        }

        // Cập nhật soldCount từng sản phẩm trong flash sale
        const flashSale = await FlashSale.findById(flashSaleId)
            .populate({
                path: 'products.product',
                select: 'name mainCategory hashtags',
                populate: { path: 'mainCategory', select: 'name' }
            });
        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        // Bulk update soldCount
        let totalQuantity = 0;
        for (const item of purchasedProducts) {
            const match = flashSale.products.find(p => p.product._id.toString() === item.productId);
            if (match) {
                match.soldCount += item.quantity || 1;
                totalQuantity += item.quantity || 1;
            }
        }

        // Cập nhật thống kê chung với thông tin chi tiết hơn
        flashSale.stats.totalPurchases += 1;
        flashSale.stats.totalRevenue += totalAmount;

        // Cập nhật views và clicks nếu chưa có (estimate từ purchase)
        if (flashSale.stats.totalViews === 0) {
            flashSale.stats.totalViews = Math.max(flashSale.stats.totalPurchases * 10, 1);
        }
        if (flashSale.stats.totalClicks === 0) {
            flashSale.stats.totalClicks = Math.max(flashSale.stats.totalPurchases * 3, 1);
        }

        flashSale.updatedAt = new Date();
        await flashSale.save();

        // Chuẩn bị dữ liệu cho trackInteraction
        const targetDetails = {
            name: flashSale.name,
            productCount: purchasedProducts.length,
            products: purchasedProducts.map(item => {
                const product = flashSale.products.find(p => p.product._id.toString() === item.productId)?.product;
                return {
                    name: product?.name,
                    category: product?.mainCategory?.name,
                    hashtags: product?.hashtags || [],
                    salePrice: flashSale.products.find(p => p.product._id.toString() === item.productId)?.salePrice,
                    quantity: item.quantity || 1
                };
            }),
            totalAmount,
            conversionRate: flashSale.stats.totalClicks > 0
                ? (flashSale.stats.totalPurchases / flashSale.stats.totalClicks * 100).toFixed(2)
                : 0
        };

        // Gọi trackInteraction để ghi nhận hành vi purchase
        req.body = {
            targetType: 'flashsale',
            targetId: flashSaleId,
            action: 'purchase',
            targetDetails,
            metadata: {
                totalAmount,
                productCount: purchasedProducts.length,
                totalQuantity,
                productIds: purchasedProducts.map(item => item.productId)
            }
        };
        await trackInteraction(req, res, () => { });

        return successResponse(res, 'Đã ghi nhận lượt mua Flash Sale', {
            flashSaleStats: {
                totalPurchases: flashSale.stats.totalPurchases,
                totalRevenue: flashSale.stats.totalRevenue,
                conversionRate: targetDetails.conversionRate + '%'
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi ghi nhận mua hàng Flash Sale', 500, err.message);
    }
};

//Xem chi tiết, Dành cho người dùng (user/shop) đang xem trên sàn
exports.getFlashSaleForUser = async (req, res) => {
    try {
        const { id } = req.params;

        const flashSale = await FlashSale.findOne({
            _id: id,
            isActive: true,
            isHidden: false,
            approvalStatus: 'approved'
        }).lean();

        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        // Enrich với thông tin sản phẩm chi tiết
        const enrichedFlashSale = await flashSaleService.enrichFlashSaleWithProducts(flashSale);

        // Thêm thông tin trạng thái
        const statusInfo = flashSaleService.getFlashSaleStatus(flashSale);

        return successResponse(res, 'Chi tiết Flash Sale (người dùng)', {
            ...enrichedFlashSale,
            statusInfo
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy Flash Sale', 500, err.message);
    }
};

//Xem chi tiết, Dành cho seller (shop) đang quản lý chương trình
exports.getFlashSaleForSeller = async (req, res) => {
    try {
        const { id } = req.params;
        const actor = req.actor;

        if (!actor || actor.type !== 'Shop') {
            return errorResponse(res, 'Chỉ seller mới được xem chi tiết này', 403);
        }

        const flashSale = await FlashSale.findById(id).lean();
        if (!flashSale) return errorResponse(res, 'Không tìm thấy Flash Sale', 404);

        // Kiểm tra quyền sở hữu (có thể bỏ nếu admin/seller dùng chung)
        if (flashSale.createdBy?.toString() !== actor._id.toString() && actor.role !== 'admin') {
            return errorResponse(res, 'Không có quyền xem chương trình này', 403);
        }

        // Lấy sản phẩm
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

        return successResponse(res, 'Chi tiết Flash Sale (seller)', {
            ...flashSale,
            saleProducts
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy Flash Sale cho seller', 500, err.message);
    }
};

//lấy danh sách tất cả Flash Sale do chính họ tạo
exports.getMyFlashSales = async (req, res) => {
    try {
        const actor = req.actor;
        if (!actor || actor.type !== 'Shop') {
            return errorResponse(res, 'Chỉ tài khoản người bán mới được truy cập', 403);
        }

        const { page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [flashSales, total] = await Promise.all([
            FlashSale.find({ createdBy: actor._id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            FlashSale.countDocuments({ createdBy: actor._id })
        ]);

        return successResponse(res, 'Lấy danh sách Flash Sale của bạn thành công', {
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