const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ admin mới được thao tác với danh mục
router.post('/', verifyToken, requireRole('admin'), categoryController.createCategory);
router.put('/:categoryId', verifyToken, requireRole('admin'), categoryController.updateCategory);
router.delete('/:categoryId', verifyToken, requireRole('admin'), categoryController.deleteCategory);

router.get('/', categoryController.getAllCategories);
router.get('/:categoryId', categoryController.getCategoryById);
router.get('/tree', categoryController.getCategoryTree);
router.get('/by-level', categoryController.getCategoriesByLevel);

module.exports = router;
