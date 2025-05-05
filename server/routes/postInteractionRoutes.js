const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const postInteractionController = require('../controllers/postInteractionController');

router.post('/:id/like', verifyToken, postInteractionController.likePost); // Like / Unlike bài viết

router.get('/:postId/likes', postInteractionController.getPostLikes); // lấy danh sách user đã like bài viết

router.post('/:postId/comment', verifyToken, postInteractionController.commentOrReply); // comment bài viết hoặc reply

router.post('/comment/:commentId/like', verifyToken, postInteractionController.likeComment); // like/bỏ like comment hoặc reply

router.get('/:postId/comments', postInteractionController.getCommentsByPost); // lấy danh sách bình luận dạng cây

router.post('/:id/share', verifyToken, postInteractionController.sharePost); // Chia sẻ bài viết

router.get('/:postId/shares', postInteractionController.getPostShares); // Lấy danh sách người đã chia sẻ bài viết

module.exports = router;
