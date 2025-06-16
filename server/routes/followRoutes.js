const express = require('express');
const router = express.Router();
const followController = require('../controllers/followController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');

router.post('/toggle', verifyToken, setActor, followController.toggleFollow);

// Kiểm tra trạng thái follow của một target
router.get('/status/:targetId/:targetType', verifyToken, setActor, followController.checkFollowStatus);

// Kiểm tra trạng thái follow của nhiều targets
router.post('/batch-status', verifyToken, setActor, followController.batchCheckFollowStatus);

// Xem danh sách followers/following của bất kỳ user/shop nào
router.get('/:slug/:listType', setActor, followController.getFollowList);

module.exports = router;