// src/services/flashSaleService.js
import api from '../utils/api';

/**
 * 📥 Lấy danh sách Flash Sale theo trạng thái duyệt
 * @param {string} approvalStatus - 'pending' | 'approved' | 'rejected'
 * @param {number} page - Trang hiện tại
 * @param {number} limit - Số lượng mỗi trang
 */
export const getFlashSales = async (approvalStatus = '', page = 1, limit = 10) => {
    const response = await api.get('/admin/flash-sales', {
        params: {
            approvalStatus,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 📄 Lấy chi tiết 1 Flash Sale
 * @param {string} id - ID của Flash Sale
 */
export const getFlashSaleDetails = async (id) => {
    const response = await api.get(`/admin/flash-sales/${id}`);
    return response.data;
};

/**
 * ✅ Duyệt 1 Flash Sale
 * @param {string} id - ID của Flash Sale
 */
export const approveFlashSale = async (id) => {
    const response = await api.put(`/admin/flash-sales/${id}/approve`);
    return response.data;
};

/**
 * ❌ Từ chối 1 Flash Sale
 * @param {string} id - ID của Flash Sale
 */
export const rejectFlashSale = async (id) => {
    const response = await api.put(`/admin/flash-sales/${id}/reject`);
    return response.data;
};

/**
 * 🔧 Tạo mới Flash Sale (shop hoặc admin)
 */
export const createFlashSale = async (data) => {
    const response = await api.post('/flash-sales', data);
    return response.data;
};

/**
 * ✏️ Cập nhật Flash Sale
 */
export const updateFlashSale = async (id, updateData) => {
    const response = await api.put(`/flash-sales/${id}`, updateData);
    return response.data;
};

/**
 * 🗑️ Xóa vĩnh viễn Flash Sale
 */
export const deleteFlashSale = async (id) => {
    const response = await api.delete(`/flash-sales/${id}/hard`);
    return response.data;
};

