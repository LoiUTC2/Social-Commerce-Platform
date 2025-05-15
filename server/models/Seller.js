const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
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

module.exports = mongoose.model('Seller', sellerSchema);