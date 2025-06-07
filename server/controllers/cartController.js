const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { successResponse, errorResponse } = require('../utils/response');
const logUserInteraction = require('../utils/logUserInteraction');
const UserInteraction = require('../models/UserInteraction');
const { trackInteraction } = require('../middleware/interactionMiddleware');

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

exports.addToCart = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        // Chuẩn hóa selectedVariant ngay từ đầu
        const { productId, quantity = 1, selectedVariant } = req.body;
        const normalizedVariant = normalizeSelectedVariant(selectedVariant);

        if (!productId) return errorResponse(res, 'Thiếu productId', 400);
        if (quantity <= 0) return errorResponse(res, 'Số lượng không hợp lệ', 400);

        // Populate product với shop thông tin để kiểm tra
        const product = await Product.findById(productId)
            .populate('seller', 'name slug avatar status')
            .populate('mainCategory', 'name slug');

        if (!product || !product.isActive) {
            return errorResponse(res, 'Sản phẩm không tồn tại hoặc đã ngừng bán', 404);
        }

        // Kiểm tra shop có còn hoạt động không
        if (!product.seller.status?.isActive || !product.seller.status?.isApprovedCreate) {
            return errorResponse(res, 'Cửa hàng đã ngừng hoạt động hoặc chưa được duyệt', 400);
        }

        // Kiểm tra stock
        if (product.stock < quantity) {
            return errorResponse(res, 'Số lượng sản phẩm không đủ trong kho', 400);
        }

        // Tìm giỏ hàng theo actor
        let cart = await Cart.findOne({ 'author._id': actorId, 'author.type': actorType });

        // Nếu chưa có giỏ hàng → tạo mới
        if (!cart) {
            cart = new Cart({
                author: {
                    _id: actorId,
                    type: actorType
                },
                items: [{
                    product: productId,
                    quantity,
                    selectedVariant: normalizedVariant
                }]
            });
        } else {
            // Sử dụng helper function để so sánh
            const existingItem = cart.items.find(item =>
                item.product.toString() === productId &&
                compareSelectedVariants(item.selectedVariant, normalizedVariant)
            );

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (product.stock < newQuantity) {
                    return errorResponse(res, 'Số lượng sản phẩm không đủ trong kho', 400);
                }
                existingItem.quantity = newQuantity;
                existingItem.addedAt = new Date();
            } else {
                cart.items.push({
                    product: productId,
                    quantity,
                    selectedVariant: normalizedVariant,
                    addedAt: new Date()
                });
            }

            cart.updatedAt = new Date();
        }

        await cart.save();

        // Populate cart để trả về thông tin đầy đủ
        const populatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'name slug images price discount stock isActive variants brand soldCount ratings sku',
                populate: [
                    {
                        path: 'seller',
                        select: 'name slug avatar contact.phone status'
                    },
                    {
                        path: 'mainCategory',
                        select: 'name slug'
                    }
                ]
            });

        // Lọc ra các sản phẩm active và tính toán dữ liệu
        const activeItems = populatedCart.items.filter(item =>
            item.product &&
            item.product.isActive &&
            item.product.seller?.status?.isActive
        );

        let totalItems = 0;
        let totalPrice = 0;

        activeItems.forEach(item => {
            totalItems += item.quantity;
            const itemPrice = item.product.discount > 0
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product.price;
            totalPrice += itemPrice * item.quantity;
        });

        const cartData = {
            ...populatedCart.toObject(),
            totalItems,
            totalPrice: Math.round(totalPrice),
            itemsCount: activeItems.length
        };

        // Ghi nhận hành vi add_to_cart
        req.body = {
            targetType: 'product',
            targetId: productId,
            action: 'add_to_cart',
            metadata: { quantity, selectedVariant: normalizedVariant }
        };
        await trackInteraction(req, res, () => { });

        return successResponse(res, 'Thêm vào giỏ hàng thành công', cartData);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi thêm vào giỏ hàng', 500, err.message);
    }
};

exports.getCart = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        }).populate({
            path: 'items.product',
            select: 'name slug images price discount stock isActive variants brand soldCount ratings sku',
            populate: [
                {
                    path: 'seller',
                    select: 'name slug avatar contact.phone status'
                },
                {
                    path: 'mainCategory',
                    select: 'name slug'
                }
            ]
        });

        if (!cart || cart.items.length === 0) {
            return successResponse(res, 'Giỏ hàng đang trống', {
                author: { _id: actorId, type: actorType },
                items: [],
                totalItems: 0,
                totalPrice: 0
            });
        }

        // Lọc ra các sản phẩm không còn active hoặc shop không còn hoạt động
        const activeItems = cart.items.filter(item =>
            item.product &&
            item.product.isActive &&
            item.product.seller?.status?.isActive
        );

        // Tính toán thông tin tổng quan
        let totalItems = 0;
        let totalPrice = 0;

        activeItems.forEach(item => {
            totalItems += item.quantity;
            const itemPrice = item.product.discount > 0
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product.price;
            totalPrice += itemPrice * item.quantity;
        });

        // Nếu có sản phẩm bị lọc ra, cập nhật cart
        if (activeItems.length !== cart.items.length) {
            cart.items = activeItems;
            await cart.save();
        }

        const cartData = {
            ...cart.toObject(),
            totalItems,
            totalPrice: Math.round(totalPrice),
            itemsCount: activeItems.length
        };

        return successResponse(res, 'Lấy giỏ hàng thành công', cartData);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy giỏ hàng', 500, error.message);
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        // Chuẩn hóa selectedVariant
        const { productId, selectedVariant, quantity } = req.body;
        const normalizedVariant = normalizeSelectedVariant(selectedVariant);

        if (!productId || typeof quantity !== 'number') {
            return errorResponse(res, 'Thiếu productId hoặc quantity', 400);
        }
        if (quantity < 1) {
            return errorResponse(res, 'Số lượng phải lớn hơn 0', 400);
        }

        // Kiểm tra sản phẩm và stock
        const product = await Product.findById(productId).select('stock isActive');
        if (!product || !product.isActive) {
            return errorResponse(res, 'Sản phẩm không tồn tại hoặc đã ngừng bán', 404);
        }

        if (product.stock < quantity) {
            return errorResponse(res, 'Số lượng sản phẩm không đủ trong kho', 400);
        }

        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        });

        if (!cart) return errorResponse(res, 'Không tìm thấy giỏ hàng', 404);

        // Tìm đúng item theo product + variant
        const item = cart.items.find(
            item =>
                item.product.toString() === productId &&
                compareSelectedVariants(item.selectedVariant, normalizedVariant)
        );

        if (!item) {
            return errorResponse(res, 'Sản phẩm này không có trong giỏ hàng', 404);
        }

        item.quantity = quantity;
        cart.updatedAt = new Date();
        await cart.save();

        // Populate cart để trả về
        const populatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'name slug images price discount stock isActive variants brand soldCount ratings sku',
                populate: [
                    {
                        path: 'seller',
                        select: 'name slug avatar contact.phone status'
                    },
                    {
                        path: 'mainCategory',
                        select: 'name slug'
                    }
                ]
            });

        // Lọc ra các sản phẩm active và tính toán dữ liệu
        const activeItems = populatedCart.items.filter(item =>
            item.product &&
            item.product.isActive &&
            item.product.seller?.status?.isActive
        );

        let totalItems = 0;
        let totalPrice = 0;

        activeItems.forEach(item => {
            totalItems += item.quantity;
            const itemPrice = item.product.discount > 0
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product.price;
            totalPrice += itemPrice * item.quantity;
        });

        const cartData = {
            ...populatedCart.toObject(),
            totalItems,
            totalPrice: Math.round(totalPrice),
            itemsCount: activeItems.length
        };

        // Ghi nhận hành vi update_cart_item
        req.body = {
            targetType: 'product',
            targetId: productId,
            action: 'update_cart_item',
            metadata: { quantity, selectedVariant: normalizedVariant }
        };
        await trackInteraction(req, res, () => { });

        return successResponse(res, 'Cập nhật giỏ hàng thành công', cartData);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật giỏ hàng', 500, err.message);
    }
};

// Xóa một sản phẩm khỏi giỏ hàng
exports.removeCartItem = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        // Chuẩn hóa selectedVariant
        const { productId, selectedVariant } = req.body;
        const normalizedVariant = normalizeSelectedVariant(selectedVariant);

        if (!productId) {
            return errorResponse(res, 'Thiếu productId', 400);
        }

        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        });

        if (!cart || cart.items.length === 0) {
            return errorResponse(res, 'Giỏ hàng không tồn tại hoặc trống', 404);
        }

        const initialCount = cart.items.length;

        // Tìm và xóa item
        cart.items = cart.items.filter(item =>
            !(item.product.toString() === productId &&
                compareSelectedVariants(item.selectedVariant, normalizedVariant))
        );

        if (cart.items.length === initialCount) {
            return errorResponse(res, 'Sản phẩm không tồn tại trong giỏ hàng', 404);
        }

        cart.updatedAt = new Date();
        await cart.save();

        // Populate cart để trả về
        const populatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'name slug images price discount stock isActive variants brand soldCount ratings sku',
                populate: [
                    {
                        path: 'seller',
                        select: 'name slug avatar contact.phone status'
                    },
                    {
                        path: 'mainCategory',
                        select: 'name slug'
                    }
                ]
            });

        // Lọc ra các sản phẩm active và tính toán dữ liệu
        const activeItems = populatedCart.items.filter(item =>
            item.product &&
            item.product.isActive &&
            item.product.seller?.status?.isActive
        );

        let totalItems = 0;
        let totalPrice = 0;

        activeItems.forEach(item => {
            totalItems += item.quantity;
            const itemPrice = item.product.discount > 0
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product.price;
            totalPrice += itemPrice * item.quantity;
        });

        const cartData = {
            ...populatedCart.toObject(),
            totalItems,
            totalPrice: Math.round(totalPrice),
            itemsCount: activeItems.length
        };

        // Ghi nhận hành vi remove_cart_item
        req.body = {
            targetType: 'product',
            targetId: productId,
            action: 'remove_cart_item',
            metadata: { selectedVariant: normalizedVariant }
        };
        await trackInteraction(req, res, () => { });

        return successResponse(res, 'Đã xóa sản phẩm khỏi giỏ hàng', cartData);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa sản phẩm', 500, err.message);
    }
};

exports.removeMultipleCartItems = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const { items = [] } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return errorResponse(res, 'Danh sách sản phẩm cần xóa không hợp lệ', 400);
        }

        // Validate format của items
        const invalidItems = items.filter(item => !item.productId);
        if (invalidItems.length > 0) {
            return errorResponse(res, 'Một số sản phẩm thiếu productId', 400);
        }

        // Chuẩn hóa selectedVariant trong danh sách items
        const normalizedItems = items.map(item => ({
            ...item,
            selectedVariant: normalizeSelectedVariant(item.selectedVariant)
        }));

        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        });

        if (!cart || cart.items.length === 0) {
            return errorResponse(res, 'Giỏ hàng không tồn tại hoặc trống', 404);
        }

        const initialCount = cart.items.length;

        // Lưu lại items bị xóa để log
        const removedItems = cart.items.filter(cartItem => {
            return normalizedItems.some(item =>
                cartItem.product.toString() === item.productId &&
                compareSelectedVariants(cartItem.selectedVariant, item.selectedVariant)
            );
        });

        // Lọc items
        cart.items = cart.items.filter(cartItem => {
            return !normalizedItems.some(item =>
                cartItem.product.toString() === item.productId &&
                compareSelectedVariants(cartItem.selectedVariant, item.selectedVariant)
            );
        });

        cart.updatedAt = new Date();
        await cart.save();

        for (const removedItem of removedItems) {
            // Ghi nhận hành vi remove_multiple_cart_items cho từng sản phẩm
            req.body = {
                targetType: 'product',
                targetId: removedItem.product,
                action: 'remove_multiple_cart_items',
                metadata: {
                    selectedVariant: removedItem.selectedVariant || {}
                }
            };
            await trackInteraction(req, res, () => { });
        }

        // Populate cart để trả về
        const populatedCart = await Cart.findById(cart._id)
            .populate({
                path: 'items.product',
                select: 'name slug images price discount stock isActive variants brand soldCount ratings sku',
                populate: [
                    {
                        path: 'seller',
                        select: 'name slug avatar contact.phone status'
                    },
                    {
                        path: 'mainCategory',
                        select: 'name slug'
                    }
                ]
            });

        // Lọc ra các sản phẩm active và tính toán dữ liệu
        const activeItems = populatedCart.items.filter(item =>
            item.product &&
            item.product.isActive &&
            item.product.seller?.status?.isActive
        );

        let totalItems = 0;
        let totalPrice = 0;

        activeItems.forEach(item => {
            totalItems += item.quantity;
            const itemPrice = item.product.discount > 0
                ? item.product.price * (1 - item.product.discount / 100)
                : item.product.price;
            totalPrice += itemPrice * item.quantity;
        });

        const cartData = {
            ...populatedCart.toObject(),
            totalItems,
            totalPrice: Math.round(totalPrice),
            itemsCount: activeItems.length
        };

        return successResponse(res, `Đã xóa ${initialCount - cart.items.length} sản phẩm khỏi giỏ hàng`, cartData);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa nhiều sản phẩm', 500, err.message);
    }
};

exports.clearCart = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        }).populate('items.product', 'name'); // Populate để log

        if (!cart || cart.items.length === 0) {
            return successResponse(res, 'Giỏ hàng đã trống', {
                author: { _id: actorId, type: actorType },
                items: [],
                totalItems: 0,
                totalPrice: 0
            });
        }

        const clearedItems = [...cart.items]; // lưu lại để log hành vi
        const clearedCount = cart.items.length;

        cart.items = [];
        cart.updatedAt = new Date();
        await cart.save();

        for (const item of clearedItems) {
            // Ghi nhận hành vi clear_cart cho từng sản phẩm
            req.body = {
                targetType: 'product',
                targetId: item.product._id,
                action: 'clear_cart',
                metadata: {
                    quantity: item.quantity,
                    selectedVariant: item.selectedVariant || {}
                }
            };
            await trackInteraction(req, res, () => { });
        }

        return successResponse(res, `Đã xóa toàn bộ ${clearedCount} sản phẩm khỏi giỏ hàng`, {
            author: { _id: actorId, type: actorType },
            items: [],
            totalItems: 0,
            totalPrice: 0,
            itemsCount: 0
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa giỏ hàng', 500, err.message);
    }
};

// Thêm hàm mới để lấy số lượng items trong cart (cho header/badge)
exports.getCartCount = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        }).select('items');

        const totalItems = cart ? cart.items.reduce((sum, item) => sum + item.quantity, 0) : 0;

        return successResponse(res, 'Lấy số lượng giỏ hàng thành công', {
            totalItems, //Số lượng tất cả các số lượng từng loại sản phẩm cộng lại
            itemsCount: cart ? cart.items.length : 0  //Số lượng loại sản phẩm 
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy số lượng giỏ hàng', 500, error.message);
    }
};

// Thêm hàm kiểm tra và làm sạch cart (xóa sản phẩm không còn active)
exports.cleanCart = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        }).populate({
            path: 'items.product',
            select: 'isActive',
            populate: {
                path: 'seller',
                select: 'status.isActive status.isApprovedCreate'
            }
        });

        if (!cart || cart.items.length === 0) {
            return successResponse(res, 'Giỏ hàng đang trống', { items: [] });
        }

        const initialCount = cart.items.length;

        // Lọc ra các items có product và shop còn active
        cart.items = cart.items.filter(item =>
            item.product &&
            item.product.isActive &&
            item.product.seller?.status?.isActive &&
            item.product.seller?.status?.isApprovedCreate
        );

        if (cart.items.length !== initialCount) {
            cart.updatedAt = new Date();
            await cart.save();
        }

        const removedCount = initialCount - cart.items.length;
        const message = removedCount > 0
            ? `Đã loại bỏ ${removedCount} sản phẩm không còn khả dụng`
            : 'Tất cả sản phẩm trong giỏ hàng đều khả dụng';

        // Ghi nhận hành vi clean_cart cho từng sản phẩm bị xóa
        const removedItems = cart.items.filter(item => !item.product?.isActive || !item.product?.seller?.status?.isActive);
        for (const item of removedItems) {
            req.body = {
                targetType: 'product',
                targetId: item.product._id,
                action: 'clean_cart',
                metadata: {
                    reason: !item.product?.isActive ? 'product_inactive' : 'shop_inactive'
                }
            };
            await trackInteraction(req, res, () => { });
        }

        return successResponse(res, message, {
            removedCount,
            remainingCount: cart.items.length
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi làm sạch giỏ hàng', 500, error.message);
    }
};