const express = require('express');
const router = express.Router();
const shopManagerController = require('../controllers/shopManagerController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ admin mới được quyền duyệt hoặc từ chối shop
router.use(verifyToken, requireRole('admin'));

// Lấy danh sách shop theo các điều kiện lọc
router.get('/', shopManagerController.getAllShops); // có query để lọc theo status 
router.get('/pending-create', shopManagerController.getPendingCreateShops);
router.get('/pending-delete', shopManagerController.getPendingDeleteShops);

// Duyệt/Từ chối tạo shop
router.put('/approve-create/:shopId', shopManagerController.approveCreateShop);
router.put('/reject-create/:shopId', shopManagerController.rejectCreateShop);

// Duyệt/Từ chối xóa shop
router.put('/approve-delete/:shopId', shopManagerController.approveDeleteShop);
router.put('/reject-delete/:shopId', shopManagerController.rejectDeleteShop);

// Cập nhật cấp độ đặc quyền của shop
router.put('/feature-level/:shopId', shopManagerController.updateShopFeatureLevel);

/// duyệt xóa tài khoản seller, tránh trường hợp seller nợ rồi xóa shop
module.exports = router;
