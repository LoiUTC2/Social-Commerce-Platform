const express = require('express');
const router = express.Router();
const adminProductController = require('../controllers/adminProductController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ admin được phép
router.get('/', verifyToken, requireRole('admin'), adminProductController.getAllProductsForAdmin);

module.exports = router;
