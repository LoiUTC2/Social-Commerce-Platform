import api from '../utils/api';

// 🔮 Gợi ý tổng hợp (product, post, user, shop)
export const getGeneralRecommendations = async ({ limit = 10, page = 1}) => {
    const res = await api.get('/recommendations', {
        params: {limit, page}
    });
    return res.data;
};

// 📝 Gợi ý bài viết
export const getRecommendedPosts = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/posts', {
        params: {limit, page}
    });
    return res.data;
};

// 🛍️ Gợi ý sản phẩm
export const getRecommendedProducts = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/products', {
        params: {limit, page}
    });
    return res.data;
};

// 🏪 Gợi ý shop
export const getRecommendedShops = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/shops', {
        params: {limit, page}
    });
    return res.data;
};

// 👤 Gợi ý người dùng
export const getRecommendedUsers = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/users', {
        params: {limit, page}
    });
    return res.data;
};

// 🏪 Gợi ý shop theo follow (đã đăng nhập)
export const getRecommendedShopsCaseLogin = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/shops-case-login', {
        params: {limit, page}
    });
    return res.data;
};

// 👤 Gợi ý người dùng theo follow (đã đăng nhập)
export const getRecommendedUsersCaseLogin = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/users-case-login', {
        params: {limit, page}
    });
    return res.data;
};

//////////////

// 🚀 Huấn luyện lại mô hình Matrix Factorization (admin)
export const retrainMatrixModel = async () => {
    const res = await api.post('/recommendations/train');
    return res.data;
};

// 🚀 Huấn luyện lại mô hình User/Shop (admin)
export const retrainUserShopModel = async () => {
    const res = await api.post('/recommendations/train-user-shop');
    return res.data;
};

// 🔁 Cập nhật TF-IDF matrix (admin)
export const updateTfidfMatrix = async () => {
    const res = await api.post('/recommendations/update-tfidf');
    return res.data;
};
