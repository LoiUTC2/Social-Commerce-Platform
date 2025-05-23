const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, setActor ,requireRole, checkProductOwnership} = require('../middleware/authMiddleware');

// Thêm sản phẩm
router.post('/', verifyToken, setActor, requireRole(['seller', 'admin']), productController.createProduct);

// Cập nhật sản phẩm
router.put('/:slug', verifyToken, setActor,requireRole(['seller', 'admin']), checkProductOwnership, productController.updateProduct);

// Xóa sản phẩm
router.delete('/:productId', verifyToken, setActor,requireRole(['seller', 'admin']), checkProductOwnership, productController.deleteProduct);  // có query để xóa mềm (xóa theo kiểu thùng rác) và cứng

// Chuyển đổi trạng thái sản phẩm (đang bán hoặc ngừng bán)
router.patch('/toggleStatus/:productId', verifyToken, setActor,requireRole(['seller', 'admin']), checkProductOwnership, productController.toggleProductActiveStatus);

// Lấy danh sách sản phẩm nổi bật (dựa vào soldCount và rating)
router.get('/featured', productController.getFeaturedProducts);

//Lấy danh sách sản phẩm gợi ý (dựa theo hành vi UserInteraction + random fallback)
router.get('/suggested', verifyToken, setActor, productController.getSuggestedProducts);

// Lấy tất cả sản phẩm thuộc 1 shop (seller) show lên sàn cho user xem, sort mới nhất
router.get('/getAllForUser/:seller', productController.getProductsByShopForUser);

// Lấy thông tin chi tiết sản phẩm (cho người dùng)
router.get('/getDetailForUser/:slug', verifyToken, setActor,productController.getProductDetailForUser);

// Lấy tất cả sản phẩm thuộc 1 shop (seller) show lên trang seller cho seller xem, sort mới nhất
router.get('/getAllForSeller/:seller', verifyToken, setActor, requireRole(['seller', 'admin']),productController.getProductsByShopForShop);

// Lấy thông tin chi tiết sản phẩm (cho seller quản lý)
router.get('/getDetailForSeller/:slug', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.getProductDetailForSeller);

// Tìm kiếm sản phẩm bằng slug
router.get('/slug/:slug', verifyToken, setActor ,productController.getProductBySlug);
module.exports = router;
