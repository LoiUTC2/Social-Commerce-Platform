const express = require('express');
const router = express.Router();
const adminUserController = require('../controllers/adminUserController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Middleware: Chỉ admin được phép truy cập các route này
router.use(verifyToken, requireRole('admin'));

// Route lấy danh sách tất cả người dùng với các bộ lọc
// GET /api/admin/users?page=1&limit=20&role=seller&isActive=true&keyword=john&hasShop=true&shopStatus=approved
router.get('/', adminUserController.getAllUsersForAdmin);

// Route tìm kiếm nâng cao
// GET /api/admin/users/search?email=john@example.com&phone=123456789&fullName=John&joinedFrom=2024-01-01
router.get('/search', adminUserController.advancedUserSearch);

// Route thống kê tổng quan
// GET /api/admin/users/statistics?period=30d
router.get('/statistics', adminUserController.getUserStatistics);

// Route lấy chi tiết một người dùng cụ thể
// GET /api/admin/users/123456789
router.get('/:userId', adminUserController.getUserDetails);

// Route cập nhật thông tin người dùng
// PUT /api/admin/users/123456789
router.put('/:userId', adminUserController.updateUser);

// Route thay đổi trạng thái kích hoạt/vô hiệu hóa
// PUT /api/admin/users/123456789/status
router.put('/:userId/status', adminUserController.toggleUserStatus);

// Route vô hiệu hóa người dùng (soft delete)
// PUT /api/admin/users/123456789/deactivate
router.put('/:userId/deactivate', adminUserController.softDeleteUser);

// Route xóa vĩnh viễn người dùng (cẩn thận sử dụng)
// DELETE /api/admin/users/123456789
router.delete('/:userId', adminUserController.deleteUserPermanently);

module.exports = router;