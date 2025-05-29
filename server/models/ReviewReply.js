const mongoose = require('mongoose');

//Model Review Reply (phản hồi từ shop hoặc khách hàng)
const reviewReplySchema = new mongoose.Schema({
    replier: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // người phản hồi
    replierType: { type: String, enum: ['shop', 'customer'], required: true }, // loại người phản hồi
    review: { type: mongoose.Schema.Types.ObjectId, required: true }, // review được phản hồi
    reviewType: { type: String, enum: ['product', 'shop', 'customer'], required: true }, // loại review
    
    content: { type: String, required: true, maxlength: 500 },
    
    status: { type: String, enum: ['active', 'hidden', 'deleted'], default: 'active' },
    
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('ReviewReply', reviewReplySchema);
