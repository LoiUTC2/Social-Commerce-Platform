const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true },
    description: { type: String, default: '' },
    avatar: { type: String },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    contact: { phone: String, email: String, address: String },
    isActive: { type: Boolean, default: true },
    rating: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    tags: [String],
    isApproved: { type: Boolean, default: false }, //được duyệt thì sẽ true, lúc này shop mới có hiệu lực
    approvalStatus: { type: String, enum: ['pending', 'approved', 'reject'], default: 'pending' }, //trạng thái xét duyệt
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Search index
shopSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Shop', shopSchema);