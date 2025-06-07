const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const tokenService = require('../utils/tokenService');
const { successResponse, errorResponse } = require('../utils/response');
const Shop = require('../models/Shop');
const UserInteraction = require('../models/UserInteraction');

const sendTokenCookies = (res, accessToken, refreshToken) => {
    // Access Token
    res.cookie('accessToken', accessToken, {
        httpOnly: false, //cookie có thể được truy cập bởi JavaScript trên client.
        secure: true, // chỉ nên true nếu dùng https
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000 // 15 phút
    });

    // Refresh Token
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true, //cookie chỉ có thể được truy cập bởi server và không thể bị truy cập bởi JavaScript trên trình duyệt.
        secure: true,
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 ngày
    });
};

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, gender, dateOfBirth, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return errorResponse(res, 'Email đã tồn tại', 400);

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            gender: gender || "other",
            dateOfBirth,
            phone,
            roles: ['buyer'],
            role: 'buyer',
            ip: req.ip,
            userAgent: req.headers['user-agent'],
        });

        await newUser.save();

        return successResponse(res, 'Đăng ký thành công', {
            userId: newUser._id,
            email: newUser.email,
            fullName: newUser.fullName
        }, 201);
    } catch (err) {
        return errorResponse(res, 'Lỗi server khi đăng ký', 500, err.message);
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const updates = req.body;

        const allowedFields = [
            'fullName',
            'avatar',
            'coverImage',
            'bio',
            'phone',
            'gender',
            'dateOfBirth',
            'address'
        ];

        const sanitizedUpdates = {};
        for (const key of allowedFields) {
            if (updates[key] !== undefined) {
                sanitizedUpdates[key] = updates[key];
            }
        }

        sanitizedUpdates.updatedAt = new Date();

        const updatedUser = await User.findByIdAndUpdate(userId, sanitizedUpdates, { new: true });

        if (!updatedUser) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        const data = {
            _id: updatedUser._id,
            fullName: updatedUser.fullName,
            slug: updatedUser.slug,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            coverImage: updatedUser.coverImage,
            bio: updatedUser.bio,
            phone: updatedUser.phone,
            gender: updatedUser.gender,
            dateOfBirth: updatedUser.dateOfBirth,
            address: updatedUser.address,
            email: updatedUser.email,
            roles: updatedUser.roles,
            role: updatedUser.role,
            shopId: updatedUser.shopId,
        };
        return successResponse(res, 'Cập nhật thông tin cá nhân thành công', data);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi cập nhật thông tin người dùng', 500, err.message);
    }
};

exports.getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.userId;

        const user = await User.findById(userId).select(
            'fullName email avatar coverImage bio phone gender dateOfBirth address role roles currentRole shopId isSellerActive followers following savedPosts likedPosts likedComments createdAt updatedAt'
        ).populate('shopId', 'name avatar slug isApproved');

        if (!user) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        return successResponse(res, 'Lấy thông tin người dùng thành công', user);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thông tin người dùng', 500, err.message);
    }
};

exports.getUserBySlug = async (req, res) => {
    const { slug } = req.params;

    try {
        const user = await User.findOne({ slug })
            .select('-password -refreshToken -refreshTokenUsage -ip -userAgent')
            .populate('shopId', 'name avatar logo coverImage')
            .populate('sellerId')
            .populate('followers', 'fullName avatar')
            .populate('following', 'fullName avatar');

        if (!user) {
            return errorResponse(res, 'Không tìm thấy người dùng', 404);
        }

        return successResponse(res, 'Lấy thông tin người dùng thành công', user);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thông tin người dùng', 500, err.message);
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Email không tồn tại' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Sai mật khẩu' });

        const csrfToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); //Chống CSRF hiệu quả hơn.
        res.cookie('csrfToken', csrfToken, { httpOnly: false, secure: true, sameSite: 'Strict' });

        const payload = { userId: user._id, role: user.role };
        const accessToken = tokenService.generateAccessToken(payload);
        const refreshToken = tokenService.generateRefreshToken(payload);

        // Chuyển hành vi từ sessionId sang author
        const sessionId = req.sessionId;
        const authorType = user.role === 'seller' && user.shopId ? 'Shop' : 'User';
        const authorId = authorType === 'Shop' ? user.shopId : user._id;
        await UserInteraction.updateMany(
            { sessionId, author: { $exists: false } },
            { $set: { author: { type: authorType, _id: authorId } } }
        );

        user.refreshToken = refreshToken;
        user.refreshTokenUsage = 0;
        user.ip = req.ip; // Lưu IP
        user.userAgent = req.headers['user-agent']; // Lưu user-agent
        await user.save();

        sendTokenCookies(res, accessToken, refreshToken);

        // Lấy thông tin của user, coi thử họ đang ở vai trò nào thì đăng nhập vào với thông tin đó
        let actor = null;
        if (user.role === 'seller' && user.shopId) {
            const shop = await Shop.findById(user.shopId).populate('seller');
            if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

            actor = {
                _id: shop._id,
                type: 'shop',
                fullName: shop.name,
                slug: shop.slug,
                avatar: shop.avatar,
                sellerId: shop.seller?._id,
                legalName: shop.seller?.legalName,
                email: shop.contact.email,
                roles: user.roles,
                role: user.role,
                shopId: user.shopId,
            };
        } else {
            actor = {
                _id: user._id,
                type: 'user',
                fullName: user.fullName,
                slug: user.slug,
                avatar: user.avatar,
                email: user.email,
                roles: user.roles,
                role: user.role,
                shopId: user.shopId,
            };
        }

        const data = {
            accessToken,
            user: actor
        };
        successResponse(res, "Đăng nhập thành công.", data)
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    const token = req.cookies.refreshToken || '';
    if (!token) return res.status(403).json({ message: 'Không có refresh token' });

    //Chống CSRF hiệu quả hơn.
    if (req.headers['x-csrf-token'] !== req.cookies.csrfToken) {
        return res.status(403).json({ message: 'CSRF token không hợp lệ' });
    }

    try {
        const decoded = tokenService.verifyRefreshToken(token);
        const user = await User.findById(decoded.userId);
        if (!user || user.refreshToken !== token)
            return res.status(403).json({ message: 'Refresh token không hợp lệ' });

        // Kiểm tra thiết bị
        if (user.ip !== req.ip || user.userAgent !== req.headers['user-agent']) {
            user.refreshToken = null;
            await user.save();
            return res.status(403).json({ message: 'Thiết bị không khớp' });
        }

        user.refreshTokenUsage += 1;
        if (user.refreshTokenUsage > 10) { // Giới hạn 10 lần, Ngăn chặn lạm dụng refresh token nếu bị lộ.
            user.refreshToken = null;
            await user.save();
            return res.status(403).json({ message: 'Refresh token vượt quá số lần sử dụng' });
        }

        // Tạo mới
        const newAccessToken = tokenService.generateAccessToken({ userId: user._id, role: user.role });
        const newRefreshToken = tokenService.generateRefreshToken({ userId: user._id, role: user.role });

        user.refreshToken = newRefreshToken;
        user.ip = req.ip; // Cập nhật IP mới
        user.userAgent = req.headers['user-agent']; // Cập nhật user-agent mới
        await user.save();

        sendTokenCookies(res, newAccessToken, newRefreshToken);

        // Lấy thông tin của user, coi thử họ đang ở vai trò nào thì lấy thông tin đó
        let actor = null;
        if (user.role === 'seller' && user.shopId) {
            const shop = await Shop.findById(user.shopId).populate('seller');
            if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

            actor = {
                _id: shop._id,
                type: 'shop',
                fullName: shop.name,
                slug: shop.slug,
                avatar: shop.avatar,
                sellerId: shop.seller?._id,
                legalName: shop.seller?.legalName,
                email: shop.contact.email,
                roles: user.roles,
                role: user.role,
                shopId: user.shopId,
            };
        } else {
            actor = {
                _id: user._id,
                type: 'user',
                fullName: user.fullName,
                slug: user.slug,
                avatar: user.avatar,
                email: user.email,
                roles: user.roles,
                role: user.role,
                shopId: user.shopId,
            };
        }

        res.json({
            accessToken: newAccessToken,
            user: actor,
        });
        // res.json({accessToken: newAccessToken });
    } catch (err) {
        res.status(403).json({ message: 'Token hết hạn hoặc không hợp lệ' });
    }
};

exports.logout = async (req, res) => {
    //Chống CSRF hiệu quả hơn.
    if (req.headers['x-csrf-token'] !== req.cookies.csrfToken) {
        return res.status(403).json({ message: 'CSRF token không hợp lệ' });
    }

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
        res.clearCookie('accessToken', {
            httpOnly: false,
            secure: true,
            sameSite: 'Strict'
        });
        res.clearCookie('csrfToken', {
            httpOnly: false,
            secure: true,
            sameSite: 'Strict'
        });

        res.status(200).json({ message: 'Đăng xuất thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};
