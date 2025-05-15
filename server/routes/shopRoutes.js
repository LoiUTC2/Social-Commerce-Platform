const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { verifyToken, requireRole, checkShopOwnership } = require('../middleware/authMiddleware');

// Chuyển đổi vai trò người dùng
router.post('/switch-role', verifyToken, shopController.switchUserRole);

// Tạo và quản lý shop
router.post('/', verifyToken, requireRole(['buyer', 'seller']), shopController.createShop);
router.put('/', verifyToken, requireRole('seller'), checkShopOwnership, shopController.updateShop);
router.post('/request-delete', verifyToken, requireRole('seller'), shopController.requestDeleteShop);
router.patch('/toggle-status', verifyToken, requireRole('seller'), shopController.toggleShopActiveStatus);

// Theo dõi/Hủy theo dõi shop
router.patch('/:shopId/follow', verifyToken, shopController.toggleFollowShop);

// Lấy thông tin shop
router.get('/my-shop', verifyToken, requireRole('seller'), shopController.getMyShop);
router.get('/followed', verifyToken, shopController.getFollowedShops);
router.get('/:shopId', shopController.getShopById);
router.get('/', shopController.getShops);

// Kiểm tra quyền sở hữu shop
router.get('/:shopId/is-owner', verifyToken, shopController.isShopOwner);

module.exports = router;
