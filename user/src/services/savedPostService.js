import api from '../utils/api';

// ✅ Toggle lưu / bỏ lưu bài viết
export const toggleSavePost = async (postId) => {
    const res = await api.post(`/saved-posts/toggle/${postId}`);
    return res.data;
};

// 📥 Lấy danh sách bài viết đã lưu (có phân trang)
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
