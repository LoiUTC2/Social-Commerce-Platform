const mongoose = require('mongoose');
const { MAIN_CATEGORIES, SUB_CATEGORIES } = require('../constants/categoryConstants');
const Category = require('./Category');
const { default: slugify } = require('slugify');

const productSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true },
    // shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true }, tại vì shopId nằm trong User nên cần láy thì populate từ User
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true },
    sku: { type: String, unique: true, required: true }, //mã định danh duy nhất (phân biệt biến thể, theo dõi tồn kho, ...)
    description: { type: String, required: true },
    images: [String],
    videos: [String],
    price: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    stock: { type: Number, required: true }, //số lượng tồn kho (số lượng hiện có)

    // chứa cả category chính (mainCategory) và tất cả các category cha (ancestors) của nó.
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    // Thêm trường để lưu đường dẫn danh mục đầy đủ cho mục đích tìm kiếm và lọc nhanh
    categoryPath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    // Trường chính để hiển thị danh mục chính của sản phẩm (thường là danh mục cấp thấp nhất)
    mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    brand: { type: String },
    condition: { type: String, enum: ['new', 'used'], default: 'new' },
    variants: [{ name: String, options: [String] }],

    ratings: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    // Thống kê review
    reviewStats: {
        totalReviews: { type: Number, default: 0 },
        verifiedReviews: { type: Number, default: 0 }, // review từ người đã mua
        averageRating: { type: Number, default: 0 },

        // Phân phối đánh giá theo sao
        ratingDistribution: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 },
        },

        // THÊM PHẦN TRĂM CHO TỪNG LOẠI ĐÁNH GIÁ
        ratingPercentage: {
            five: { type: Number, default: 0 },
            four: { type: Number, default: 0 },
            three: { type: Number, default: 0 },
            two: { type: Number, default: 0 },
            one: { type: Number, default: 0 }
        },

        // ĐIỂM CHẤT LƯỢNG TỔNG THỂ (0-100)
        qualityScore: { type: Number, default: 0 },

        // THỐNG KÊ TƯƠNG TÁC
        totalLikes: { type: Number, default: 0 },
        reviewsWithImages: { type: Number, default: 0 },
        reviewsWithVideos: { type: Number, default: 0 },
        reviewsWithMedia: { type: Number, default: 0 },

        // THỜI GIAN CẬP NHẬT CUỐI
        lastUpdated: { type: Date, default: Date.now },

        // THÊM THỐNG KÊ THEO THỜI GIAN (tuỳ chọn)
        recentRating: {
            last30Days: {
                average: { type: Number, default: 0 },
                count: { type: Number, default: 0 }
            },
            last7Days: {
                average: { type: Number, default: 0 },
                count: { type: Number, default: 0 }
            }
        }
    },

    soldCount: { type: Number, default: 0 }, //số lượng đã bán

    isActive: { type: Boolean, default: true }, // đang bán (true) và ngừng bán (false)
    allowPosts: { type: Boolean, default: true }, // Cho phép đăng bài viết kèm sản phẩm
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }], // Danh sách các bài viết liên quan đến sản phẩm (nếu cần)
    hashtags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware để tự động tạo slug từ tên sản phẩm
productSchema.pre('validate', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        }) + '-' + Date.now().toString().slice(-6); // Thêm số cuối để đảm bảo tính unique
    }
    next();
});

// Pre-validate middleware để tự động cập nhật categoryPath và categories từ mainCategory
productSchema.pre('validate', async function (next) {
    if (this.isModified('mainCategory') || this.isNew) {
        try {
            if (!this.mainCategory || !mongoose.Types.ObjectId.isValid(this.mainCategory)) {
                return next(new Error('Danh mục chính không hợp lệ'));
            }
            const Category = mongoose.model('Category');
            const category = await Category.findById(this.mainCategory);
            if (!category) {
                return next(new Error('Danh mục không tồn tại'));
            }
            this.categoryPath = [...category.path, category._id];
            const allCategories = [...category.path, category._id].map(id => id.toString());
            if (this.categories && this.categories.length > 0) {
                const existingCategories = this.categories.map(id => id.toString());
                this.categories = [...new Set([...allCategories, ...existingCategories])].map(id => new mongoose.Types.ObjectId(id));
            } else {
                this.categories = allCategories.map(id => new mongoose.Types.ObjectId(id));
            }
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// THÊM MIDDLEWARE MỚI: Pre-update middleware để xử lý thay đổi mainCategory khi update
productSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
    try {
        const update = this.getUpdate();

        // Kiểm tra nếu có thay đổi mainCategory
        if (update.$set && update.$set.mainCategory) {
            const newMainCategoryId = update.$set.mainCategory;

            if (!mongoose.Types.ObjectId.isValid(newMainCategoryId)) {
                return next(new Error('Danh mục chính không hợp lệ'));
            }

            const Category = mongoose.model('Category');
            const category = await Category.findById(newMainCategoryId);

            if (!category) {
                return next(new Error('Danh mục không tồn tại'));
            }

            // Cập nhật categoryPath và categories
            const categoryPath = [...category.path, category._id];
            const allCategories = [...category.path, category._id];

            // Thêm các trường cần cập nhật vào update query
            update.$set.categoryPath = categoryPath;
            update.$set.categories = allCategories;

            console.log('Updated categoryPath and categories for mainCategory change:', {
                mainCategory: newMainCategoryId,
                categoryPath: categoryPath,
                categories: allCategories
            });
        }

        next();
    } catch (error) {
        console.error('Error in pre-update middleware:', error);
        next(error);
    }
});

// Middleware để tự động tạo mã SKU nếu không được cung cấp
productSchema.pre('validate', async function (next) {
    // Chỉ tạo SKU nếu chưa có (khi tạo mới) hoặc nếu là null/undefined
    if (!this.sku) {
        try {
            // Lấy thông tin cần thiết cho SKU
            const prefix = 'PRD'; // Tiền tố cho sản phẩm

            // Lấy chữ cái đầu của brand nếu có, không thì dùng 'X'
            const brandPrefix = this.brand ? this.brand.substring(0, 2).toUpperCase() : 'XX';

            // Lấy Category ID của mainCategory (lấy 3 ký tự đầu)
            const Category = mongoose.model('Category');
            const category = await Category.findById(this.mainCategory);
            const catCode = category ? category._id.toString().substring(0, 3).toUpperCase() : 'CAT';

            // Lấy seller ID (lấy 3 ký tự đầu)
            const sellerCode = this.seller.toString().substring(0, 3).toUpperCase();

            // Lấy thời gian hiện tại để đảm bảo tính duy nhất
            const timestamp = Date.now().toString().slice(-6);

            // Tạo mã SKU với format: PRD-[Brand]-[Category]-[Seller]-[Timestamp]
            this.sku = `${prefix}-${brandPrefix}-${catCode}-${sellerCode}-${timestamp}`;

            // Nếu muốn đảm bảo tính duy nhất ở mức cao hơn, có thể kiểm tra sự tồn tại của SKU
            const Product = mongoose.model('Product');
            let skuExists = await Product.findOne({ sku: this.sku });
            let counter = 1;

            // Nếu SKU đã tồn tại, thêm số đếm vào cuối cho đến khi tìm được SKU duy nhất
            while (skuExists && counter < 100) { // Giới hạn 100 lần thử để tránh vòng lặp vô hạn
                this.sku = `${prefix}-${brandPrefix}-${catCode}-${sellerCode}-${timestamp}-${counter}`;
                skuExists = await Product.findOne({ sku: this.sku });
                counter++;
            }

            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Tự thêm số lượng sản phẩm đang thuộc danh mục sản phẩm nào đó (productCount), Khi tạo sản phẩm mới (chỉ nếu isNew và isActive)
productSchema.pre('save', async function (next) {
    try {
        console.log('Running pre-save middleware for product:', this._id);
        console.log('isNew:', this.isNew, 'isActive:', this.isActive, 'mainCategory:', this.mainCategory);

        if (this.isNew && this.isActive && this.mainCategory) {
            // Lấy thông tin danh mục chính và tất cả danh mục cha
            const mainCategory = await Category.findById(this.mainCategory);
            if (!mainCategory) {
                return next(new Error('Danh mục chính không tồn tại'));
            }

            // Tạo mảng chứa tất cả các danh mục cần cập nhật (bao gồm cả danh mục chính và các danh mục cha)
            const categoriesToUpdate = [mainCategory._id, ...mainCategory.path];

            console.log('Incrementing productCount for categories:', categoriesToUpdate);

            // Cập nhật productCount cho tất cả các danh mục liên quan
            await Category.updateMany(
                { _id: { $in: categoriesToUpdate } },
                { $inc: { productCount: 1 } }
            );
        }
        next();
    } catch (err) {
        console.error('Error in pre-save middleware:', err);
        next(err);
    }
});

// Tự xóa số lượng sản phẩm đang thuộc danh mục sản phẩm nào đó (productCount), Khi xóa sản phẩm (xóa cứng)
// Lưu ý: "this" ở đây là query, không phải document
productSchema.pre('findOneAndDelete', async function (next) {
    try {
        const doc = await this.model.findOne(this.getFilter());
        if (doc && doc.isActive && doc.mainCategory) {
            // Lấy thông tin danh mục chính và tất cả danh mục cha
            const mainCategory = await Category.findById(doc.mainCategory);
            if (!mainCategory) {
                return next(new Error('Danh mục chính không tồn tại'));
            }

            // Tạo mảng chứa tất cả các danh mục cần cập nhật
            const categoriesToUpdate = [mainCategory._id, ...mainCategory.path];

            console.log('Decrementing productCount for categories:', categoriesToUpdate);

            // Cập nhật productCount cho tất cả các danh mục liên quan
            await Category.updateMany(
                { _id: { $in: categoriesToUpdate } },
                { $inc: { productCount: -1 } }
            );
        }
        next();
    } catch (err) {
        console.error('Error in pre-findOneAndDelete middleware:', err);
        next(err);
    }
});

//Middleware khi thay đổi trạng thái isActive
productSchema.pre('save', async function (next) {
    try {
        if (this.isModified('isActive') && !this.isNew && this.mainCategory) {
            const mainCategory = await Category.findById(this.mainCategory);
            if (!mainCategory) {
                return next(new Error('Danh mục chính không tồn tại'));
            }
            const categoriesToUpdate = [mainCategory._id, ...mainCategory.path];
            const increment = this.isActive ? 1 : -1;
            await Category.updateMany(
                { _id: { $in: categoriesToUpdate } },
                { $inc: { productCount: increment } }
            );
        }
        next();
    } catch (err) {
        console.error('Error in isActive change middleware:', err);
        next(err);
    }
});

//Middleware khi thay đổi mainCategory trong save (giữ nguyên để xử lý productCount)
productSchema.pre('save', async function (next) {
    try {
        if (this.isModified('mainCategory') && !this.isNew) {
            const oldMainCategory = this._original?.mainCategory;
            const newMainCategory = this.mainCategory;

            if (oldMainCategory && this.isActive) {
                const oldCategory = await Category.findById(oldMainCategory);
                if (oldCategory) {
                    const oldCategories = [oldCategory._id, ...oldCategory.path];
                    await Category.updateMany(
                        { _id: { $in: oldCategories } },
                        { $inc: { productCount: -1 } }
                    );
                }
            }
            if (newMainCategory && this.isActive) {
                const newCategory = await Category.findById(newMainCategory);
                if (newCategory) {
                    const newCategories = [newCategory._id, ...newCategory.path];
                    await Category.updateMany(
                        { _id: { $in: newCategories } },
                        { $inc: { productCount: 1 } }
                    );
                }
            }
        }
        next();
    } catch (err) {
        console.error('Error in mainCategory change middleware:', err);
        next(err);
    }
});

// THÊM MIDDLEWARE MỚI: Pre-update middleware để xử lý thay đổi productCount khi update mainCategory
productSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], async function (next) {
    try {
        const update = this.getUpdate();

        // Kiểm tra nếu có thay đổi mainCategory và sản phẩm đang active
        if (update.$set && update.$set.mainCategory) {
            const filter = this.getFilter();
            const currentProduct = await this.model.findOne(filter);

            if (currentProduct && currentProduct.isActive) {
                const oldMainCategoryId = currentProduct.mainCategory;
                const newMainCategoryId = update.$set.mainCategory;

                // Nếu mainCategory thực sự thay đổi
                if (oldMainCategoryId.toString() !== newMainCategoryId.toString()) {
                    const Category = mongoose.model('Category');

                    // Giảm productCount cho danh mục cũ
                    if (oldMainCategoryId) {
                        const oldCategory = await Category.findById(oldMainCategoryId);
                        if (oldCategory) {
                            const oldCategories = [oldCategory._id, ...oldCategory.path];
                            await Category.updateMany(
                                { _id: { $in: oldCategories } },
                                { $inc: { productCount: -1 } }
                            );
                            console.log('Decreased productCount for old categories:', oldCategories);
                        }
                    }

                    // Tăng productCount cho danh mục mới
                    const newCategory = await Category.findById(newMainCategoryId);
                    if (newCategory) {
                        const newCategories = [newCategory._id, ...newCategory.path];
                        await Category.updateMany(
                            { _id: { $in: newCategories } },
                            { $inc: { productCount: 1 } }
                        );
                        console.log('Increased productCount for new categories:', newCategories);
                    }
                }
            }
        }

        next();
    } catch (error) {
        console.error('Error in pre-update productCount middleware:', error);
        next(error);
    }
});

// Single field index
productSchema.index({ seller: 1 }); // Index cho seller
productSchema.index({ mainCategory: 1 }); // Index cho category chính
productSchema.index({ 'categories': 1 }); // Index cho danh sách category
productSchema.index({ 'categoryPath': 1 }); // Index cho categoryPath - giúp tìm kiếm sản phẩm theo phân cấp danh mục

// Index tìm kiếm toàn văn
productSchema.index(
    { name: 'text', description: 'text', hashtags: 'text' },
    { weights: { name: 3, hashtags: 2, description: 1 } } // Tìm kiếm theo name quan trọng nhất
);

// Index tổng hợp cho lọc và sắp xếp
productSchema.index({ price: 1, ratings: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
