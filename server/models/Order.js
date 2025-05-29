const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }, // đơn giá tại thời điểm đặt hàng
    selectedVariant: { type: mongoose.Schema.Types.Mixed }, // { size: 'M', color: 'Black' }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    buyer: {
        type: {
            type: String,
            enum: ['User', 'Shop'],
            required: true
        },
        _id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            refPath: 'buyer.type'
        }
    },

    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true
    }, //Shop nhận đơn — dùng để chia đơn hàng theo shop

    items: [orderItemSchema], //Danh sách sản phẩm được mua (mỗi item có variant riêng)

    totalAmount: { type: Number, required: true },
    shippingFee: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['COD', 'Momo', 'VNPay'], default: 'COD' },


    // Địa chỉ nhận hàng
    shippingAddress: {
        fullName: String,
        phone: String,
        address: String
    },

    status: {
        type: String,
        enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'],
        default: 'pending'
    },

    //Dùng cho thanh toán online
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },

    notes: { type: String },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
