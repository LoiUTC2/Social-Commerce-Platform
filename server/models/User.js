const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: String,
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  avatar: String,
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  refreshToken: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
