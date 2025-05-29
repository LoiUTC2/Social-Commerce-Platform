const mongoose = require('mongoose');
const Category = require('./Category');

const shopSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' }, //Có hoặc không cũng được, vì trong User cũng có sellerId rồi, để như này lấy ra sài cho dễ
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true },
    description: { type: String, default: '' },

    // Hình ảnh nhận diện
    avatar: { type: String },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },

    // Thông tin liên hệ của shop
    contact: {
        phone: { type: String },
        email: { type: String },
        businessAddress: {
            street: { type: String },
            ward: { type: String },
            district: { type: String },
            city: { type: String },
            province: { type: String },
            postalCode: { type: String },
            country: { type: String, default: 'Vietnam' }
        }
    },

    // Thông tin hỗ trợ khách hàng
    customerSupport: {
        email: { type: String },
        phone: { type: String },
        operatingHours: { type: String },
        socialMediaLinks: {
            facebook: { type: String },
            instagram: { type: String },
            youtube: { type: String },
            tiktok: { type: String }
        }
    },

    // Thông tin doanh nghiệp của shop
    businessInfo: {
        businessLicense: { type: String }, // Giấy phép kinh doanh
        taxIdentificationNumber: { type: String }, // Mã số thuế
        businessRegistrationNumber: { type: String }, // Số đăng ký kinh doanh (nếu khác MST)
        businessAddress: {
            street: { type: String },
            ward: { type: String },
            district: { type: String },
            city: { type: String },
            province: { type: String },
            postalCode: { type: String }
        }
    },

    // Thông tin vận hành
    operations: {
        warehouseAddress: {
            street: { type: String },
            ward: { type: String },
            district: { type: String },
            city: { type: String },
            province: { type: String }
        },
        shippingProviders: [{ type: String }],
        paymentMethods: [{
            name: { type: String },
            isActive: { type: Boolean, default: true }
        }],
        policies: {
            return: { type: String }, // Chính sách đổi trả
            shipping: { type: String }, // Chính sách vận chuyển
            warranty: { type: String } // Chính sách bảo hành
        }
    },

    // Thông tin sản phẩm và ngành hàng
    productInfo: {
        mainCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }, // Danh mục chính của shop
        subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }], // Danh mục con mà shop kinh doanh
        brands: [{ type: String }], // Các thương hiệu
        productRestrictions: [{ type: String }] // Hạn chế sản phẩm,  sản phẩm mà cửa hàng không được phép hoặc không muốn kinh doanh.
    },

    // Thông tin SEO
    seo: {
        metaTitle: { type: String },
        metaDescription: { type: String },
        keywords: [{ type: String }]
    },

    // Dữ liệu thống kê và hiệu suất
    stats: {
        rating: {
            avg: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
            breakdown: { // ✅ Thêm breakdown để thống kê từng sao
                1: { type: Number, default: 0 },
                2: { type: Number, default: 0 },
                3: { type: Number, default: 0 },
                4: { type: Number, default: 0 },
                5: { type: Number, default: 0 }
            }
        },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        views: { type: Number, default: 0 },
        orderCount: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 },

        // Thống kê review khách hàng
        customerReviews: {
            totalGiven: { type: Number, default: 0 }, // số review đã cho khách hàng
            avgRatingGiven: { type: Number, default: 0 } // điểm TB đã cho khách hàng
        }
    },

    // Từ khóa và hashtags
    hashtags: [{ type: String }],

    // Trạng thái hoạt động
    status: {
        isActive: { type: Boolean, default: true },

        //Phê duyệt tạo shop
        isApprovedCreate: { type: Boolean, default: false }, //được duyệt thì sẽ true, lúc này shop mới có hiệu lực
        approvalCreateStatus: {  //trạng thái xét duyệt
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        createNote: { type: String }, // Ghi chú về việc duyệt/từ chối

        //Phê duyệt xóa shop
        isApprovedDelete: { type: Boolean, default: false }, //được duyệt thì sẽ true, lúc này shop mới có hiệu lực
        approvalDeleteStatus: {  //trạng thái xét duyệt
            type: String,
            enum: ['pending', 'approved', 'rejected'],
        },
        deleteNote: { type: String }, // Ghi chú về việc duyệt/từ chối

        featureLevel: {
            type: String,
            enum: ['normal', 'premium', 'vip'],
            default: 'normal'
        }
    },

    // Thời gian
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }

}, { timestamps: true });

// Function to create slug from shop name
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
async function generateUniqueSlug(baseSlug, shopId = null) {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
        // Check if slug exists (excluding current shop if updating)
        const query = { slug: slug };
        if (shopId) {
            query._id = { $ne: shopId };
        }

        const existingShop = await mongoose.model('Shop').findOne(query);

        if (!existingShop) {
            return slug;
        }

        // If slug exists, append counter
        slug = `${baseSlug}-${counter}`;
        counter++;
    }
}

// Pre-save middleware to generate slug
shopSchema.pre('save', async function (next) {
    try {
        // Only generate slug if name exists and (slug doesn't exist or name has changed)
        if (this.name && (!this.slug || this.isModified('name'))) {
            const baseSlug = createSlug(this.name);

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
shopSchema.pre(['findOneAndUpdate', 'updateOne'], async function (next) {
    try {
        const update = this.getUpdate();

        // Check if name is being updated
        if (update.name || (update.$set && update.$set.name)) {
            const newName = update.name || update.$set.name;

            if (newName) {
                const baseSlug = createSlug(newName);

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

// Tự thêm số lượng shop bán sản phẩm đang thuộc danh mục sản phẩm nào đó (shopCount),Khi shop được duyệt (chuyển từ pending → approved)
shopSchema.post('save', async function (doc, next) {
    try {
        if (
            this.isModified('status') &&
            this.status?.approvalCreateStatus === 'approved' &&
            this.productInfo?.mainCategory
        ) {
            await Category.findByIdAndUpdate(this.productInfo.mainCategory, { $inc: { shopCount: 1 } });
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Tự động xóa số lượng shop bán sản phẩm đang thuộc danh mục sản phẩm nào đó, Khi xóa shop vĩnh viễn
// Lưu ý: "this" ở đây là query, không phải document
shopSchema.pre('deleteOne', async function (next) {
    try {
        if (this.status?.approvalCreateStatus === 'approved' && this.productInfo?.mainCategory) {
            await Category.findByIdAndUpdate(this.productInfo.mainCategory, { $inc: { shopCount: -1 } });
        }
        next();
    } catch (err) {
        next(err);
    }
});

// Search index
shopSchema.index({ name: 'text', description: 'text', hashtags: 'text', 'productInfo.mainCategory': 'text' });

// Compound indexes
shopSchema.index({ slug: 1 });
shopSchema.index({ 'status.approvalCreateStatus': 1, 'status.isActive': 1 });
shopSchema.index({ 'status.approvalDeleteStatus': 1, 'status.isActive': 1 });
shopSchema.index({ owner: 1 });
shopSchema.index({ seller: 1 });

module.exports = mongoose.model('Shop', shopSchema);