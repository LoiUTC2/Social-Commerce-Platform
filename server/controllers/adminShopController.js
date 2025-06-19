const Shop = require('../models/Shop');
const User = require('../models/User');
const Product = require('../models/Product');
const Post = require('../models/Post');
const { successResponse, errorResponse } = require('../utils/response');

// Duyệt tạo shop 
exports.approveCreateShop = async (req, res) => {
    const { shopId } = req.params;
    const { createNote } = req.body;

    try {
        // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Kiểm tra trạng thái
        if (shop.status.isApprovedCreate)
            return errorResponse(res, 'Shop đã được duyệt trước đó', 400);
        if (shop.status.approvalCreateStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt', 400);

        // Tìm chủ shop
        const ownerUser = await User.findById(shop.owner);
        if (!ownerUser) return errorResponse(res, 'Không tìm thấy người dùng sở hữu shop', 404);

        // Cập nhật thông tin shop
        shop.status.isApprovedCreate = true;
        shop.status.approvalCreateStatus = "approved";
        shop.status.createNote = createNote || 'Đã duyệt';
        shop.updatedAt = new Date();
        await shop.save();

        // Cập nhật user
        ownerUser.roles.push('seller');
        await ownerUser.save();

        return successResponse(res, 'Đã duyệt shop thành công', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi duyệt shop', 500, error.message);
    }
};

// Từ chối tạo shop 
exports.rejectCreateShop = async (req, res) => {
    const { shopId } = req.params;
    const { createNote } = req.body;
    try {
        // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Kiểm tra trạng thái
        if (shop.status.approvalCreateStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt', 400);

        // Cập nhật thông tin shop
        shop.status.isApprovedCreate = false;
        shop.status.approvalCreateStatus = "rejected";
        shop.status.createNote = createNote || 'Không đạt yêu cầu';
        shop.updatedAt = new Date();
        await shop.save();

        // Cập nhật thông tin user
        await User.findByIdAndUpdate(shop.owner, { $set: { shopId: null } });

        return successResponse(res, 'Đã từ chối tạo shop thành công', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi từ chối tạo shop', 500, error.message);
    }
};

// Duyệt xóa shop 
exports.approveDeleteShop = async (req, res) => {
    const { shopId } = req.params;
    const { deleteNote } = req.body;

    try {
        // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Kiểm tra trạng thái
        if (shop.status.approvalDeleteStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt xóa', 400);

        // Tìm chủ shop
        const ownerUser = await User.findById(shop.owner);
        if (!ownerUser) return errorResponse(res, 'Không tìm thấy người dùng sở hữu shop', 404);

        // Cập nhật trạng thái shop trước khi xóa
        shop.status.isApprovedDelete = true;
        shop.status.approvalDeleteStatus = "approved";
        shop.status.deleteNote = deleteNote || 'Đã duyệt xóa';
        shop.updatedAt = new Date();
        await shop.save();

        // Cập nhật thông tin người dùng
        ownerUser.shopId = null;
        ownerUser.role = 'buyer';
        ownerUser.isSellerActive = false;

        // Loại bỏ vai trò seller nếu có
        if (ownerUser.roles.includes('seller')) {
            ownerUser.roles = ownerUser.roles.filter(role => role !== 'seller');
        }

        await ownerUser.save();

        // Xóa shop khỏi hệ thống
        await Shop.deleteOne({ _id: shopId });

        return successResponse(res, 'Đã duyệt xóa shop và xóa shop khỏi nền tảng thành công', { shopId: shopId });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi duyệt xóa shop', 500, error.message);
    }
};

// Từ chối xóa shop 
exports.rejectDeleteShop = async (req, res) => {
    const { shopId } = req.params;
    const { deleteNote } = req.body;
    try {
        // Tìm shop
        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Kiểm tra trạng thái
        if (shop.status.approvalDeleteStatus !== 'pending')
            return errorResponse(res, 'Shop không trong trạng thái chờ duyệt xóa', 400);

        // Cập nhật thông tin shop
        shop.status.isApprovedDelete = false;
        shop.status.approvalDeleteStatus = "rejected";
        shop.status.deleteNote = deleteNote || 'Từ chối xóa shop';
        shop.updatedAt = new Date();
        await shop.save();

        return successResponse(res, 'Đã từ chối xóa shop khỏi nền tảng', shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi từ chối xóa shop', 500, error.message);
    }
};

// Lấy danh sách tất cả shop, có thể lọc theo trạng thái duyệt
exports.getAllShops = async (req, res) => {
    try {
        const {
            createStatus, // pending | approved | rejected
            deleteStatus, // pending | approved | rejected
            featureLevel, // normal | premium | vip
            page = 1,
            limit = 10
        } = req.query;

        const filter = {}; //ví dụ filter sẽ lưu như này: filter = { 'status.approvalCreateStatus': 'approved' }, nó sẽ lấy ra thế này: 'status.approvalCreateStatus': 'approved'

        // Lọc theo trạng thái duyệt tạo shop
        if (['pending', 'approved', 'rejected'].includes(createStatus)) {
            filter['status.approvalCreateStatus'] = createStatus;
        }

        // Lọc theo trạng thái duyệt xóa shop
        if (['pending', 'approved', 'rejected'].includes(deleteStatus)) {
            filter['status.approvalDeleteStatus'] = deleteStatus;
        }

        // Lọc theo cấp độ đặc quyền
        if (['normal', 'premium', 'vip'].includes(featureLevel)) {
            filter['status.featureLevel'] = featureLevel;
        }

        // Đếm tổng số shop thỏa điều kiện
        const total = await Shop.countDocuments(filter);

        // Lấy danh sách shop
        const shops = await Shop.find(filter)
            .populate('owner', 'fullName email avatar')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        return successResponse(res, 'Lấy danh sách shop thành công', {
            shops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop', 500, error.message);
    }
};

// Lấy danh sách shop đang chờ duyệt tạo
exports.getPendingCreateShops = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = { 'status.approvalCreateStatus': 'pending' };
        const total = await Shop.countDocuments(query);

        const pendingShops = await Shop.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('owner', 'fullName email avatar');

        return successResponse(res, 'Lấy danh sách shop đang chờ duyệt tạo thành công', {
            shops: pendingShops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop đang chờ duyệt tạo', 500, err.message);
    }
};

// Lấy danh sách shop đang chờ duyệt xóa
exports.getPendingDeleteShops = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const query = { 'status.approvalDeleteStatus': 'pending' };
        const total = await Shop.countDocuments(query);

        const pendingDeleteShops = await Shop.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .populate('owner', 'fullName email avatar');

        return successResponse(res, 'Lấy danh sách shop đang chờ duyệt xóa thành công', {
            shops: pendingDeleteShops,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop đang chờ duyệt xóa', 500, err.message);
    }
};


// Lấy tất cả shop với thông tin đầy đủ để quản lý
exports.getAllShopsForManagement = async (req, res) => {
    try {
        const {
            status = 'all', // all, active, inactive
            featureLevel, // normal, premium, vip
            isApproved, // true, false
            search, // tìm kiếm theo tên shop hoặc email owner
            sortBy = 'createdAt', // createdAt, name, revenue, rating
            sortOrder = 'desc', // asc, desc
            page = 1,
            limit = 20
        } = req.query;

        const filter = {};

        // Lọc theo trạng thái hoạt động
        if (status === 'active') filter['status.isActive'] = true;
        else if (status === 'inactive') filter['status.isActive'] = false;

        // Lọc theo cấp độ đặc quyền
        if (['normal', 'premium', 'vip'].includes(featureLevel)) {
            filter['status.featureLevel'] = featureLevel;
        }

        // Lọc theo trạng thái duyệt
        if (isApproved === 'true') filter['status.isApprovedCreate'] = true;
        else if (isApproved === 'false') filter['status.isApprovedCreate'] = false;

        // Tìm kiếm theo tên shop
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }

        // Xây dựng sort object
        const sortOptions = {};
        if (sortBy === 'name') sortOptions.name = sortOrder === 'asc' ? 1 : -1;
        else if (sortBy === 'revenue') sortOptions['stats.revenue'] = sortOrder === 'asc' ? 1 : -1;
        else if (sortBy === 'rating') sortOptions['stats.rating.avg'] = sortOrder === 'asc' ? 1 : -1;
        else sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;

        // Đếm tổng số shop
        const total = await Shop.countDocuments(filter);

        // Lấy danh sách shop với thông tin đầy đủ
        const shops = await Shop.find(filter)
            .populate({
                path: 'owner',
                select: 'fullName email avatar phone roles role isActive createdAt',
                populate: {
                    path: 'sellerId',
                    select: 'legalName businessType verificationStatus'
                }
            })
            .populate('productInfo.mainCategory', 'name slug')
            .populate('productInfo.subCategories', 'name slug')
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .lean();

        // Thêm thống kê cho mỗi shop
        const shopsWithStats = await Promise.all(shops.map(async (shop) => {
            // Đếm số sản phẩm
            const productCount = await Product.countDocuments({
                seller: shop._id,
                isActive: true
            });

            // Đếm số bài viết
            const postCount = await Post.countDocuments({
                'author.type': 'Shop',
                'author._id': shop._id
            });

            return {
                ...shop,
                additionalStats: {
                    productCount,
                    postCount,
                    followersCount: shop.stats.followers?.length || 0
                }
            };
        }));

        return successResponse(res, 'Lấy danh sách shop để quản lý thành công', {
            shops: shopsWithStats,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit)
            },
            filters: {
                status,
                featureLevel,
                isApproved,
                search,
                sortBy,
                sortOrder
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh sách shop để quản lý', 500, error.message);
    }
};

// Lấy thống kê tổng quan về shops
exports.getShopsOverview = async (req, res) => {
    try {
        // Thống kê tổng số shop
        const totalShops = await Shop.countDocuments();
        const activeShops = await Shop.countDocuments({ 'status.isActive': true });
        const pendingApproval = await Shop.countDocuments({ 'status.approvalCreateStatus': 'pending' });
        const approvedShops = await Shop.countDocuments({ 'status.isApprovedCreate': true });

        // Thống kê theo cấp độ
        const normalShops = await Shop.countDocuments({ 'status.featureLevel': 'normal' });
        const premiumShops = await Shop.countDocuments({ 'status.featureLevel': 'premium' });
        const vipShops = await Shop.countDocuments({ 'status.featureLevel': 'vip' });

        // Thống kê theo tháng
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const newShopsThisMonth = await Shop.countDocuments({
            createdAt: { $gte: currentMonth }
        });

        // Top 10 shop có doanh thu cao nhất
        const topRevenueShops = await Shop.find()
            .sort({ 'stats.revenue': -1 })
            .limit(10)
            .populate('owner', 'fullName email')
            .select('name slug stats.revenue stats.orderCount')
            .lean();

        // Top 10 shop có rating cao nhất
        const topRatingShops = await Shop.find({ 'stats.rating.count': { $gte: 5 } })
            .sort({ 'stats.rating.avg': -1 })
            .limit(10)
            .populate('owner', 'fullName email')
            .select('name slug stats.rating')
            .lean();

        const overview = {
            totalStats: {
                totalShops,
                activeShops,
                inactiveShops: totalShops - activeShops,
                pendingApproval,
                approvedShops,
                rejectedShops: totalShops - approvedShops - pendingApproval
            },
            featureLevelStats: {
                normal: normalShops,
                premium: premiumShops,
                vip: vipShops
            },
            monthlyStats: {
                newShopsThisMonth
            },
            topShops: {
                byRevenue: topRevenueShops,
                byRating: topRatingShops
            }
        };

        return successResponse(res, 'Thống kê tổng quan shops', overview);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thống kê shops', 500, error.message);
    }
};

// Lấy thông tin chi tiết 1 shop bất kỳ (admin)
exports.getShopDetailsByAdmin = async (req, res) => {
    try {
        const { shopId } = req.params;

        // Lấy thông tin shop đầy đủ
        const shop = await Shop.findById(shopId)
            .populate({
                path: 'owner',
                select: 'fullName email avatar phone gender dateOfBirth address roles role isActive createdAt updatedAt',
                populate: {
                    path: 'sellerId',
                    select: 'legalName businessType verificationStatus documents bankInfo'
                }
            })
            .populate('productInfo.mainCategory', 'name slug path')
            .populate('productInfo.subCategories', 'name slug path')
            .populate('stats.followers', 'fullName avatar email')
            .lean();

        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Lấy thống kê sản phẩm
        const productStats = await Product.aggregate([
            { $match: { seller: shop._id } },
            {
                $group: {
                    _id: null,
                    totalProducts: { $sum: 1 },
                    activeProducts: { $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] } },
                    inactiveProducts: { $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] } },
                    totalStock: { $sum: '$stock' },
                    totalSold: { $sum: '$soldCount' },
                    avgPrice: { $avg: '$price' },
                    maxPrice: { $max: '$price' },
                    minPrice: { $min: '$price' }
                }
            }
        ]);

        // Lấy thống kê bài viết
        const postStats = await Post.aggregate([
            { $match: { 'author.type': 'Shop', 'author._id': shop._id } },
            {
                $group: {
                    _id: null,
                    totalPosts: { $sum: 1 },
                    totalLikes: { $sum: '$likesCount' },
                    totalComments: { $sum: '$commentsCount' },
                    totalShares: { $sum: '$sharesCount' },
                    avgLikes: { $avg: '$likesCount' }
                }
            }
        ]);

        // Lấy sản phẩm bán chạy nhất (top 5)
        const topProducts = await Product.find({ seller: shop._id })
            .sort({ soldCount: -1 })
            .limit(5)
            .select('name slug price soldCount stock images')
            .lean();

        // Lấy bài viết gần đây (top 5)
        const recentPosts = await Post.find({
            'author.type': 'Shop',
            'author._id': shop._id
        })
            .sort({ createdAt: -1 })
            .limit(5)
            .select('content images likesCount commentsCount sharesCount createdAt')
            .lean();

        // Lấy lịch sử thay đổi trạng thái (nếu có log)
        // Có thể thêm model ActivityLog hoặc StatusHistory nếu cần

        // Tính toán thống kê theo thời gian
        const currentMonth = new Date();
        currentMonth.setDate(1);
        currentMonth.setHours(0, 0, 0, 0);

        const lastMonth = new Date(currentMonth);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        // Thống kê sản phẩm tháng này
        const thisMonthProducts = await Product.countDocuments({
            seller: shop._id,
            createdAt: { $gte: currentMonth }
        });

        // Thống kê bài viết tháng này
        const thisMonthPosts = await Post.countDocuments({
            'author.type': 'Shop',
            'author._id': shop._id,
            createdAt: { $gte: currentMonth }
        });

        // Kết hợp tất cả thông tin
        const shopDetails = {
            ...shop,
            statistics: {
                products: productStats[0] || {
                    totalProducts: 0,
                    activeProducts: 0,
                    inactiveProducts: 0,
                    totalStock: 0,
                    totalSold: 0,
                    avgPrice: 0,
                    maxPrice: 0,
                    minPrice: 0
                },
                posts: postStats[0] || {
                    totalPosts: 0,
                    totalLikes: 0,
                    totalComments: 0,
                    totalShares: 0,
                    avgLikes: 0
                },
                followers: {
                    total: shop.stats.followers?.length || 0,
                    list: shop.stats.followers || []
                },
                monthly: {
                    thisMonthProducts,
                    thisMonthPosts
                }
            },
            topProducts,
            recentPosts,
            // Thêm metadata để admin dễ quản lý
            metadata: {
                accountAge: Math.floor((Date.now() - new Date(shop.createdAt).getTime()) / (1000 * 60 * 60 * 24)), // số ngày
                lastUpdate: shop.updatedAt,
                hasBusinessLicense: !!shop.businessInfo?.businessLicense,
                hasTaxId: !!shop.businessInfo?.taxIdentificationNumber,
                completenessScore: calculateCompletenessScore(shop)
            }
        };

        return successResponse(res, 'Thông tin chi tiết shop', shopDetails);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy chi tiết shop', 500, err.message);
    }
};

// Tạm dừng hoạt động shop (admin)
exports.suspendShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { reason, duration } = req.body; // duration in days, 0 = permanent

        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Cập nhật trạng thái shop
        shop.status.isActive = false;
        shop.status.suspensionInfo = {
            reason: reason || 'Vi phạm quy định',
            suspendedAt: new Date(),
            suspendedBy: req.user.userId,
            duration: duration || 0,
            expiresAt: duration > 0 ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null
        };
        shop.updatedAt = new Date();

        await shop.save();

        // Tạm dừng tất cả sản phẩm của shop
        await Product.updateMany(
            { seller: shopId },
            { $set: { isActive: false } }
        );

        return successResponse(res, 'Đã tạm dừng hoạt động shop', {
            shopId,
            reason,
            duration: duration || 'Vĩnh viễn'
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi tạm dừng shop', 500, error.message);
    }
};

// Khôi phục hoạt động shop (admin)
exports.restoreShop = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { note } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Kiểm tra shop có đang bị đình chỉ không
        if (shop.status.isActive) {
            return errorResponse(res, 'Shop đang hoạt động bình thường', 400);
        }

        // Khôi phục trạng thái shop
        shop.status.isActive = true;
        shop.status.restorationInfo = {
            restoredAt: new Date(),
            restoredBy: req.user.userId,
            note: note || 'Khôi phục hoạt động'
        };
        // Xóa thông tin đình chỉ
        shop.status.suspensionInfo = undefined;
        shop.updatedAt = new Date();

        await shop.save();

        // Khôi phục các sản phẩm (chỉ những sản phẩm được phép)
        await Product.updateMany(
            { seller: shopId },
            { $set: { isActive: true } }
        );

        return successResponse(res, 'Đã khôi phục hoạt động shop', {
            shopId,
            note
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi khôi phục shop', 500, error.message);
    }
};

// Hàm tính điểm hoàn thiện profile shop
function calculateCompletenessScore(shop) {
    let score = 0;
    const maxScore = 100;

    // Thông tin cơ bản (30%)
    if (shop.name) score += 5;
    if (shop.description) score += 5;
    if (shop.avatar) score += 5;
    if (shop.logo) score += 5;
    if (shop.coverImage) score += 5;
    if (shop.contact?.phone) score += 5;

    // Thông tin doanh nghiệp (25%)
    if (shop.businessInfo?.businessLicense) score += 10;
    if (shop.businessInfo?.taxIdentificationNumber) score += 10;
    if (shop.businessInfo?.businessAddress?.street) score += 5;

    // Thông tin vận hành (20%)
    if (shop.operations?.warehouseAddress?.street) score += 5;
    if (shop.operations?.shippingProviders?.length > 0) score += 5;
    if (shop.operations?.paymentMethods?.length > 0) score += 5;
    if (shop.operations?.policies?.return) score += 5;

    // Thông tin sản phẩm (15%)
    if (shop.productInfo?.mainCategory) score += 10;
    if (shop.productInfo?.subCategories?.length > 0) score += 5;

    // SEO và khác (10%)
    if (shop.seo?.metaTitle) score += 5;
    if (shop.seo?.metaDescription) score += 5;

    return Math.min(score, maxScore);
}

// Cập nhật thông tin cơ bản shop (admin) - version nhẹ hơn
exports.updateShopBasicInfo = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { name, description, avatar, logo, coverImage, contact } = req.body;

        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        // Tạo object cập nhật
        const updateData = {};
        
        if (name) {
            // Kiểm tra tên shop đã tồn tại chưa
            const existingShop = await Shop.findOne({ 
                name: name, 
                _id: { $ne: shopId } 
            });
            if (existingShop) {
                return errorResponse(res, 'Tên shop đã được sử dụng', 400);
            }
            updateData.name = name;
            
            // Tạo slug mới
            const slug = name
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim('-');
            updateData.slug = slug;
        }

        if (description) updateData.description = description;
        if (avatar) updateData.avatar = avatar;
        if (logo) updateData.logo = logo;
        if (coverImage) updateData.coverImage = coverImage;
        if (contact) updateData.contact = { ...shop.contact, ...contact };

        updateData.updatedAt = new Date();

        const updatedShop = await Shop.findByIdAndUpdate(
            shopId,
            updateData,
            { new: true, runValidators: true }
        ).populate('owner', 'fullName email avatar');

        return successResponse(res, 'Cập nhật thông tin cơ bản shop thành công', updatedShop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật thông tin cơ bản shop', 500, error.message);
    }
};

// Xóa shop vĩnh viễn (admin)
exports.deleteShopByAdmin = async (req, res) => {
    try {
        const { shopId } = req.params;

        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        await Shop.deleteOne({ _id: shopId });

        // Optional: cập nhật user
        await User.findByIdAndUpdate(shop.owner, {
            $set: { shopId: null, isSellerActive: false, role: 'buyer' },
            $pull: { roles: 'seller' }
        });

        return successResponse(res, 'Đã xóa shop khỏi hệ thống thành công', { shopId });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi xóa shop', 500, err.message);
    }
};

// Cập nhật cấp độ đặc quyền của shop (chỉ admin)
exports.updateShopFeatureLevel = async (req, res) => {
    try {
        const { shopId } = req.params;
        const { featureLevel } = req.body;

        if (!['normal', 'premium', 'vip'].includes(featureLevel)) {
            return errorResponse(res, 'Cấp độ đặc quyền không hợp lệ', 400);
        }

        const shop = await Shop.findById(shopId);
        if (!shop) return errorResponse(res, 'Không tìm thấy shop', 404);

        shop.status.featureLevel = featureLevel;
        shop.updatedAt = new Date();

        await shop.save();

        return successResponse(res, `Đã cập nhật cấp độ đặc quyền của shop thành ${featureLevel}`, shop);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật cấp độ đặc quyền của shop', 500, error.message);
    }
};

