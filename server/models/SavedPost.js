const mongoose = require('mongoose');

const savedPostSchema = new mongoose.Schema({
  user: {
    type: {
      type: String,
      enum: ['User', 'Shop'],
      required: true
    },
    _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'user.type' }
  },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  savedAt: { type: Date, default: Date.now }
}, { timestamps: true });

savedPostSchema.index({ user: 1, post: 1 }, { unique: true }); // Mỗi user chỉ lưu 1 lần 1 bài

module.exports = mongoose.model('SavedPost', savedPostSchema);