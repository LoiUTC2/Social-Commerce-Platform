import api from '../utils/api';

// 📝 Gửi đánh giá sản phẩm (yêu cầu đã mua & giao hàng)
export const createReview = async (reviewData) => {
    const res = await api.post('/product-reviews', reviewData);
    return res.data;
};

// 📦 Lấy danh sách đánh giá theo sản phẩm
export const getReviewsByProduct = async (productId, page = 1, limit = 10, filters = {}) => {
    const params = new URLSearchParams({
        page,
        limit,
        ...filters // { rating, sortBy }
    });

    const res = await api.get(`/product-reviews/product/${productId}?${params.toString()}`);
    return res.data;
};

// 📄 Lấy chi tiết một đánh giá
export const getReviewById = async (reviewId) => {
    const res = await api.get(`/product-reviews/${reviewId}`);
    return res.data;
};

// 👤 Lấy tất cả đánh giá của người dùng hiện tại
export const getMyReviews = async (page = 1, limit = 10) => {
    const res = await api.get(`/product-reviews/my-reviews?page=${page}&limit=${limit}`);
    return res.data;
};

// ✏️ Cập nhật đánh giá
export const updateReview = async (reviewId, updatedData) => {
    const res = await api.put(`/product-reviews/${reviewId}`, updatedData);
    return res.data;
};

// ❌ Xoá đánh giá
export const deleteReview = async (reviewId) => {
    const res = await api.delete(`/product-reviews/${reviewId}`);
    return res.data;
};

// 👍 Thích / bỏ thích đánh giá
export const toggleLikeReview = async (reviewId) => {
    const res = await api.put(`/product-reviews/${reviewId}/like`);
    return res.data;
};
