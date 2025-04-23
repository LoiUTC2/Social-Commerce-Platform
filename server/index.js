const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/database'); 
const cookieParser = require('cookie-parser');

const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/authRoutes');
const interactionRoutes = require('./routes/interactionRoutes');
const postRoutes = require('./routes/postRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/interactions', interactionRoutes);
app.use('/api/posts', postRoutes);


// Gọi hàm kết nối MongoDB
connectDB().then(() => {
  app.listen(5000, () => {
    console.log('🚀 Server started on port 5000');
  });
});