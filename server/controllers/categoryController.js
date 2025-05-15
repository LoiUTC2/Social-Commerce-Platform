const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');

// [POST] Tạo danh mục mới
exports.createCategory = async (req, res) => {
    try {
        const category = new Category(req.body);
        const saved = await category.save();
        return successResponse(res, 'Tạo danh mục thành công', saved);
    } catch (error) {
        return errorResponse(res, 'Lỗi tạo danh mục', 500, error.message);
    }
};

// [PUT] Cập nhật danh mục
exports.updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const updated = await Category.findByIdAndUpdate(categoryId, req.body, { new: true });
        if (!updated) return errorResponse(res, 'Không tìm thấy danh mục', 404);
        return successResponse(res, 'Cập nhật danh mục thành công', updated);
    } catch (error) {
        return errorResponse(res, 'Lỗi cập nhật danh mục', 500, error.message);
    }
};

// [DELETE] Xoá danh mục
exports.deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const deleted = await Category.findByIdAndDelete(categoryId);
        if (!deleted) return errorResponse(res, 'Không tìm thấy danh mục', 404);
        return successResponse(res, 'Xoá danh mục thành công');
    } catch (error) {
        return errorResponse(res, 'Lỗi xoá danh mục', 500, error.message);
    }
};

// Đệ quy tạo cây danh mục
const buildCategoryTree = (categories, parent = null) => {
    return categories
        .filter(cat => String(cat.parentCategory) === String(parent))
        .map(cat => ({
            ...cat._doc,
            children: buildCategoryTree(categories, cat._id)
        }));
};

// [GET] Lấy cây danh mục (parent → children)
exports.getCategoryTree = async (req, res) => {
    try {
        const categories = await Category.find().sort({ sortOrder: 1 });

        const tree = buildCategoryTree(categories, null); // parentCategory = null là danh mục gốc

        return successResponse(res, 'Lấy cây danh mục thành công', tree);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi tạo cây danh mục', 500, error.message);
    }
};

// [GET] Lấy tất cả danh mục (có thể thêm phân trang/lọc)
exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ sortOrder: 1, createdAt: -1 });
        return successResponse(res, 'Lấy danh sách danh mục thành công', categories);
    } catch (error) {
        return errorResponse(res, 'Lỗi lấy danh mục', 500, error.message);
    }
};

// [GET] Lấy danh sách danh mục theo cấp độ
exports.getCategoriesByLevel = async (req, res) => {
    try {
        const { level } = req.query;

        if (!level) {
            return errorResponse(res, 'Vui lòng cung cấp cấp độ (level)', 400);
        }

        let query = {};

        if (level !== 'all') {
            const levelNum = parseInt(level);
            if (isNaN(levelNum)) return errorResponse(res, 'Cấp độ không hợp lệ', 400);
            query.level = levelNum;
        }

        const categories = await Category.find(query).sort({ sortOrder: 1, createdAt: -1 });

        return successResponse(res, `Lấy danh mục cấp ${level} thành công`, categories);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh mục theo cấp', 500, error.message);
    }
};

// [GET] Lấy danh mục theo ID
exports.getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findById(categoryId);
        if (!category) return errorResponse(res, 'Không tìm thấy danh mục', 404);
        return successResponse(res, 'Lấy danh mục thành công', category);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh mục', 500, error.message);
    }
};