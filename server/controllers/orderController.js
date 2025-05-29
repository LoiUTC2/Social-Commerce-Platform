const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const { removeOrderedItemsFromCart } = require('../utils/cartUtils');
const logUserInteraction = require('../utils/logUserInteraction');
const { successResponse, errorResponse } = require('../utils/response');

exports.checkoutOrder = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const { shippingAddress, paymentMethod = 'COD', notes } = req.body;

        // Validate shipping address
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
            return errorResponse(res, 'Thông tin địa chỉ giao hàng không đầy đủ', 400);
        }

        // Lấy giỏ hàng của người mua với populate đầy đủ
        const cart = await Cart.findOne({
            'author._id': actorId,
            'author.type': actorType
        }).populate({
            path: 'items.product',
            select: 'name slug images price discount stock isActive seller brand variants soldCount',
            populate: {
                path: 'seller',
                select: 'name slug avatar logo contact.phone contact.email status.isActive'
            }
        });

        if (!cart || cart.items.length === 0) {
            return errorResponse(res, 'Giỏ hàng trống', 400);
        }

        const orderedItems = []; // Sản phẩm sẽ mua
        const groupedByShop = {}; // Gom sản phẩm theo shop
        const invalidItems = []; // Sản phẩm không hợp lệ

        for (const item of cart.items) {
            const product = item.product;

            // Kiểm tra tính hợp lệ của sản phẩm
            if (!product) {
                invalidItems.push({ reason: 'Sản phẩm không tồn tại', item });
                continue;
            }

            if (!product.isActive) {
                invalidItems.push({ reason: 'Sản phẩm đã ngừng bán', product: product.name });
                continue;
            }

            if (product.stock < item.quantity) {
                invalidItems.push({
                    reason: `Không đủ hàng (còn ${product.stock}, yêu cầu ${item.quantity})`,
                    product: product.name
                });
                continue;
            }

            // Kiểm tra shop còn hoạt động
            if (!product.seller || !product.seller.status.isActive) {
                invalidItems.push({ reason: 'Shop không còn hoạt động', product: product.name });
                continue;
            }

            // Ngăn mua sản phẩm chính shop mình
            if (actorType === 'Shop' && product.seller._id.toString() === actorId.toString()) {
                invalidItems.push({ reason: 'Không thể mua sản phẩm của chính shop mình', product: product.name });
                continue;
            }

            const shopId = product.seller._id.toString();

            if (!groupedByShop[shopId]) {
                groupedByShop[shopId] = {
                    shopInfo: product.seller,
                    items: []
                };
            }

            const finalPrice = product.discount > 0 ?
                product.price * (1 - product.discount / 100) :
                product.price;

            groupedByShop[shopId].items.push({
                product: product._id,
                quantity: item.quantity,
                price: finalPrice, // Giá sau khi giảm
                originalPrice: product.price, // Giá gốc
                selectedVariant: item.selectedVariant
            });

            orderedItems.push({
                productId: product._id.toString(),
                selectedVariant: item.selectedVariant
            });

            // Lưu hành vi "purchase" nếu actor là User
            if (actorType === 'User') {
                await logUserInteraction(req.actor, {
                    targetType: 'product',
                    targetId: product._id,
                    action: 'purchase',
                    metadata: {
                        quantity: item.quantity,
                        selectedVariant: item.selectedVariant,
                        price: finalPrice
                    }
                });
            }
        }

        if (orderedItems.length === 0) {
            return errorResponse(res, 'Không có sản phẩm nào hợp lệ để đặt hàng', 400, { invalidItems });
        }

        const createdOrders = [];

        for (const shopId in groupedByShop) {
            const { shopInfo, items } = groupedByShop[shopId];

            const totalAmount = items.reduce(
                (sum, item) => sum + item.quantity * item.price,
                0
            );

            const order = new Order({
                buyer: {
                    type: actorType,
                    _id: actorId
                },
                shop: shopId,
                items,
                totalAmount,
                shippingFee: 0, // có thể tính sau
                paymentMethod,
                shippingAddress,
                notes
            });

            await order.save();

            // Populate order trước khi trả về
            const populatedOrder = await Order.findById(order._id)
                .populate({
                    path: 'shop',
                    select: 'name slug avatar logo contact.phone contact.email'
                })
                .populate({
                    path: 'items.product',
                    select: 'name slug images price discount variants brand'
                });

            createdOrders.push(populatedOrder);

            // Giảm tồn kho sản phẩm sau khi tạo order thành công
            for (const item of items) {
                await Product.findByIdAndUpdate(item.product, {
                    $inc: {
                        stock: -item.quantity,
                        soldCount: item.quantity
                    }
                });
            }
        }

        // Xóa sản phẩm đã mua khỏi giỏ hàng
        await removeOrderedItemsFromCart(req.actor, orderedItems);

        return successResponse(res, 'Đặt hàng thành công', {
            orders: createdOrders,
            invalidItems: invalidItems.length > 0 ? invalidItems : undefined
        });
    } catch (err) {
        console.error('Checkout error:', err);
        return errorResponse(res, 'Lỗi khi đặt hàng', 500, err.message);
    }
};

exports.createDirectOrder = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const { productId, quantity = 1, selectedVariant = {}, shippingAddress, paymentMethod = 'COD', notes } = req.body;

        if (!productId || quantity < 1) {
            return errorResponse(res, 'Thiếu sản phẩm hoặc số lượng không hợp lệ', 400);
        }

        // Validate shipping address
        if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.phone || !shippingAddress.address) {
            return errorResponse(res, 'Thông tin địa chỉ giao hàng không đầy đủ', 400);
        }

        const product = await Product.findById(productId).populate({
            path: 'seller',
            select: 'name slug avatar logo contact.phone contact.email status.isActive'
        });

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
        }

        if (!product.isActive) {
            return errorResponse(res, 'Sản phẩm đã ngừng bán', 400);
        }

        if (product.stock < quantity) {
            return errorResponse(res, `Không đủ hàng (còn ${product.stock}, yêu cầu ${quantity})`, 400);
        }

        if (!product.seller || !product.seller.status.isActive) {
            return errorResponse(res, 'Shop không còn hoạt động', 400);
        }

        // Ngăn shop tự đặt mua sản phẩm của chính mình
        if (actorType === 'Shop' && product.seller._id.toString() === actorId.toString()) {
            return errorResponse(res, 'Không thể mua sản phẩm từ chính shop của bạn', 400);
        }

        const finalPrice = product.discount > 0 ?
            product.price * (1 - product.discount / 100) :
            product.price;

        const totalAmount = finalPrice * quantity;

        const order = new Order({
            buyer: {
                type: actorType,
                _id: actorId
            },
            shop: product.seller._id,
            items: [{
                product: product._id,
                quantity,
                price: finalPrice,
                selectedVariant
            }],
            totalAmount,
            shippingFee: 0,
            paymentMethod,
            shippingAddress,
            notes
        });

        await order.save();

        // Trừ kho + tăng sold
        product.stock -= quantity;
        product.soldCount += quantity;
        await product.save();

        // Ghi hành vi "purchase" nếu là người dùng
        if (actorType === 'User') {
            await logUserInteraction(req.actor, {
                targetType: 'product',
                targetId: productId,
                action: 'purchase',
                metadata: {
                    quantity,
                    selectedVariant,
                    direct: true,
                    price: finalPrice
                }
            });
        }

        // Populate order trước khi trả về
        const populatedOrder = await Order.findById(order._id)
            .populate({
                path: 'shop',
                select: 'name slug avatar logo contact.phone contact.email'
            })
            .populate({
                path: 'items.product',
                select: 'name slug images price discount variants brand'
            });

        return successResponse(res, 'Đặt hàng thành công', populatedOrder);
    } catch (err) {
        console.error('Direct order error:', err);
        return errorResponse(res, 'Lỗi khi đặt hàng trực tiếp', 500, err.message);
    }
};

exports.getOrders = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";
        const { page = 1, limit = 10, status } = req.query;

        let filter = {};

        if (actorType === 'User') {
            filter['buyer._id'] = actorId;
            filter['buyer.type'] = 'User';
        } else if (actorType === 'Shop') {
            filter['shop'] = actorId;
        } else {
            return errorResponse(res, 'Vai trò không hợp lệ', 403);
        }

        // Lọc theo status nếu có
        if (status && ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
            filter.status = status;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate({
                    path: 'shop',
                    select: 'name slug avatar logo contact.phone contact.email status.isActive'
                })
                .populate({
                    path: 'items.product',
                    select: 'name slug images price discount variants brand categories',
                    populate: {
                        path: 'categories',
                        select: 'name slug'
                    }
                })
                .populate({
                    path: 'buyer._id',
                    select: 'fullName name contact.phone contact.email slug avatar email phone',
                    refPath: 'buyer.type'
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(filter)
        ]);

        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalOrders: total,
            hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
            hasPrev: parseInt(page) > 1
        };

        return successResponse(res, 'Lấy danh sách đơn hàng thành công', {
            orders,
            pagination
        });
    } catch (err) {
        console.error('Get orders error:', err);
        return errorResponse(res, 'Lỗi khi lấy danh sách đơn hàng', 500, err.message);
    }
};

// API lấy đơn hàng cho SELLER
exports.getOrdersForSeller = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type;
        const { page = 1, limit = 10, status, startDate, endDate } = req.query;

        // Chỉ cho phép seller truy cập
        if (actorType !== 'shop') {
            return errorResponse(res, 'Chỉ seller mới có thể truy cập', 403);
        }

        let filter = { shop: actorId };

        // Lọc theo status nếu có
        if (status && ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
            filter.status = status;
        }

        // Lọc theo ngày tháng nếu có
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate({
                    path: 'buyer._id',
                    select: 'fullName name phone contact.phone contact.email email avatar', // Thông tin liên hệ cần thiết
                    refPath: 'buyer.type'
                })
                .populate({
                    path: 'items.product',
                    select: 'name slug images price discount variants brand sku',
                    populate: {
                        path: 'categories',
                        select: 'name slug'
                    }
                })
                .select('buyer items totalAmount shippingFee paymentMethod shippingAddress status isPaid paidAt notes createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(filter)
        ]);

        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalOrders: total,
            hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
            hasPrev: parseInt(page) > 1
        };

        // Thêm thống kê nhanh cho seller
        const quickStats = await Order.aggregate([
            { $match: { shop: actorId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        return successResponse(res, 'Lấy danh sách đơn hàng cho seller thành công', {
            orders,
            pagination,
            quickStats
        });
    } catch (err) {
        console.error('Get orders for seller error:', err);
        return errorResponse(res, 'Lỗi khi lấy danh sách đơn hàng', 500, err.message);
    }
};

// API lấy đơn hàng cho BUYER
exports.getOrdersForBuyer = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";
        const { page = 1, limit = 10, status, shopId } = req.query;

        let filter = {
            'buyer._id': actorId,
            'buyer.type': actorType
        };

        // Lọc theo status nếu có
        if (status && ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'].includes(status)) {
            filter.status = status;
        }

        // Lọc theo shop nếu có
        if (shopId) {
            filter.shop = shopId;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [orders, total] = await Promise.all([
            Order.find(filter)
                .populate({
                    path: 'shop',
                    select: 'name slug avatar logo contact.phone contact.email customerSupport status.isActive'
                })
                .populate({
                    path: 'items.product',
                    select: 'name slug images price discount variants brand categories ratings allowPosts',
                    populate: {
                        path: 'categories',
                        select: 'name slug'
                    }
                })
                .select('shop items totalAmount shippingFee paymentMethod shippingAddress status isPaid paidAt notes createdAt updatedAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Order.countDocuments(filter)
        ]);

        const pagination = {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            totalOrders: total,
            hasNext: parseInt(page) < Math.ceil(total / parseInt(limit)),
            hasPrev: parseInt(page) > 1
        };

        // Thêm thống kê nhanh cho buyer
        const orderSummary = await Order.aggregate([
            {
                $match: {
                    'buyer._id': actorId,
                    'buyer.type': actorType
                }
            },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalSpent: { $sum: '$totalAmount' }
                }
            }
        ]);

        return successResponse(res, 'Lấy danh sách đơn hàng cho buyer thành công', {
            orders,
            pagination,
            orderSummary
        });
    } catch (err) {
        console.error('Get orders for buyer error:', err);
        return errorResponse(res, 'Lỗi khi lấy danh sách đơn hàng', 500, err.message);
    }
};

exports.getOrderById = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const order = await Order.findById(orderId)
            .populate({
                path: 'shop',
                select: 'name slug avatar logo contact customerSupport operations.policies status.isActive'
            })
            .populate({
                path: 'items.product',
                select: 'name slug description images price discount variants brand categories soldCount ratings',
                populate: {
                    path: 'categories',
                    select: 'name slug'
                }
            })
            .populate({
                path: 'buyer._id',
                select: 'fullName name contact.phone contact.email slug avatar email phone',
                refPath: 'buyer.type'
            })
            .lean();

        if (!order) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        const isBuyer = order.buyer &&
            order.buyer._id.toString() === actorId.toString() &&
            order.buyer.type === actorType;

        const isShopOwner = order.shop &&
            order.shop._id.toString() === actorId.toString() &&
            actorType === 'Shop';

        if (!isBuyer && !isShopOwner) {
            return errorResponse(res, 'Bạn không có quyền truy cập đơn hàng này', 403);
        }

        return successResponse(res, 'Lấy chi tiết đơn hàng thành công', order);
    } catch (err) {
        console.error('Get order by ID error:', err);
        return errorResponse(res, 'Lỗi khi lấy chi tiết đơn hàng', 500, err.message);
    }
};

// API lấy chi tiết đơn hàng dành cho USER/BUYER
exports.getOrderDetailForBuyer = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const order = await Order.findById(orderId)
            .populate({
                path: 'shop',
                select: 'name slug avatar logo contact.phone contact.email customerSupport status.isActive'
            })
            .populate({
                path: 'items.product',
                select: 'name slug description images price discount variants brand categories soldCount ratings allowPosts',
                populate: {
                    path: 'categories',
                    select: 'name slug'
                }
            })
            .lean();

        if (!order) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        // Kiểm tra quyền truy cập - chỉ người mua mới được xem
        const isBuyer = order.buyer &&
            order.buyer._id.toString() === actorId.toString() &&
            order.buyer.type === actorType;

        if (!isBuyer) {
            return errorResponse(res, 'Bạn không có quyền truy cập đơn hàng này', 403);
        }

        // Thêm thông tin bổ sung cho buyer
        const orderWithExtras = {
            ...order,
            // Thông tin về khả năng thao tác
            canCancel: ['pending', 'confirmed'].includes(order.status),
            canReview: order.status === 'delivered',

            // Thông tin về delivery timeline
            statusTimeline: {
                pending: order.createdAt,
                confirmed: order.status !== 'pending' ? order.updatedAt : null,
                shipping: ['shipping', 'delivered'].includes(order.status) ? order.updatedAt : null,
                delivered: order.status === 'delivered' ? order.updatedAt : null,
                cancelled: order.status === 'cancelled' ? order.updatedAt : null
            },

            // Thông tin thanh toán
            paymentInfo: {
                method: order.paymentMethod,
                isPaid: order.isPaid,
                paidAt: order.paidAt,
                needPayment: order.paymentMethod !== 'COD' && !order.isPaid
            },

            // Tính toán chi phí
            costBreakdown: {
                subtotal: order.totalAmount,
                shipping: order.shippingFee,
                total: order.totalAmount + order.shippingFee
            }
        };

        return successResponse(res, 'Lấy chi tiết đơn hàng thành công', orderWithExtras);
    } catch (err) {
        console.error('Get order detail for buyer error:', err);
        return errorResponse(res, 'Lỗi khi lấy chi tiết đơn hàng', 500, err.message);
    }
};

// API lấy chi tiết đơn hàng dành cho SELLER
exports.getOrderDetailForSeller = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        // Chỉ cho phép seller truy cập
        if (actorType !== 'Shop') {
            return errorResponse(res, 'Chỉ seller mới có thể truy cập', 403);
        }

        const order = await Order.findById(orderId)
            .populate({
                path: 'buyer._id',
                select: 'fullName name phone email avatar contact.phone contact.email',
                refPath: 'buyer.type'
            })
            .populate({
                path: 'items.product',
                select: 'name slug description images price discount variants brand sku categories stock',
                populate: {
                    path: 'categories',
                    select: 'name slug'
                }
            })
            .lean();

        if (!order) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        // Kiểm tra quyền truy cập - chỉ shop sở hữu đơn hàng
        if (order.shop.toString() !== actorId.toString()) {
            return errorResponse(res, 'Bạn không có quyền truy cập đơn hàng này', 403);
        }

        // Thêm thông tin bổ sung cho seller
        const orderWithSellerInfo = {
            ...order,
            // Thông tin về khả năng thao tác của seller
            canConfirm: order.status === 'pending',
            canShip: order.status === 'confirmed',
            canDeliver: order.status === 'shipping',
            canCancel: ['pending', 'confirmed'].includes(order.status),

            // Thông tin khách hàng (đã mua hàng)
            customerInfo: {
                ...order.buyer,
                orderHistory: null // Có thể thêm logic đếm số đơn hàng trước đó
            },

            // Thông tin logistics
            fulfillmentInfo: {
                packingRequired: order.status === 'confirmed',
                shippingRequired: order.status === 'shipping',
                estimatedProcessingTime: '1-2 ngày làm việc'
            },

            // Thông tin doanh thu
            revenueInfo: {
                grossAmount: order.totalAmount,
                platformFee: Math.round(order.totalAmount * 0.03), // Giả sử phí platform 3%
                netAmount: Math.round(order.totalAmount * 0.97),
                shippingFee: order.shippingFee
            },

            // Timeline xử lý đơn hàng
            processingTimeline: {
                ordered: order.createdAt,
                confirmed: order.status !== 'pending' ? order.updatedAt : null,
                shipped: ['shipping', 'delivered'].includes(order.status) ? order.updatedAt : null,
                delivered: order.status === 'delivered' ? order.updatedAt : null,
                cancelled: order.status === 'cancelled' ? order.updatedAt : null
            },

            // Thống kê sản phẩm trong đơn
            productStats: order.items.map(item => ({
                productId: item.product._id,
                productName: item.product.name,
                quantity: item.quantity,
                unitPrice: item.price,
                totalPrice: item.quantity * item.price,
                currentStock: item.product.stock,
                sku: item.product.sku
            }))
        };

        return successResponse(res, 'Lấy chi tiết đơn hàng cho seller thành công', orderWithSellerInfo);
    } catch (err) {
        console.error('Get order detail for seller error:', err);
        return errorResponse(res, 'Lỗi khi lấy chi tiết đơn hàng cho seller', 500, err.message);
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { status } = req.body;
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const allowedStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
        if (!allowedStatuses.includes(status)) {
            return errorResponse(res, 'Trạng thái không hợp lệ', 400);
        }

        const order = await Order.findById(orderId);
        if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);

        // Chỉ shop sở hữu đơn hàng mới được cập nhật
        if (actorType !== 'Shop' || order.shop.toString() !== actorId.toString()) {
            return errorResponse(res, 'Bạn không có quyền cập nhật đơn hàng này', 403);
        }

        // Kiểm tra luồng hợp lệ
        const validTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['shipping', 'cancelled'],
            shipping: ['delivered'],
            delivered: [],
            cancelled: []
        };

        const currentStatus = order.status;
        if (!validTransitions[currentStatus].includes(status)) {
            return errorResponse(res, `Không thể chuyển từ trạng thái "${currentStatus}" sang "${status}"`, 400);
        }

        // Cập nhật thời gian thanh toán khi delivered (COD)
        if (status === 'delivered' && order.paymentMethod === 'COD' && !order.isPaid) {
            order.isPaid = true;
            order.paidAt = new Date();
        }

        order.status = status;
        order.updatedAt = new Date();
        await order.save();

        // Populate order sau khi cập nhật
        const updatedOrder = await Order.findById(orderId)
            .populate({
                path: 'shop',
                select: 'name slug avatar logo'
            })
            .populate({
                path: 'items.product',
                select: 'name slug images price discount'
            });

        return successResponse(res, 'Cập nhật trạng thái đơn hàng thành công', updatedOrder);
    } catch (err) {
        console.error('Update order status error:', err);
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái đơn hàng', 500, err.message);
    }
};

exports.cancelOrderByUser = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { reason } = req.body; // Thêm lý do hủy
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const order = await Order.findById(orderId).populate('items.product', 'stock');
        if (!order) return errorResponse(res, 'Không tìm thấy đơn hàng', 404);

        // Chỉ người dùng đã đặt đơn mới được hủy
        if (
            actorType !== 'User' ||
            order.buyer.type !== 'User' ||
            order.buyer._id.toString() !== actorId.toString()
        ) {
            return errorResponse(res, 'Bạn không có quyền hủy đơn hàng này', 403);
        }

        if (!['pending', 'confirmed'].includes(order.status)) {
            return errorResponse(res, `Chỉ có thể hủy đơn khi ở trạng thái 'pending' hoặc 'confirmed'. Trạng thái hiện tại: ${order.status}`, 400);
        }

        // Hoàn lại tồn kho
        for (const item of order.items) {
            if (item.product) {
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: {
                        stock: item.quantity,
                        soldCount: -item.quantity
                    }
                });
            }
        }

        order.status = 'cancelled';
        order.notes = reason ? `${order.notes || ''}\nLý do hủy: ${reason}`.trim() : order.notes;
        order.updatedAt = new Date();
        await order.save();

        // Populate order sau khi hủy
        const cancelledOrder = await Order.findById(orderId)
            .populate({
                path: 'shop',
                select: 'name slug avatar logo'
            })
            .populate({
                path: 'items.product',
                select: 'name slug images price discount'
            });

        return successResponse(res, 'Hủy đơn hàng thành công', cancelledOrder);
    } catch (err) {
        console.error('Cancel order error:', err);
        return errorResponse(res, 'Lỗi khi hủy đơn hàng', 500, err.message);
    }
};

// Buyer xác nhận đơn hàng
exports.confirmOrderReceived = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const { rating, review } = req.body; // Optional: cho phép đánh giá luôn khi nhận hàng
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        const order = await Order.findById(orderId)
            .populate('items.product', 'name slug seller')
            .populate('shop', 'name slug');
        
        if (!order) {
            return errorResponse(res, 'Không tìm thấy đơn hàng', 404);
        }

        // Chỉ có thể xác nhận khi đơn hàng đang ở trạng thái 'shipping'
        if (order.status !== 'shipping') {
            return errorResponse(res, `Chỉ có thể xác nhận nhận hàng khi đơn hàng đang được giao. Trạng thái hiện tại: ${order.status}`, 400);
        }

        // Cập nhật trạng thái đơn hàng
        order.status = 'delivered';
        order.deliveredAt = new Date();
        order.updatedAt = new Date();
        
        await order.save();

        // Populate order sau khi cập nhật
        const updatedOrder = await Order.findById(orderId)
            .populate({
                path: 'shop',
                select: 'name slug avatar logo contact.phone contact.email'
            })
            .populate({
                path: 'items.product',
                select: 'name slug images price discount variants brand'
            });

        return successResponse(res, 'Xác nhận nhận hàng thành công', {
            order: updatedOrder,
            message: 'Cảm ơn bạn đã xác nhận nhận hàng. Đơn hàng đã được hoàn thành.'
        });
    } catch (err) {
        console.error('Confirm order received error:', err);
        return errorResponse(res, 'Lỗi khi xác nhận nhận hàng', 500, err.message);
    }
};

// Thêm hàm thống kê đơn hàng cho shop
exports.getOrderStats = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        if (actorType !== 'Shop') {
            return errorResponse(res, 'Chỉ shop mới có thể xem thống kê', 403);
        }

        const stats = await Order.aggregate([
            { $match: { shop: actorId } },
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$totalAmount' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments({ shop: actorId });
        const totalRevenue = await Order.aggregate([
            { $match: { shop: actorId, status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        return successResponse(res, 'Lấy thống kê đơn hàng thành công', {
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0,
            statusBreakdown: stats
        });
    } catch (err) {
        console.error('Get order stats error:', err);
        return errorResponse(res, 'Lỗi khi lấy thống kê đơn hàng', 500, err.message);
    }
};

// **CONTROLLER MỚI** - Xuất báo cáo Excel
exports.exportOrdersToExcel = async (req, res) => {
    try {
        const { _id: actorId } = req.actor;
        const actorType = req.actor.type === "shop" ? "Shop" : "User";

        if (actorType !== 'Shop') {
            return errorResponse(res, 'Chỉ shop mới có thể xuất báo cáo', 403);
        }

        const { status, startDate, endDate } = req.query;

        let filter = { shop: actorId };

        // Áp dụng các filter
        if (status && status !== 'all') {
            filter.status = status;
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(filter)
            .populate({
                path: 'buyer._id',
                select: 'fullName name phone email',
                refPath: 'buyer.type'
            })
            .populate({
                path: 'items.product',
                select: 'name sku'
            })
            .sort({ createdAt: -1 })
            .lean();

        // Trong thực tế, đây sẽ là logic tạo file Excel
        // Hiện tại chỉ trả về URL để download
        const exportData = {
            success: true,
            data: {
                downloadUrl: `/api/orders/export/download?${new URLSearchParams(req.query).toString()}`,
                filename: `orders_export_${new Date().toISOString().split('T')[0]}.xlsx`,
                totalRecords: orders.length,
                filters: {
                    status: status || 'all',
                    startDate,
                    endDate
                }
            }
        };

        return successResponse(res, 'Tạo file xuất báo cáo thành công', exportData);
    } catch (err) {
        console.error('Export orders error:', err);
        return errorResponse(res, 'Lỗi khi xuất báo cáo đơn hàng', 500, err.message);
    }
};