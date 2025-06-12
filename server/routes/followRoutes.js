const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');

router.post('/toggle', verifyToken, setActor, followController.toggleFollow);

// Xem danh sách followers/following của bất kỳ user/shop nào
router.get('/:slug/:listType', setActor, followController.getFollowList);

module.exports = router;