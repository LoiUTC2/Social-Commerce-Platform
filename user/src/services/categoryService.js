import api from '../utils/api';

// [GET] Lấy tất cả danh mục (không phân cấp)
export const getAllCategories = async () => {
    const res = await api.get('/categories');
    return res.data;
};

// [GET] Lấy cây danh mục phân cấp (parent → children)
export const getCategoryTree = async () => {
    const res = await api.get('/categories/tree');
    return res.data;
};

// [GET] Lấy danh mục theo ID
export const getCategoryById = async (categoryId) => {
    const res = await api.get(`/categories/${categoryId}`);
    return res.data;
};

// [GET] Lấy danh mục theo cấp độ (level = 1, 2, 3,... hoặc 'all')
export const getCategoriesByLevel = async (level) => {
    const res = await api.get(`/categories/by-level?level=${level}`);
    return res.data;
};

// [POST] Tạo danh mục mới (admin)
export const createCategory = async (data) => {
    const res = await api.post('/categories', data);
    return res.data;
};

// [PUT] Cập nhật danh mục (admin)
export const updateCategory = async (categoryId, data) => {
    const res = await api.put(`/categories/${categoryId}`, data);
    return res.data;
};

// [DELETE] Xoá danh mục (admin)
export const deleteCategory = async (categoryId) => {
    const res = await api.delete(`/categories/${categoryId}`);
    return res.data;
};
