const mongoose = require('mongoose');
const Product = require('./Product.js');
const Category = require('../models/Category');

const userInteractionSchema = new mongoose.Schema({
  author: {
    type: {
      type: String,
      enum: ['User', 'Shop'],
    },
    _id: { type: mongoose.Schema.Types.ObjectId, refPath: 'author.type' }
  },
  targetType: {
    type: String,
    enum: ['post', 'comment', 'product', 'shop', 'user', 'review', 'search'],
    required: true
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function () {
      // ✅ Chỉ required khi không phải là search action
      return this.action !== 'search';
    }
  },
  targetDetails: { // Thêm thông tin ngữ nghĩa trực tiếp
    name: String, // Tên sản phẩm, bài viết, shop, v.v.
    category: String, // Danh mục
    subCategories: [String], //Danh mục con (nếu là shop)
    hashtags: [String], // Hashtag liên quan

    price: Number, // Giá (nếu là sản phẩm)
    rating: Number, //Rank (nếu là Shop hoặc sản phẩm)
    stock: Number,
    isActive: Boolean,
    soldCount: Number,
    variants: [{ name: String, options: [String] }],

    phone: Number, //Nếu là Shop

    content: String, //Nếu là Post
    authorType: String, //Nếu là Post
    isSponsored: Boolean, //Nếu là Post
    likesCount: Number, //Nếu là Post
    commentsCount: Number, //Nếu là Post

    roles: [String], //Nếu là User
    followersCount: Number, //Nếu là User
    followingCount: Number, //Nếu là User

    searchQuery: String, // Từ khóa tìm kiếm (nếu có)
    resultsCount: Number, // Số lượng kết quả (nếu là search)
    hasResults: Boolean // Có kết quả không (nếu là search)
  },
  action: {
    type: String,
    enum: [
      'like', 'unlike', 'comment', 'share', 'click', 'view', 'save', 'unsave', 'care', 'uncare',
      'add_to_cart', 'update_cart_item', 'remove_cart_item', 'remove_multiple_cart_items', 'clear_cart', 'clean_cart',
      'purchase', 'review', 'reply', 'report', 'follow', 'unfollow', 'search',
      'create', 'update', 'delete', 'toggle_status', 'toggle_allow_posts'
    ],
    required: true
  },

  // ✅ Thêm thông tin session và device để phân tích behavior tốt hơn
  sessionId: { type: String, required: true }, // Để track cùng một session, // Bắt buộc để hỗ trợ người dùng chưa đăng nhập
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
    default: {} // Giữ lại metadata cho các thông tin phụ (referrer, duration, v.v.)
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
  weight: { type: Number, default: 0 }, // Trọng số của hành vi (mua hàng = 10, view = 1)

  timestamp: { type: Date, default: Date.now },

  // ✅ Thêm TTL để tự động xóa data cũ (tùy chọn)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 năm
  }
});

// Pre-save middleware để gán trọng số và điền thông tin ngữ nghĩa
userInteractionSchema.pre('save', async function (next) {
  const actionWeights = {
    'view': 1,
    'like': 2,
    'comment': 3,
    'share': 4,
    'save': 5,
    'care': 6,
    'follow': 6,
    'review': 8,
    'add_to_cart': 9,
    'update_cart_item': 7,
    'purchase': 10,
    'create': 7, ///
    'update': 5, ///
    'delete': -5, ///
    'toggle_status': 3, ///
    'toggle_allow_posts': 3, ///
    'search': 3,
    'unlike': -2,
    'unsave': -5,
    'uncare': -6,
    'unfollow': -6,
    'remove_cart_item': -5,
    'remove_multiple_cart_items': -5,
    'clear_cart': -8,
    'clean_cart': -3,
    'click': 2,
    'reply': 3,
    'report': 0
  };
  // Luôn gán weight dựa trên action
  this.weight = actionWeights[this.action] || 0;

  // Nếu là action 'search', điền thông tin từ metadata
  if (this.action === 'search') {
    this.targetDetails = {
      searchQuery: this.targetDetails?.searchQuery || this.metadata?.keyword || null,
      resultsCount: this.targetDetails?.resultsCount || this.metadata?.resultsCount || 0,
      hasResults: this.targetDetails?.hasResults || this.metadata?.hasResults || false,
      category: this.targetDetails?.category || null,
      hashtags: this.targetDetails?.hashtags || this.metadata?.hashtags || []
    };
    // Xóa các trường đã chuyển sang targetDetails khỏi metadata
    delete this.metadata.keyword;
    delete this.metadata.resultsCount;
    delete this.metadata.hasResults;
    delete this.metadata.hashtags;
  }

  next();
});

// ✅ Indexes để tối ưu query
userInteractionSchema.index({ 'author._id': 1, timestamp: -1 });
userInteractionSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
userInteractionSchema.index({ action: 1, timestamp: -1 });
userInteractionSchema.index({ sessionId: 1 });
userInteractionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model('UserInteraction', userInteractionSchema);