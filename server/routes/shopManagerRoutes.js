const express = require('express');
const router = express.Router();
const shopManagerController = require('../controllers/shopManagerController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ admin mới được quyền duyệt hoặc từ chối shop
router.use(verifyToken, requireRole('admin'));

router.get('/', shopManagerController.getAllShops); // có query để lọc theo status 
router.put('/approve/:shopId', shopManagerController.approveShop);
router.put('/reject/:shopId', shopManagerController.rejectShop);

/// duyệt xóa tài khoản seller, tránh trường hợp seller nợ rồi xóa shop
module.exports = router;
