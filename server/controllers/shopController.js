const Shop = require('../models/Shop');
const User = require('../models/User');
const Seller = require('../models/Seller');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const mongoose = require('mongoose');
const slugify = require('slugify');

//Chuyển đổi tài khoản, seller hoặc buyer
exports.switchUserRole = async (req, res) => {
    const userId = req.user.userId;

    try {
        const user = await User.findById(userId);
        if (!user) return errorResponse(res, 'Không tìm thấy người dùng', 404);

        const targetRole = user.role === 'buyer' ? 'seller' : 'buyer';

        // Kiểm tra user có quyền đó không
        if (!user.roles.includes(targetRole)) {
            return errorResponse(res, `Bạn chưa có quyền chuyển sang ${targetRole}`, 403);
        }

        user.role = targetRole;
        await user.save();

        const userData = {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                roles: user.roles,
                role: user.role,
                shopId: user.shopId,
                isSellerActive: user.isSellerActive,     
        };

        return successResponse(res, `Chuyển sang vai trò ${targetRole} thành công`, userData);
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

        // Tìm hoặc tạo thông tin seller
        let seller = await Seller.findOne({ user: userId });
        if (!seller) {
            seller = new Seller({
                user: userId,
                status: 'active'
            });
            await seller.save();
        }

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
            tags 
        } = req.body;

        // Tạo slug từ tên shop
        const slug = slugify(name, { 
            lower: true,
            strict: true
        });

        // Kiểm tra slug đã tồn tại chưa
        const slugExists = await Shop.findOne({ slug });
        if (slugExists) {
            return errorResponse(res, 'Tên shop đã được sử dụng, vui lòng chọn tên khác', 400);
        }

        const newShop = new Shop({
            owner: userId,
            seller: seller._id,
            name,
            slug,
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
            tags,
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

        return successResponse(res, 'Tạo shop thành công, vui lòng chờ admin duyệt', savedShop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi tạo shop', 500, error.message);
    }
};

// Cập nhật thông tin shop (phải là chủ shop)
exports.updateShop = async (req, res) => {
    try {
        const userId = req.user.userId;
        const shop = await Shop.findOne({ owner: userId });
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
            tags 
        } = req.body;

        // Nếu có thay đổi tên shop, cần cập nhật lại slug
        if (name && name !== shop.name) {
            const newSlug = slugify(name, { 
                lower: true,
                strict: true
            });
            
            // Kiểm tra slug mới đã tồn tại chưa (nếu khác với slug hiện tại)
            if (newSlug !== shop.slug) {
                const slugExists = await Shop.findOne({ slug: newSlug });
                if (slugExists) {
                    return errorResponse(res, 'Tên shop đã được sử dụng, vui lòng chọn tên khác', 400);
                }
                shop.slug = newSlug;
            }
            shop.name = name;
        }

        // Cập nhật các thông tin khác
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
        if (tags !== undefined) shop.tags = tags;

        shop.updatedAt = new Date();

        const updatedShop = await shop.save();

        return successResponse(res, 'Cập nhật shop thành công', updatedShop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật shop', 500, error.message);
    }
};

// Cập nhật trạng thái hoạt động của shop (chỉ seller có quyền)
exports.toggleShopActiveStatus = async (req, res) => {
    try {
        const userId = req.user.userId;
        const shop = await Shop.findOne({ owner: userId });
        
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
        const userId = req.user.userId;
        const { reason } = req.body; // Lý do xóa shop
        
        const shop = await Shop.findOne({ owner: userId });
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
    const userId = req.user.userId;

    try {
        const shop = await Shop.findById(shopId);
        if (!shop || !shop.status.isActive || !shop.status.isApprovedCreate) {
            return errorResponse(res, 'Cửa hàng không tồn tại hoặc chưa được duyệt', 404);
        }

         // Kiểm tra xem đã follow shop chưa
        const isFollowing = shop.stats.followers.includes(userId);

        if (isFollowing) {
            // Hủy theo dõi
            shop.stats.followers.pull(userId);
            await shop.save();

            // Ghi lại tương tác người dùng
            await UserInteraction.create({
                userId,
                targetType: 'shop',
                targetId: shopId,
                action: 'unfollow',
                timestamp: new Date()
            });

            return successResponse(res, 'Đã hủy theo dõi shop', null);
        } else {
            // Theo dõi
            shop.stats.followers.push(userId);
            await shop.save();

            // Ghi lại tương tác người dùng
            await UserInteraction.create({
                userId,
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

// Lấy thông tin shop theo ID
exports.getShopById = async (req, res) => {
    const { shopId } = req.params;
    const userId = req.user?.userId || null;

    try {
        const shop = await Shop.findOne({ 
            _id: shopId, 
            'status.isApprovedCreate': true 
        }).populate('owner', 'fullName avatar');

        if (!shop) {
            return errorResponse(res, 'Cửa hàng không tồn tại hoặc chưa được duyệt', 404);
        }

        // Tăng lượt xem cho shop
        shop.stats.views += 1;
        await shop.save();

        // Ghi lại hành vi xem shop để AI học (nếu đã đăng nhập)
        if (userId) {
            await UserInteraction.create({
                userId,
                targetType: 'shop',
                targetId: shop._id,
                action: 'view',
                metadata: { source: 'shop_detail' },
                timestamp: new Date()
            });
        }

        return successResponse(res, 'Lấy thông tin cửa hàng thành công', shop);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy thông tin cửa hàng', 500, err.message);
    }
};

// Lấy thông tin shop của người dùng hiện tại
exports.getMyShop = async (req, res) => {
    const userId = req.user.userId;

    try {
        const shop = await Shop.findOne({ owner: userId });
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
            .select('name slug avatar logo description stats tags status')
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
        const userId = req.user.userId;
        const { page = 1, limit = 10 } = req.query;
        
        const query = { 
            'stats.followers': userId,
            'status.isApprovedCreate': true
        };
        
        const total = await Shop.countDocuments(query);
        
        const followedShops = await Shop.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .select('name slug avatar logo description stats tags status');

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