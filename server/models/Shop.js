const mongoose = require('mongoose');
const Category = require('./Category');

const shopSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
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
        productRestrictions: [{ type: String }] // Hạn chế sản phẩm
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
            count: { type: Number, default: 0 }
        },
        followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        views: { type: Number, default: 0 },
        orderCount: { type: Number, default: 0 },
        revenue: { type: Number, default: 0 }
    },

    // Từ khóa và tags
    tags: [{ type: String }],

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
shopSchema.index({ name: 'text', description: 'text', tags: 'text', 'productInfo.mainCategory': 'text' });

// Compound indexes
shopSchema.index({ slug: 1 });
shopSchema.index({ 'status.approvalCreateStatus': 1, 'status.isActive': 1 });
shopSchema.index({ 'status.approvalDeleteStatus': 1, 'status.isActive': 1 });
shopSchema.index({ owner: 1 });
shopSchema.index({ seller: 1 });

module.exports = mongoose.model('Shop', shopSchema);