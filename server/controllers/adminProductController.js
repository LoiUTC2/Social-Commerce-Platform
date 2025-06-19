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
            { hashtags: regex }
        ];
    }

    try {
        const products = await Product.find(query)
            .populate('seller', 'name email avatar') // hiển thị seller
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

exports.getProductDetails = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId)
            .populate('seller', 'name avatar')
            .populate('mainCategory', 'name')
            .lean();

        if (!product) return errorResponse(res, 'Không tìm thấy sản phẩm', 404);

        return successResponse(res, 'Chi tiết sản phẩm', product);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy chi tiết sản phẩm', 500, err.message);
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const updateData = req.body;

        const updated = await Product.findByIdAndUpdate(productId, updateData, {
            new: true,
            runValidators: true,
        });

        if (!updated) return errorResponse(res, 'Không tìm thấy sản phẩm', 404);

        return successResponse(res, 'Cập nhật sản phẩm thành công', updated);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật sản phẩm', 500, err.message);
    }
};

exports.softDeleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 'Không tìm thấy sản phẩm', 404);

        product.isActive = false;
        product.updatedAt = new Date();

        await product.save();

        return successResponse(res, 'Sản phẩm đã được ngừng bán');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi ngừng bán sản phẩm', 500, err.message);
    }
};

exports.deleteProductPermanently = async (req, res) => {
    try {
        const { productId } = req.params;

        const result = await Product.findByIdAndDelete(productId);

        if (!result) return errorResponse(res, 'Không tìm thấy sản phẩm', 404);

        return successResponse(res, 'Đã xóa sản phẩm vĩnh viễn');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa sản phẩm', 500, err.message);
    }
};

// Cập nhật hàng loạt sản phẩm
exports.bulkUpdateProducts = async (req, res) => {
    try {
        const { productIds, updateData } = req.body;

        if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
            return errorResponse(res, 'Danh sách sản phẩm không hợp lệ', 400);
        }

        if (!updateData || Object.keys(updateData).length === 0) {
            return errorResponse(res, 'Dữ liệu cập nhật không hợp lệ', 400);
        }

        // Cập nhật nhiều sản phẩm cùng lúc
        const result = await Product.updateMany(
            { _id: { $in: productIds } },
            { 
                ...updateData,
                updatedAt: new Date()
            },
            { runValidators: true }
        );

        if (result.matchedCount === 0) {
            return errorResponse(res, 'Không tìm thấy sản phẩm nào để cập nhật', 404);
        }

        return successResponse(res, `Đã cập nhật ${result.modifiedCount}/${productIds.length} sản phẩm thành công`, {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
            totalRequested: productIds.length
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật hàng loạt sản phẩm', 500, err.message);
    }
};

// Export danh sách sản phẩm ra file CSV/Excel
exports.exportProducts = async (req, res) => {
    try {
        const { format = 'csv', ...filters } = req.query;

        // Xây dựng query tương tự như getAllProductsForAdmin
        const query = {};

        if (typeof filters.isActive !== 'undefined') {
            query.isActive = filters.isActive === 'true';
        }

        if (filters.seller) {
            query.seller = filters.seller;
        }

        if (filters.keyword) {
            const regex = new RegExp(filters.keyword, 'i');
            query.$or = [
                { name: regex },
                { description: regex },
                { hashtags: regex }
            ];
        }

        // Lấy tất cả sản phẩm theo query (không phân trang)
        const products = await Product.find(query)
            .populate('seller', 'name email')
            .populate('mainCategory', 'name')
            .sort({ createdAt: -1 })
            .lean();

        if (products.length === 0) {
            return errorResponse(res, 'Không có sản phẩm nào để export', 404);
        }

        // Chuẩn bị dữ liệu export
        const exportData = products.map(product => ({
            'ID': product._id,
            'Tên sản phẩm': product.name,
            'SKU': product.sku,
            'Giá': product.price,
            'Giảm giá': product.discount,
            'Tồn kho': product.stock,
            'Đã bán': product.soldCount,
            'Trạng thái': product.isActive ? 'Đang bán' : 'Ngừng bán',
            'Shop': product.seller?.name || '',
            'Email Shop': product.seller?.email || '',
            'Danh mục': product.mainCategory?.name || '',
            'Thương hiệu': product.brand || '',
            'Tình trạng': product.condition === 'new' ? 'Mới' : 'Đã sử dụng',
            'Đánh giá TB': product.ratings?.avg || 0,
            'Số đánh giá': product.ratings?.count || 0,
            'Hashtags': product.hashtags?.join(', ') || '',
            'Ngày tạo': new Date(product.createdAt).toLocaleDateString('vi-VN'),
            'Cập nhật lần cuối': new Date(product.updatedAt).toLocaleDateString('vi-VN')
        }));

        if (format === 'json') {
            // Trả về JSON
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=products_${Date.now()}.json`);
            return res.json({
                success: true,
                message: 'Export thành công',
                data: exportData,
                totalRecords: exportData.length,
                exportedAt: new Date().toISOString()
            });
        } else {
            // Trả về CSV (mặc định)
            const csvHeader = Object.keys(exportData[0]).join(',');
            const csvRows = exportData.map(row => 
                Object.values(row).map(value => 
                    typeof value === 'string' && value.includes(',') 
                        ? `"${value.replace(/"/g, '""')}"` // Escape quotes trong CSV
                        : value
                ).join(',')
            );
            const csvContent = [csvHeader, ...csvRows].join('\n');

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename=products_${Date.now()}.csv`);
            
            // Thêm BOM để Excel đọc được UTF-8
            return res.send('\ufeff' + csvContent);
        }

    } catch (err) {
        return errorResponse(res, 'Lỗi khi export sản phẩm', 500, err.message);
    }
};