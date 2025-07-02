// flashSaleMiddleware.js
const cron = require('node-cron');
const FlashSale = require('../models/FlashSale');
const Product = require('../models/Product');


class FlashSaleManager {
    constructor() {
        this.initScheduler();
    }

    // Khởi tạo scheduler để tự động kiểm tra flash sale
    initScheduler() {
        // Chạy mỗi phút để kiểm tra flash sale
        cron.schedule('* * * * *', async () => {
            await this.updateFlashSaleStatus();
        });

        console.log('Flash Sale Scheduler initialized');
    }

    // Cập nhật trạng thái flash sale
    async updateFlashSaleStatus() {
        try {
            const now = new Date();

            // 1. Tìm các flash sale đang active nhưng đã hết hạn
            const expiredFlashSales = await FlashSale.find({
                isActive: true,
                endTime: { $lt: now }
            });

            // Vô hiệu hóa flash sale đã hết hạn
            for (const flashSale of expiredFlashSales) {
                await this.deactivateFlashSale(flashSale._id);
            }

            // 2. Tìm các flash sale sắp bắt đầu
            const upcomingFlashSales = await FlashSale.find({
                isActive: true,
                approvalStatus: 'approved',
                startTime: { $lte: now },
                endTime: { $gt: now }
            });

            // Kích hoạt flash sale
            for (const flashSale of upcomingFlashSales) {
                await this.activateFlashSale(flashSale._id);
            }

            // 3. Dọn dẹp products không còn trong flash sale
            await this.cleanupExpiredFlashSaleProducts();

        } catch (error) {
            console.error('Error updating flash sale status:', error);
        }
    }

    // Kích hoạt flash sale
    async activateFlashSale(flashSaleId) {
        try {
            const flashSale = await FlashSale.findById(flashSaleId).populate('products.product');

            if (!flashSale) return;

            // Cập nhật trạng thái cho tất cả products
            for (const item of flashSale.products) {
                await Product.updateFlashSaleStatus(item.product._id, {
                    flashSaleId: flashSale._id,
                    salePrice: item.salePrice,
                    stockLimit: item.stockLimit,
                    soldCount: item.soldCount,
                    startTime: flashSale.startTime,
                    endTime: flashSale.endTime
                });
            }

            console.log(`Flash Sale ${flashSale.name} activated`);
        } catch (error) {
            console.error('Error activating flash sale:', error);
        }
    }

    // Vô hiệu hóa flash sale
    async deactivateFlashSale(flashSaleId) {
        try {
            const flashSale = await FlashSale.findByIdAndUpdate(
                flashSaleId,
                { isActive: false },
                { new: true }
            );

            // Xóa flash sale khỏi tất cả products
            await Product.updateMany(
                { 'currentFlashSale.flashSaleId': flashSaleId },
                { $unset: { currentFlashSale: 1 } }
            );

            console.log(`Flash Sale ${flashSale.name} deactivated`);
        } catch (error) {
            console.error('Error deactivating flash sale:', error);
        }
    }

    // Dọn dẹp products có flash sale đã hết hạn
    async cleanupExpiredFlashSaleProducts() {
        try {
            const now = new Date();

            await Product.updateMany(
                {
                    'currentFlashSale.endTime': { $lt: now },
                    'currentFlashSale.isActive': true
                },
                {
                    'currentFlashSale.isActive': false
                }
            );
        } catch (error) {
            console.error('Error cleaning up expired flash sale products:', error);
        }
    }

    // Kiểm tra và cập nhật stock khi có đơn hàng
    async updateFlashSaleStock(productId, quantity) {
        try {
            const product = await Product.findById(productId);

            if (product && product.isInFlashSale) {
                // Cập nhật soldCount trong currentFlashSale
                await Product.findByIdAndUpdate(
                    productId,
                    {
                        $inc: {
                            'currentFlashSale.soldCount': quantity,
                            'soldCount': quantity
                        }
                    }
                );

                // Cập nhật soldCount trong FlashSale
                await FlashSale.updateOne(
                    {
                        '_id': product.currentFlashSale.flashSaleId,
                        'products.product': productId
                    },
                    {
                        $inc: {
                            'products.$.soldCount': quantity
                        }
                    }
                );

                // Kiểm tra nếu đã bán hết quota
                const updatedProduct = await Product.findById(productId);
                if (updatedProduct.currentFlashSale.soldCount >= updatedProduct.currentFlashSale.stockLimit) {
                    await Product.findByIdAndUpdate(
                        productId,
                        { 'currentFlashSale.isActive': false }
                    );
                }
            }
        } catch (error) {
            console.error('Error updating flash sale stock:', error);
        }
    }
}

// Middleware cho Express để inject flash sale info
const flashSaleMiddleware = (req, res, next) => {
    // Thêm helper methods vào request
    req.flashSaleManager = new FlashSaleManager();
    next();
};

// Singleton instance
const flashSaleManager = new FlashSaleManager();

module.exports = {
    FlashSaleManager,
    flashSaleMiddleware,
    flashSaleManager
};