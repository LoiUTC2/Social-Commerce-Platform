const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken, setActor, requireRole, checkProductOwnership } = require('../middleware/authMiddleware');
const { trackView } = require('../middleware/interactionMiddleware');

// Thêm sản phẩm
router.post('/', verifyToken, setActor, requireRole(['seller', 'admin']), productController.createProduct);

// Cập nhật sản phẩm
router.put('/:slug', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.updateProduct);

// Xóa sản phẩm
router.delete('/:productId', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.deleteProduct);

// Chuyển đổi trạng thái sản phẩm
router.patch('/toggleStatus/:productId', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.toggleProductActiveStatus);

// Bật/tắt allowPosts
router.patch('/:productId/toggleAllowPosts', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.toggleAllowPosts);

// Lấy sản phẩm cho phép đăng bài viết
router.get('/forPosts', verifyToken, setActor, productController.getFeaturedProductsForPosts);

// Lấy danh sách sản phẩm nổi bật
router.get('/featured', productController.getFeaturedProducts);

// Lấy danh sách sản phẩm gợi ý
router.get('/suggested', verifyToken, setActor, productController.getSuggestedProducts);

// Lấy tất cả sản phẩm của shop (cho user)
router.get('/getAllForUser/:seller', productController.getProductsByShopForUser);

// Lấy chi tiết sản phẩm (cho user)
router.get('/getDetailForUser/:slug', verifyToken, setActor, trackView('product'), productController.getProductDetailForUser);

// Lấy tất cả sản phẩm của shop (cho seller)
router.get('/getAllForSeller/:seller', verifyToken, setActor, requireRole(['seller', 'admin']), productController.getProductsByShopForShop);

// Lấy chi tiết sản phẩm (cho seller)
router.get('/getDetailForSeller/:slug', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.getProductDetailForSeller);

// Tìm kiếm sản phẩm bằng slug
router.get('/slug/:slug', verifyToken, setActor, trackView('product'), productController.getProductBySlug);

// Lấy danh sách bài viết của sản phẩm
router.get('/:productId/posts', verifyToken, setActor, trackView('product'), productController.getProductPosts);

// Thêm bài viết vào sản phẩm
router.post('/:productId/posts', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.addPostToProduct);

// Xóa bài viết khỏi sản phẩm
router.delete('/:productId/posts/:postId', verifyToken, setActor, requireRole(['seller', 'admin']), checkProductOwnership, productController.removePostFromProduct);

module.exports = router;