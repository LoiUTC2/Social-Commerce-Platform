const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');

// Lấy giỏ hàng
router.get('/', verifyToken, setActor, cartController.getCart);

// Lấy số lượng items trong giỏ hàng (cho header/badge)
router.get('/count', verifyToken, setActor, cartController.getCartCount);

// Thêm sản phẩm vào giỏ hàng
router.post('/add', verifyToken, setActor, cartController.addToCart);

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/update', verifyToken, setActor, cartController.updateCartItem);

// Xóa một sản phẩm khỏi giỏ hàng
router.delete('/remove', verifyToken, setActor, cartController.removeCartItem);

// Xóa nhiều sản phẩm khỏi giỏ hàng
router.delete('/remove-multiple', verifyToken, setActor, cartController.removeMultipleCartItems);

// Xóa toàn bộ giỏ hàng
router.delete('/clear', verifyToken, setActor, cartController.clearCart);

// Làm sạch giỏ hàng (xóa sản phẩm không còn active)
router.patch('/clean', verifyToken, setActor, cartController.cleanCart);

module.exports = router;