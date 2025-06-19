const express = require('express');
const http = require('http');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database');
const cookieParser = require('cookie-parser');
const { initializeCronJobs } = require('./services/cronJobs');
const SocketHandler = require('./socket/socketHandler');

const app = express();

const server = http.createServer(app);

// Kết nối database trước khi khởi động server
connectDB();

const socketHandler = new SocketHandler(server);

app.locals.socketHandler = socketHandler

// app.use(cors());
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'], // Mảng các địa chỉ được phép
  credentials: true, // QUAN TRỌNG để gửi cookie
}));

// Các middleware xử lý request
app.use(express.json()); // Cho JSON data
app.use(express.urlencoded({ extended: true })); // Cho form data
app.use(cookieParser());

// Cấu hình session
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: true,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions'
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 24 giờ
    secure: process.env.NODE_ENV === 'production', // Chỉ dùng secure trong production
    sameSite: 'strict'
  }
}));

// Middleware để gán sessionId cho req
app.use((req, res, next) => {
  req.sessionId = req.sessionID; // Lưu sessionId vào req để sử dụng
  next();
});

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
const searchRoutes = require('./routes/searchRoutes');
const hashtagsRoutes = require('./routes/hashtagsRouter')
const savedPostRoutes = require('./routes/savedPostRoutes');
const followRoutes = require('./routes/followRoutes');
const recommendationRoutes = require('./routes/recommendationRoutes');
const flashSaleRoutes = require('./routes/flashSaleRoutes');


const adminPostRoutes = require('./routes/adminPostRoutes');
const adminProductRoutes = require('./routes/adminProductRoutes');
const adminUserRoutes = require('./routes/adminUserRoutes');
const adminShopRoutes = require('./routes/adminShopRoutes');
const adminFlashSaleRoutes = require('./routes/adminFlashSaleRoutes');


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
app.use('/api/search', searchRoutes);
app.use('/api/hashtags', hashtagsRoutes);
app.use('/api/saved-posts', savedPostRoutes);
app.use('/api/follow', followRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/flash-sales', flashSaleRoutes);

app.use('/api/admin/posts', adminPostRoutes); //quản lí bài viết nền tảng
app.use('/api/admin/products', adminProductRoutes); //quản lí sản phẩm nền tảng
app.use('/api/admin/users', adminUserRoutes); //quản lí người dùng (user/shop) nền tảng
app.use('/api/admin/shops', adminShopRoutes); //quản lí duyệt shop đăng kí
app.use('/api/admin/flash-sales', adminFlashSaleRoutes); //quản lí flashsale nền tảng

app.use('/api/upload', uploadRoutes);
app.use('/uploads', express.static('uploads')); // phục vụ file tĩnh

// Khởi động cron jobs
initializeCronJobs();

// Khởi động server
// app.listen(5000, () => {
//   console.log('🚀 Server started on port 5000');
// });

server.listen(5000, () => {
  console.log('🚀 Server started on port 5000');
});