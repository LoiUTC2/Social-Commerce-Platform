// src/services/shopService.js
import api from '../utils/api';

/**
 * 📋 Lấy danh sách shop theo điều kiện lọc (status, featureLevel)
 */
export const getAllShops = async (filters = {}, page = 1, limit = 10) => {
    const response = await api.get('/admin/shops', {
        params: {
            ...filters,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 📥 Lấy danh sách shop đang chờ duyệt tạo
 */
export const getPendingCreateShops = async (page = 1, limit = 10) => {
    const response = await api.get('/admin/shops/pending-create', {
        params: { page, limit },
    });
    return response.data;
};

/**
 * 🗑️ Lấy danh sách shop đang chờ duyệt xóa
 */
export const getPendingDeleteShops = async (page = 1, limit = 10) => {
    const response = await api.get('/admin/shops/pending-delete', {
        params: { page, limit },
    });
    return response.data;
};

/**
 * ✅ Duyệt tạo shop
 */
export const approveCreateShop = async (shopId, createNote = '') => {
    const response = await api.put(`/admin/shops/approve-create/${shopId}`, { createNote });
    return response.data;
};

/**
 * ❌ Từ chối tạo shop
 */
export const rejectCreateShop = async (shopId, createNote = '') => {
    const response = await api.put(`/admin/shops/reject-create/${shopId}`, { createNote });
    return response.data;
};

/**
 * ✅ Duyệt xóa shop
 */
export const approveDeleteShop = async (shopId, deleteNote = '') => {
    const response = await api.put(`/admin/shops/approve-delete/${shopId}`, { deleteNote });
    return response.data;
};

/**
 * ❌ Từ chối xóa shop
 */
export const rejectDeleteShop = async (shopId, deleteNote = '') => {
    const response = await api.put(`/admin/shops/reject-delete/${shopId}`, { deleteNote });
    return response.data;
};

/**
 * ✏️ Cập nhật thông tin cơ bản shop (admin)
 */
export const updateShopBasicInfo = async (shopId, basicInfo) => {
    const response = await api.put(`/admin/shops/${shopId}/basic-info`, basicInfo);
    return response.data;
};

/**
 * 🗑️ Xóa shop hoàn toàn (admin)
 */
export const deleteShop = async (shopId) => {
    const response = await api.delete(`/admin/shops/${shopId}`);
    return response.data;
};

/**
 * ⭐ Cập nhật cấp độ đặc quyền (normal | premium | vip)
 */
export const updateShopFeatureLevel = async (shopId, featureLevel) => {
    const response = await api.put(`/admin/shops/feature-level/${shopId}`, { featureLevel });
    return response.data;
};

/**
 * 📊 Lấy thống kê tổng quan về shops
 */
export const getShopsOverview = async () => {
    const response = await api.get('/admin/shops/overview');
    return response.data;
};

/**
 * 📋 Lấy danh sách shop để quản lý (với filter và search đầy đủ)
 */
export const getAllShopsForManagement = async (params = {}) => {
    const {
        status = 'all',
        featureLevel,
        isApproved,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = 1,
        limit = 20
    } = params;

    const response = await api.get('/admin/shops/management', {
        params: {
            status,
            featureLevel,
            isApproved,
            search,
            sortBy,
            sortOrder,
            page,
            limit
        }
    });
    return response.data;
};

/**
 * ⏸️ Tạm dừng hoạt động shop
 */
export const suspendShop = async (shopId, reason = '', duration = 0) => {
    const response = await api.put(`/admin/shops/suspend/${shopId}`, {
        reason,
        duration
    });
    return response.data;
};

/**
 * ▶️ Khôi phục hoạt động shop
 */
export const restoreShop = async (shopId, note = '') => {
    const response = await api.put(`/admin/shops/restore/${shopId}`, { note });
    return response.data;
};

/**
 * 🔍 Lấy chi tiết shop đầy đủ (admin) - bao gồm thống kê và metadata
 */
export const getShopDetails = async (shopId) => {
    const response = await api.get(`/admin/shops/${shopId}`);
    return response.data;
};

