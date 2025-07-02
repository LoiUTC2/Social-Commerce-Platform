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
  mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // có middle xử lí rồi, nên ko cần truyền từ body, nếu người dùng muốn thì cứ truyền bt
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

// ==================== VALIDATE MIDDLEWARES ====================
// 1. Middleware tự động set mainCategory từ productIds (chạy trước validate)
postSchema.pre('validate', async function (next) {
  // Chỉ xử lý khi có productIds và chưa có mainCategory được set thủ công
  if (this.productIds && this.productIds.length > 0 && !this.mainCategory) {
    try {
      // Lấy thông tin sản phẩm đầu tiên để lấy mainCategory
      const firstProduct = await Product.findById(this.productIds[0]).select('mainCategory');

      if (firstProduct && firstProduct.mainCategory) {
        this.mainCategory = firstProduct.mainCategory;
        console.log('Auto-set mainCategory from productIds:', {
          postId: this._id,
          productId: this.productIds[0],
          mainCategory: this.mainCategory
        });
      }
    } catch (error) {
      console.error('Error in auto-set mainCategory middleware:', error);
      // Không throw error để không block việc tạo post
    }
  }

  // Nếu không có productIds thì để mainCategory = null
  if (!this.productIds || this.productIds.length === 0) {
    this.mainCategory = null;
  }

  next();
});

// 2. Middleware tự động cập nhật categories từ mainCategory (chạy sau khi mainCategory đã được set)
postSchema.pre('validate', async function (next) {
  // Chỉ xử lý khi mainCategory được modified hoặc là document mới
  if (this.isModified('mainCategory') || this.isNew) {
    try {
      // Nếu không có mainCategory thì clear categories liên quan
      if (!this.mainCategory) {
        console.log('No mainCategory, skipping categories update');
        return next();
      }

      if (!mongoose.Types.ObjectId.isValid(this.mainCategory)) {
        return next(new Error('Danh mục chính không hợp lệ'));
      }

      const category = await Category.findById(this.mainCategory);

      if (!category) {
        return next(new Error('Danh mục không tồn tại'));
      }

      // Tạo mảng categories bao gồm tất cả danh mục cha và danh mục chính
      const categoriesFromMain = [...category.path, category._id].map(id => id.toString());

      // Nếu đã có categories từ trước (do user tự thêm), thì merge với categories từ mainCategory
      if (this.categories && this.categories.length > 0) {
        const existingCategories = this.categories.map(id => id.toString());
        // Loại bỏ duplicate và merge
        this.categories = [...new Set([...categoriesFromMain, ...existingCategories])]
          .map(id => new mongoose.Types.ObjectId(id));
      } else {
        // Nếu chưa có categories, thì set bằng categories từ mainCategory
        this.categories = categoriesFromMain.map(id => new mongoose.Types.ObjectId(id));
      }

      console.log('Auto-updated categories for post:', {
        mainCategory: this.mainCategory,
        categories: this.categories
      });

    } catch (error) {
      console.error('Error in categories update middleware:', error);
      return next(error);
    }
  }
  
  next();
});

// ==================== SAVE MIDDLEWARES ====================
// 3. Middleware xử lý khi có thay đổi productIds array trong save
postSchema.pre('save', async function (next) {
  try {
    // Chỉ xử lý khi productIds được modified và không phải lần đầu tạo
    if (this.isModified('productIds') && !this.isNew) {
      if (this.productIds && this.productIds.length > 0) {
        // Nếu chưa có mainCategory, lấy từ sản phẩm đầu tiên
        if (!this.mainCategory) {
          const firstProduct = await Product.findById(this.productIds[0]).select('mainCategory');

          if (firstProduct && firstProduct.mainCategory) {
            this.mainCategory = firstProduct.mainCategory;
            console.log('Auto-set mainCategory in save middleware:', {
              postId: this._id,
              mainCategory: this.mainCategory
            });
          }
        }
      } else {
        // Nếu không còn productIds nào thì set mainCategory = null
        this.mainCategory = null;
        console.log('Cleared mainCategory due to empty productIds:', {
          postId: this._id
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in productIds save middleware:', error);
    next(error);
  }
});

// 4. Middleware để log khi thêm/xóa categories thủ công
postSchema.pre('save', function (next) {
  try {
    // Chỉ xử lý nếu categories được modified và không phải lần đầu tạo và không modify mainCategory
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

// ==================== UPDATE MIDDLEWARES ====================
// 5. Middleware xử lý update mainCategory từ productIds
postSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
  try {
    const update = this.getUpdate();

    // Kiểm tra nếu có thay đổi productIds
    if (update.$set && update.$set.productIds) {
      const newProductIds = update.$set.productIds;

      if (newProductIds && newProductIds.length > 0) {
        // Lấy mainCategory từ sản phẩm đầu tiên
        const firstProduct = await Product.findById(newProductIds[0]).select('mainCategory');

        if (firstProduct && firstProduct.mainCategory) {
          // Chỉ set mainCategory nếu chưa được set thủ công trong update
          if (!update.$set.mainCategory) {
            update.$set.mainCategory = firstProduct.mainCategory;
            console.log('Auto-updated mainCategory from productIds in update:', {
              productIds: newProductIds,
              mainCategory: firstProduct.mainCategory
            });
          }
        }
      } else {
        // Nếu xóa hết productIds thì set mainCategory = null (nếu chưa set thủ công)
        if (!update.$set.mainCategory) {
          update.$set.mainCategory = null;
        }
      }
    }

    // Xử lý trường hợp push productIds
    if (update.$push && update.$push.productIds) {
      const filter = this.getFilter();
      const currentPost = await this.model.findOne(filter).select('mainCategory productIds');

      if (currentPost && !currentPost.mainCategory) {
        const newProductId = update.$push.productIds;
        const product = await Product.findById(newProductId).select('mainCategory');

        if (product && product.mainCategory) {
          update.$set = update.$set || {};
          update.$set.mainCategory = product.mainCategory;
          console.log('Auto-set mainCategory from pushed productId:', {
            productId: newProductId,
            mainCategory: product.mainCategory
          });
        }
      }
    }

    // Xử lý trường hợp pull productIds
    if (update.$pull && update.$pull.productIds) {
      const filter = this.getFilter();
      const currentPost = await this.model.findOne(filter).select('mainCategory productIds');

      if (currentPost && currentPost.productIds.length === 1) {
        const removingProductId = update.$pull.productIds;
        if (currentPost.productIds[0].toString() === removingProductId.toString()) {
          update.$set = update.$set || {};
          update.$set.mainCategory = null;
          console.log('Cleared mainCategory due to last productId removal');
        }
      }
    }

    next();
  } catch (error) {
    console.error('Error in productIds update middleware:', error);
    next(error);
  }
});

// 6. Middleware xử lý update categories từ mainCategory
postSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
  try {
    const update = this.getUpdate();

    // Kiểm tra nếu có thay đổi mainCategory
    if (update.$set && update.$set.mainCategory) {
      const newMainCategoryId = update.$set.mainCategory;

      // Nếu set mainCategory = null thì không cần xử lý categories
      if (!newMainCategoryId) {
        console.log('MainCategory set to null, categories unchanged');
        return next();
      }

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
        const newCategoriesFromMain = [...category.path, category._id].map(id => id.toString());

        // Lấy categories hiện tại không phải từ mainCategory cũ
        let existingCustomCategories = [];
        if (currentPost.categories && currentPost.categories.length > 0 && currentPost.mainCategory) {
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
          ...newCategoriesFromMain,
          ...existingCustomCategories
        ])].map(id => new mongoose.Types.ObjectId(id));

        // Thêm vào update query
        update.$set.categories = finalCategories;

        console.log('Updated categories for mainCategory change:', {
          oldMainCategory: currentPost.mainCategory,
          newMainCategory: newMainCategoryId,
          finalCategories: finalCategories.length
        });
      }
    }

    next();
  } catch (error) {
    console.error('Error in mainCategory update middleware:', error);
    next(error);
  }
});

// ==================== DELETE MIDDLEWARES ====================
// 7. Middleware tự động xóa bài viết khỏi products khi xóa post
postSchema.pre('deleteOne', { document: true }, async function (next) {
  try {
    // Xóa bài viết khỏi các sản phẩm liên quan
    if (this.productIds && this.productIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: this.productIds } },
        { $pull: { posts: this._id } }
      );
      console.log('Removed post from products:', {
        postId: this._id,
        productIds: this.productIds
      });
    }
    next();
  } catch (error) {
    console.error('Error in post deletion middleware:', error);
    next(error);
  }
});

// ==================== INDEXES ====================
// Index cho hiệu suất tìm kiếm
postSchema.index({ mainCategory: 1 });
postSchema.index({ categories: 1 });
postSchema.index({ 'author._id': 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ privacy: 1 });
postSchema.index({ productIds: 1 });

// Text index cho tìm kiếm nội dung
postSchema.index(
  { content: 'text', hashtags: 'text', tags: 'text' },
  { weights: { content: 3, hashtags: 2, tags: 1 } }
);

module.exports = mongoose.model('Post', postSchema);
