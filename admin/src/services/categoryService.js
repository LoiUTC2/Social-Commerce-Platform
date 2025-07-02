import api from '../utils/api';

// ============================================================================
// CATEGORY CRUD OPERATIONS
// ============================================================================

/**
 * [POST] Tạo danh mục mới (admin only)
 * @param {Object} data - Dữ liệu danh mục
 * @returns {Promise} Response data với category và breadcrumb
 */
export const createCategory = async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
};

/**
 * [PUT] Cập nhật danh mục (admin only)
 * @param {string} categoryId - ID danh mục
 * @param {Object} data - Dữ liệu cập nhật
 * @returns {Promise} Response data với category và breadcrumb
 */
export const updateCategory = async (categoryId, data) => {
    const res = await api.put(`/categories/${categoryId}`, data);
    return res.data;
};

/**
 * [DELETE] Xóa danh mục (admin only)
 * @param {string} categoryId - ID danh mục
 * @returns {Promise} Response data
 */
export const deleteCategory = async (categoryId) => {
    const res = await api.delete(`/categories/${categoryId}`);
    return res.data;
};

// ============================================================================
// CATEGORY RETRIEVAL OPERATIONS
// ============================================================================

/**
 * [GET] Lấy tất cả danh mục với các filter và phân trang
 * @param {Object} params - Query parameters
 * @param {number} params.page - Trang hiện tại
 * @param {number} params.limit - Số lượng mỗi trang
 * @param {number} params.level - Cấp độ danh mục
 * @param {string} params.parent - ID danh mục cha
 * @param {string} params.search - Từ khóa tìm kiếm
 * @param {boolean} params.isActive - Trạng thái active
 * @param {string} params.sortBy - Sắp xếp theo (sortOrder, name, level, created)
 * @returns {Promise} Response data với categories và pagination
 */
export const getAllCategories = async (params = {}) => {
    const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    ).toString();

    const res = await api.get(`/categories${queryString ? `?${queryString}` : ''}`);
    return res.data;
};

/**
 * [GET] Lấy cây danh mục phân cấp (parent → children)
 * @param {Object} options - Tùy chọn build tree
 * @param {boolean} options.includeInactive - Bao gồm danh mục không active
 * @param {number} options.maxLevel - Cấp độ tối đa
 * @param {string} options.parentId - ID danh mục cha
 * @param {string} options.sortBy - Sắp xếp theo
 * @returns {Promise} Response data với tree structure
 */
export const getCategoryTree = async (options = {}) => {
    const queryString = new URLSearchParams(
        Object.entries(options).filter(([_, value]) => value !== undefined && value !== '')
    ).toString();

    const res = await api.get(`/categories/tree${queryString ? `?${queryString}` : ''}`);
    return res.data;
};

/**
 * [GET] Lấy danh mục theo ID
 * @param {string} categoryId - ID danh mục
 * @returns {Promise} Response data với category, breadcrumb, children
 */
export const getCategoryById = async (categoryId) => {
    const res = await api.get(`/categories/${categoryId}`);
    return res.data;
};

/**
 * [GET] Lấy danh mục theo cấp độ
 * @param {number|string} level - Cấp độ (1, 2, 3,... hoặc 'all')
 * @returns {Promise} Response data với categories theo level
 */
export const getCategoriesByLevel = async (level) => {
    const res = await api.get(`/categories/by-level?level=${level}`);
    return res.data;
};

// ============================================================================
// CATEGORY RELATIONSHIP OPERATIONS
// ============================================================================

/**
 * [GET] Lấy breadcrumb của danh mục
 * @param {string} categoryId - ID danh mục
 * @returns {Promise} Response data với breadcrumb array
 */
export const getCategoryBreadcrumb = async (categoryId) => {
    const res = await api.get(`/categories/${categoryId}/breadcrumb`);
    return res.data;
};

/**
 * [GET] Lấy tất cả danh mục con
 * @param {string} categoryId - ID danh mục cha
 * @param {boolean} includeInactive - Bao gồm danh mục không active
 * @returns {Promise} Response data với children array
 */
export const getCategoryChildren = async (categoryId, includeInactive = false) => {
    const res = await api.get(`/categories/${categoryId}/children?includeInactive=${includeInactive}`);
    return res.data;
};

/**
 * [PUT] Di chuyển danh mục sang danh mục cha khác (admin only)
 * @param {string} categoryId - ID danh mục cần di chuyển
 * @param {string} newParentId - ID danh mục cha mới (null để thành root)
 * @returns {Promise} Response data với category và breadcrumb mới
 */
export const moveCategory = async (categoryId, newParentId) => {
    const res = await api.put(`/categories/${categoryId}/move`, { newParentId });
    return res.data;
};

// ============================================================================
// CATEGORY SEARCH & STATS OPERATIONS
// ============================================================================

/**
 * [GET] Tìm kiếm danh mục
 * @param {string} searchTerm - Từ khóa tìm kiếm
 * @param {Object} options - Tùy chọn tìm kiếm
 * @param {number} options.level - Cấp độ danh mục
 * @param {boolean} options.isActive - Trạng thái active
 * @param {number} options.limit - Giới hạn kết quả
 * @returns {Promise} Response data với results array
 */
export const searchCategories = async (searchTerm, options = {}) => {
    const params = { q: searchTerm, ...options };
    const queryString = new URLSearchParams(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    ).toString();

    const res = await api.get(`/categories/search?${queryString}`);
    return res.data;
};

/**
 * [GET] Lấy thống kê danh mục
 * @returns {Promise} Response data với stats object
 */
export const getCategoryStats = async () => {
    const res = await api.get('/categories/stats');
    return res.data;
};

// ============================================================================
// CATEGORY MANAGEMENT OPERATIONS (Admin Only)
// ============================================================================

/**
 * [GET] Kiểm tra có thể xóa danh mục không
 * @param {string} categoryId - ID danh mục
 * @returns {Promise} Response data với canDelete và reason
 */
export const checkCanDelete = async (categoryId) => {
    const res = await api.get(`/categories/${categoryId}/can-delete`);
    return res.data;
};

/**
 * [PUT] Cập nhật số lượng sản phẩm cho danh mục (admin only)
 * @param {string} categoryId - ID danh mục
 * @param {number} productCount - Số lượng sản phẩm
 * @returns {Promise} Response data với category đã cập nhật
 */
export const updateProductCount = async (categoryId, productCount) => {
    const res = await api.put(`/categories/${categoryId}/product-count`, { productCount });
    return res.data;
};

/**
 * [PUT] Cập nhật số lượng shop cho danh mục (admin only)
 * @param {string} categoryId - ID danh mục
 * @param {number} shopCount - Số lượng shop
 * @returns {Promise} Response data với category đã cập nhật
 */
export const updateShopCount = async (categoryId, shopCount) => {
    const res = await api.put(`/categories/${categoryId}/shop-count`, { shopCount });
    return res.data;
};

/**
 * [PUT] Cập nhật thứ tự sắp xếp nhiều danh mục cùng lúc (admin only)
 * @param {Array} categories - Array of {id, sortOrder}
 * @returns {Promise} Response data với categories đã cập nhật
 */
export const updateSortOrder = async (categories) => {
    const res = await api.put('/categories/bulk/sort-order', { categories });
    return res.data;
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Hàm helper để build query parameters từ object
 * @param {Object} params - Object chứa parameters
 * @returns {string} Query string
 */
export const buildQueryString = (params) => {
    return new URLSearchParams(
        Object.entries(params).filter(([_, value]) => value !== undefined && value !== '')
    ).toString();
};

/**
 * Hàm helper để lấy danh mục root (level 1)
 * @returns {Promise} Response data với root categories
 */
export const getRootCategories = async () => {
    return await getCategoriesByLevel(1);
};

/**
 * Hàm helper để lấy tất cả danh mục active
 * @returns {Promise} Response data với active categories
 */
export const getActiveCategories = async () => {
    return await getAllCategories({ isActive: true });
};

/**
 * Hàm helper để tìm kiếm danh mục với từ khóa đơn giản
 * @param {string} keyword - Từ khóa tìm kiếm
 * @returns {Promise} Response data với search results
 */
export const quickSearch = async (keyword) => {
    if (!keyword || keyword.trim().length < 2) {
        throw new Error('Từ khóa tìm kiếm phải có ít nhất 2 ký tự');
    }
    return await searchCategories(keyword.trim(), { isActive: true, limit: 10 });
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

/**
 * Lấy nhiều danh mục theo danh sách ID
 * @param {Array<string>} categoryIds - Array of category IDs
 * @returns {Promise<Array>} Array of category data
 */
export const getCategoriesByIds = async (categoryIds) => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return [];
    }

    const promises = categoryIds.map(id => getCategoryById(id).catch(() => null));
    const results = await Promise.all(promises);

    return results.filter(result => result !== null);
};

/**
 * Lấy breadcrumb cho nhiều danh mục
 * @param {Array<string>} categoryIds - Array of category IDs
 * @returns {Promise<Object>} Object với key là categoryId, value là breadcrumb
 */
export const getBreadcrumbsForCategories = async (categoryIds) => {
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
        return {};
    }

    const promises = categoryIds.map(async (id) => {
        try {
            const breadcrumb = await getCategoryBreadcrumb(id);
            return { id, breadcrumb: breadcrumb.data };
        } catch {
            return { id, breadcrumb: [] };
        }
    });

    const results = await Promise.all(promises);
    return results.reduce((acc, { id, breadcrumb }) => {
        acc[id] = breadcrumb;
        return acc;
    }, {});
};

// Export default object chứa tất cả functions (tùy chọn)
export default {
    // CRUD
    createCategory,
    updateCategory,
    deleteCategory,

    // Retrieval
    getAllCategories,
    getCategoryTree,
    getCategoryById,
    getCategoriesByLevel,

    // Relationships
    getCategoryBreadcrumb,
    getCategoryChildren,
    moveCategory,

    // Search & Stats
    searchCategories,
    getCategoryStats,

    // Management
    checkCanDelete,
    updateProductCount,
    updateShopCount,
    updateSortOrder,

    // Utilities
    buildQueryString,
    getRootCategories,
    getActiveCategories,
    quickSearch,
    getCategoriesByIds,
    getBreadcrumbsForCategories
};