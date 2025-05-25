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

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware tự động tạo slug, path và level
categorySchema.pre('validate', async function (next) {
    console.log('🚀 === MIDDLEWARE CATEGORY BẮT ĐẦU ===');
    console.log('📝 Tạo mới:', this.isNew);
    console.log('📝 Tên thay đổi:', this.isModified('name'));
    console.log('📝 Parent thay đổi:', this.isModified('parent'));
    console.log('📝 Tên hiện tại:', this.name);
    console.log('📝 Parent hiện tại:', this.parent);

    try {
        // BƯỚC 1: Cập nhật path và level khi parent thay đổi hoặc tạo mới
        if (this.isNew || this.isModified('parent')) {
            await this._updatePathAndLevel();
        }

        // BƯỚC 2: Tạo slug khi name, parent thay đổi hoặc tạo mới
        if (this.isNew || this.isModified('name') || this.isModified('parent')) {
            await this._generateSlug();
        }

        console.log('✅ Kết quả cuối cùng:');
        console.log('   - Slug:', this.slug);
        console.log('   - Level:', this.level);
        console.log('   - Path:', this.path);
        console.log('🏁 === MIDDLEWARE CATEGORY KẾT THÚC ===\n');

        next();
    } catch (error) {
        console.error('❌ Lỗi trong middleware:', error.message);
        return next(error);
    }
});

// Phương thức cập nhật path và level
categorySchema.methods._updatePathAndLevel = async function () {
    console.log('🔄 Cập nhật path và level...');
    
    if (!this.parent) {
        // Danh mục gốc
        this.path = [];
        this.level = 1;
        console.log('   - Danh mục gốc: level = 1, path = []');
    } else {
        // Danh mục con
        const parentCategory = await this.constructor.findById(this.parent);
        
        if (!parentCategory) {
            throw new Error('Danh mục cha không tồn tại');
        }

        // Kiểm tra không tạo vòng lặp (không thể chọn chính mình hoặc con cháu làm parent)
        if (this._id && (
            parentCategory._id.equals(this._id) || 
            parentCategory.path.includes(this._id)
        )) {
            throw new Error('Không thể tạo vòng lặp trong cây danh mục');
        }

        this.path = [...parentCategory.path, parentCategory._id];
        this.level = parentCategory.level + 1;
        
        console.log('   - Danh mục con:');
        console.log('     + Parent:', parentCategory.name);
        console.log('     + Level:', this.level);
        console.log('     + Path length:', this.path.length);
    }
};

// Phương thức tạo slug
categorySchema.methods._generateSlug = async function () {
    console.log('🏷️  Tạo slug...');
    
    // Tạo slug cơ bản từ tên
    const baseSlug = slugify(this.name, {
        lower: true,
        strict: true,
        locale: 'vi', // Hỗ trợ tiếng Việt
        remove: /[*+~.()'"!:@]/g // Loại bỏ ký tự đặc biệt
    });

    let slug = baseSlug;

    // Tạo slug có cấu trúc phân cấp dễ hiểu
    if (this.parent && this.path.length > 0) {
        // Lấy thông tin các danh mục cha để tạo slug có ý nghĩa
        const parentCategories = await this.constructor.find({
            _id: { $in: this.path }
        }).select('name slug');

        // Tạo mảng slug từ root đến parent
        const pathSlugs = [];
        
        // Sắp xếp theo thứ tự trong path
        for (const pathId of this.path) {
            const parentCat = parentCategories.find(cat => cat._id.equals(pathId));
            if (parentCat) {
                const parentSlug = slugify(parentCat.name, {
                    lower: true,
                    strict: true,
                    locale: 'vi'
                });
                pathSlugs.push(parentSlug);
            }
        }

        // Tạo slug với cấu trúc: parent1-parent2-current
        // Chỉ lấy 3 cấp cuối để slug không quá dài
        const recentPaths = pathSlugs.slice(-2); // Lấy 2 cấp gần nhất
        if (recentPaths.length > 0) {
            slug = `${recentPaths.join('-')}-${baseSlug}`;
        }
    }

    // Đảm bảo slug không trùng lặp
    slug = await this._ensureUniqueSlug(slug);
    
    this.slug = slug;
    console.log('   - Slug được tạo:', this.slug);
};

// Phương thức đảm bảo slug duy nhất
categorySchema.methods._ensureUniqueSlug = async function (proposedSlug) {
    let uniqueSlug = proposedSlug;
    let counter = 1;

    while (true) {
        const existingCategory = await this.constructor.findOne({
            slug: uniqueSlug,
            _id: { $ne: this._id } // Loại trừ chính nó khi update
        });

        if (!existingCategory) {
            break; // Slug này chưa tồn tại
        }

        // Thêm số vào cuối slug
        uniqueSlug = `${proposedSlug}-${counter}`;
        counter++;

        // Giới hạn để tránh vòng lặp vô tận
        if (counter > 1000) {
            uniqueSlug = `${proposedSlug}-${Date.now()}`;
            break;
        }
    }

    if (uniqueSlug !== proposedSlug) {
        console.log('   - Slug điều chỉnh do trùng lặp:', uniqueSlug);
    }

    return uniqueSlug;
};

// Phương thức tĩnh để lấy breadcrumb
categorySchema.statics.getBreadcrumb = async function (categoryId) {
    const category = await this.findById(categoryId).populate({
        path: 'path',
        select: 'name slug'
    });

    if (!category) return [];

    const breadcrumb = category.path.map(cat => ({
        id: cat._id,
        name: cat.name,
        slug: cat.slug
    }));

    // Thêm danh mục hiện tại vào cuối
    breadcrumb.push({
        id: category._id,
        name: category.name,
        slug: category.slug
    });

    return breadcrumb;
};

// Phương thức tĩnh để lấy tất cả danh mục con
categorySchema.statics.getAllChildren = async function (categoryId) {
    const children = await this.find({
        path: categoryId
    }).sort({ level: 1, sortOrder: 1 });

    return children;
};

// Middleware cập nhật các danh mục con khi danh mục cha thay đổi
categorySchema.post('save', async function (doc) {
    if (this.isModified('name') || this.isModified('path')) {
        console.log('🔄 Cập nhật danh mục con...');
        
        // Tìm tất cả danh mục con có chứa danh mục này trong path
        const children = await this.constructor.find({
            path: doc._id
        });

        // Cập nhật lại path và slug cho các danh mục con
        for (const child of children) {
            child.markModified('parent'); // Trigger middleware
            await child.save();
        }
        
        console.log(`✅ Đã cập nhật ${children.length} danh mục con`);
    }
});

// Phương thức kiểm tra trùng lặp thông minh
categorySchema.statics.checkDuplicate = async function(name, parent = null, excludeId = null) {
    const query = { name };
    
    // Thêm điều kiện parent
    if (parent) {
        query.parent = parent;
    } else {
        query.parent = null; // Danh mục gốc
    }
    
    // Loại trừ ID hiện tại (khi update)
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    
    const existing = await this.findOne(query);
    
    if (existing) {
        let message = 'Danh mục đã tồn tại';
        if (parent) {
            message += ' trong cùng danh mục cha';
        } else {
            message += ' ở cấp gốc';
        }
        
        return { exists: true, message, category: existing };
    }
    
    return { exists: false };
};

// Phương thức xây dựng cây danh mục
categorySchema.statics.buildCategoryTree = async function(options = {}) {
    const {
        includeInactive = false,
        maxLevel = null,
        parentId = null,
        sortBy = 'sortOrder'
    } = options;
    
    // Xây dựng query
    let query = {};
    if (!includeInactive) query.isActive = true;
    if (maxLevel) query.level = { $lte: maxLevel };
    if (parentId) query.parent = parentId;
    
    // Xây dựng sort
    let sort = {};
    switch (sortBy) {
        case 'name': sort = { level: 1, name: 1 }; break;
        case 'created': sort = { level: 1, createdAt: -1 }; break;
        default: sort = { level: 1, sortOrder: 1 };
    }
    
    const categories = await this.find(query).sort(sort).lean();
    
    // Xây dựng cây
    const buildTree = (cats, parentId = null) => {
        return cats
            .filter(cat => 
                (parentId === null && !cat.parent) ||
                (cat.parent && cat.parent.toString() === parentId?.toString())
            )
            .map(cat => {
                const children = buildTree(cats, cat._id);
                return {
                    ...cat,
                    children,
                    hasChildren: children.length > 0,
                    childrenCount: children.length
                };
            });
    };
    
    return buildTree(categories);
};

// Phương thức thống kê danh mục
categorySchema.statics.getCategoryStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: '$level',
                count: { $sum: 1 },
                activeCount: {
                    $sum: { $cond: ['$isActive', 1, 0] }
                },
                totalProducts: { $sum: '$productCount' },
                totalShops: { $sum: '$shopCount' }
            }
        },
        { $sort: { _id: 1 } }
    ]);
    
    const totalCategories = await this.countDocuments();
    const activeCategories = await this.countDocuments({ isActive: true });
    
    return {
        total: totalCategories,
        active: activeCategories,
        inactive: totalCategories - activeCategories,
        byLevel: stats,
        maxLevel: stats.length > 0 ? Math.max(...stats.map(s => s._id)) : 0
    };
};

// Phương thức tìm kiếm danh mục
categorySchema.statics.searchCategories = async function(searchTerm, options = {}) {
    const {
        level = null,
        isActive = true,
        limit = 20
    } = options;
    
    let query = {
        $or: [
            { name: new RegExp(searchTerm, 'i') },
            { description: new RegExp(searchTerm, 'i') },
            { slug: new RegExp(searchTerm, 'i') }
        ]
    };
    
    if (level) query.level = level;
    if (isActive !== null) query.isActive = isActive;
    
    const categories = await this.find(query)
        .limit(limit)
        .sort({ level: 1, sortOrder: 1 })
        .populate('parent', 'name slug')
        .lean();
    
    // Thêm breadcrumb cho mỗi kết quả
    const results = await Promise.all(
        categories.map(async (cat) => {
            const breadcrumb = await this.getBreadcrumb(cat._id);
            return { ...cat, breadcrumb };
        })
    );
    
    return results;
};

// Phương thức kiểm tra có thể xóa không
categorySchema.statics.canDelete = async function(categoryId) {
    const category = await this.findById(categoryId);
    if (!category) return { canDelete: false, reason: 'Danh mục không tồn tại' };
    
    // Kiểm tra có danh mục con
    const childrenCount = await this.countDocuments({ path: categoryId });
    if (childrenCount > 0) {
        return { 
            canDelete: false, 
            reason: `Có ${childrenCount} danh mục con` 
        };
    }
    
    // Kiểm tra có sản phẩm
    if (category.productCount > 0) {
        return { 
            canDelete: false, 
            reason: `Có ${category.productCount} sản phẩm` 
        };
    }
    
    return { canDelete: true };
};

// Phương thức di chuyển danh mục
categorySchema.statics.moveCategory = async function(categoryId, newParentId = null) {
    const category = await this.findById(categoryId);
    if (!category) throw new Error('Danh mục không tồn tại');
    
    // Kiểm tra parent mới (nếu có)
    if (newParentId) {
        const newParent = await this.findById(newParentId);
        if (!newParent) throw new Error('Danh mục cha mới không tồn tại');
        
        // Kiểm tra không tạo vòng lặp
        if (newParent.path.includes(categoryId)) {
            throw new Error('Không thể di chuyển vào danh mục con của chính nó');
        }
    }
    
    // Cập nhật parent
    category.parent = newParentId;
    await category.save(); // Middleware sẽ tự động cập nhật path, level, slug
    
    return category;
};

// Indexes để tối ưu hiệu suất
categorySchema.index({ slug: 1 });
categorySchema.index({ name: 'text' });
categorySchema.index({ parent: 1 });
categorySchema.index({ path: 1 });
categorySchema.index({ level: 1 });
categorySchema.index({ isActive: 1, isVisible: 1 });
categorySchema.index({ sortOrder: 1 });

module.exports = mongoose.model('Category', categorySchema);