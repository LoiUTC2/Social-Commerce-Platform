const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Cấu hình connection options tối ưu cho Mongoose phiên bản mới
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // Timeout settings
      serverSelectionTimeoutMS: 30000, // 30 giây
      socketTimeoutMS: 45000, // 45 giây
      connectTimeoutMS: 30000, // 30 giây
      
      // Connection pool settings
      maxPoolSize: 10, // Giới hạn connection pool
      minPoolSize: 5,
      maxIdleTimeMS: 30000,
      
      // Retry settings
      retryWrites: true,
      retryReads: true,
      
      // Heartbeat settings
      heartbeatFrequencyMS: 10000, // 10 giây
      
      // Tắt buffering (sử dụng cú pháp đúng)
      bufferCommands: false,
      
      // Các tùy chọn khác
      autoCreate: true, // Tự động tạo collection
      autoIndex: true, // Tự động tạo index
    };

    const conn = await mongoose.connect(process.env.MONGO_URI, options);

    console.log(`✅ MongoDB connected successfully to: ${conn.connection.host}`);

    // Xử lý các events
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
      // Có thể thêm logic reconnect ở đây nếu cần
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    mongoose.connection.on('connecting', () => {
      console.log('🔄 MongoDB connecting...');
    });

    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      try {
        await mongoose.connection.close();
        console.log('🔒 MongoDB connection closed through app termination');
        process.exit(0);
      } catch (err) {
        console.error('❌ Error during MongoDB shutdown:', err);
        process.exit(1);
      }
    });

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);

    // Retry connection sau 5 giây
    console.log('🔄 Retrying connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

module.exports = connectDB;