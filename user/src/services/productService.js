import api from '../utils/api';

// Thêm sản phẩm mới
export const createProduct = async (productData) => {
    const res = await api.post('/products', productData);
    return res.data;
};

// Cập nhật sản phẩm
export const updateProduct = async (slug, productData) => {
    const res = await api.put(`/products/${slug}`, productData);
    return res.data;
};

// Xoá sản phẩm 
export const deleteProduct = async (productId) => {
    const res = await api.delete(`/products/${productId}`);
    return res.data;
};

// Chuyển đổi trạng thái sản phẩm (đang bán, ngừng bán)
export const toggleProductActiveStatus = async (productId) => {
    const res = await api.patch(`/products/toggleStatus/${productId}`);
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

// Lấy danh sách sản phẩm của shop cho user xem trên sàn
export const getAllProductsToShopForUser = async (seller, page = 1, limit = 20) => {
    const res = await api.get(`/products/getAllForUser/${seller}?page=${page}&limit=${limit}`);
    return res.data;
};

// Lấy chi tiết sản phẩm cho user xem trên sàn
export const getDetailProductForUser = async (slug) => {
    const res = await api.get(`/products/getDetailForUser/${slug}`);
    return res.data;
};

// Lấy danh sách sản phẩm của shop cho seller xem trong trang seller
export const getAllProductsToShopForSeller = async (seller, page = 1, limit = 20) => {
    const res = await api.get(`/products/getAllForSeller/${seller}?page=${page}&limit=${limit}`);
    return res.data;
};

// Lấy chi tiết sản phẩm cho seller xem trong trang seller
export const getDetailProductForSeller = async (slug) => {
    const res = await api.get(`/products/getDetailForSeller/${slug}`);
    return res.data;
};