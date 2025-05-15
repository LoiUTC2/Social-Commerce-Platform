const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: '' },

    // Cấu trúc phân cấp
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    level: { type: Number, default: 1 },
    path: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // Đường dẫn đầy đủ từ root đến danh mục hiện tại. nghĩa là nó sẽ tự động bỏ parent vào mảng (thêm vào sau mảng))(ở đầu mảng là cha,ở sau là con) VD: Trang chủ > Điện tử > Điện thoại > iPhone, 

    // Thông tin hiển thị
    icon: { type: String, default: '' },
    image: { type: String, default: '' },
    color: { type: String, default: '#000000' },

    // Thông tin hiệu suất
    productCount: { type: Number, default: 0 }, // Số lượng sản phẩm trong danh mục
    shopCount: { type: Number, default: 0 }, // Số shop có sản phẩm trong danh mục

    // Trạng thái và sắp xếp
    isActive: { type: Boolean, default: true },
    isVisible: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },

    // Metadata và SEO
    metaTitle: { type: String },
    metaDescription: { type: String },
    keywords: [{ type: String }],

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-save middleware để tạo slug tự động
categorySchema.pre('save', function (next) { if (this.isModified('name')) { this.slug = slugify(this.name, { lower: true, strict: true }); } next(); });

// Tạo path tự động khi lưu danh mục
categorySchema.pre('save', async function (next) {
    if (this.isModified('parent') || this.isNew) {
        try {
            if (!this.parent) { this.path = []; this.level = 1; } else { const parentCategory = await this.constructor.findById(this.parent); if (!parentCategory) { return next(new Error('Danh mục cha không tồn tại')); } this.path = [...parentCategory.path, parentCategory._id]; this.level = parentCategory.level + 1; }
            next();
        } catch (error) { next(error); }
    } else { next(); }
});

categorySchema.index({ slug: 1 });
categorySchema.index({ name: 'text' });
categorySchema.index({ parent: 1 });
categorySchema.index({ 'path': 1 });
categorySchema.index({ isActive: 1, isVisible: 1 });

module.exports = mongoose.model('Category', categorySchema);