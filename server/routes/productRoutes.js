const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, requireRole, checkProductOwnership} = require('../middleware/authMiddleware');

// Thêm sản phẩm
router.post('/', verifyToken,  requireRole(['seller', 'admin']), productController.createProduct);

// Cập nhật sản phẩm
router.put('/:id', verifyToken, requireRole(['seller', 'admin']), checkProductOwnership, productController.updateProduct);

// Xóa sản phẩm
router.delete('/:productId', verifyToken, requireRole(['seller', 'admin']), checkProductOwnership, productController.deleteProduct);  // có query để xóa mềm (xóa theo kiểu thùng rác) và cứng

// Khôi phục sản phẩm
router.patch('/restore/:productId', verifyToken, requireRole(['seller', 'admin']), checkProductOwnership, productController.restoreProduct);

// Lấy danh sách sản phẩm nổi bật (dựa vào soldCount và rating)
router.get('/featured', productController.getFeaturedProducts);

//Lấy danh sách sản phẩm gợi ý (dựa theo hành vi UserInteraction + random fallback)
router.get('/suggested', productController.getSuggestedProducts);

// Lấy tất cả sản phẩm thuộc 1 shop (seller), sort mới nhất
router.get('/shop/:seller', productController.getProductsByShop);

module.exports = router;
