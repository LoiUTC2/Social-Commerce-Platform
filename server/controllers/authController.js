const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenService = require('../utils/tokenService');

const sendTokenCookies = (res, accessToken, refreshToken) => {
    // Access Token
    res.cookie('accessToken', accessToken, {
      httpOnly: false,
      secure: true, // chỉ nên true nếu dùng https
      sameSite: 'Strict',
      maxAge: 15 * 60 * 1000 // 15 phút
    });
  
    // Refresh Token
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });
  };

exports.register = async (req, res) => {
    try {
        const { fullName, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email đã tồn tại' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ fullName, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Đăng ký thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Email không tồn tại' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Sai mật khẩu' });

        const payload = { userId: user._id, role: user.role };
        const accessToken = tokenService.generateAccessToken(payload);
        const refreshToken = tokenService.generateRefreshToken(payload);

        user.refreshToken = refreshToken;
        await user.save();

        sendTokenCookies(res, accessToken, refreshToken);

        res.json({
            accessToken,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: 'Không có refresh token' });

    try {
        const decoded = tokenService.verifyRefreshToken(token);
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== token)
            return res.status(403).json({ message: 'Refresh token không hợp lệ' });

        // Tạo mới
        const newAccessToken = tokenService.generateAccessToken({ userId: user._id, role: user.role });
        const newRefreshToken = tokenService.generateRefreshToken({ userId: user._id, role: user.role });

        user.refreshToken = newRefreshToken;
        await user.save();

        sendTokenCookies(res, newAccessToken, newRefreshToken);

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ' });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) return res.sendStatus(204); // No content

        const user = await User.findOne({ refreshToken: token });
        if (user) {
            user.refreshToken = null;
            await user.save();
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: true,
            sameSite: 'Strict'
        });

        res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
