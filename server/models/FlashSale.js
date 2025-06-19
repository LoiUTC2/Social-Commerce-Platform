const mongoose = require('mongoose');

const flashSaleSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    description: { type: String },
    slug: { type: String, unique: true },
    hashtags: [String],

    // Danh sách sản phẩm được chọn cho chương trình Flash Sale
    products: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        salePrice: { type: Number, required: true },
        stockLimit: { type: Number, required: true }, // Số lượng giới hạn trong Flash Sale
        soldCount: { type: Number, default: 0 }
    }],

    // Thời gian hiệu lực
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },

    // Cấu hình hiển thị
    banner: { type: String },
    isFeatured: { type: Boolean, default: false },

    // Thống kê (hỗ trợ AI & phân tích)
    stats: {
        totalViews: { type: Number, default: 0 },
        totalClicks: { type: Number, default: 0 },
        totalPurchases: { type: Number, default: 0 },
        totalRevenue: { type: Number, default: 0 } // tổng doanh thu

    },

    // Trạng thái
    isActive: { type: Boolean, default: true },
    isHidden: { type: Boolean, default: false }, // Ẩn khỏi người dùng khi cần
    approvalStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop' },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Helper function để tạo slug từ string
function createSlug(text) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
        .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
        .replace(/[ìíịỉĩ]/g, 'i')
        .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
        .replace(/[ùúụủũưừứựửữ]/g, 'u')
        .replace(/[ỳýỵỷỹ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '') // Loại bỏ ký tự đặc biệt
        .replace(/\s+/g, '-') // Thay thế khoảng trống bằng dấu gạch ngang
        .replace(/-+/g, '-') // Loại bỏ dấu gạch ngang trùng lặp
        .replace(/^-|-$/g, ''); // Loại bỏ dấu gạch ngang ở đầu và cuối
}

// Middleware để tự động tạo slug trước khi save
flashSaleSchema.pre('save', async function (next) {
    try {
        // Chỉ tạo slug mới khi:
        // 1. Document mới được tạo (isNew = true)
        // 2. Hoặc name đã được thay đổi và slug chưa được set thủ công
        if (this.isNew || (this.isModified('name') && !this.isModified('slug'))) {
            let baseSlug = createSlug(this.name);
            let uniqueSlug = baseSlug;
            let counter = 1;

            // Kiểm tra slug đã tồn tại chưa, nếu có thì thêm số vào cuối
            while (await this.constructor.findOne({
                slug: uniqueSlug,
                _id: { $ne: this._id } // Loại trừ document hiện tại khi update
            })) {
                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
            }

            this.slug = uniqueSlug;
        }
        next();
    } catch (error) {
        next(error);
    }
});

// Middleware để tự động tạo slug khi sử dụng findOneAndUpdate
flashSaleSchema.pre('findOneAndUpdate', async function (next) {
    try {
        const update = this.getUpdate();

        // Chỉ tạo slug mới khi name được update và slug không được set thủ công
        if (update.name && !update.slug) {
            let baseSlug = createSlug(update.name);
            let uniqueSlug = baseSlug;
            let counter = 1;

            // Lấy _id của document đang được update
            const docId = this.getQuery()._id;

            // Kiểm tra slug đã tồn tại chưa
            while (await this.model.findOne({
                slug: uniqueSlug,
                _id: { $ne: docId }
            })) {
                uniqueSlug = `${baseSlug}-${counter}`;
                counter++;
            }

            // Thêm slug vào update
            this.setUpdate({ ...update, slug: uniqueSlug });
        }
        next();
    } catch (error) {
        next(error);
    }
});

flashSaleSchema.index({ startTime: 1, endTime: 1 });
flashSaleSchema.index({ 'products.product': 1 });
flashSaleSchema.index({ slug: 1 });

module.exports = mongoose.model('FlashSale', flashSaleSchema);
