import api from '../utils/api';

// 🛒 Thêm sản phẩm vào giỏ hàng
export const addToCart = async ({ productId, quantity = 1, selectedVariant = {} }) => {
    const res = await api.post('/carts/add', { productId, quantity, selectedVariant });
    return res.data;
};

// 📦 Lấy giỏ hàng đầy đủ (các item, total, shop, variant…)
export const getCart = async () => {
    const res = await api.get('/carts');
    return res.data;
};

// 🔢 Lấy tổng số lượng sản phẩm trong giỏ hàng (badge, header)
export const getCartCount = async () => {
    const res = await api.get('/carts/count');
    return res.data;
};

// ✏️ Cập nhật số lượng của 1 sản phẩm trong giỏ
export const updateCartItem = async ({ productId, selectedVariant = {}, quantity }) => {
    const res = await api.put('/carts/update', { productId, selectedVariant, quantity });
    return res.data;
};

// ❌ Xoá 1 sản phẩm khỏi giỏ
export const removeCartItem = async ({ productId, selectedVariant = {} }) => {
    const res = await api.delete('/carts/remove', {
        data: { productId, selectedVariant },
    });
    return res.data;
};

// ❌❌ Xoá nhiều sản phẩm cùng lúc
export const removeMultipleCartItems = async (items = []) => {
    const res = await api.delete('/carts/remove-multiple', {
        data: { items },
    });
    return res.data;
};

// 🧹 Xoá toàn bộ giỏ hàng
export const clearCart = async () => {
    const res = await api.delete('/carts/clear');
    return res.data;
};

// 🧼 Làm sạch giỏ (xoá sản phẩm không còn bán, shop không hoạt động)
export const cleanCart = async () => {
    const res = await api.patch('/carts/clean');
    return res.data;
};
