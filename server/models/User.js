const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  avatar: String,
  bio: String, // mô tả ngắn hồ sơ cá nhân
  phone: String,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: Date,
  address: String,
  roles: { type: [String], enum: ['buyer', 'seller', 'admin'], default: ['buyer'] }, //danh sách role, phải được admin duyệt shop thì mới có quyền là seller
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' }, //role hiện tại của người dùng
  // isSellerActive: { type: Boolean, default: false }, // đã bật chế độ bán hàng chưa
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' }, // liên kết đến shop nếu là seller, khi đăng kí shop thì sẽ có shopId ngay
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  likedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  likedComments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  refreshToken: String,
  refreshTokenUsage: { type: Number, default: 0 }, //Kiểm soát giới hạn sử dụng refresh token
  ip: String, //Kiểm tra thiết bị đăng nhập
  userAgent: String, //Kiểm tra thiết bị đăng nhập
  isActive: { type: Boolean, default: true }, // trạng thái tài khoản
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
