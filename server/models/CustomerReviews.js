const mongoose = require('mongoose');

//Model Customer Review (shop đánh giá khách hàng)
const customerReviewSchema = new mongoose.Schema({
    reviewer: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }, // shop đánh giá
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // khách hàng được đánh giá
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    
    rating: {
        overall: { type: Number, required: true, min: 1, max: 5 },
        communication: { type: Number, min: 1, max: 5 }, // giao tiếp
        payment: { type: Number, min: 1, max: 5 }, // thanh toán đúng hạn
        cooperation: { type: Number, min: 1, max: 5 } // hợp tác
    },
    
    content: { type: String, maxlength: 500 }, // không bắt buộc, có thể chỉ đánh giá sao
    
    // Nhãn đánh giá nhanh
    tags: [{ 
        type: String, 
        enum: ['excellent_customer', 'good_communication', 'prompt_payment', 'cooperative', 'recommended'] 
    }],
    
    // Chỉ shop mới thấy được (không public)
    isPrivate: { type: Boolean, default: true },
    status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active' },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CustomerReview', customerReviewSchema);
