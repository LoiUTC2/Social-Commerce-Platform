const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database'); 
const cookieParser = require('cookie-parser');

const app = express();

// app.use(cors());
app.use(cors({
  origin: 'http://localhost:3000', // địa chỉ frontend
  credentials: true, // QUAN TRỌNG để gửi cookie
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/authRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const postRoutes = require('./routes/postRoutes');
const socialRoutes = require('./routes/postInteractionRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const productRoutes = require('./routes/productRoutes')
const categoryRoutes = require('./routes/categoryRoutes')
const shopRoutes = require('./routes/shopRoutes')
const sellerRoutes = require('./routes/sellerRoutes')
const cartRoutes = require('./routes/cartRoutes')
const orderRoutes = require('./routes/orderRoutes')
const productReviewRoutes = require('./routes/productReviewRoutes')
const shopReviewRoutes = require('./routes/shopReviewRoutes')

const shopManagerRoutes = require('./routes/shopManagerRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');

const searchRoutes = require('./routes/searchRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/postInteraction', socialRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/sellers', sellerRoutes);
app.use('/api/carts', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/product-reviews', productReviewRoutes);
app.use('/api/shop-reviews', shopReviewRoutes);

app.use('/api/admin/shops', shopManagerRoutes); //quản lí duyệt shop đăng kí
app.use('/api/admin/products', adminProductRoutes); //quản lí sản phẩm nền tảng


app.use('/api/search', searchRoutes);

app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static('uploads')); // phục vụ file tĩnh


// Gọi hàm kết nối MongoDB
connectDB().then(() => {
  app.listen(5000, () => {
    console.log('🚀 Server started on port 5000');
  });
});