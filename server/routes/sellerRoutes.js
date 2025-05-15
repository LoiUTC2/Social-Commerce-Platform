const express = require('express');
const router = express.Router();
const sellerController = require('../controllers/sellerController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Các route cơ bản cho Seller
router.post('/', sellerController.registerSeller);
router.get('/', sellerController.getAllSellers);
router.get('/:sellerId', sellerController.getSellerById);
router.put('/:sellerId', verifyToken, requireRole('seller'), sellerController.updateSeller); //  Chỉ seller hoặc admin mới được cập nhật
router.delete('/:sellerId', verifyToken, requireRole('admin'), sellerController.deleteSeller); // Có thể chỉ admin mới được xóa

// Route cho KYC (ví dụ)
router.put('/:sellerId/kyc', verifyToken, requireRole('seller'), sellerController.updateKycLevel);


module.exports = router;