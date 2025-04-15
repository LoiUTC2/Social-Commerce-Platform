const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./database'); // <-- import hàm kết nối

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Gọi hàm kết nối MongoDB
connectDB().then(() => {
  app.listen(5000, () => {
    console.log('🚀 Server started on port 5000');
  });
});