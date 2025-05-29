const mongoose = require('mongoose');
const Product = require('./Product');

const postSchema = new mongoose.Schema({
  // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  author: {
    type: {
      type: String,
      enum: ['User', 'Shop'],
      required: true
    },
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'author.type' } //refPath: 'author.type' cho phép Mongoose populate linh hoạt theo kiểu (User hoặc Shop).
  },
  content: { type: String, required: true },
  images: [String],
  videos: [String],
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  hashtags: [String],
  tags: [String],
  emotionTags: [String],
  categories: [String],
  location: String,
  isSponsored: { type: Boolean, default: false }, //được tài trợ

  type: { type: String, enum: ['normal', 'share'], default: 'normal' },

  sharedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', default: null }, //đây là bài viết gốc (nếu nó là bài share), bản chất nó là 1 oject, lưu _id chỉ là đại diện thôi
  privacy: { type: String, enum: ['public', 'friends', 'private'], default: 'public' },

  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },

  aiScore: Number, //điểm đánh giá mức độ quan tâm bài viết (phân tích từ AI)
  sentiment: String, // "positive", "negative", "neutral" cảm xúc AI gán sau khi phân tích nội dung
  topicEmbedding: [Number], //vector nhúng chủ đề để gợi ý bài viết tương tự

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Middleware tự động xóa id bài viết ra khỏi danh sách chứa bài viết của sản phẩm (Product)
postSchema.pre('deleteOne', { document: true }, async function (next) {
  try {
    // Xóa bài viết khỏi các sản phẩm liên quan
    if (this.productIds && this.productIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: this.productIds } },
        { $pull: { posts: this._id } }
      );
    }
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Post', postSchema);
