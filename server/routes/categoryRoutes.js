const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

// Chỉ admin mới được thao tác với danh mục, thêm requireRole('admin') vào nha
router.post('/', verifyToken, categoryController.createCategory);
router.put('/:categoryId', verifyToken, requireRole('admin'), categoryController.updateCategory);
router.delete('/:categoryId', verifyToken, requireRole('admin'), categoryController.deleteCategory);

router.get('/', categoryController.getAllCategories);

router.get('/tree', categoryController.getCategoryTree);
router.get('/by-level', categoryController.getCategoriesByLevel);
router.get('/:categoryId', categoryController.getCategoryById);

module.exports = router;
