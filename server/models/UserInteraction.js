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
    enum: ['post', 'comment', 'product', 'shop', 'user', 'review', 'search', 'flashsale'],
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
    hasResults: Boolean, // Có kết quả không (nếu là search)

    description: String, // Mô tả flash sale
    totalProducts: Number, // Tổng số sản phẩm trong flash sale
    products: [{
      name: String,
      category: String,
      hashtags: [String]
    }], // Danh sách sản phẩm trong flash sale
    isFeatured: Boolean, // Flash sale nổi bật
    startTime: Date, // Thời gian bắt đầu
    endTime: Date, // Thời gian kết thúc
    totalViews: Number, // Tổng lượt xem
    totalPurchases: Number, // Tổng lượt mua
    totalRevenue: Number, // Tổng doanh thu
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

  count: { type: Number, default: 1 }, // đếm số lượng hành vi nếu trùng nhau, ví dụ: người dùng xem bài viết 2 lần, khỏi phải tạo 2 bản ghi

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

  //Nội dung search
  searchSignature: {
    query: String,
    category: String,
    hashtags: [String]
  },

  // ✅ Thêm trọng số cho AI học
  weight: { type: Number, default: 0 }, // Trọng số của hành vi (mua hàng = 10, view = 1)

  timestamp: { type: Date, default: Date.now },
  lastInteraction: { type: Date, default: Date.now }, // Track lần tương tác cuối

  // ✅ Thêm TTL để tự động xóa data cũ (tùy chọn)
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 năm
  }
});

// ✅ Tách logic tính weight thành helper function
const getActionWeight = (action) => {
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
    'create': 7,
    'update': 5,
    'delete': -5,
    'toggle_status': 3,
    'toggle_allow_posts': 3,
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
  return actionWeights[action] || 0;
};

// ✅ Tách logic xử lý search targetDetails
const processSearchTargetDetails = (targetDetails, metadata) => {
  const processedDetails = {
    searchQuery: targetDetails?.searchQuery || metadata?.keyword || null,
    resultsCount: targetDetails?.resultsCount || metadata?.resultsCount || 0,
    hasResults: targetDetails?.hasResults || (metadata?.hasResults !== undefined ? metadata.hasResults : false),
    category: targetDetails?.category || null,
    hashtags: targetDetails?.hashtags || metadata?.hashtags || []
  };

  // Tạo metadata mới không chứa các field đã được xử lý
  const cleanedMetadata = { ...metadata };
  delete cleanedMetadata.keyword;
  delete cleanedMetadata.resultsCount;
  delete cleanedMetadata.hasResults;
  delete cleanedMetadata.hashtags;

  return { processedDetails, cleanedMetadata };
};


// Pre-save middleware để xử lý các document được tạo trực tiếp (không qua recordInteraction)
userInteractionSchema.pre('save', async function (next) {
  // Chỉ xử lý nếu document mới hoặc các field quan trọng bị thay đổi
  if (this.isNew || this.isModified('action') || this.isModified('count')) {
    let baseWeight = getActionWeight(this.action);
    this.weight = baseWeight * (this.count || 1);

    // Xử lý search action
    if (this.action === 'search') {
      const { processedDetails, cleanedMetadata } = processSearchTargetDetails(this.targetDetails, this.metadata);
      this.targetDetails = processedDetails;
      this.metadata = cleanedMetadata;
    }
  }

  next();
});


//Hàm tăng count nếu như có hành vi trùng nhau, giúp tránh tạo bản ghi, trong này có cập nhật weight của các hành vi
userInteractionSchema.statics.recordInteraction = async function (interactionData) {
  const { author, targetType, targetId, action, sessionId, metadata = {} } = interactionData;

  // Tạo filter để tìm bản ghi trùng lặp
  const filter = {
    targetType,
    action,
    sessionId
  };

  // Thêm targetId nếu có (search không có targetId)
  if (targetId) {
    filter.targetId = targetId;
  }

  // Thêm author nếu có (anonymous user không có author)
  if (author && author._id) {
    filter['author._id'] = author._id;
    filter['author.type'] = author.type;
  }

  // Đối với search, phân biệt theo nội dung search để AI học tốt hơn
  if (action === 'search') {
    const searchQuery = interactionData.targetDetails?.searchQuery || metadata?.keyword;
    const category = interactionData.targetDetails?.category;
    const hashtags = interactionData.targetDetails?.hashtags;

    // Tạo unique key dựa trên nội dung search
    filter.searchSignature = {
      query: searchQuery ? searchQuery.toLowerCase().trim() : null,
      category: category || null,
      hashtags: hashtags && hashtags.length > 0 ? hashtags.sort() : null
    };
  }

  try {
    // Tính weight ban đầu dựa trên action
    const baseWeight = getActionWeight(action);

    // Xử lý targetDetails cho search action
    let processedTargetDetails = interactionData.targetDetails || {};
    let cleanedMetadata = metadata;

    if (action === 'search') {
      const processed = processSearchTargetDetails(interactionData.targetDetails, metadata);
      processedTargetDetails = processed.processedDetails;
      cleanedMetadata = processed.cleanedMetadata;
    }

    // ✅ Sử dụng aggregation pipeline để tính weight chính xác
    const result = await this.findOneAndUpdate(
      filter,
      [
        {
          $set: {
            // Tăng count
            count: { $add: [{ $ifNull: ["$count", 0] }, 1] },

            // Tính weight = baseWeight * newCount
            weight: { $multiply: [baseWeight, { $add: [{ $ifNull: ["$count", 0] }, 1] }] },

            // Update timestamp
            lastInteraction: new Date(),

            // Giữ các field khác nếu document đã tồn tại, hoặc set từ interactionData nếu mới
            author: { $ifNull: ["$author", author] },
            targetType: { $ifNull: ["$targetType", targetType] },
            targetId: { $ifNull: ["$targetId", targetId] },
            action: { $ifNull: ["$action", action] },
            sessionId: { $ifNull: ["$sessionId", sessionId] },
            targetDetails: { $ifNull: ["$targetDetails", processedTargetDetails] },
            deviceInfo: { $ifNull: ["$deviceInfo", interactionData.deviceInfo] },
            location: { $ifNull: ["$location", interactionData.location] },
            metadata: { $ifNull: ["$metadata", cleanedMetadata] },
            timestamp: { $ifNull: ["$timestamp", new Date()] },
            expiresAt: { $ifNull: ["$expiresAt", new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)] }
          }
        }
      ],
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    return result;
  } catch (error) {
    console.error('Error recording interaction:', error);
    throw error;
  }
};

// ✅ Thêm method để bulk update weight (nếu cần)
userInteractionSchema.statics.recalculateWeights = async function (filter = {}) {
  const interactions = await this.find(filter);

  const bulkOps = interactions.map(interaction => ({
    updateOne: {
      filter: { _id: interaction._id },
      update: {
        $set: {
          weight: getActionWeight(interaction.action) * interaction.count
        }
      }
    }
  }));

  if (bulkOps.length > 0) {
    return await this.bulkWrite(bulkOps);
  }

  return { modifiedCount: 0 };
};

// ✅ Indexes để tối ưu query
userInteractionSchema.index({ 'author._id': 1, timestamp: -1 });
userInteractionSchema.index({ targetType: 1, targetId: 1, timestamp: -1 });
userInteractionSchema.index({ action: 1, timestamp: -1 });
userInteractionSchema.index({ sessionId: 1 });
userInteractionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index
userInteractionSchema.index({
  'author._id': 1,
  targetType: 1,
  targetId: 1,
  action: 1,
  sessionId: 1
}, {
  name: 'interaction_dedup_index',
  sparse: true // Chỉ index các document có searchSignature
}); // Index cho việc tìm duplicate

module.exports = mongoose.model('UserInteraction', userInteractionSchema);