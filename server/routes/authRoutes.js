const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken, setActor, requireRole } = require('../middleware/authMiddleware');
const { trackView } = require('../middleware/interactionMiddleware');

// Route chỉ cho admin
router.get('/admin/dashboard', verifyToken, requireRole('admin'), (req, res) => {
    res.json({ message: 'Xin chào admin!' });
});

router.post('/register', authController.register);
router.put('/me', verifyToken, authController.updateProfile);
router.get('/me', verifyToken, authController.getCurrentUser);
router.get('/slug/:slug',verifyToken, setActor, trackView('user'), authController.getUserBySlug);

router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;