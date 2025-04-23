const mongoose = require('mongoose');

const productViewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  device: String,
  viewedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ProductView', productViewSchema);
