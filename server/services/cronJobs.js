const cron = require('node-cron');
const { trainMatrixFactorization, prepareTfIdfMatrix } = require('./recommendationService');

// Lịch huấn luyện mô hình Matrix Factorization vào 1h sáng mỗi ngày 
cron.schedule('0 1 * * *', async () => { //phút, giờ, ngày, tháng, thứ (CN=0, T2 =1)
    try {
        console.log('🚀 Bắt đầu huấn luyện mô hình Matrix Factorization...');
        await trainMatrixFactorization();
        console.log('✅ Huấn luyện mô hình Matrix Factorization hoàn thành');
    } catch (error) {
        console.error('❌ Lỗi khi huấn luyện mô hình:', error);
    }
});

// Lịch cập nhật ma trận TF-IDF vào 2h sáng thứ Hai hàng tuần
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('🚀 Bắt đầu cập nhật ma trận TF-IDF...');
        await prepareTfIdfMatrix();
        console.log('✅ Cập nhật ma trận TF-IDF hoàn thành');
    } catch (error) {
        console.error('❌ Lỗi khi cập nhật ma trận TF-IDF:', error);
    }
});

// Hàm khởi động cron jobs
const initializeCronJobs = () => {
    console.log('⏰ Cron jobs đã được khởi động');
};

module.exports = { initializeCronJobs };