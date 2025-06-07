const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');
const { trackView } = require('../middleware/interactionMiddleware');

router.post('/', verifyToken, setActor, postController.createPost);
router.get('/', postController.getAllPosts);
router.get('/:id', trackView('post'), postController.getPostById);
router.get('/author/:slug', postController.getPostsByAuthorSlug);
router.put('/:id', verifyToken, setActor, postController.updatePost);
router.delete('/:id', verifyToken,setActor, postController.deletePost);

module.exports = router;