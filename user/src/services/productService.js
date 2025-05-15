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
export const toggleProductStatus = async (productId) => {
    const res = await api.patch(`/products/toggleStatus/${productId}`);
    return res.data;
};

// Lấy danh sách sản phẩm nổi bật (dựa vào rating và soldCount)
export const getFeaturedProducts = async (page = 1, limit = 20, category = null) => {
    const url = category
        ? `/products/featured?page=${page}&limit=${limit}&category=${category}`
        : `/products/featured?page=${page}&limit=${limit}`;
    const res = await api.get(url);
    return res.data;
};

// Lấy danh sách sản phẩm gợi ý (dựa trên hành vi)
export const getSuggestedProducts = async (page = 1, limit = 20) => {
    const res = await api.get(`/products/suggested?page=${page}&limit=${limit}`);
    return res.data;
};

// Lấy danh sách sản phẩm theo shop cho người dùng (sàn TMĐT)
export const getProductsByShopForUser = async (sellerId, page = 1, limit = 20, sort = 'newest') => {
    const res = await api.get(`/products/getAllForUser/${sellerId}?page=${page}&limit=${limit}&sort=${sort}`);
    return res.data;
};

// Lấy danh sách sản phẩm theo shop cho seller quản lý (Trang quản lí người bán)
export const getProductsByShopForSeller = async (sellerId, page = 1, limit = 20, sort = 'newest', status, search) => {
    let url = `/products/getAllForSeller/${sellerId}?page=${page}&limit=${limit}&sort=${sort}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const res = await api.get(url);
    return res.data;
};

// Lấy chi tiết sản phẩm cho user 
export const getProductDetailForUser = async (slug) => {
    const res = await api.get(`/products/getDetailForUser/${slug}`);
    return res.data;
};

// Lấy chi tiết sản phẩm cho seller xem trong trang seller
export const getProductDetailForSeller = async (slug) => {
    const res = await api.get(`/products/getDetailForSeller/${slug}`);
    return res.data;
};

// Tìm sản phẩm theo slug (dạng rút gọn)
export const getProductBySlug = async (slug) => {
    const res = await api.get(`/products/slug/${slug}`);
    return res.data;
};