import api from '../utils/api';

// 🟢 Tạo Flash Sale (seller hoặc admin)
export const createFlashSale = async (flashSaleData) => {
    const res = await api.post('/flash-sales', flashSaleData);
    return res.data;
};

// ✏️ Cập nhật Flash Sale
export const updateFlashSale = async (id, updateData) => {
    const res = await api.put(`/flash-sales/${id}`, updateData);
    return res.data;
};

// ❌ Xóa mềm Flash Sale
export const softDeleteFlashSale = async (id) => {
    const res = await api.delete(`/flash-sales/${id}/soft`);
    return res.data;
};

// ❌ Xóa cứng Flash Sale (chỉ admin/seller owner)
export const hardDeleteFlashSale = async (id) => {
    const res = await api.delete(`/flash-sales/${id}/hard`);
    return res.data;
};

// 📦 Lấy danh sách Flash Sale đang hoạt động
export const getActiveFlashSales = async (page = 1, limit = 10) => {
    const res = await api.get('/flash-sales/active', {
        params: { page, limit, populateProducts: true }
    });
    return res.data;
};

// 🕒 Lấy Flash Sale sắp diễn ra
export const getUpcomingFlashSales = async (page = 1, limit = 10) => {
    const res = await api.get('/flash-sales/upcoming', {
        params: { page, limit, populateProducts: true }
    });
    return res.data;
};

// ✅ Lấy Flash Sale đã kết thúc
export const getEndedFlashSales = async (page = 1, limit = 10) => {
    const res = await api.get('/flash-sales/ended', {
        params: { page, limit, populateProducts: false }
    });
    return res.data;
};

// 🔥 Flash Sale hot nhất (dành cho trang chủ)
export const getHotFlashSales = async (limit = 5) => {
    const res = await api.get('/flash-sales/hot', {
        params: { limit }
    });
    return res.data;
};

// 🏠 Flash Sale trang chủ (gồm active, upcoming…)
export const getHomepageFlashSales = async (page = 1, limit = 20) => {
    const res = await api.get('/flash-sales/homepage', {
        params: { page, limit, populateProducts: true }
    });
    return res.data;
};

// 📋 Lấy Flash Sale của người bán (seller hiện tại)
export const getMyFlashSales = async (page = 1, limit = 10) => {
    const res = await api.get('/flash-sales/my', {
        params: { page, limit }
    });
    return res.data;
};

// 👁 Xem chi tiết Flash Sale từ phía người dùng
export const getFlashSaleForUser = async (id) => {
    const res = await api.get(`/flash-sales/${id}/view`);
    return res.data;
};

// ⚙️ Xem chi tiết Flash Sale cho seller (để chỉnh sửa)
export const getFlashSaleForSeller = async (id) => {
    const res = await api.get(`/flash-sales/${id}/manage`);
    return res.data;
};

// 📈 Ghi nhận hành vi mua hàng trong Flash Sale
export const trackFlashSalePurchase = async (id, data) => {
    const res = await api.post(`/flash-sales/${id}/track-purchase`, data);
    return res.data;
};

// 🔍 Tìm kiếm Flash Sale
export const searchFlashSales = async (query, filters = {}) => {
    const res = await api.get("/flash-sales/search", {
        params: { q: query, ...filters },
    })
    return res.data
}

// 📊 Lấy thống kê Flash Sale
export const getFlashSaleStats = async (id) => {
    const res = await api.get(`/flash-sales/${id}/stats`)
    return res.data
}