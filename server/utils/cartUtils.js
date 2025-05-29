const Cart = require('../models/Cart');

/**
 * Xoá các item đã được đặt hàng thành công khỏi giỏ hàng
 * @param {Object} actor - từ req.actor
 * @param {Array} orderedItems - danh sách các sản phẩm đã mua: [{ productId, selectedVariant }]
 */

// Thêm helper function để chuẩn hóa selectedVariant
const normalizeSelectedVariant = (variant) => {
    // Chuyển null, undefined, hoặc object rỗng thành {}
    if (!variant || Object.keys(variant).length === 0) {
        return {};
    }
    return variant;
};

// Thêm helper function để so sánh selectedVariant
const compareSelectedVariants = (variant1, variant2) => {
    const normalized1 = normalizeSelectedVariant(variant1);
    const normalized2 = normalizeSelectedVariant(variant2);
    return JSON.stringify(normalized1) === JSON.stringify(normalized2);
};

const removeOrderedItemsFromCart = async (actor, orderedItems = []) => {
    try {
        if (!actor || !actor._id || !actor.type) return;

        const cart = await Cart.findOne({
            'author._id': actor._id,
            'author.type': actor.type === "shop" ? "Shop" : "User"
        });

        if (!cart || cart.items.length === 0) return;

        // Lọc lại danh sách chưa mua (giữ lại)
        cart.items = cart.items.filter(cartItem => {
            return !orderedItems.some(ordered =>
                cartItem.product.toString() === ordered.productId &&
                compareSelectedVariants(cartItem.selectedVariant,ordered.selectedVariant)
            );
        });

        cart.updatedAt = new Date();
        await cart.save();
    } catch (err) {
        console.error('Lỗi khi xoá sản phẩm đã mua khỏi giỏ hàng:', err.message);
    }
};

module.exports = { removeOrderedItemsFromCart };
