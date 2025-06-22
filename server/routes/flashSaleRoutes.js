const express = require('express');
const router = express.Router();
const { verifyToken, setActor, requireRole } = require('../middleware/authMiddleware');
const { ensureSessionId, trackView } = require('../middleware/interactionMiddleware');
const controller = require('../controllers/flashSaleController');

// CRUD operations
router.post('/', verifyToken, setActor, ensureSessionId, requireRole(['seller', 'admin']), controller.createFlashSale);
router.put('/:id', verifyToken, setActor, ensureSessionId, controller.updateFlashSale);
router.delete('/:id/soft', verifyToken, setActor, ensureSessionId, controller.softDeleteFlashSale);
router.delete('/:id/hard', verifyToken, setActor, ensureSessionId, controller.hardDeleteFlashSale);

// Public routes - Lấy danh sách Flash Sale
router.get('/active', controller.getActiveFlashSales);
router.get('/upcoming', controller.getUpcomingFlashSales);
router.get('/ended', controller.getEndedFlashSales);
router.get('/homepage', controller.getAllFlashSalesForHomepage); //Tối ưu cho trang chủ
router.get('/hot', controller.getHotFlashSales); //Flash Sale hot nhất

// Seller routes
router.get('/my', verifyToken, setActor, ensureSessionId, controller.getMyFlashSales);

// Detail routes
router.get('/:id/view', trackView("flashsale"), setActor, controller.getFlashSaleForUser);
router.get('/:id/manage', verifyToken, setActor, ensureSessionId, controller.getFlashSaleForSeller);

// Tracking routes
router.post('/:id/track-purchase', setActor, ensureSessionId, controller.trackFlashSalePurchase);

// 🔍 Tìm kiếm Flash Sale
router.get('/search', controller.searchFlashSales);

// 📊 Lấy thống kê Flash Sale
router.get('/:id/stats', controller.getFlashSaleStats);

module.exports = router;