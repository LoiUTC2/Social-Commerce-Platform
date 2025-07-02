import api from '../utils/api';

// 🔥 Lấy danh sách hashtag phổ biến với phân trang
export const getPopularHashtags = async (options = {}) => {
    const {
        limit = 20,
        page = 1,
        offset
    } = options;

    const params = { limit };

    // Ưu tiên offset nếu có, không thì dùng page
    if (offset !== undefined) {
        params.offset = offset;
    } else {
        params.page = page;
    }

    const res = await api.get('/hashtags/popular', { params });
    return res.data;
};

// 🔍 Tìm kiếm hashtag theo từ khoá (autocomplete, search)
export const searchHashtags = async (query, limit = 10) => {
    const res = await api.get('/hashtags/search', {
        params: { q: query, limit },
    });
    return res.data;
};
