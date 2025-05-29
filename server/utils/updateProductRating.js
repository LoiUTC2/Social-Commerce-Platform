const Product = require('../models/Product');
const ProductReview = require('../models/ProductReviews');

const updateProductRatingStats = async (productId) => {
    try {
        // ✅ Thêm validation
        if (!productId) {
            console.error('ProductId is required for updating rating stats');
            return;
        }

        // Lấy tất cả đánh giá còn hiệu lực của sản phẩm
        const reviews = await ProductReview.find({
            product: productId,
            status: 'active',
            isHidden: false
        });

        const totalReviews = reviews.length;
        let verifiedReviews = 0;
        let ratingSum = 0;
        const distribution = { five: 0, four: 0, three: 0, two: 0, one: 0 };

        // ✅ Thêm thống kê chi tiết
        let totalLikes = 0;
        let reviewsWithImages = 0;
        let reviewsWithVideos = 0;

        for (const review of reviews) {
            const r = review.rating;
            ratingSum += r;
            if (review.isVerified) verifiedReviews++;

            // Phân phối rating
            if (r === 5) distribution.five++;
            else if (r === 4) distribution.four++;
            else if (r === 3) distribution.three++;
            else if (r === 2) distribution.two++;
            else if (r === 1) distribution.one++;

            // ✅ Thống kê bổ sung
            totalLikes += review.likes?.length || 0;
            if (review.images?.length > 0) reviewsWithImages++;
            if (review.videos?.length > 0) reviewsWithVideos++;
        }

        const avgRating = totalReviews > 0 ? parseFloat((ratingSum / totalReviews).toFixed(2)) : 0;

        // ✅ Tính rating quality score (0-100)
        const qualityScore = totalReviews > 0 ? Math.min(100, Math.round(
            (verifiedReviews / totalReviews * 40) + // 40% từ verified reviews
            (reviewsWithImages / totalReviews * 30) + // 30% từ reviews có hình
            (avgRating / 5 * 20) + // 20% từ điểm trung bình
            (Math.min(totalLikes / totalReviews, 2) * 5) // 10% từ likes (tối đa 2 likes/review)
        )) : 0;

        // ✅ Cập nhật thông tin chi tiết hơn
        const updateData = {
            ratings: {
                avg: avgRating,
                count: totalReviews
            },
            reviewStats: {
                totalReviews,
                verifiedReviews,
                averageRating: avgRating,
                ratingDistribution: distribution,

                // ✅ Thêm thống kê mới
                qualityScore,
                totalLikes,
                reviewsWithMedia: reviewsWithImages + reviewsWithVideos,
                reviewsWithImages,
                reviewsWithVideos,

                // ✅ Tỷ lệ phần trăm cho từng sao
                ratingPercentage: totalReviews > 0 ? {
                    five: Math.round((distribution.five / totalReviews) * 100),
                    four: Math.round((distribution.four / totalReviews) * 100),
                    three: Math.round((distribution.three / totalReviews) * 100),
                    two: Math.round((distribution.two / totalReviews) * 100),
                    one: Math.round((distribution.one / totalReviews) * 100)
                } : { five: 0, four: 0, three: 0, two: 0, one: 0 },

                lastUpdated: new Date()
            }
        };

        const result = await Product.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true }
        );

        if (!result) {
            console.error(`Product with ID ${productId} not found`);
            return null;
        }

        // ✅ Log thông tin để debug
        console.log(`Updated rating stats for product ${productId}:`, {
            avgRating,
            totalReviews,
            qualityScore
        });

        return result;

    } catch (err) {
        console.error('Lỗi khi cập nhật đánh giá sản phẩm:', err);
        throw err; // ✅ Throw error để caller có thể handle
    }
};

// ✅ Thêm function batch update cho nhiều sản phẩm
const batchUpdateProductRatingStats = async (productIds) => {
    try {
        const results = [];
        for (const productId of productIds) {
            const result = await updateProductRatingStats(productId);
            results.push({ productId, success: !!result });
        }
        return results;
    } catch (err) {
        console.error('Lỗi khi batch update rating stats:', err);
        throw err;
    }
};

// ✅ Thêm function để recalculate tất cả products (dùng cho admin)
const recalculateAllProductRatings = async () => {
    try {
        const products = await Product.find({ isActive: true }, '_id');
        const productIds = products.map(p => p._id);

        console.log(`Recalculating ratings for ${productIds.length} products...`);

        const results = await batchUpdateProductRatingStats(productIds);
        const successCount = results.filter(r => r.success).length;

        console.log(`Successfully updated ${successCount}/${productIds.length} products`);
        return { total: productIds.length, success: successCount };
    } catch (err) {
        console.error('Lỗi khi recalculate tất cả ratings:', err);
        throw err;
    }
};

module.exports = {
    updateProductRatingStats,
    batchUpdateProductRatingStats,
    recalculateAllProductRatings
};