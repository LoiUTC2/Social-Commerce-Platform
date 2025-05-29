const mongoose = require('mongoose');

const hashtagSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
    
    // Thống kê sử dụng
    usageCount: { type: Number, default: 0 },

    // Loại hashtag (nếu cần phân loại)
    type: { type: String, enum: ['general', 'branded', 'campaign'], default: 'general' },
    
    // Người tạo (nếu là hashtag riêng của shop/cá nhân)
    createdBy: { type: mongoose.Schema.Types.ObjectId, refPath: 'createdByModel' },
    createdByModel: { type: String, enum: ['User', 'Shop'] },
    
    // Các bài viết sử dụng hashtag này (optional)
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    
    // Các sản phẩm sử dụng hashtag này (optional)
    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],

    // Các shop sử dụng hashtag này (optional)
    shops: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }],
    
    // Metadata
    isTrending: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index để tìm kiếm nhanh
hashtagSchema.index({ name: 1 });
hashtagSchema.index({ usageCount: -1 });
hashtagSchema.index({ isTrending: 1 });

// Middleware tự động cập nhật khi hashtag được sử dụng
hashtagSchema.methods.incrementUsage = async function () {
    this.usageCount += 1;
    this.lastUsedAt = new Date();
    await this.save();
};

const Hashtag = mongoose.model('Hashtag', hashtagSchema);

module.exports = Hashtag;