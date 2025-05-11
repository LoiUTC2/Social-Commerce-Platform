const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'comment', 'product', 'shop', 'user'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true }, // id bài viết hoặc sản phẩm user đã tương tác, có thể là id_comment mà user đã reply
  action: { 
    type: String, 
    enum: ['like', 'comment', 'share', 'click', 'view', 'save', 'purchase', 'follow', 'unfollow', 'search', 'create'], 
    required: true 
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
