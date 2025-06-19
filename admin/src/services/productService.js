// src/services/productService.js
import api from '../utils/api';

/**
 * Lấy danh sách sản phẩm
 */
export const getAllProducts = async (filters = {}, page = 1, limit = 20) => {
    const response = await api.get('/admin/products', {
        params: { ...filters, page, limit }
    });
    return response.data;
};

/**
 * Lấy chi tiết 1 sản phẩm
 */
export const getProductDetails = async (productId) => {
    const response = await api.get(`/admin/products/${productId}`);
    return response.data;
};

/**
 * Cập nhật sản phẩm
 */
export const updateProduct = async (productId, updateData) => {
    const response = await api.put(`/admin/products/${productId}`, updateData);
    return response.data;
};

/**
 * Ngừng bán (soft delete)
 */
export const deactivateProduct = async (productId) => {
    const response = await api.put(`/admin/products/${productId}/deactivate`);
    return response.data;
};

/**
 * Xóa sản phẩm vĩnh viễn
 */
export const deleteProduct = async (productId) => {
    const response = await api.delete(`/admin/products/${productId}`);
    return response.data;
};

/**
 * Cập nhật hàng loạt sản phẩm
 */
export const bulkUpdateProducts = async (productIds, updateData) => {
    const response = await api.put('/admin/products/bulk-update', {
        productIds,
        updateData
    });
    return response.data;
};

/**
 * Export danh sách sản phẩm
 */
export const exportProducts = async (filters = {}, format = 'csv') => {
    const response = await api.get('/admin/products/export', {
        params: { ...filters, format },
        responseType: format === 'json' ? 'json' : 'blob' // blob cho CSV file
    });
    return response;
};