// src/services/postService.js
import api from '../utils/api';

/**
 * 📋 Lấy danh sách tất cả bài viết cho admin với phân trang và lọc
 */
export const getAllPostsForAdmin = async (filters = {}, page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
        params: {
            ...filters,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🔍 Lấy chi tiết thông tin 1 bài viết (admin)
 */
export const getPostDetails = async (postId) => {
    const response = await api.get(`/admin/posts/${postId}`);
    return response.data;
};

/**
 * ✏️ Cập nhật bài viết (admin)
 */
export const updatePost = async (postId, updateData) => {
    const response = await api.put(`/admin/posts/${postId}`, updateData);
    return response.data;
};

/**
 * 🗑️ Xóa bài viết vĩnh viễn (admin)
 */
export const deletePostPermanently = async (postId) => {
    const response = await api.delete(`/admin/posts/${postId}`);
    return response.data;
};

/**
 * 📊 Lấy thống kê bài viết
 */
export const getPostStatistics = async (filters = {}) => {
    const response = await api.get('/admin/posts/statistics', {
        params: filters,
    });
    return response.data;
};

/**
 * 💰 Cập nhật trạng thái tài trợ của bài viết
 */
export const updateSponsoredStatus = async (postId, isSponsored) => {
    const response = await api.put(`/admin/posts/${postId}/sponsored`, { isSponsored });
    return response.data;
};

/**
 * 🔎 Tìm kiếm bài viết nâng cao
 */
export const advancedSearchPosts = async (searchParams = {}, page = 1, limit = 20) => {
    const response = await api.get('/admin/posts/search', {
        params: {
            ...searchParams,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 📝 Lấy bài viết theo loại tác giả (User hoặc Shop)
 */
export const getPostsByAuthorType = async (authorType, page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
        params: {
            authorType,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🏷️ Lấy bài viết theo danh mục chính
 */
export const getPostsByCategory = async (mainCategory, page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
        params: {
            mainCategory,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🔒 Lấy bài viết theo quyền riêng tư
 */
export const getPostsByPrivacy = async (privacy, page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
        params: {
            privacy,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 💎 Lấy bài viết được tài trợ
 */
export const getSponsoredPosts = async (page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
        params: {
            isSponsored: true,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 👤 Lấy bài viết theo ID tác giả cụ thể
 */
export const getPostsByAuthorId = async (authorId, page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
        params: {
            authorId,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 🔤 Tìm kiếm bài viết theo từ khóa
 */
export const searchPostsByKeyword = async (keyword, page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
        params: {
            keyword,
            page,
            limit,
        },
    });
    return response.data;
};

/**
 * 📈 Lấy bài viết với sắp xếp tùy chỉnh
 */
export const getPostsWithSorting = async (sortBy = 'createdAt', sortOrder = 'desc', page = 1, limit = 20) => {
    const response = await api.get('/admin/posts', {
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
 * 🎯 Tìm kiếm bài viết theo nhiều điều kiện
 */
export const searchPostsAdvanced = async ({
    content,
    hashtags,
    tags,
    authorName,
    minLikes,
    maxLikes,
    minComments,
    maxComments,
    dateFrom,
    dateTo,
    hasProducts,
    hasMedia,
    page = 1,
    limit = 20
}) => {
    const params = {};

    if (content) params.content = content;
    if (hashtags) params.hashtags = hashtags;
    if (tags) params.tags = tags;
    if (authorName) params.authorName = authorName;
    if (minLikes) params.minLikes = minLikes;
    if (maxLikes) params.maxLikes = maxLikes;
    if (minComments) params.minComments = minComments;
    if (maxComments) params.maxComments = maxComments;
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    if (hasProducts !== undefined) params.hasProducts = hasProducts;
    if (hasMedia !== undefined) params.hasMedia = hasMedia;

    params.page = page;
    params.limit = limit;

    const response = await api.get('/admin/posts/search', { params });
    return response.data;
};