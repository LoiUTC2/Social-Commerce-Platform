const mongoose = require('mongoose');
const { MAIN_CATEGORIES, SUB_CATEGORIES } = require('../constants/categoryConstants');
const Category = require('./Category');

const productSchema = new mongoose.Schema({
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
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
    categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
    // Thêm trường để lưu đường dẫn danh mục đầy đủ cho mục đích tìm kiếm và lọc nhanh
    categoryPath: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    // Trường chính để hiển thị danh mục chính của sản phẩm (thường là danh mục cấp thấp nhất)
    mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },

    brand: { type: String },
    condition: { type: String, enum: ['new', 'used'], default: 'new' },
    variants: [{ name: String, options: [String] }],
    ratings: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    soldCount: { type: Number, default: 0 }, //số lượng đã bán
    isActive: { type: Boolean, default: true }, // đang bán (true) và ngừng bán (false)
    tags: [String],
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware để tự động tạo slug từ tên sản phẩm
productSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = slugify(this.name, {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        }) + '-' + Date.now().toString().slice(-6); // Thêm số cuối để đảm bảo tính unique
    }
    next();
});

// Pre-save middleware để tự động cập nhật categoryPath và categories từ mainCategory
productSchema.pre('save', async function (next) {
    if (this.isModified('mainCategory')) {
        try {
            const Category = mongoose.model('Category');
            const category = await Category.findById(this.mainCategory);

            if (!category) {
                return next(new Error('Danh mục không tồn tại'));
            }

            // Lấy toàn bộ đường dẫn từ root đến danh mục hiện tại
            this.categoryPath = [...category.path, category._id];

            // Tự động thêm mainCategory và tất cả danh mục cha vào categories
            // Tạo mảng chứa mainCategory và tất cả danh mục cha của nó
            const allCategories = [...category.path, category._id].map(id => id.toString());

            // Kết hợp với categories hiện có (nếu có) và loại bỏ trùng lặp
            if (this.categories && this.categories.length > 0) {
                const existingCategories = this.categories.map(id => id.toString());
                this.categories = [...new Set([...allCategories, ...existingCategories])].map(id => mongoose.Types.ObjectId(id));
            } else {
                // Nếu chưa có categories nào được set, sử dụng allCategories
                this.categories = allCategories.map(id => mongoose.Types.ObjectId(id));
            }

            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

// Middleware để tự động tạo mã SKU nếu không được cung cấp
productSchema.pre('save', async function (next) {
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
productSchema.post('save', async function (doc, next) {
    try {
        if (this.isNew && this.isActive && this.mainCategory) {
            await Category.findByIdAndUpdate(this.mainCategory, { $inc: { productCount: 1 } });
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Tự xóa số lượng sản phẩm đang thuộc danh mục sản phẩm nào đó (productCount), Khi xóa sản phẩm (xóa cứng)
 // Lưu ý: "this" ở đây là query, không phải document
productSchema.pre('findOneAndDelete', async function (next) {
    try {
        if (this.mainCategory && this.isActive) {
            await Category.findByIdAndUpdate(this.mainCategory, { $inc: { productCount: -1 } });
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Single field index
productSchema.index({ slug: 1 }); // Index cho slug
productSchema.index({ sku: 1 }); // Index cho sku
productSchema.index({ seller: 1 }); // Index cho seller
productSchema.index({ mainCategory: 1 }); // Index cho category chính
productSchema.index({ 'categories': 1 }); // Index cho danh sách category
productSchema.index({ 'categoryPath': 1 }); // Index cho categoryPath - giúp tìm kiếm sản phẩm theo phân cấp danh mục

// Index tìm kiếm toàn văn
productSchema.index(
    { name: 'text', description: 'text', tags: 'text' },
    { weights: { name: 3, tags: 2, description: 1 } } // Tìm kiếm theo name quan trọng nhất
);

// Index tổng hợp cho lọc và sắp xếp
productSchema.index({ price: 1, ratings: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ soldCount: -1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
