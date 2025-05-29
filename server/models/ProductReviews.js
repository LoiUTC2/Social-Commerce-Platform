const mongoose = require('mongoose');

//Model Review sản phẩm (khách hàng đánh giá sản phẩm)
const productReviewSchema = new mongoose.Schema({
    // Người đánh giá
    reviewer: {
        type: {
            type: String,
            enum: ['User', 'Shop'],
            required: true
        },
        _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'reviewer.type' } //refPath: 'reviewer.type' cho phép Mongoose populate linh hoạt theo kiểu (User hoặc Shop).
    },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true }, // sản phẩm được đánh giá
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }, // shop bán sản phẩm
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // đơn hàng liên quan (đảm bảo đã mua mới được đánh giá)

    // Đánh giá
    rating: {
        type: Number, required: true, min: 1, max: 5
    },

    title: { type: String, trim: true, maxlength: 100 },
    content: { type: String, required: true, maxlength: 1000 },
    images: [String], // hình ảnh kèm theo review
    videos: [String], // video review

    // Tương tác
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    replies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ReviewReply' }], // phản hồi từ shop

    // Trạng thái
    isVerified: { type: Boolean, default: false }, // đã xác minh mua hàng
    isHidden: { type: Boolean, default: false }, // ẩn review (vi phạm chính sách)
    status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index để tối ưu query
productReviewSchema.index({ product: 1, status: 1 });
productReviewSchema.index({ shop: 1, status: 1 });
productReviewSchema.index({ 'reviewer._id': 1 });

module.exports = mongoose.model('ProductReview', productReviewSchema);
