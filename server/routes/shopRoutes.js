const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { verifyToken, setActor, requireRole, checkShopOwnership } = require('../middleware/authMiddleware');
const { trackView } = require('../middleware/interactionMiddleware');

// Chuyển đổi vai trò người dùng
router.post('/switch-role', verifyToken, setActor, shopController.switchUserRole);

// Tạo và quản lý shop
router.post('/', verifyToken, setActor, requireRole(['buyer', 'seller']), shopController.createShop);
// router.post('/', shopController.createShop);

router.put('/', verifyToken, setActor, requireRole('seller'), checkShopOwnership, shopController.updateShop);
router.post('/request-delete', verifyToken, setActor, requireRole('seller'), shopController.requestDeleteShop);
router.patch('/toggle-status', verifyToken, setActor, requireRole('seller'), shopController.toggleShopActiveStatus);

// Theo dõi/Hủy theo dõi shop
router.patch('/:shopId/follow', verifyToken, setActor, shopController.toggleFollowShop);

// Lấy thông tin shop
router.get('/my-shop', verifyToken, setActor, requireRole('seller'), shopController.getMyShop);
router.get('/followed', verifyToken, setActor, shopController.getFollowedShops);
router.get('/slug/:slug', trackView('shop'), shopController.getShopBySlug);
router.get('/', shopController.getShops);

// Kiểm tra quyền sở hữu shop
router.get('/:shopId/is-owner', verifyToken, shopController.isShopOwner);

module.exports = router;