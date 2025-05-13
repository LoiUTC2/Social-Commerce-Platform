const mongoose = require('mongoose');
const { MAIN_CATEGORIES, SUB_CATEGORIES } = require('../constants/categoryConstants');

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
    category: {
        type: [String], required: true, enum: ["Điện thoại", "Laptop", "Tablet", "Phụ kiện", "Máy ảnh", "Thời trang", "Thể thao",
            "Sneakers", "Đồng hồ", "Mỹ phẩm", "Nước hoa", "Đồ gia dụng", "Nội thất", "Công nghệ", "Gaming", "Đồ ăn",
            "Đồ uống", "Sách", "Đồ chơi", "Xe cộ", "Âm thanh", "Máy tính bảng", "Flagship", "Nhiếp ảnh"]
    },
    // categoryParent: { type: String, required: true, enum: MAIN_CATEGORIES },
    // categoryChild: { type: String, required: true, enum: [].concat(...Object.values(SUB_CATEGORIES)) },
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

//single field index
productSchema.index({ slug: 1 }); // Index cho slug
// Index tìm kiếm toàn văn
productSchema.index(
    { name: 'text', description: 'text', tags: 'text' },
    { weights: { name: 3, tags: 2, description: 1 } } // Tìm kiếm theo name quan trọng nhất
);

module.exports = mongoose.model('Product', productSchema);
