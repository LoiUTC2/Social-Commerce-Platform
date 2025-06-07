import api from '../utils/api';

// ✅ Lưu bài viết
export const savePost = async (postId) => {
    const res = await api.post(`/saved-posts/${postId}`);
    return res.data;
};

// ❌ Bỏ lưu bài viết
export const unsavePost = async (postId) => {
    const res = await api.delete(`/saved-posts/${postId}`);
    return res.data;
};

// 📥 Lấy danh sách bài viết đã lưu (phân trang)
export const getSavedPosts = async (page = 1, limit = 10) => {
    const res = await api.get('/saved-posts', {
        params: { page, limit },
    });
    return res.data;
};

// ❓ Kiểm tra xem bài viết đã được lưu chưa
export const checkSavedPost = async (postId) => {
    const res = await api.get(`/saved-posts/check/${postId}`);
    return res.data;
};
