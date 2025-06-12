const express = require('express');
const router = express.Router();

const {
    getHybridRecommendations,
    getUserShopRecommendations,
    trainMatrixFactorization,
    prepareTfIdfMatrix,
    trainUserShopModel
} = require('../services/recommendationService');

const { verifyToken, setActor } = require('../middleware/authMiddleware');

// Route lấy gợi ý chung (có thể là post, product, user, shop)
router.get('/', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';
        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'Cần userId hoặc sessionId' });
        }
        const recommendations = await getHybridRecommendations(userId, sessionId, parseInt(limit), role);
        res.json({ success: true, data: recommendations, count: recommendations.length });
    } catch (err) {
        console.error('❌ API Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lấy gợi ý', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

// Route lấy gợi ý bài viết
router.get('/posts', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';
        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'Cần userId hoặc sessionId' });
        }
        const recommendations = await getHybridRecommendations(userId, sessionId, parseInt(limit), role)
            .then(recs => recs.filter(r => r.type === 'post'));
        res.json({ success: true, data: recommendations, count: recommendations.length });
    } catch (err) {
        console.error('❌ API Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

// Route lấy gợi ý sản phẩm
router.get('/products', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';
        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'Cần userId hoặc sessionId' });
        }
        const recommendations = await getHybridRecommendations(userId, sessionId, parseInt(limit), role)
            .then(recs => recs.filter(r => r.type === 'product'));
        res.json({ success: true, data: recommendations, count: recommendations.length });
    } catch (err) {
        console.error('❌ API Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

// Route lấy gợi ý shops
router.get('/shops', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';
        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'Cần userId hoặc sessionId' });
        }
        const recommendations = await getUserShopRecommendations(userId, sessionId, parseInt(limit), 'shop', role);
        res.json({ success: true, data: recommendations, count: recommendations.length });
    } catch (err) {
        console.error('❌ API Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

// Route lấy gợi ý users
router.get('/users', setActor, async (req, res) => {
    try {
        const { userId, sessionId, limit = 10 } = req.query;
        const role = req.actor?.type || 'user';
        if (!userId && !sessionId) {
            return res.status(400).json({ success: false, message: 'Cần userId hoặc sessionId' });
        }
        const recommendations = await getUserShopRecommendations(userId, sessionId, parseInt(limit), 'user', role);
        res.json({ success: true, data: recommendations, count: recommendations.length });
    } catch (err) {
        console.error('❌ API Error:', err);
        res.status(500).json({ success: false, message: 'Lỗi server', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
    }
});

// Route để huấn luyện mô hình User-Shop
router.post('/train-user-shop', async (req, res) => {
    try {
        console.log('🎯 Bắt đầu huấn luyện mô hình User/Shop...');
        const model = await trainUserShopModel();
        if (model) {
            res.json({
                success: true,
                message: 'Mô hình User/Shop đã được huấn luyện thành công',
                modelInfo: {
                    users: model.users.length,
                    entities: model.entities.length,
                    factors: model.numFactors
                }
            });
        } else {
            res.json({ success: false, message: 'Không thể huấn luyện mô hình do thiếu dữ liệu' });
        }
    } catch (err) {
        console.error('❌ Training Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi huấn luyện mô hình User/Shop',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Route để huấn luyện lại model trainMatrixFactorization
router.post('/train', async (req, res) => {
    try {
        console.log('🎯 Bắt đầu huấn luyện model...');
        const model = await trainMatrixFactorization();

        if (model) {
            res.json({
                success: true,
                message: 'Model đã được huấn luyện thành công',
                modelInfo: {
                    users: model.users.length,
                    items: model.items.length,
                    factors: model.numFactors
                }
            });
        } else {
            res.json({
                success: false,
                message: 'Không thể huấn luyện model do thiếu dữ liệu'
            });
        }
    } catch (err) {
        console.error('❌ Training Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi huấn luyện model',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

// Route để cập nhật TF-IDF matrix
router.post('/update-tfidf', async (req, res) => {
    try {
        console.log('🔄 Cập nhật TF-IDF matrix...');
        await prepareTfIdfMatrix();
        res.json({ success: true, message: 'TF-IDF matrix đã được cập nhật' });
    } catch (err) {
        console.error('❌ TF-IDF Update Error:', err);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật TF-IDF matrix',
            error: process.env.NODE_ENV === 'development' ? err.message : undefined
        });
    }
});

module.exports = router;