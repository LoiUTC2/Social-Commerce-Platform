const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
  author: {
    type: {
      type: String,
      enum: ['User', 'Shop'],
      required: true
    },
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'author.type' }
  },
  targetType: {
    type: String,
    enum: ['post', 'comment', 'product', 'shop', 'user', 'review'], // ✅ Thêm 'review'
    required: true
  },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: {
    type: String,
    enum: [
      'like', 'unlike', 'comment', 'share', 'click', 'view', 'save', 'unsave',
      'purchase', 'follow', 'unfollow', 'search', 'create', 'update', 'delete',
      'review', 'reply', 'report' // ✅ Thêm các action mới
    ],
    required: true
  },

  // ✅ Thêm thông tin session và device để phân tích behavior tốt hơn
  sessionId: { type: String }, // Để track cùng một session
  deviceInfo: {
    userAgent: String,
    ip: String,
    platform: String, // web, mobile, app
    browser: String
  },

  // ✅ Thêm thông tin location nếu cần
  location: {
    country: String,
    city: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },

  metadata: {
    type: mongoose.Schema.Types.Mixed,
    // Ví dụ metadata structure:
    // {
    //   rating: 5, // cho review
    //   duration: 120, // thời gian view (seconds)
    //   searchQuery: "iphone 15", // cho search
    //   referrer: "facebook", // nguồn traffic
    //   category: "electronics" // danh mục sản phẩm
    // }
  },

  // ✅ Thêm trọng số cho AI học
  weight: { type: Number, default: 1 }, // Trọng số của hành vi (mua hàng = 10, view = 1)

  timestamp: { type: Date, default: Date.now },

  // ✅ Thêm TTL để tự động xóa data cũ (tùy chọn)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 năm
  }
});

// ✅ Indexes để tối ưu query
userInteractionSchema.index({ 'author._id': 1, timestamp: -1 });
userInteractionSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
userInteractionSchema.index({ action: 1, timestamp: -1 });
userInteractionSchema.index({ sessionId: 1 });
userInteractionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ✅ Thêm pre-save middleware để set weight tự động
userInteractionSchema.pre('save', function (next) {
  if (!this.weight) {
    const actionWeights = {
      'view': 1,
      'like': 2,
      'comment': 3,
      'share': 4,
      'save': 5,
      'follow': 6,
      'review': 8,
      'purchase': 10
    };
    this.weight = actionWeights[this.action] || 1;
  }
  next();
});

module.exports = mongoose.model('UserInteraction', userInteractionSchema);