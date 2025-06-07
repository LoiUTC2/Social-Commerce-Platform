const Shop = require('../models/Shop');
const User = require('../models/User');
const Seller = require('../models/Seller');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const mongoose = require('mongoose');
const slugify = require('slugify');
const tokenService = require('../utils/tokenService');
const Hashtag = require('../models/Hashtags');

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

//Thêm hoặc sửa hashtags
async function handleHashtagsUpdate(shopId, hashtags = [], createdById) {
    for (const rawTag of hashtags) {
        const tagName = rawTag.trim().toLowerCase();
        if (!tagName) continue;

        const hashtag = await Hashtag.findOneAndUpdate(
            { name: tagName },
            {
                $setOnInsert: {
                    name: tagName,
                    createdBy: createdById,
                    createdByModel: "User"
                },
                $addToSet: { shops: shopId },
                $set: { lastUsedAt: new Date() },
                $inc: { usageCount: 1 }
            },
            { upsert: true, new: true }
        );
    }
}

//Chuyển đổi tài khoản, seller hoặc buyer
exports.switchUserRole = async (req, res) => {
    try {
        const userId = req.user.userId;
        const sessionId = req.sessionId;

        const user = await User.findById(userId);
        if (!user) return errorResponse(res, 'Không tìm thấy người dùng', 404);

        const targetRole = user.role === 'buyer' ? 'seller' : 'buyer';

        // Kiểm tra user có quyền đó không
        if (!user.roles.includes(targetRole)) {
            return errorResponse(res, `Bạn chưa có quyền chuyển sang ${targetRole}`, 403);
        }

        // Cập nhật author trong UserInteraction
        const authorType = targetRole === 'seller' && user.shopId ? 'Shop' : 'User';
        const authorId = authorType === 'Shop' ? user.shopId : user._id;
        await UserInteraction.updateMany(
            { sessionId, author: { $exists: false } },
            { $set: { author: { type: authorType, _id: authorId } } }
        );

        // Tạo token mới với role mới
        const payload = { userId: user._id, role: targetRole };
        const newAccessToken = tokenService.generateAccessToken(payload);
        const newRefreshToken = tokenService.generateRefreshToken(payload);

        // Cập nhật refresh token trong DB
        user.refreshToken = newRefreshToken;
        user.refreshTokenUsage = 0; // Reset usage count
        user.role = targetRole;
        await user.save();

        // Gửi token mới qua cookies
        sendTokenCookies(res, newAccessToken, newRefreshToken);

        let actor = null;
        if (targetRole === 'seller' && user.shopId) {
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
            accessToken: newAccessToken,
            user: actor,
            previousRole: user.role === 'buyer' ? 'seller' : 'buyer', // Role trước đó
            currentRole: targetRole,
            message: `Đã chuyển từ ${targetRole === 'seller' ? 'Người mua' : 'Người bán'} sang ${targetRole === 'seller' ? 'Người bán' : 'Người mua'}`,
            success: true,
        };

        return successResponse(res, `Chuyển sang vai trò ${targetRole} thành công`, data);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi chuyển vai trò', 500, err.message);
    }
};

// Tạo shop mới (chưa duyệt), trạng thái chờ admin duyệt
exports.createShop = async (req, res) => {
    try {
        const userId = req.user.userId;
        const existingUser = await User.findById(userId);
        if (!existingUser) return errorResponse(res, 'Người dùng không tồn tại', 404);

        if (existingUser.shopId) return errorResponse(res, 'Bạn đã đăng ký shop rồi', 400);

        // Kiểm tra user đã có shop chưa
        const existingShop = await Shop.findOne({ owner: userId });
        if (existingShop) return errorResponse(res, 'Bạn đã tạo yêu cầu mở shop trước đó, đang đợi duyệt', 400);

        const {
            name,
            description,
            avatar,
            logo,
            coverImage,
            contact,
            customerSupport,
            businessInfo,
            operations,
            productInfo,
            seo,
            hashtags
        } = req.body;

        const newShop = new Shop({
            owner: userId,
            name,
            description,
            avatar,
            logo,
            coverImage,
            contact,
            customerSupport,
            businessInfo,
            operations,
            productInfo,
            seo,
            hashtags,
            status: {
                isActive: true,
                isApprovedCreate: false,
                approvalCreateStatus: 'pending',
                featureLevel: 'normal'
            }
        });

        const savedShop = await newShop.save();

        // Cập nhật user
        existingUser.shopId = savedShop._id;
        await existingUser.save();

        await handleHashtagsUpdate(savedShop._id, req.body.hashtags, userId);

        return successResponse(res, 'Tạo shop thành công, vui lòng chờ admin duyệt', savedShop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi tạo shop', 500, error.message);
    }
};

// Cập nhật thông tin shop (phải là chủ shop)
exports.updateShop = async (req, res) => {
    try {
        // const userId = req.user.userId;
        const sellerId = req.actor._id.toString();
        const shop = await Shop.findOne({ _id: sellerId });
        if (!shop) return errorResponse(res, 'Bạn chưa có shop', 404);

        const {
            name,
            description,
            avatar,
            logo,
            coverImage,
            contact,
            customerSupport,
            businessInfo,
            operations,
            productInfo,
            seo,
            hashtags
        } = req.body;

        // Cập nhật các thông tin khác
        if (name !== undefined) shop.name = name;
        if (description !== undefined) shop.description = description;
        if (avatar !== undefined) shop.avatar = avatar;
        if (logo !== undefined) shop.logo = logo;
        if (coverImage !== undefined) shop.coverImage = coverImage;
        if (contact !== undefined) shop.contact = contact;
        if (customerSupport !== undefined) shop.customerSupport = customerSupport;
        if (businessInfo !== undefined) shop.businessInfo = businessInfo;
        if (operations !== undefined) shop.operations = operations;
        if (productInfo !== undefined) shop.productInfo = productInfo;
        if (seo !== undefined) shop.seo = seo;
        if (hashtags !== undefined) shop.hashtags = hashtags;

        shop.updatedAt = new Date();

        const updatedShop = await shop.save();

        // Populate thông tin danh mục sau khi lưu
        const populatedShop = await Shop.findById(updatedShop._id)
            .populate('owner', 'fullName avatar coverImage email phone')
            .populate('seller')
            .populate('productInfo.mainCategory', 'name slug description icon level')
            .populate('productInfo.subCategories', 'name slug description icon level')
            .populate('stats.followers', 'fullName avatar');

        if (updatedShop.hashtags) {
            await handleHashtagsUpdate(updatedShop._id, updatedShop.hashtags, sellerId);
        }

        return successResponse(res, 'Cập nhật shop thành công', populatedShop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật shop', 500, error.message);
    }
};

// Cập nhật trạng thái hoạt động của shop (chỉ seller có quyền)
exports.toggleShopActiveStatus = async (req, res) => {
    try {
        // const userId = req.user.userId;
        const sellerId = req.actor._id.toString();
        const shop = await Shop.findOne({ _id: sellerId });

        if (!shop) return errorResponse(res, 'Bạn chưa có shop', 404);
        if (shop.status.approvalCreateStatus !== 'approved')
            return errorResponse(res, 'Shop chưa được duyệt, không thể thay đổi trạng thái', 400);

        // Đảo ngược trạng thái hiện tại
        shop.status.isActive = !shop.status.isActive;
        shop.updatedAt = new Date();

        await shop.save();

        const statusMessage = shop.status.isActive ? 'hoạt động' : 'tạm ngưng';
        return successResponse(res, `Shop đã được chuyển sang trạng thái ${statusMessage}`, shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi thay đổi trạng thái shop', 500, error.message);
    }
};

// Tạo yêu cầu xóa shop (chỉ seller có quyền)
exports.requestDeleteShop = async (req, res) => {
    try {
        // const userId = req.user.userId;
        const sellerId = req.actor._id.toString();
        const { reason } = req.body; // Lý do xóa shop

        const shop = await Shop.findOne({ _id: sellerId });
        if (!shop) return errorResponse(res, 'Bạn chưa có shop', 404);

        if (shop.status.approvalDeleteStatus === 'pending') {
            return errorResponse(res, 'Bạn đã gửi yêu cầu xóa shop trước đó, đang chờ xét duyệt', 400);
        }

        // Cập nhật trạng thái yêu cầu xóa shop
        shop.status.approvalDeleteStatus = 'pending';
        shop.status.deleteNote = reason || '';
        shop.updatedAt = new Date();

        await shop.save();

        return successResponse(res, 'Đã gửi yêu cầu xóa shop, vui lòng chờ admin duyệt', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi gửi yêu cầu xóa shop', 500, error.message);
    }
};

//Follow hoặc UnFollow
exports.toggleFollowShop = async (req, res) => {
    const shopId = req.params.shopId;
    // const userId = req.user.userId;
    const actorId = req.actor._id.toString();

    try {
        const shop = await Shop.findById(shopId);
        if (!shop || !shop.status.isActive || !shop.status.isApprovedCreate) {
            return errorResponse(res, 'Cửa hàng không tồn tại hoặc chưa được duyệt', 404);
        }

        // Kiểm tra xem đã follow shop chưa
        const isFollowing = shop.stats.followers.includes(actorId);

        if (isFollowing) {
            // Hủy theo dõi
            shop.stats.followers.pull(actorId);
            await shop.save();

            // Ghi lại tương tác người dùng
            await UserInteraction.create({
                author: {
                    type: req.actor.type === "seller" ? "Shop" : "User",
                    _id: actorId
                },
                targetType: 'shop',
                targetId: shopId,
                action: 'unfollow',
                timestamp: new Date()
            });

            return successResponse(res, 'Đã hủy theo dõi shop', null);
        } else {
            // Theo dõi
            shop.stats.followers.push(actorId);
            await shop.save();

            // Ghi lại tương tác người dùng
            await UserInteraction.create({
                author: {
                    type: req.actor.type === "seller" ? "Shop" : "User",
                    _id: actorId
                },
                targetType: 'shop',
                targetId: shopId,
                action: 'follow',
                timestamp: new Date()
            });

            return successResponse(res, 'Đã theo dõi shop', null);
        }
    } catch (err) {
        return errorResponse(res, 'Lỗi hệ thống khi theo dõi/hủy theo dõi', 500, err.message);
    }
};

// Lấy thông tin shop theo Slug
exports.getShopBySlug = async (req, res) => {
    const { slug } = req.params;

    try {
        const shop = await Shop.findOne({ slug, 'status.isApprovedCreate': true })
            .populate('owner', 'fullName avatar coverImage email phone')
            .populate('seller')
            .populate('productInfo.mainCategory', 'name')
            .populate('productInfo.subCategories', 'name')
            .populate('stats.followers', 'fullName avatar');

        if (!shop) {
            return errorResponse(res, 'Cửa hàng không tồn tại hoặc chưa được duyệt', 404);
        }

        // Tăng lượt xem cho shop
        shop.stats.views += 1;
        await shop.save();

        return successResponse(res, 'Lấy thông tin cửa hàng thành công', shop);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thông tin cửa hàng', 500, err.message);
    }
};

// Lấy thông tin shop của người dùng hiện tại
exports.getMyShop = async (req, res) => {
    const sellerId = req.actor._id.toString(); //này thực chất là shopID

    try {
        const shop = await Shop.findOne({ _id: sellerId })
            .populate('owner', 'fullName avatar coverImage email phone')
            .populate('seller')
            .populate('productInfo.mainCategory', 'name slug description icon level')
            .populate('productInfo.subCategories', 'name slug description icon level')
            .populate('stats.followers', 'fullName avatar');
        if (!shop) {
            return errorResponse(res, 'Bạn chưa có shop', 404);
        }

        return successResponse(res, 'Lấy thông tin shop thành công', shop);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thông tin shop', 500, err.message);
    }
};

// Lấy danh sách shop (sắp xếp theo đánh giá, lượt theo dõi, lượt xem)
exports.getShops = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc',
            search = '',
            category,
            status
        } = req.query;

        const query = {
            'status.isApprovedCreate': true
        };

        // Thêm điều kiện lọc theo trạng thái hoạt động
        if (status === 'active') {
            query['status.isActive'] = true;
        } else if (status === 'inactive') {
            query['status.isActive'] = false;
        }

        // Thêm điều kiện tìm kiếm
        if (search) {
            query.$text = { $search: search };
        }

        // Thêm điều kiện lọc theo danh mục
        if (category) {
            query['productInfo.mainCategory'] = new mongoose.Types.ObjectId(category);
        }

        // Xác định trường sắp xếp
        let sortOption = {};
        if (sortBy === 'rating') {
            sortOption = { 'stats.rating.avg': order === 'asc' ? 1 : -1 };
        } else if (sortBy === 'followers') {
            sortOption = { 'stats.followers': order === 'asc' ? 1 : -1 };
        } else if (sortBy === 'views') {
            sortOption = { 'stats.views': order === 'asc' ? 1 : -1 };
        } else if (sortBy === 'orders') {
            sortOption = { 'stats.orderCount': order === 'asc' ? 1 : -1 };
        } else if (sortBy === 'revenue') {
            sortOption = { 'stats.revenue': order === 'asc' ? 1 : -1 };
        } else {
            sortOption = { [sortBy]: order === 'asc' ? 1 : -1 };
        }

        // Đếm tổng số shop thỏa mãn điều kiện
        const total = await Shop.countDocuments(query);

        // Lấy danh sách shop
        const shops = await Shop.find(query)
            .sort(sortOption)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('name slug avatar logo description stats hashtags status')
            .populate('owner', 'fullName avatar');

        return successResponse(res, 'Lấy danh sách shop thành công', {
            shops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop', 500, err.message);
    }
};

// Xác thực quyền sở hữu shop
exports.isShopOwner = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { shopId } = req.params;

        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        const isOwner = shop.owner.toString() === userId;

        return successResponse(res, 'Kiểm tra quyền sở hữu shop thành công', { isOwner });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi kiểm tra quyền sở hữu shop', 500, error.message);
    }
};

// Xem danh sách shop đã theo dõi
exports.getFollowedShops = async (req, res) => {
    try {
        // const userId = req.user.userId;
        const actorId = req.actor._id.toString();
        const { page = 1, limit = 10 } = req.query;

        const query = {
            'stats.followers': actorId,
            'status.isApprovedCreate': true
        };

        const total = await Shop.countDocuments(query);

        const followedShops = await Shop.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('name slug avatar logo description stats hashtags status');

        return successResponse(res, 'Lấy danh sách shop đã theo dõi thành công', {
            shops: followedShops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop đã theo dõi', 500, error.message);
    }
};