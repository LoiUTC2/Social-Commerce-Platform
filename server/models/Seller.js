const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', required: true, unique: true },
    // author: {
    //     type: {
    //         type: String,
    //         enum: ['User', 'Shop'],
    //         required: true
    //     },
    //     _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'author.type' } //refPath: 'author.type' cho phép Mongoose populate linh hoạt theo kiểu (User hoặc Shop).
    // }, //Tại vì người dùng có thể đăng kí seller với tư cách là buyer hoặc seller (shop), ko nhất thiết chuyển role mới đăng kí được
    legalName: { type: String }, // Tên đầy đủ theo pháp lý

    idCardNumber: { type: String }, // Số CMND/CCCD
    idCardFrontImage: { type: String }, // Ảnh mặt trước CMND/CCCD
    idCardBackImage: { type: String }, // Ảnh mặt sau CMND/CCCD

    bankName: { type: String }, // Tên ngân hàng
    bankAccountNumber: { type: String }, // Số tài khoản ngân hàng
    accountHolderName: { type: String }, // Tên chủ tài khoản
    paymentMethods: [{ type: String }], // Các phương thức thanh toán được chấp nhận

    kycLevel: { type: Number, default: 0 }, // Cấp độ KYC (xác minh danh tính)
    kycDetails: { type: Object }, // Chi tiết KYC (có thể linh hoạt lưu các thông tin khác nhau tùy theo cấp độ)

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware để cập nhật sellerId trong User
sellerSchema.post('save', async function (doc, next) {
    try {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(this.user, { sellerId: this._id });

        const Shop = mongoose.model('Shop');
        await Shop.findByIdAndUpdate(this.shop, { seller: this._id });

        next();
    } catch (err) {
        next(err);
    }
});

// Xóa liên kết sellerId trong User khi Seller bị xóa
sellerSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
    try {
        const User = mongoose.model('User');
        await User.findByIdAndUpdate(this.user, { sellerId: null });

        const Shop = mongoose.model('Shop');
        await Shop.findByIdAndUpdate(this.shop, { seller: null});

        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model('Seller', sellerSchema);