import api from '../utils/api';

// 🔥 Lấy danh sách hashtag phổ biến (top N, mặc định 20)
export const getPopularHashtags = async (limit = 20) => {
    const res = await api.get('/hashtags/popular', {
        params: { limit },
    });
    return res.data;
};

// 🔍 Tìm kiếm hashtag theo từ khoá (autocomplete, search)
export const searchHashtags = async (query, limit = 10) => {
    const res = await api.get('/hashtags/search', {
        params: { q: query, limit },
    });
    return res.data;
};
