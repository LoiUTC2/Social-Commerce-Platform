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

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    createdAt: { type: Date, default: Date.now },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', require: true },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Pre-validate middleware để tạo slug tự động, pre('validate'): Chuẩn bị dữ liệu trước khi validate, còn pre('save'): 	Sau khi validate, trước khi lưu
// categorySchema.pre('validate', function (next) {
//     console.log('Middleware pre save chạy!');
//     console.log('isModified(name):', this.isModified('name'));
//     console.log('this.isNew:', this.isNew); // Kiểm tra this context

//     if (this.isNew || this.isModified('name')) {
//         this.slug = slugify(this.name, { lower: true, strict: true });
//         console.log('Slug đã được tạo:', this.slug);
//     }
//     next();
// });

// categorySchema.pre('validate', async function (next) {
//     console.log('--- Middleware pre validate bắt đầu ---');
//     console.log('this.isNew:', this.isNew);
//     console.log('this.isModified(\'name\'):', this.isModified('name'));
//     console.log('this.name:', this.name);
//     console.log('this.slug (trước):', this.slug);
//     console.log('this.level:', this.level);

//     if (this.isNew || this.isModified('name')) {
//         try {
//             let baseSlug = slugify(this.name, { lower: true, strict: true });
//             let slug = baseSlug;
//             let count = 1;

//             // Kiểm tra xem đã có slug nào giống chưa
//             const existingCategory = await this.constructor.findOne({ slug: slug });

//             if (existingCategory) {
//                 slug = `${baseSlug}-${this.level}`; // Thêm level vào slug
//                 const existingCategoryWithLevel = await this.constructor.findOne({slug: slug});
//                 if(existingCategoryWithLevel){
//                     slug = `${baseSlug}-${this.level}-${count++}`;
//                 }
//             }

//             this.slug = slug;
//             console.log('Slug đã được tạo:', this.slug);

//         } catch (error) {
//             return next(error); // Chuyển lỗi cho Mongoose xử lý
//         }
//     }

//     console.log('this.slug (sau):', this.slug);
//     console.log('--- Middleware pre validate kết thúc ---');
//     next();
// });

// middle ware tạo slug tự động
// categorySchema.pre('validate', async function (next) {
//     console.log('--- Middleware pre validate (slug) bắt đầu ---');
//     console.log('this.isNew:', this.isNew);
//     console.log('this.isModified(\'name\'):', this.isModified('name'));
//     console.log('this.name:', this.name);
//     console.log('this.slug (trước):', this.slug);
//     console.log('this.level:', this.level);
//     console.log('this.parent:', this.parent);

//     if (this.isNew || this.isModified('name') || this.isModified('level') || this.isModified('parent')) {
//         try {
//             // Tạo base slug từ name
//             let baseSlug = slugify(this.name, { lower: true, strict: true });
//             let slug = baseSlug;

//             // Thêm thông tin parent nếu có
//             let parentSlug = '';
//             if (this.parent) {
//                 const parentCategory = await this.constructor.findById(this.parent);
//                 if (parentCategory) {
//                     parentSlug = slugify(parentCategory.name, { lower: true, strict: true });
//                     slug = `${baseSlug}-${parentSlug}`;
//                 }
//             }

//             // Thêm level
//             slug = `${slug}-${this.level}`;

//             // Kiểm tra slug trùng lặp
//             let existingCategory = await this.constructor.findOne({ slug });
//             if (existingCategory && existingCategory._id.toString() !== this._id.toString()) {
//                 let count = 1;
//                 while (await this.constructor.findOne({ slug: `${slug}-${count}` })) {
//                     count++;
//                 }
//                 slug = `${slug}-${count}`;
//             }

//             this.slug = slug;
//             console.log('Slug đã được tạo:', this.slug);
//         } catch (error) {
//             return next(error);
//         }
//     }

//     console.log('this.slug (sau):', this.slug);
//     console.log('--- Middleware pre validate (slug) kết thúc ---');
//     next();
// });

// Tạo path tự động khi lưu danh mục
// categorySchema.pre('validate', async function (next) {
//     if (this.isModified('parent') || this.isNew) {
//         try {
//             if (!this.parent) { this.path = []; this.level = 1; } else { const parentCategory = await this.constructor.findById(this.parent); if (!parentCategory) { return next(new Error('Danh mục cha không tồn tại')); } this.path = [...parentCategory.path, parentCategory._id]; this.level = parentCategory.level + 1; }
//             next();
//         } catch (error) { next(error); }
//     } else { next(); }
// });

// Middleware để cập nhật path, level và tạo slug tự động
categorySchema.pre('validate', async function (next) {
    console.log('--- Middleware pre validate bắt đầu ---');
    console.log('this.isNew:', this.isNew);
    console.log('this.isModified(\'name\'):', this.isModified('name'));
    console.log('this.isModified(\'parent\'):', this.isModified('parent'));
    console.log('this.name:', this.name);
    console.log('this.slug (trước):', this.slug);
    console.log('this.level (trước):', this.level);
    console.log('this.parent:', this.parent);

    try {
        // Bước 1: Cập nhật path và level nếu cần
        if (this.isNew || this.isModified('parent')) {
            if (!this.parent) {
                this.path = [];
                this.level = 1;
            } else {
                const parentCategory = await this.constructor.findById(this.parent);
                if (!parentCategory) {
                    return next(new Error('Danh mục cha không tồn tại'));
                }
                this.path = [...parentCategory.path, parentCategory._id];
                this.level = parentCategory.level + 1;
            }
            console.log('Path đã được cập nhật:', this.path);
            console.log('Level đã được cập nhật:', this.level);
        }

        // Bước 2: Tạo slug nếu cần
        if (this.isNew || this.isModified('name') || this.isModified('parent') || this.isModified('level')) {
            let baseSlug = slugify(this.name, { lower: true, strict: true });
            let slug = baseSlug;

            // Thêm thông tin parent nếu có
            let parentSlug = '';
            if (this.parent) {
                const parentCategory = await this.constructor.findById(this.parent);
                if (parentCategory) {
                    parentSlug = slugify(parentCategory.name, { lower: true, strict: true });
                    slug = `${baseSlug}-${parentSlug}`;
                }
            }

            // Thêm level
            slug = `${slug}-${this.level}`;

            // Kiểm tra slug trùng lặp
            let existingCategory = await this.constructor.findOne({ slug });
            if (existingCategory && existingCategory._id.toString() !== this._id.toString()) {
                let count = 1;
                while (await this.constructor.findOne({ slug: `${slug}-${count}` })) {
                    count++;
                }
                slug = `${slug}-${count}`;
            }

            this.slug = slug;
            console.log('Slug đã được tạo:', this.slug);
        }

        console.log('this.slug (sau):', this.slug);
        console.log('this.level (sau):', this.level);
        console.log('--- Middleware pre validate kết thúc ---');
        next();
    } catch (error) {
        return next(error);
    }
});

categorySchema.index({ slug: 1 });
categorySchema.index({ name: 'text' });
categorySchema.index({ parent: 1 });
categorySchema.index({ 'path': 1 });
categorySchema.index({ isActive: 1, isVisible: 1 });

module.exports = mongoose.model('Category', categorySchema);