import api from '../utils/api';
import { getShops } from "./shopService"


// 🔮 Gợi ý tổng hợp (product, post, user, shop)
export const getGeneralRecommendations = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations', {
        params: { limit, page }
    });
    return res.data;
};

// 📝 Gợi ý bài viết
export const getRecommendedPosts = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/posts', {
        params: { limit, page }
    });
    return res.data;
};

// 🛍️ Gợi ý sản phẩm
export const getRecommendedProducts = async ({ limit = 10, page = 1 }) => {
    const res = await api.get('/recommendations/products', {
        params: { limit, page }
    });
    return res.data;
};

// 🏪 Lấy gợi ý shops (cho người dùng chưa đăng nhập)
export const getRecommendedShops = async (page = 1, limit = 10, filters = {}) => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            ...filters, // spread filters directly instead of using URLSearchParams
        };

        const res = await api.get('/recommendations/shops', {
            params // use axios params option
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended shops:', error);
        throw error;
    }
};

// 🏪 Lấy gợi ý shops (cho người dùng đã đăng nhập)
export const getRecommendedShopsCaseLogin = async (page = 1, limit = 10, entityType = "shop") => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            entityType,
        };

        const res = await api.get('/recommendations/shops-case-login', {
            params
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended shops (case login):', error);
        throw error;
    }
};

// 👥 Lấy gợi ý users (cho người dùng chưa đăng nhập)
export const getRecommendedUsers = async (page = 1, limit = 10, sortBy = "score", sortOrder = "desc") => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            sortBy,
            sortOrder,
        };

        const res = await api.get('/recommendations/users', {
            params
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended users:', error);
        throw error;
    }
};

// 👥 Lấy gợi ý users (cho người dùng đã đăng nhập)
export const getRecommendedUsersCaseLogin = async (page = 1, limit = 10, entityType = "user") => {
    try {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            entityType,
        };

        const res = await api.get('/recommendations/users-case-login', {
            params
        });
        return res.data;
    } catch (error) {
        console.error('Error fetching recommended users (case login):', error);
        throw error;
    }
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
