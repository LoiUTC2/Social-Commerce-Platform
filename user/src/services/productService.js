import api from '../utils/api';

// Thêm sản phẩm mới
export const createProduct = async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
};

// Cập nhật sản phẩm
export const updateProduct = async (productId, productData) => {
    const res = await api.put(`/products/${productId}`, productData);
    return res.data;
};

// Xoá sản phẩm (soft/hard)
export const deleteProduct = async (productId, type = 'soft') => {
    const res = await api.delete(`/products/${productId}?type=${type}`);
    return res.data;
};

// Khôi phục sản phẩm đã xoá mềm
export const restoreProduct = async (productId) => {
    const res = await api.patch(`/products/${productId}/restore`);
    return res.data;
};

// Lấy danh sách sản phẩm nổi bật
export const getFeaturedProducts = async (page = 1, limit = 20) => {
    const res = await api.get(`/products/featured?page=${page}&limit=${limit}`);
    return res.data;
};

// Lấy danh sách sản phẩm gợi ý (dựa trên hành vi)
export const getSuggestedProducts = async (page = 1, limit = 20) => {
    const res = await api.get(`/products/suggested?page=${page}&limit=${limit}`);
    return res.data;
};

// Lấy danh sách sản phẩm của shop cho seller
export const getAllProductsToShop = async (seller, page = 1, limit = 20) => {
    const res = await api.get(`/products/shop/${seller}?page=${page}&limit=${limit}`);
    return res.data;
};
