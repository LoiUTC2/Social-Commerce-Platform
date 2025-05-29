import api from '../utils/api';

// 📝 Gửi đánh giá cho shop (yêu cầu đã mua & đã giao hàng)
export const createShopReview = async (reviewData) => {
    const res = await api.post('/shop-reviews', reviewData);
    return res.data;
};

// 📦 Lấy danh sách đánh giá theo shop
export const getReviewsByShop = async (shopId, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc') => {
    const params = new URLSearchParams({
        page,
        limit,
        sortBy,
        order,
    });

    const res = await api.get(`/shop-reviews/shop/${shopId}?${params.toString()}`);
    return res.data;
};

// 📊 Lấy thống kê đánh giá của shop (trung bình, số sao, tổng đánh giá)
export const getShopRatingStats = async (shopId) => {
    const res = await api.get(`/shop-reviews/shop/${shopId}/rating-stats`);
    return res.data;
};

// ✏️ Cập nhật đánh giá (chỉ chủ review được sửa)
export const updateShopReview = async (reviewId, updatedData) => {
    const res = await api.put(`/shop-reviews/${reviewId}`, updatedData);
    return res.data;
};

// ❌ Xoá đánh giá (chỉ chủ review được xoá)
export const deleteShopReview = async (reviewId) => {
    const res = await api.delete(`/shop-reviews/${reviewId}`);
    return res.data;
};
