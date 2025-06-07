const express = require('express');
const router = express.Router();
const savedPostController = require('../controllers/savedPostController');
const { verifyToken, setActor, ensureSessionId } = require('../middlewares/authMiddleware');
const { trackInteraction } = require('../middlewares/interactionMiddleware');

router.post(
    '/:postId',
    verifyToken,
    setActor,
    ensureSessionId,
    savedPostController.savePost
);
router.delete(
    '/:postId',
    verifyToken,
    setActor,
    ensureSessionId,
    savedPostController.unsavePost
);

router.get(
    '/',
    verifyToken,
    setActor,
    savedPostController.getSavedPosts
);

router.get(
    '/check/:postId',
    verifyToken,
    setActor,
    savedPostController.checkSavedPost
);

module.exports = router;
