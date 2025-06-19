const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ admin được phép
router.get('/', verifyToken, requireRole('admin'), adminProductController.getAllProductsForAdmin);

router.get('/:productId', adminProductController.getProductDetails);
router.put('/:productId', adminProductController.updateProduct);
router.put('/:productId/deactivate', adminProductController.softDeleteProduct); // ngừng bán
router.delete('/:productId', adminProductController.deleteProductPermanently);  // xóa vĩnh viễn

// Cập nhật hàng loạt sản phẩm
router.put('/bulk-update', verifyToken, requireRole('admin'), adminProductController.bulkUpdateProducts);

// Export danh sách sản phẩm
router.get('/export', verifyToken, requireRole('admin'), adminProductController.exportProducts);

module.exports = router;
