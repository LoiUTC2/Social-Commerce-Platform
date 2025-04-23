const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  images: [String],
  videos: [String],
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  hashtags: [String],
  emotionTags: [String],
  categories: [String],
  location: String,
  isSponsored: { type: Boolean, default: false }, //được tài trợ

  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  sharesCount: { type: Number, default: 0 },

  aiScore: Number, //điểm đánh giá mức độ quan tâm bài viết (phân tích từ AI)
  sentiment: String, // "positive", "negative", "neutral" cảm xúc AI gán sau khi phân tích nội dung
  topicEmbedding: [Number], //vector nhúng chủ đề để gợi ý bài viết tương tự

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Post', postSchema);
