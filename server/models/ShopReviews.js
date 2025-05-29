const mongoose = require('mongoose');

//Model Shop Review (khách hàng đánh giá shop)
const shopReviewSchema = new mongoose.Schema({
    // Người đánh giá
    reviewer: {
        type: {
            type: String,
            enum: ['User', 'Shop'],
            required: true
        },
        _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'reviewer.type' } //refPath: 'reviewer.type' cho phép Mongoose populate linh hoạt theo kiểu (User hoặc Shop).
    },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },

    rating: {
        type: Number, required: true, min: 1, max: 5
    },

    title: { type: String, trim: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 1000 },

    // Tương tác
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ReviewReply' }],

    isVerified: { type: Boolean, default: false },
    isHidden: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ShopReview', shopReviewSchema);
