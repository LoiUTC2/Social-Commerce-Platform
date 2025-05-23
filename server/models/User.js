const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  slug: { type: String, unique: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  avatar: String,
  coverImage: String,
  bio: String, // mô tả ngắn hồ sơ cá nhân
  phone: String,
  gender: { type: String, enum: ['male', 'female', 'other'] },
  dateOfBirth: Date,
  address: String,
  roles: { type: [String], enum: ['buyer', 'seller', 'admin'], default: ['buyer'] }, //danh sách role, phải được admin duyệt shop thì mới có quyền là seller
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' }, //role hiện tại của người dùng
  // isSellerActive: { type: Boolean, default: false }, // đã bật chế độ bán hàng chưa
  shopId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', unique: true}, // liên kết đến shop nếu là seller, khi đăng kí shop thì sẽ có shopId ngay
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', unique: true}, // Liên kết với Seller (1-1)
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

// Function to create slug from fullName
function createSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Remove Vietnamese accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace special characters with hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    // Replace spaces and multiple spaces with single hyphen
    .replace(/\s+/g, '-')
    // Remove multiple consecutive hyphens
    .replace(/-+/g, '-')
    // Remove leading and trailing hyphens
    .replace(/^-+|-+$/g, '');
}

// Function to ensure unique slug
async function generateUniqueSlug(baseSlug, userId = null) {
  let slug = baseSlug;
  let counter = 1;
  
  while (true) {
    // Check if slug exists (excluding current user if updating)
    const query = { slug: slug };
    if (userId) {
      query._id = { $ne: userId };
    }
    
    const existingUser = await mongoose.model('User').findOne(query);
    
    if (!existingUser) {
      return slug;
    }
    
    // If slug exists, append counter
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

// Pre-save middleware to generate slug
userSchema.pre('save', async function(next) {
  try {
    // Only generate slug if fullName exists and (slug doesn't exist or fullName has changed)
    if (this.fullName && (!this.slug || this.isModified('fullName'))) {
      const baseSlug = createSlug(this.fullName);
      
      if (baseSlug) {
        this.slug = await generateUniqueSlug(baseSlug, this._id);
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Pre-update middleware for findOneAndUpdate
userSchema.pre(['findOneAndUpdate', 'updateOne'], async function(next) {
  try {
    const update = this.getUpdate();
    
    // Check if fullName is being updated
    if (update.fullName || (update.$set && update.$set.fullName)) {
      const newFullName = update.fullName || update.$set.fullName;
      
      if (newFullName) {
        const baseSlug = createSlug(newFullName);
        
        if (baseSlug) {
          // Get the document being updated to exclude it from uniqueness check
          const docId = this.getQuery()._id;
          const uniqueSlug = await generateUniqueSlug(baseSlug, docId);
          
          if (update.$set) {
            update.$set.slug = uniqueSlug;
          } else {
            update.slug = uniqueSlug;
          }
        }
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

// Index for better performance
userSchema.index({ slug: 1 });

module.exports = mongoose.model('User', userSchema);
