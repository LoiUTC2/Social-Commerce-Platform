const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminFlashSaleController');
const { verifyToken, setActor, requireRole } = require('../middleware/authMiddleware');

router.get('/', verifyToken, setActor, requireRole('admin'), controller.getFlashSalesByApprovalStatus);
router.get('/:id', verifyToken, setActor, controller.getFlashSaleDetailsByAdmin);

// 💼 Chỉ admin mới được duyệt/từ chối
router.put('/:id/approve', verifyToken, setActor, requireRole('admin'), controller.approveFlashSale);
router.put('/:id/reject', verifyToken, setActor, requireRole('admin'), controller.rejectFlashSale);


module.exports = router;
