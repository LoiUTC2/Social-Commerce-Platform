const express = require('express');
const router = express.Router();
const controller = require('../controllers/shopReviewController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');

router.post('/', verifyToken, setActor, controller.createShopReview);
router.get('/shop/:shopId', controller.getReviewsByShop);
router.put('/:id', verifyToken, setActor, controller.updateShopReview);
router.delete('/:id', verifyToken, setActor, controller.deleteShopReview);
router.get('/shop/:shopId/rating-stats', controller.getShopRatingStats);

module.exports = router;
