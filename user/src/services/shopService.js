import api from '../utils/api';

// Tạo shop mới (chờ admin duyệt)
export const createShop = async (shopData) => {
    const res = await api.post('/shops', shopData);
    return res.data;
};

// Cập nhật shop (chỉ chủ shop có quyền)
export const updateShop = async (shopData) => {
    const res = await api.put('/shops', shopData);
    return res.data;
};

// Xoá shop (mềm hoặc cứng)
export const deleteShop = async (shopId, force = false) => {
    const res = await api.delete(`/shops/${shopId}?force=${force}`);
    return res.data;
};

// Khôi phục shop (nếu bị xoá mềm)
export const restoreShop = async () => {
    const res = await api.patch('/shops/restore');
    return res.data;
};

// Lấy thông tin shop theo ID (public hoặc đã đăng nhập)
export const getShopById = async (shopId) => {
    const res = await api.get(`/shops/${shopId}`);
    return res.data;
};

// Theo dõi / Bỏ theo dõi shop
export const toggleFollowShop = async (shopId) => {
    const res = await api.patch(`/shops/${shopId}/follow`);
    return res.data;
};

// Chuyển đổi tài khoản giữa buyer/seller (nếu user có cả 2 vai trò)
export const switchUserRole = async () => {
    const res = await api.post('/shops/switchUserRole');
    return res.data;
};
