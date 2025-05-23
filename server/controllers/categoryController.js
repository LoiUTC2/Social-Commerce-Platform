const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');
// [POST] Tạo danh mục mới
exports.createCategory = async (req, res) => {
    const user = req.user.userId;
    try {
        const { name, parent, level } = req.body;

        // Kiểm tra xem tên danh mục, level và parent có bị trùng không
        const existingCategory = await Category.findOne({ name, level, parent });
        if (existingCategory) {
            return errorResponse(res, 'Danh mục đã tồn tại ở cùng cấp và danh mục cha', 400);
        }

        // Kiểm tra thêm nếu chỉ trùng tên và level
        const existingCategoryNameAndLevel = await Category.findOne({ name, level });
        if (existingCategoryNameAndLevel) {
            return errorResponse(res, 'Danh mục đã tồn tại ở cùng cấp', 400);
        }

        // Kiểm tra thêm nếu chỉ trùng tên và parent
        const existingCategoryNameAndParent = await Category.findOne({ name, parent });
        if (existingCategoryNameAndParent) {
            return errorResponse(res, 'Danh mục đã tồn tại ở cùng danh mục cha', 400);
        }

        const category = new Category({ ...req.body, createdBy: user });
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
        const { name, parent, level } = req.body;

        // Kiểm tra xem danh mục có tồn tại không
        const categoryToUpdate = await Category.findById(categoryId);
        if (!categoryToUpdate) {
            return errorResponse(res, 'Không tìm thấy danh mục', 404);
        }

        // Kiểm tra trùng lặp tên, level, parent (loại trừ chính nó)
        const existingCategory = await Category.findOne({
            _id: { $ne: categoryId }, // Loại trừ danh mục hiện tại đang được cập nhật
            name,
            level,
            parent,
        });
        if (existingCategory) {
            return errorResponse(res, 'Danh mục đã tồn tại ở cùng cấp và danh mục cha', 400);
        }

        // Kiểm tra thêm nếu chỉ trùng tên và level
        const existingCategoryNameAndLevel = await Category.findOne({
            _id: { $ne: categoryId },
            name,
            level
        });
        if (existingCategoryNameAndLevel) {
            return errorResponse(res, 'Danh mục đã tồn tại ở cùng cấp', 400);
        }

        // Kiểm tra thêm nếu chỉ trùng tên và parent
        const existingCategoryNameAndParent = await Category.findOne({
            _id: { $ne: categoryId },
            name,
            parent
        });
        if (existingCategoryNameAndParent) {
            return errorResponse(res, 'Danh mục đã tồn tại ở cùng danh mục cha', 400);
        }

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

exports.getCategoryTree = async (req, res) => {
    try {
        // Lấy tất cả danh mục và sắp xếp theo level và sortOrder
        const allCategories = await Category.find({ isActive: true })
            .sort({ level: 1, sortOrder: 1 })
            .lean();

        // Hàm đệ quy để xây dựng cây danh mục
        const buildTree = (categories, parentId = null) => {
            const tree = [];
            const filteredCategories = categories.filter(cat =>
                (parentId === null && !cat.parent) ||
                (cat.parent && cat.parent?.toString() === parentId?.toString())
            );

            for (const category of filteredCategories) {
                const children = buildTree(categories, category._id);
                if (children.length > 0) {
                    category.children = children;
                }
                tree.push(category);
            }

            return tree;
        };

        const categoryTree = buildTree(allCategories);

        return successResponse(res, 'Lấy cây danh mục thành công', categoryTree);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy cây danh mục', 500, error.message);
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