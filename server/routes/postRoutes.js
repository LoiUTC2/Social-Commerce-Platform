const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');
const { trackView } = require('../middleware/interactionMiddleware');

router.post('/', verifyToken, setActor, postController.createPost);
// router.post('/', postController.createPost);//Dùng để tạo dữ liệu ảo bằng runder postman


router.get('/', postController.getAllPosts);

// tổng hợp bài viết mới, phổ biến (tương tác cao), và từ người/shop đang theo dõi.
router.get('/popular', verifyToken, setActor, postController.getPopularPosts);

// hiển thị bài viết được gợi ý bởi AI, cá nhân hóa cho người dùng.
router.get('/for-you', verifyToken, setActor, postController.getForYouPosts);

// lấy bài viết của những người (user/shop) đang theo dõi
router.get('/following', verifyToken, setActor, postController.getFollowingPosts);


router.get('/:id', trackView('post'), postController.getPostById);
router.get('/author/:slug', postController.getPostsByAuthorSlug);

router.put('/:id', verifyToken, setActor, postController.updatePost);
router.delete('/:id', verifyToken,setActor, postController.deletePost);



module.exports = router;