import api from '../utils/api';

// Chuyển đổi vai trò người dùng
export const switchUserRole = async () => {
    const res = await api.post('/shops/switch-role');
    return res.data;
};

// Tạo shop mới (chờ admin duyệt)
export const createShop = async (shopData) => {
    const res = await api.post('/shops', shopData);
    return res.data;
};

// Cập nhật thông tin shop (chỉ chủ shop có quyền)
export const updateShop = async (shopData) => {
    const res = await api.put('/shops', shopData);
    return res.data;
};

// Gửi yêu cầu xóa shop
export const requestDeleteShop = async (reason) => {
    const res = await api.post('/shops/request-delete', { reason });
    return res.data;
};

// Bật/tắt trạng thái hoạt động của shop
export const toggleShopActiveStatus = async () => {
    const res = await api.patch('/shops/toggle-status');
    return res.data;
};

// Theo dõi/Hủy theo dõi shop
export const toggleFollowShop = async (shopId) => {
    const res = await api.patch(`/shops/${shopId}/follow`);
    return res.data;
};

// Lấy thông tin shop của người dùng hiện tại
export const getMyShop = async () => {
    const res = await api.get('/shops/my-shop');
    return res.data;
};

// Lấy thông tin Shop theo slug  
export const getShopBySlug = async (slug) => {
    const res = await api.get(`/shops/slug/${slug}`);
    return res.data;
};

// Lấy danh sách shop đã theo dõi
export const getFollowedShops = async (page = 1, limit = 10) => {
    const res = await api.get(`/shops/followed?page=${page}&limit=${limit}`);
    return res.data;
};

// Lấy thông tin shop theo ID
export const getShopById = async (shopId) => {
    const res = await api.get(`/shops/${shopId}`);
    return res.data;
};

// Lấy danh sách shop với phân trang và bộ lọc
export const getShops = async (params = {}) => {
    const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        order = 'desc',
        search = '',
        category,
        status
    } = params;

    const queryParams = new URLSearchParams({
        page,
        limit,
        sortBy,
        order,
        ...(search && { search }),
        ...(category && { category }),
        ...(status && { status })
    });

    const res = await api.get(`/shops?${queryParams.toString()}`);
    return res.data;
};

// Kiểm tra quyền sở hữu shop
export const isShopOwner = async (shopId) => {
    const res = await api.get(`/shops/${shopId}/is-owner`);
    return res.data;
};