const express = require('express');
const router = express.Router();
const shopManagerController = require('../controllers/adminShopController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ admin mới được quyền duyệt hoặc từ chối shop
router.use(verifyToken, requireRole('admin'));

// ============ QUẢN LÝ SHOP ============
// Lấy thống kê tổng quan về shops
router.get('/overview', shopManagerController.getShopsOverview);

// Lấy danh sách shop để quản lý (với filter và search đầy đủ)
router.get('/management', shopManagerController.getAllShopsForManagement);

// Lấy danh sách shop theo các điều kiện lọc (cho việc duyệt)
router.get('/', shopManagerController.getAllShops);

// Lấy danh sách shop chờ duyệt
router.get('/pending-create', shopManagerController.getPendingCreateShops);
router.get('/pending-delete', shopManagerController.getPendingDeleteShops);

// ============ THAO TÁC VỚI SHOP ============
// Duyệt/Từ chối tạo shop
router.put('/approve-create/:shopId', shopManagerController.approveCreateShop);
router.put('/reject-create/:shopId', shopManagerController.rejectCreateShop);

// Duyệt/Từ chối xóa shop
router.put('/approve-delete/:shopId', shopManagerController.approveDeleteShop);
router.put('/reject-delete/:shopId', shopManagerController.rejectDeleteShop);

// Tạm dừng và khôi phục shop
router.put('/suspend/:shopId', shopManagerController.suspendShop);
router.put('/restore/:shopId', shopManagerController.restoreShop);

// Cập nhật cấp độ đặc quyền của shop
router.put('/feature-level/:shopId', shopManagerController.updateShopFeatureLevel);

// Cập nhật thông tin cơ bản
router.put('/:shopId/basic-info', shopManagerController.updateShopBasicInfo);
// Xóa vĩnh viễn shop (admin)
router.delete('/:shopId', shopManagerController.deleteShopByAdmin);

// ============ XEM THÔNG TIN SHOP ============
// Lấy chi tiết shop (phải để cuối để tránh conflict với các route khác)
router.get('/:shopId', shopManagerController.getShopDetailsByAdmin);

module.exports = router;