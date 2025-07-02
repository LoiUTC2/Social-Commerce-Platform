const Category = require('../models/Category');
const { successResponse, errorResponse } = require('../utils/response');

// [POST] Tạo danh mục mới
exports.createCategory = async (req, res) => {
    const user = req.user.userId;
    try {
        const { name, parent } = req.body;

        // ✅ SỬ DỤNG STATIC METHOD: Kiểm tra trùng lặp thông minh hơn
        const duplicateCheck = await Category.checkDuplicate(name, parent);
        if (duplicateCheck.exists) {
            return errorResponse(res, duplicateCheck.message, 400);
        }

        const category = new Category({
            ...req.body,
            createdBy: user,
            updatedBy: user
        });

        const saved = await category.save();

        // ✅ SỬ DỤNG STATIC METHOD: Trả về breadcrumb luôn
        const breadcrumb = await Category.getBreadcrumb(saved._id);

        return successResponse(res, 'Tạo danh mục thành công', {
            category: saved,
            breadcrumb
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi tạo danh mục', 500, error.message);
    }
};

// [PUT] Cập nhật danh mục
exports.updateCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { name, parent } = req.body;

        // Kiểm tra danh mục tồn tại
        const categoryToUpdate = await Category.findById(categoryId);
        if (!categoryToUpdate) {
            return errorResponse(res, 'Không tìm thấy danh mục', 404);
        }

        // ✅ SỬ DỤNG STATIC METHOD: Kiểm tra trùng lặp (loại trừ chính nó)
        const duplicateCheck = await Category.checkDuplicate(name, parent, categoryId);
        if (duplicateCheck.exists) {
            return errorResponse(res, duplicateCheck.message, 400);
        }

        // Cập nhật thông tin
        const updated = await Category.findByIdAndUpdate(
            categoryId,
            // { ...req.body, updatedBy: req.user.userId },
            { ...req.body},

            { new: true, runValidators: true }
        );

        if (!updated) return errorResponse(res, 'Không tìm thấy danh mục', 404);

        // ✅ SỬ DỤNG STATIC METHOD: Trả về breadcrumb
        const breadcrumb = await Category.getBreadcrumb(updated._id);

        return successResponse(res, 'Cập nhật danh mục thành công', {
            category: updated,
            breadcrumb
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi cập nhật danh mục', 500, error.message);
    }
};

// [DELETE] Xoá danh mục - CẢI TIẾN QUAN TRỌNG
exports.deleteCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // ✅ SỬ DỤNG STATIC METHOD: Kiểm tra có thể xóa không
        const deleteCheck = await Category.canDelete(categoryId);
        if (!deleteCheck.canDelete) {
            return errorResponse(res, deleteCheck.reason, 400);
        }

        const deleted = await Category.findByIdAndDelete(categoryId);
        if (!deleted) {
            return errorResponse(res, 'Không tìm thấy danh mục', 404);
        }

        return successResponse(res, 'Xoá danh mục thành công');
    } catch (error) {
        return errorResponse(res, 'Lỗi xoá danh mục', 500, error.message);
    }
};

// [GET] Lấy danh mục theo ID - CẢI TIẾN
exports.getCategoryById = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const category = await Category.findById(categoryId);
        if (!category) return errorResponse(res, 'Không tìm thấy danh mục', 404);

        // ✅ SỬ DỤNG STATIC METHOD: Lấy breadcrumb và children
        const [breadcrumb, children] = await Promise.all([
            Category.getBreadcrumb(categoryId),
            Category.find({ parent: categoryId }).sort({ sortOrder: 1 })
        ]);

        return successResponse(res, 'Lấy danh mục thành công', {
            category,
            breadcrumb,
            children,
            hasChildren: children.length > 0
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh mục', 500, error.message);
    }
};

// ✅ API MỚI: Lấy breadcrumb cho 1 danh mục
exports.getCategoryBreadcrumb = async (req, res) => {
    try {
        const { categoryId } = req.params;

        const breadcrumb = await Category.getBreadcrumb(categoryId);

        if (breadcrumb.length === 0) {
            return errorResponse(res, 'Không tìm thấy danh mục', 404);
        }

        return successResponse(res, 'Lấy breadcrumb thành công', breadcrumb);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy breadcrumb', 500, error.message);
    }
};

// ✅ API MỚI: Lấy tất cả danh mục con
exports.getCategoryChildren = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { includeInactive = false } = req.query;

        const children = await Category.getAllChildren(categoryId);

        // Lọc theo trạng thái nếu cần
        const filteredChildren = includeInactive === 'true'
            ? children
            : children.filter(child => child.isActive);

        return successResponse(res, 'Lấy danh mục con thành công', {
            total: filteredChildren.length,
            children: filteredChildren
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh mục con', 500, error.message);
    }
};

// [GET] Lấy cây danh mục - SỬ DỤNG STATIC METHOD
exports.getCategoryTree = async (req, res) => {
    try {
        const {
            includeInactive = false,
            maxLevel,
            parentId,
            sortBy = 'sortOrder'
        } = req.query;

        // ✅ SỬ DỤNG STATIC METHOD từ model
        const categoryTree = await Category.buildCategoryTree({
            includeInactive: includeInactive === 'true',
            maxLevel: maxLevel ? parseInt(maxLevel) : null,
            parentId: parentId || null,
            sortBy
        });

        // Đếm tổng số categories trong tree
        const countCategories = (tree) => {
            return tree.reduce((count, cat) => {
                return count + 1 + (cat.children ? countCategories(cat.children) : 0);
            }, 0);
        };

        return successResponse(res, 'Lấy cây danh mục thành công', {
            total: countCategories(categoryTree),
            tree: categoryTree
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy cây danh mục', 500, error.message);
    }
};

// [GET] Lấy tất cả danh mục
exports.getAllCategories = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            level,
            parent,
            search,
            isActive,
            sortBy = 'sortOrder'
        } = req.query;

        // Xây dựng query
        let query = {};

        if (level && level !== 'all') {
            const levelNum = parseInt(level);
            if (!isNaN(levelNum)) query.level = levelNum;
        }

        if (parent) query.parent = parent;
        if (isActive !== undefined) query.isActive = isActive === 'true';

        if (search) {
            query.$text = { $search: search };
        }

        // Xây dựng sort
        let sort = {};
        switch (sortBy) {
            case 'name': sort = { name: 1 }; break;
            case 'level': sort = { level: 1, sortOrder: 1 }; break;
            case 'created': sort = { createdAt: -1 }; break;
            default: sort = { sortOrder: 1, createdAt: -1 };
        }

        // Thực hiện query với phân trang
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [categories, total] = await Promise.all([
            Category.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('parent', 'name slug')
                .lean(),
            Category.countDocuments(query)
        ]);

        return successResponse(res, 'Lấy danh sách danh mục thành công', {
            categories,
            pagination: {
                current: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });
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

        let query = { isActive: true };

        if (level !== 'all') {
            const levelNum = parseInt(level);
            if (isNaN(levelNum)) return errorResponse(res, 'Cấp độ không hợp lệ', 400);
            query.level = levelNum;
        }

        const categories = await Category.find(query)
            .sort({ sortOrder: 1, name: 1 })
            .populate('parent', 'name slug');

        return successResponse(res, `Lấy danh mục cấp ${level} thành công`, {
            level: level,
            total: categories.length,
            categories
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh mục theo cấp', 500, error.message);
    }
};

// ✅ API MỚI: Tìm kiếm danh mục - SỬ DỤNG STATIC METHOD
exports.searchCategories = async (req, res) => {
    try {
        const { q: searchTerm } = req.query;

        if (!searchTerm || searchTerm.trim().length < 2) {
            return errorResponse(res, 'Từ khóa tìm kiếm phải có ít nhất 2 ký tự', 400);
        }

        const {
            level,
            isActive = true,
            limit = 20
        } = req.query;

        // ✅ SỬ DỤNG STATIC METHOD từ model
        const results = await Category.searchCategories(searchTerm.trim(), {
            level: level ? parseInt(level) : null,
            isActive: isActive === 'true',
            limit: parseInt(limit)
        });

        return successResponse(res, 'Tìm kiếm danh mục thành công', {
            searchTerm: searchTerm.trim(),
            total: results.length,
            results
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi tìm kiếm danh mục', 500, error.message);
    }
};

// ✅ API MỚI: Lấy thống kê danh mục - SỬ DỤNG STATIC METHOD
exports.getCategoryStats = async (req, res) => {
    try {
        // ✅ SỬ DỤNG STATIC METHOD từ model
        const stats = await Category.getCategoryStats();

        return successResponse(res, 'Lấy thống kê danh mục thành công', stats);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thống kê danh mục', 500, error.message);
    }
};

// ✅ API MỚI: Di chuyển danh mục - SỬ DỤNG STATIC METHOD
exports.moveCategory = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { newParentId } = req.body;

        // ✅ SỬ DỤNG STATIC METHOD từ model
        const movedCategory = await Category.moveCategory(categoryId, newParentId);

        // Lấy breadcrumb mới sau khi di chuyển
        const breadcrumb = await Category.getBreadcrumb(categoryId);

        return successResponse(res, 'Di chuyển danh mục thành công', {
            category: movedCategory,
            breadcrumb
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi di chuyển danh mục', 500, error.message);
    }
};

// ✅ API MỚI: Kiểm tra có thể xóa danh mục không
exports.checkCanDelete = async (req, res) => {
    try {
        const { categoryId } = req.params;

        // ✅ SỬ DỤNG STATIC METHOD từ model
        const deleteCheck = await Category.canDelete(categoryId);

        return successResponse(res, 'Kiểm tra xóa danh mục thành công', deleteCheck);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi kiểm tra xóa danh mục', 500, error.message);
    }
};

// ✅ API MỚI: Cập nhật số lượng sản phẩm cho danh mục
exports.updateProductCount = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { productCount } = req.body;

        if (productCount === undefined || productCount < 0) {
            return errorResponse(res, 'Số lượng sản phẩm không hợp lệ', 400);
        }

        const updated = await Category.findByIdAndUpdate(
            categoryId,
            {
                productCount: parseInt(productCount),
                updatedBy: req.user.userId
            },
            { new: true }
        );

        if (!updated) {
            return errorResponse(res, 'Không tìm thấy danh mục', 404);
        }

        return successResponse(res, 'Cập nhật số lượng sản phẩm thành công', {
            category: updated
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật số lượng sản phẩm', 500, error.message);
    }
};

// ✅ API MỚI: Cập nhật số lượng shop cho danh mục
exports.updateShopCount = async (req, res) => {
    try {
        const { categoryId } = req.params;
        const { shopCount } = req.body;

        if (shopCount === undefined || shopCount < 0) {
            return errorResponse(res, 'Số lượng shop không hợp lệ', 400);
        }

        const updated = await Category.findByIdAndUpdate(
            categoryId,
            {
                shopCount: parseInt(shopCount),
                updatedBy: req.user.userId
            },
            { new: true }
        );

        if (!updated) {
            return errorResponse(res, 'Không tìm thấy danh mục', 404);
        }

        return successResponse(res, 'Cập nhật số lượng shop thành công', {
            category: updated
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật số lượng shop', 500, error.message);
    }
};

// ✅ API MỚI: Cập nhật thứ tự sắp xếp nhiều danh mục cùng lúc
exports.updateSortOrder = async (req, res) => {
    try {
        const { categories } = req.body; // Array of {id, sortOrder}

        if (!Array.isArray(categories) || categories.length === 0) {
            return errorResponse(res, 'Danh sách danh mục không hợp lệ', 400);
        }

        const updatePromises = categories.map(cat =>
            Category.findByIdAndUpdate(
                cat.id,
                {
                    sortOrder: parseInt(cat.sortOrder),
                    updatedBy: req.user.userId
                },
                { new: true }
            )
        );

        const updatedCategories = await Promise.all(updatePromises);

        // Lọc bỏ null values (danh mục không tìm thấy)
        const validUpdates = updatedCategories.filter(cat => cat !== null);

        return successResponse(res, 'Cập nhật thứ tự sắp xếp thành công', {
            updated: validUpdates.length,
            total: categories.length,
            categories: validUpdates
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật thứ tự sắp xếp', 500, error.message);
    }
};