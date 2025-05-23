import api from '../utils/api';

// 📝 Tạo bài viết mới
export const createPost = async (postData) => {
    const res = await api.post('/posts', postData);
    return res.data;
};

// 📥 Lấy danh sách bài viết 
export const getAllPosts = async (page = 1, limit = 5) => {
    const res = await api.get(`/posts?page=${page}&limit=${limit}`);
    return res.data;
};

// 📄 Lấy chi tiết 1 bài viết
export const getPostById = async (postId) => {
    const res = await api.get(`/posts/${postId}`);
    return res.data;
};

// 👤 Lấy danh sách bài viết theo ID tác giả (User hoặc Shop)
export const getPostsByAuthorSlug = async (slug, page = 1, limit = 5) => {
    const res = await api.get(`/posts/author/${slug}?page=${page}&limit=${limit}`);
    return res.data;
};

// 🗑 Xoá bài viết (cần xác thực là chủ sở hữu)
export const deletePost = async (postId) => {
    const res = await api.delete(`/posts/${postId}`);
    return res.data;
};

// ✏️ Cập nhật bài viết
export const updatePost = async (postId, updatedData) => {
    const res = await api.put(`/posts/${postId}`, updatedData);
    return res.data;
};
