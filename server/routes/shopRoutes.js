const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { verifyToken, requireRole, checkShopOwnership } = require('../middleware/authMiddleware');

// Bật chế độ người bán (chỉ user đã đăng nhập mới bật được)
router.post('/activate-seller', verifyToken, shopController.activateSellerMode);

router.post('/', verifyToken, shopController.createShop);
router.put('/', verifyToken, requireRole(['seller', 'admin']), checkShopOwnership, shopController.updateShop);
router.delete('/:shopId', verifyToken, requireRole(['seller', 'admin']), checkShopOwnership, shopController.deleteShop);
router.patch('/restore', verifyToken, requireRole(['seller', 'admin']), checkShopOwnership, shopController.restoreShop);

router.patch('/:shopId/follow', verifyToken, shopController.toggleFollowShop);

router.get('/:shopId', shopController.getShopById); // Không cần verify nếu cho phép public xem shop

module.exports = router;
