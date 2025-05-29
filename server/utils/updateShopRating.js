const Shop = require('../models/Shop');
const ShopReview = require('../models/ShopReviews');

const updateShopRatingStats = async (shopId) => {
    try {
        const reviews = await ShopReview.find({
            shop: shopId,
            status: 'active',
            isHidden: false
        });

        const count = reviews.length;
        const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = count > 0 ? sum / count : 0;

        // ✅ THÊM: Thống kê theo từng sao
        const ratingBreakdown = {
            1: reviews.filter(r => r.rating === 1).length,
            2: reviews.filter(r => r.rating === 2).length,
            3: reviews.filter(r => r.rating === 3).length,
            4: reviews.filter(r => r.rating === 4).length,
            5: reviews.filter(r => r.rating === 5).length
        };

        await Shop.findByIdAndUpdate(shopId, {
            $set: {
                'stats.rating.avg': parseFloat(avg),
                'stats.rating.count': count,
                'stats.rating.breakdown': ratingBreakdown // ✅ Thêm breakdown
            }
        });
    } catch (err) {
        console.error('Lỗi cập nhật rating shop:', err.message);
    }
};

module.exports = updateShopRatingStats;
