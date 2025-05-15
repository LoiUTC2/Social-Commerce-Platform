import api from '../utils/api';

/**
 * Đăng ký thông tin người bán
 * @param {Object} sellerData - Dữ liệu người bán
 * @returns {Promise} - Promise chứa kết quả từ API
 */
export const registerSeller = async (sellerData) => {
    try {
        const res = await api.post('/sellers', sellerData);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Lấy danh sách tất cả người bán
 * @returns {Promise} - Promise chứa danh sách người bán
 */
export const getAllSellers = async () => {
    try {
        const res = await api.get('/sellers');
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Lấy thông tin người bán theo ID
 * @param {string} sellerId - ID người bán
 * @returns {Promise} - Promise chứa thông tin người bán
 */
export const getSellerById = async (sellerId) => {
    try {
        const res = await api.get(`/sellers/${sellerId}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Cập nhật thông tin người bán (yêu cầu quyền seller)
 * @param {string} sellerId - ID người bán
 * @param {Object} updateData - Dữ liệu cập nhật
 * @returns {Promise} - Promise chứa thông tin người bán đã cập nhật
 */
export const updateSeller = async (sellerId, updateData) => {
    try {
        const res = await api.put(`/sellers/${sellerId}`, updateData);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Xóa người bán (yêu cầu quyền admin)
 * @param {string} sellerId - ID người bán
 * @returns {Promise} - Promise chứa kết quả xóa
 */
export const deleteSeller = async (sellerId) => {
    try {
        const res = await api.delete(`/sellers/${sellerId}`);
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Cập nhật cấp độ KYC cho người bán (yêu cầu quyền seller)
 * @param {string} sellerId - ID người bán
 * @param {number} kycLevel - Cấp độ KYC mới
 * @param {Object} kycDetails - Chi tiết KYC
 * @returns {Promise} - Promise chứa thông tin người bán đã cập nhật
 */
export const updateKycLevel = async (sellerId, kycLevel, kycDetails) => {
    try {
        const res = await api.put(`/sellers/${sellerId}/kyc`, { kycLevel, kycDetails });
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};

/**
 * Lấy thông tin người bán của user hiện tại
 * @returns {Promise} - Promise chứa thông tin người bán
 */
export const getMySellerInfo = async () => {
    try {
        const res = await api.get('/sellers/me');
        return res.data;
    } catch (error) {
        throw error.response?.data || error;
    }
};