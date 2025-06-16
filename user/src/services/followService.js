import api from '../utils/api';

// 🟢 Follow / Unfollow user hoặc shop
export const toggleFollow = async ({ targetId, targetType }) => {
    const res = await api.post('/follow/toggle', {
        targetId,
        targetType, // 'user' hoặc 'shop'
    });
    return res.data;
};

// 📥 Lấy danh sách followers hoặc following của một user/shop (theo slug)
export const getFollowList = async ({ slug, listType = 'followers', page = 1, limit = 10, entityType = 'all' }) => {
    const res = await api.get(`/follow/${slug}/${listType}`, {
        params: {
            page,
            limit,
            entityType, // 'user', 'shop', hoặc 'all'
        },
    });
    return res.data;
};

// 📊 Kiểm tra trạng thái follow của một target cụ thể
export const checkFollowStatus = async ({ targetId, targetType }) => {
    const res = await api.get(`/follow/status/${targetId}/${targetType}`);
    return res.data;
};

// 📊 Kiểm tra trạng thái follow của nhiều targets cùng lúc (batch check)
export const batchCheckFollowStatus = async (targets) => {
    const res = await api.post('/follow/batch-status', { targets });
    return res.data;
};
