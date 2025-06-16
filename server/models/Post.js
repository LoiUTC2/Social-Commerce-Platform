const mongoose = require('mongoose');
const Product = require('./Product');
const Category = require('./Category');

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
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // chứa cả category chính (mainCategory) và tất cả các category cha (ancestors) của nó.
  mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
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
}, { timestamps: true });

// Pre-validate middleware để tự động cập nhật categories từ mainCategory
postSchema.pre('validate', async function (next) {
  if (this.isModified('mainCategory') || this.isNew) {
    try {
      if (!this.mainCategory || !mongoose.Types.ObjectId.isValid(this.mainCategory)) {
        return next(new Error('Danh mục chính không hợp lệ'));
      }

      const category = await Category.findById(this.mainCategory);

      if (!category) {
        return next(new Error('Danh mục không tồn tại'));
      }

      // Tạo mảng categories bao gồm tất cả danh mục cha và danh mục chính
      const allCategories = [...category.path, category._id].map(id => id.toString());

      // Nếu đã có categories từ trước (do user tự thêm), thì merge với categories từ mainCategory
      if (this.categories && this.categories.length > 0) {
        const existingCategories = this.categories.map(id => id.toString());
        // Loại bỏ duplicate và merge
        this.categories = [...new Set([...allCategories, ...existingCategories])]
          .map(id => new mongoose.Types.ObjectId(id));
      } else {
        // Nếu chưa có categories, thì set bằng categories từ mainCategory
        this.categories = allCategories.map(id => new mongoose.Types.ObjectId(id));
      }

      console.log('Auto-updated categories for post:', {
        mainCategory: this.mainCategory,
        categories: this.categories
      });

      next();
    } catch (error) {
      console.error('Error in post pre-validate middleware:', error);
      next(error);
    }
  } else {
    next();
  }
});

// Pre-update middleware để xử lý thay đổi mainCategory khi update
postSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
  try {
    const update = this.getUpdate();

    // Kiểm tra nếu có thay đổi mainCategory
    if (update.$set && update.$set.mainCategory) {
      const newMainCategoryId = update.$set.mainCategory;

      if (!mongoose.Types.ObjectId.isValid(newMainCategoryId)) {
        return next(new Error('Danh mục chính không hợp lệ'));
      }

      const category = await Category.findById(newMainCategoryId);

      if (!category) {
        return next(new Error('Danh mục không tồn tại'));
      }

      // Lấy bài viết hiện tại để biết categories cũ
      const filter = this.getFilter();
      const currentPost = await this.model.findOne(filter);

      if (currentPost) {
        // Tạo mảng categories mới từ mainCategory mới
        const newCategoriesFromMain = [...category.path, category._id];

        // Lấy categories hiện tại không phải từ mainCategory cũ
        let existingCustomCategories = [];
        if (currentPost.categories && currentPost.categories.length > 0) {
          // Lấy danh mục cũ để biết categories nào cần loại bỏ
          const oldMainCategory = await Category.findById(currentPost.mainCategory);
          const oldCategoriesFromMain = oldMainCategory ?
            [...oldMainCategory.path, oldMainCategory._id].map(id => id.toString()) : [];

          // Lấy những categories không phải từ mainCategory cũ (do user tự thêm)
          existingCustomCategories = currentPost.categories
            .filter(catId => !oldCategoriesFromMain.includes(catId.toString()))
            .map(id => id.toString());
        }

        // Merge categories mới với categories tùy chỉnh hiện có
        const finalCategories = [...new Set([
          ...newCategoriesFromMain.map(id => id.toString()),
          ...existingCustomCategories
        ])].map(id => new mongoose.Types.ObjectId(id));

        // Thêm vào update query
        update.$set.categories = finalCategories;

        console.log('Updated categories for post mainCategory change:', {
          mainCategory: newMainCategoryId,
          newCategories: finalCategories
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in post pre-update middleware:', error);
    next(error);
  }
});

// Middleware để xử lý khi thêm/xóa categories thủ công mà không thay đổi mainCategory
postSchema.pre('save', function (next) {
  try {
    // Chỉ xử lý nếu categories được modified và không phải lần đầu tạo
    if (this.isModified('categories') && !this.isNew && !this.isModified('mainCategory')) {
      console.log('Categories manually updated for post:', this._id);
      // Có thể thêm logic validation hoặc logging ở đây nếu cần
    }
    next();
  } catch (error) {
    console.error('Error in post categories save middleware:', error);
    next(error);
  }
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

// Index cho hiệu suất tìm kiếm
postSchema.index({ mainCategory: 1 });
postSchema.index({ categories: 1 });
postSchema.index({ 'author._id': 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ privacy: 1 });

// Text index cho tìm kiếm nội dung
postSchema.index(
  { content: 'text', hashtags: 'text', tags: 'text' },
  { weights: { content: 3, hashtags: 2, tags: 1 } }
);

module.exports = mongoose.model('Post', postSchema);
