const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');

router.post('/', verifyToken, setActor, postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:id', postController.getPostById);
router.get('/author/:slug', postController.getPostsByAuthorSlug);
router.delete('/:id', verifyToken,setActor, postController.deletePost);

module.exports = router;