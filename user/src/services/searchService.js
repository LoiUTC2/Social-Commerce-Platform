import api from '../utils/api';

// 🔎 Tìm kiếm sản phẩm
export const searchProducts = async (params) => {
    const res = await api.get('/search/products', { params });
    return res.data;
};

// 🔎 Tìm kiếm cửa hàng
export const searchShops = async (params) => {
    const res = await api.get('/search/shops', { params });
    return res.data;
};

// 🔎 Tìm kiếm người dùng
export const searchUsers = async (params) => {
    const res = await api.get('/search/users', { params });
    return res.data;
};

// 🔎 Tìm kiếm bài viết
export const searchPosts = async (params) => {
    const res = await api.get('/search/posts', { params });
    return res.data;
};

// 🔍 Tìm theo hashtag (tổng hợp product + shop + post)
export const searchByHashtag = async ({ hashtag, page = 1, limit = 20, sortBy = 'relevance' }) => {
    const res = await api.get('/search/hashtag', {
        params: { hashtag, page, limit, sortBy },
    });
    return res.data;
};

// 🔍 Tìm theo danh mục (tổng hợp product + shop + post)
export const searchByCategory = async ({ categoryId, page = 1, limit = 20, sortBy = 'relevance' }) => {
    const res = await api.get('/search/category', {
        params: { categoryId, page, limit, sortBy },
    });
    return res.data;
};

// 🔍 Tìm kiếm tổng hợp (keyword / hashtag / category)
export const searchAll = async ({ q, hashtag, categoryId, limit = 5 }) => {
    const res = await api.get('/search/all', {
        params: { q, hashtag, categoryId, limit },
    });
    return res.data;
};

// 🧠 Lấy từ khóa tìm kiếm phổ biến
export const getPopularSearches = async (limit = 10, timeRange = '7d') => {
    const res = await api.get('/search/popular', {
        params: { limit, timeRange },
    });
    return res.data;
};

// ✨ Gợi ý tìm kiếm (autocomplete)
export const getSearchSuggestions = async (q, type = 'all', limit = 10) => {
    const res = await api.get('/search/suggestions', {
        params: { q, type, limit },
    });
    return res.data;
};
