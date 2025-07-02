const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// ============================================================================
// ROUTES CÔNG KHAI (Không cần đăng nhập)
// ============================================================================

// [GET] Lấy tất cả danh mục với các filter
router.get('/', categoryController.getAllCategories);

// [GET] Lấy cây danh mục
router.get('/tree', categoryController.getCategoryTree);

// [GET] Lấy danh mục theo cấp độ
router.get('/by-level', categoryController.getCategoriesByLevel);

// [GET] Tìm kiếm danh mục
router.get('/search', categoryController.searchCategories);

// [GET] Lấy thống kê danh mục
router.get('/stats', categoryController.getCategoryStats);

// [GET] Lấy danh mục theo ID (phải đặt cuối để tránh conflict với các route khác)
router.get('/:categoryId', categoryController.getCategoryById);

// [GET] Lấy breadcrumb của danh mục
router.get('/:categoryId/breadcrumb', categoryController.getCategoryBreadcrumb);

// [GET] Lấy tất cả danh mục con
router.get('/:categoryId/children', categoryController.getCategoryChildren);

// ============================================================================
// ROUTES CẦN ĐĂNG NHẬP (verifyToken)
// ============================================================================

// [GET] Kiểm tra có thể xóa danh mục không (cần đăng nhập để biết quyền)
router.get('/:categoryId/can-delete', verifyToken, categoryController.checkCanDelete);

// ============================================================================
// ROUTES CHỈ ADMIN (verifyToken + requireRole('admin'))
// ============================================================================

// [POST] Tạo danh mục mới
router.post('/', verifyToken, categoryController.createCategory); //hiện tại đang cho ai thêm cũng được

// [PUT] Cập nhật danh mục
// router.put('/:categoryId', verifyToken, requireRole('admin'), categoryController.updateCategory);
router.put('/:categoryId', categoryController.updateCategory);

// [DELETE] Xóa danh mục
router.delete('/:categoryId', verifyToken, requireRole('admin'), categoryController.deleteCategory);

// [PUT] Di chuyển danh mục
router.put('/:categoryId/move', verifyToken, requireRole('admin'), categoryController.moveCategory);

// [PUT] Cập nhật số lượng sản phẩm
router.put('/:categoryId/product-count', verifyToken, requireRole('admin'), categoryController.updateProductCount);

// [PUT] Cập nhật số lượng shop
router.put('/:categoryId/shop-count', verifyToken, requireRole('admin'), categoryController.updateShopCount);

// [PUT] Cập nhật thứ tự sắp xếp nhiều danh mục
router.put('/bulk/sort-order', verifyToken, requireRole('admin'), categoryController.updateSortOrder);

module.exports = router;