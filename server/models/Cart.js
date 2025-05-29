const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, default: 1 },
    selectedVariant: { type: mongoose.Schema.Types.Mixed }, // nếu có size, màu,...
    addedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
    author: {
        type: {
            type: String,
            enum: ['User', 'Shop'],
            required: true
        },
        _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'author.type' } //refPath: 'author.type' cho phép Mongoose populate linh hoạt theo kiểu (User hoặc Shop).
    },
    items: [cartItemSchema],
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cart', cartSchema);
