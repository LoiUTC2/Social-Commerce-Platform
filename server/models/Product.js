const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    description: { type: String, required: true },
    images: [String],
    videos: [String],
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, required: true }, //cổ phần
    category: { type: String, required: true },
    brand: { type: String },
    condition: { type: String, enum: ['new', 'used'], default: 'new' },
    variants: [{ name: String, options: [String] }],
    ratings: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    soldCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index tìm kiếm toàn văn
productSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Product', productSchema);
