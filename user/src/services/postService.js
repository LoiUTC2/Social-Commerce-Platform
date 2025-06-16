import api from '../utils/api';

// 📝 Tạo bài viết mới
export const createPost = async (postData) => {
    const res = await api.post('/posts', postData);
    return res.data;
};

// ✏️ Cập nhật bài viết
export const updatePost = async (postId, postData) => {
    const res = await api.put(`/posts/${postId}`, postData);
    return res.data;
};

// ❌ Xoá bài viết
export const deletePost = async (postId) => {
    const res = await api.delete(`/posts/${postId}`);
    return res.data;
};

// 📄 Lấy chi tiết bài viết
export const getPostById = async (postId) => {
    const res = await api.get(`/posts/${postId}`);
    return res.data;
};

// 📚 Lấy danh sách tất cả bài viết (mặc định phân trang)
export const getAllPosts = async (page = 1, limit = 10) => {
    const res = await api.get('/posts', {
        params: { page, limit },
    });
    return res.data;
};

// 🔥 Lấy bài viết phổ biến (tab "Phổ biến")
export const getPopularPosts = async (page = 1, limit = 10) => {
    const res = await api.get('/posts/popular', {
        params: { page, limit },
    });
    return res.data;
};

// 🧠 Lấy bài viết gợi ý cá nhân hoá (tab "Dành cho bạn")
export const getForYouPosts = async (page = 1, limit = 10) => {
    const res = await api.get('/posts/for-you', {
        params: { page, limit },
    });
    return res.data;
};

// 👥 Lấy bài viết từ người dùng/shop đang theo dõi
export const getFollowingPosts = async (page = 1, limit = 10) => {
    const res = await api.get('/posts/following', {
        params: { page, limit },
    });
    return res.data;
};

// 📦 Lấy bài viết theo slug của user/shop
export const getPostsByAuthorSlug = async (slug, page = 1, limit = 10) => {
    const res = await api.get(`/posts/author/${slug}`, {
        params: { page, limit },
    });
    return res.data;
};
