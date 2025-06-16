const express = require('express');
const router = express.Router();
const savedPostController = require('../controllers/savedPostController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');

const middlewares = [verifyToken, setActor];

// Toggle save/unsave bài viết
router.post('/toggle/:postId', ...middlewares, savedPostController.toggleSavePost);

// Lấy danh sách bài viết đã lưu
router.get('/', verifyToken, setActor, savedPostController.getSavedPosts);

// Kiểm tra xem bài viết đã được lưu chưa
router.get('/check/:postId', verifyToken, setActor, savedPostController.checkSavedPost);

module.exports = router;
