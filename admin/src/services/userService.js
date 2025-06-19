// src/services/userService.js
import api from '../utils/api';

/**
 * 📋 Lấy danh sách tất cả người dùng cho admin với phân trang và lọc
 */
export const getAllUsersForAdmin = async (filters = {}, page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            ...filters,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🔍 Lấy chi tiết thông tin 1 người dùng (admin)
 */
export const getUserDetails = async (userId) => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
};

/**
 * ✏️ Cập nhật thông tin người dùng (admin)
 */
export const updateUser = async (userId, updateData) => {
    const response = await api.put(`/admin/users/${userId}`, updateData);
    return response.data;
};

/**
 * 🔄 Thay đổi trạng thái kích hoạt/vô hiệu hóa người dùng
 */
export const toggleUserStatus = async (userId, isActive, reason = '') => {
    const response = await api.put(`/admin/users/${userId}/status`, {
        isActive,
        reason,
    });
    return response.data;
};

/**
 * 🚫 Vô hiệu hóa người dùng (soft delete)
 */
export const softDeleteUser = async (userId, reason = '') => {
    const response = await api.put(`/admin/users/${userId}/deactivate`, { reason });
    return response.data;
};

/**
 * 🗑️ Xóa vĩnh viễn người dùng (admin)
 */
export const deleteUserPermanently = async (userId, confirmDelete = true) => {
    const response = await api.delete(`/admin/users/${userId}`, {
        data: { confirmDelete },
    });
    return response.data;
};

/**
 * 📊 Lấy thống kê tổng quan người dùng
 */
export const getUserStatistics = async (period = '30d') => {
    const response = await api.get('/admin/users/statistics', {
        params: { period },
    });
    return response.data;
};

/**
 * 🔎 Tìm kiếm người dùng nâng cao
 */
export const advancedUserSearch = async (searchParams = {}, page = 1, limit = 20) => {
    const response = await api.get('/admin/users/search', {
        params: {
            ...searchParams,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 👥 Lấy người dùng theo role (buyer, seller, admin)
 */
export const getUsersByRole = async (role, page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            role,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * ✅ Lấy người dùng đang hoạt động
 */
export const getActiveUsers = async (page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            isActive: true,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * ❌ Lấy người dùng không hoạt động
 */
export const getInactiveUsers = async (page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            isActive: false,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🏪 Lấy người dùng có shop
 */
export const getUsersWithShop = async (page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            hasShop: true,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 👤 Lấy người dùng không có shop
 */
export const getUsersWithoutShop = async (page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            hasShop: false,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 📝 Lấy người dùng theo trạng thái shop
 */
export const getUsersByShopStatus = async (shopStatus, page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            shopStatus,
            hasShop: true,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🔤 Tìm kiếm người dùng theo từ khóa
 */
export const searchUsersByKeyword = async (keyword, page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            keyword,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 📈 Lấy người dùng với sắp xếp tùy chỉnh
 */
export const getUsersWithSorting = async (sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            sortBy,
            sortOrder,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🎯 Tìm kiếm người dùng theo nhiều điều kiện chi tiết
 */
export const searchUsersAdvanced = async ({
    email,
    phone,
    fullName,
    role,
    hasShop,
    shopName,
    joinedFrom,
    joinedTo,
    isActive,
    minOrders,
    maxOrders,
    page = 1,
    limit = 20
}) => {
    const params = {};

    if (email) params.email = email;
    if (phone) params.phone = phone;
    if (fullName) params.fullName = fullName;
    if (role) params.role = role;
    if (hasShop !== undefined) params.hasShop = hasShop;
    if (shopName) params.shopName = shopName;
    if (joinedFrom) params.joinedFrom = joinedFrom;
    if (joinedTo) params.joinedTo = joinedTo;
    if (isActive !== undefined) params.isActive = isActive;
    if (minOrders) params.minOrders = minOrders;
    if (maxOrders) params.maxOrders = maxOrders;

    params.page = page;
    params.limit = limit;

    const response = await api.get('/admin/users/search', { params });
    return response.data;
};

/**
 * 🛒 Lấy người dùng là sellers (có role seller)
 */
export const getSellers = async (page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            role: 'seller',
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🛍️ Lấy người dùng là buyers (có role buyer)
 */
export const getBuyers = async (page = 1, limit = 20) => {
    const response = await api.get('/admin/users', {
        params: {
            role: 'buyer',
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * ⚡ Kích hoạt người dùng
 */
export const activateUser = async (userId, reason = '') => {
    return await toggleUserStatus(userId, true, reason);
};

/**
 * 🚫 Vô hiệu hóa người dùng
 */
export const deactivateUser = async (userId, reason = '') => {
    return await toggleUserStatus(userId, false, reason);
};

/**
 * 📧 Tìm kiếm người dùng theo email
 */
export const searchUserByEmail = async (email) => {
    const response = await api.get('/admin/users/search', {
        params: { email, limit: 1 },
    });
    return response.data;
};

/**
 * 📱 Tìm kiếm người dùng theo số điện thoại
 */
export const searchUserByPhone = async (phone) => {
    const response = await api.get('/admin/users/search', {
        params: { phone, limit: 1 },
    });
    return response.data;
};

/**
 * 📅 Lấy người dùng mới tham gia trong khoảng thời gian
 */
export const getNewUsers = async (period = '7d', page = 1, limit = 20) => {
    const endDate = new Date();
    let startDate = new Date();

    switch (period) {
        case '7d':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case '30d':
            startDate.setDate(startDate.getDate() - 30);
            break;
        case '90d':
            startDate.setDate(startDate.getDate() - 90);
            break;
        default:
            startDate.setDate(startDate.getDate() - 7);
    }

    const response = await api.get('/admin/users/search', {
        params: {
            joinedFrom: startDate.toISOString(),
            joinedTo: endDate.toISOString(),
            page,
            limit,
        },
    });
    return response.data;
};