const express = require('express');
const router = express.Router();
const adminPostController = require('../controllers/adminPostController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Tất cả các route đều yêu cầu quyền admin
router.use(verifyToken, requireRole('admin'));

// Lấy tất cả bài viết cho admin với phân trang và lọc
router.get('/', adminPostController.getAllPostsForAdmin);

// Tìm kiếm bài viết nâng cao
router.get('/search', adminPostController.advancedSearchPosts);

// Lấy thống kê bài viết
router.get('/statistics', adminPostController.getPostStatistics);

// Lấy chi tiết bài viết
router.get('/:postId', adminPostController.getPostDetails);

// Cập nhật bài viết
router.put('/:postId', adminPostController.updatePost);

// Cập nhật trạng thái tài trợ
router.put('/:postId/sponsored', adminPostController.updateSponsoredStatus);

// Xóa bài viết vĩnh viễn
router.delete('/:postId', adminPostController.deletePostPermanently);

module.exports = router;