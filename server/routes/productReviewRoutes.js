const express = require('express');
const router = express.Router();
const productReviewController = require('../controllers/productReviewController');
const { verifyToken, setActor, requireRole, checkShopOwnership} = require('../middleware/authMiddleware');

router.post('/', verifyToken, setActor, productReviewController.createReview);
router.get('/my-reviews', verifyToken, setActor, productReviewController.getMyReviews);
router.get('/product/:productId', productReviewController.getReviewsByProduct);
router.get('/:reviewId', productReviewController.getReviewById);
router.put('/:reviewId', verifyToken, setActor, productReviewController.updateReview);
router.delete('/:reviewId', verifyToken, setActor, productReviewController.deleteReview);
router.put('/:reviewId/like', verifyToken, setActor, productReviewController.likeReview);

module.exports = router;