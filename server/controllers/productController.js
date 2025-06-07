const Product = require('../models/Product');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const slugify = require("slugify");
const mongoose = require('mongoose');
const Category = require('../models/Category');
const Post = require('../models/Post');
const ProductReviews = require('../models/ProductReviews');
const Hashtag = require('../models/Hashtags');
const geoip = require('geoip-lite');

//Tạo slug khác biệt
const generateUniqueSlug = async (name) => {
    let slug = slugify(name, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });
    let existingProduct = await Product.findOne({ slug });
    let count = 1;

    while (existingProduct) {
        slug = `${slug}-${count}`; // Thêm số vào cuối slug
        existingProduct = await Product.findOne({ slug });
        count++;
    }

    return slug;
};

//hàm này để bỏ dấu
const removeVietnameseTones = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");
};
const generateSKU = async (name, sellerId) => {
    const prefix = removeVietnameseTones(name).substring(0, 3).toUpperCase();
    const sellerCode = sellerId.toString().slice(-6); // Lấy 6 ký tự cuối của sellerId
    const randomNum = Math.floor(1000 + Math.random() * 9000); // Số ngẫu nhiên 4 chữ số

    let sku = `${prefix}-${sellerCode}-${randomNum}`;
    let existingProduct = await Product.findOne({ sku });
    let count = 1;

    // Đảm bảo SKU là duy nhất
    while (existingProduct) {
        sku = `${prefix}-${sellerCode}-${randomNum + count}`;
        existingProduct = await Product.findOne({ sku });
        count++;
    }

    return sku;
};

//Thêm hoặc sửa hashtags
async function handleHashtagsUpdate(productId, hashtags = [], createdById) {
    for (const rawTag of hashtags) {
        const tagName = rawTag.trim().toLowerCase();
        if (!tagName) continue;

        const hashtag = await Hashtag.findOneAndUpdate(
            { name: tagName },
            {
                $setOnInsert: {
                    name: tagName,
                    createdBy: createdById,
                    createdByModel: 'Shop'
                },
                $addToSet: { products: productId },
                $set: { lastUsedAt: new Date() },
                $inc: { usageCount: 1 }
            },
            { upsert: true, new: true }
        );
    }
}

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const sellerId = req.actor._id.toString(); //này là 1 shopId nhé, có middle ware check hết rồi nên bây giờ chắc chắn là seller(dùng shopId), còn model seller chỉ là thông tin bổ trợ cho shop thôi

        const sessionId = req.sessionId;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        const slug = await generateUniqueSlug(req.body.name);
        const sku = await generateSKU(req.body.name, sellerId);

        const requiredFields = ['name', 'description', 'price', 'stock', 'mainCategory'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                return errorResponse(res, `Thiếu trường bắt buộc: ${field}`, 400);
            }
        }

        const price = Number(req.body.price);
        if (isNaN(price) || price <= 0) {
            return errorResponse(res, 'Giá sản phẩm phải là số dương', 400);
        }

        const discount = Number(req.body.discount) || 0;
        if (isNaN(discount) || discount < 0) {
            return errorResponse(res, 'Giảm giá phải là số không âm', 400);
        }
        if (discount > price) {
            return errorResponse(res, 'Giảm giá không được lớn hơn giá sản phẩm', 400);
        }

        const stock = Number(req.body.stock);
        if (isNaN(stock) || stock < 0) {
            return errorResponse(res, 'Số lượng tồn kho phải là số không âm', 400);
        }

        // Kiểm tra danh mục tồn tại
        const mainCategory = await Category.findById(req.body.mainCategory);
        console.log('mainCategory:', sellerId);
        console.log('mainCategory:', req.body.mainCategory);
        if (!mainCategory) {
            return errorResponse(res, 'Danh mục không tồn tại', 400);
        }

        // Tạo sản phẩm mới với dữ liệu đã được validate
        const productData = {
            seller: sellerId,
            name: req.body.name,
            // slug, //model tự tạo 
            sku: sku, // model tự tạo
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock,
            mainCategory: req.body.mainCategory,
            images: req.body.images || [],
            videos: req.body.videos || [],
            discount: req.body.discount || 0,
            brand: req.body.brand,
            condition: req.body.condition || 'new',
            variants: req.body.variants || [],
            allowPosts: req.body.allowPosts,
            hashtags: req.body.hashtags || [],
            isActive: true,
        };

        const product = await Product.create(productData);

        await handleHashtagsUpdate(product._id, req.body.hashtags, sellerId);

        // Ghi lại hành vi tạo sản phẩm để phân tích sau này
        // await UserInteraction.create({
        //     author: {
        //         type: "Shop",
        //         _id: sellerId
        //     },
        //     targetType: 'product',
        //     targetId: product._id,
        //     action: 'create',
        //     sessionId,
        //     deviceInfo: {
        //         userAgent,
        //         ip,
        //         platform: req.headers['sec-ch-ua-platform'] || 'unknown',
        //         browser: req.headers['user-agent'].match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
        //     },
        //     location: geoip.lookup(ip) || {},
        //     metadata: {
        //         price: product.price,
        //         category: product.mainCategory,
        //         brand: product.brand
        //     }
        // });

        return successResponse(res, 'Thêm sản phẩm thành công', product, 201);

    } catch (error) {
        // Xử lý lỗi duplicate slug hoặc SKU
        if (error.code === 11000) {
            if (error.keyPattern?.slug) {
                return errorResponse(res, 'Slug sản phẩm đã tồn tại', 400);
            }
            if (error.keyPattern?.sku) {
                return errorResponse(res, 'SKU sản phẩm đã tồn tại', 400);
            }
        }

        // Xử lý lỗi validation của Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return errorResponse(res, 'Dữ liệu không hợp lệ', 400, errors);
        }

        return errorResponse(res, 'Thêm sản phẩm thất bại', 500, error.message);
    }
};

// Cập nhật sản phẩm
exports.updateProduct = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.actor._id.toString(); //người dùng lúc này là tài khoản seller nhé (dùng ShopId)
        const sessionId = req.sessionId;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        // Tìm sản phẩm hiện tại để kiểm tra
        const currentProduct = await Product.findOne({ slug, seller: userId });
        if (!currentProduct) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền', 404);
        }

        const updateData = { ...req.body };

        // Kiểm tra và xử lý các trường số
        if (updateData.price !== undefined) {
            const price = Number(updateData.price);
            if (isNaN(price) || price <= 0) {
                return errorResponse(res, 'Giá sản phẩm phải là số dương', 400);
            }
        }

        if (updateData.discount !== undefined) {
            const discount = Number(updateData.discount);
            if (isNaN(discount) || discount < 0) {
                return errorResponse(res, 'Giảm giá phải là số không âm', 400);
            }

            const priceToCompare = updateData.price !== undefined
                ? Number(updateData.price)
                : currentProduct.price;

            if (discount > priceToCompare) {
                return errorResponse(res, 'Giảm giá không được lớn hơn giá sản phẩm', 400);
            }
        }

        if (updateData.stock !== undefined) {
            const stock = Number(updateData.stock);
            if (isNaN(stock) || stock < 0) {
                return errorResponse(res, 'Số lượng tồn kho phải là số không âm', 400);
            }
        }

        // Kiểm tra danh mục nếu được cập nhật
        if (updateData.mainCategory !== undefined) {
            const mainCategory = await Category.findById(updateData.mainCategory);
            if (!mainCategory) {
                return errorResponse(res, 'Danh mục không tồn tại', 400);
            }
        }

        const updatedProduct = await Product.findOneAndUpdate(
            { slug, seller: userId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (updateData.hashtags) {
            await handleHashtagsUpdate(updatedProduct._id, updateData.hashtags, userId);
        }

        if (!updatedProduct) {
            return errorResponse(res, 'Không thể cập nhật sản phẩm', 500);
        }

        // Ghi lại hành vi cập nhật sản phẩm
        // await UserInteraction.create({
        //     author: {
        //         type: "Shop",
        //         _id: userId
        //     },
        //     targetType: 'product',
        //     targetId: updatedProduct._id,
        //     action: 'update',
        //     sessionId,
        //     deviceInfo: {
        //         userAgent,
        //         ip,
        //         platform: req.headers['sec-ch-ua-platform'] || 'unknown',
        //         browser: req.headers['user-agent'].match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
        //     },
        //     location: geoip.lookup(ip) || {},
        //     metadata: updateData
        // });

        return successResponse(res, 'Cập nhật sản phẩm thành công', updatedProduct);
    } catch (error) {
        // Xử lý lỗi duplicate
        if (error.code === 11000) {
            if (error.keyPattern?.slug) {
                return errorResponse(res, 'Slug sản phẩm đã tồn tại', 400);
            }
            if (error.keyPattern?.sku) {
                return errorResponse(res, 'SKU sản phẩm đã tồn tại', 400);
            }
        }

        // Xử lý lỗi validation
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return errorResponse(res, 'Dữ liệu không hợp lệ', 400, errors);
        }

        return errorResponse(res, 'Cập nhật sản phẩm thất bại', 500, error.message);
    }
};

//Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.actor._id.toString();

        const sessionId = req.sessionId;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        const product = await Product.findOne({
            _id: productId,
            seller: userId
        });

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền xóa', 404);
        }

        // Xóa sản phẩm (middleware pre findOneAndDelete sẽ cập nhật productCount trong Category)
        await Product.findByIdAndDelete(productId);

        // Ghi lại hành vi xóa sản phẩm
        // await UserInteraction.create({
        //     author: {
        //         type: "Shop",
        //         _id: userId
        //     },
        //     targetType: 'product',
        //     targetId: productId,
        //     action: 'delete',
        //     sessionId,
        //     deviceInfo: {
        //         userAgent,
        //         ip,
        //         platform: req.headers['sec-ch-ua-platform'] || 'unknown',
        //         browser: req.headers['user-agent'].match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
        //     },
        //     location: geoip.lookup(ip) || {},
        // });

        return successResponse(res, 'Đã xóa sản phẩm khỏi hệ thống');
    } catch (error) {
        return errorResponse(res, 'Lỗi khi xóa sản phẩm', 500, error.message);
    }
};

//Chuyển đổi trạng thái sản phẩm (đang bán hoặc ngừng bán)
exports.toggleProductActiveStatus = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.actor._id.toString();

        const sessionId = req.sessionId;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        const product = await Product.findOne({
            _id: productId,
            seller: userId
        });

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền thay đổi trạng thái', 404);
        }

        // Lưu trạng thái cũ để so sánh
        const oldStatus = product.isActive;

        // Cập nhật trạng thái
        product.isActive = !product.isActive;
        await product.save();

        // Cập nhật số lượng sản phẩm trong danh mục nếu cần
        if (oldStatus !== product.isActive) {
            const increment = product.isActive ? 1 : -1;
            await Category.findByIdAndUpdate(
                product.mainCategory,
                { $inc: { productCount: increment } }
            );
        }

        const statusText = product.isActive ? 'Sản phẩm đã được mở bán' : 'Sản phẩm đã ngừng bán';

        // Ghi lại hoạt động
        // await UserInteraction.create({
        //     author: {
        //         type: "Shop",
        //         _id: userId
        //     }, targetType: 'product',
        //     targetId: product._id,
        //     action: 'toggle_status',
        //     sessionId,
        //     deviceInfo: {
        //         userAgent,
        //         ip,
        //         platform: req.headers['sec-ch-ua-platform'] || 'unknown',
        //         browser: req.headers['user-agent'].match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
        //     },
        //     location: geoip.lookup(ip) || {},
        //     metadata: { isActive: product.isActive }
        // });

        return successResponse(res, statusText, { isActive: product.isActive, product });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái sản phẩm', 500, error.message);
    }
};

// Bật/tắt cho phép đăng bài viết kèm sản phẩm
exports.toggleAllowPosts = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.actor._id.toString();

        const sessionId = req.sessionId;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        // Tìm sản phẩm và kiểm tra quyền sở hữu
        const product = await Product.findOne({
            _id: productId,
            seller: userId
        });

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền thay đổi', 404);
        }

        // Chuyển đổi trạng thái allowPosts
        product.allowPosts = !product.allowPosts;
        await product.save();

        // Ghi lại hành vi thay đổi (nếu cần)
        // await UserInteraction.create({
        //     author: {
        //         type: "Shop",
        //         _id: userId
        //     },
        //     targetType: 'product',
        //     targetId: product._id,
        //     action: 'toggle_allow_posts',
        //     sessionId,
        //     deviceInfo: {
        //         userAgent,
        //         ip,
        //         platform: req.headers['sec-ch-ua-platform'] || 'unknown',
        //         browser: req.headers['user-agent'].match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
        //     },
        //     location: geoip.lookup(ip) || {},
        //     metadata: {
        //         allowPosts: product.allowPosts
        //     }
        // });

        const statusText = product.allowPosts
            ? 'Đã bật chức năng đăng bài viết cho sản phẩm'
            : 'Đã tắt chức năng đăng bài viết cho sản phẩm';

        return successResponse(res, statusText, {
            allowPosts: product.allowPosts,
            productId: product._id
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi thay đổi trạng thái allowPosts', 500, error.message);
    }
};

// Lấy danh sách sản phẩm nổi bật cho phép đăng bài viết (allowPosts: true)
exports.getFeaturedProductsForPosts = async (req, res) => {
    const { page = 1, limit = 10, search } = req.query;
    const parsedLimit = parseInt(limit);
    const skipCount = (parseInt(page) - 1) * parsedLimit;

    try {
        // Xây dựng query cơ bản
        const query = {
            isActive: true,
            allowPosts: true
        };

        // Thêm điều kiện tìm kiếm nếu có
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { hashhashtags: { $regex: search, $options: 'i' } }
            ];
        }

        // Lấy danh sách sản phẩm
        const products = await Product.find(query)
            .populate('seller', 'shopName avatar') // Thông tin shop
            .populate('mainCategory', 'name slug') // Thông tin danh mục
            .sort({
                soldCount: -1,       // Ưu tiên sản phẩm bán chạy
                'ratings.avg': -1,   // Ưu tiên sản phẩm đánh giá cao
                createdAt: -1        // Ưu tiên sản phẩm mới
            })
            .skip(skipCount)
            .limit(parsedLimit);

        // Đếm tổng số sản phẩm phù hợp
        const total = await Product.countDocuments(query);

        return successResponse(res, 'Danh sách sản phẩm cho phép đăng bài viết', {
            products,
            pagination: {
                page: parseInt(page),
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh sách sản phẩm', 500, error.message);
    }
};

// Lấy danh sách sản phẩm nổi bật (dựa vào soldCount và rating)
exports.getFeaturedProducts = async (req, res) => {
    const { page = 1, limit = 20, category } = req.query;
    const parsedLimit = parseInt(limit);
    const skipCount = (parseInt(page) - 1) * parsedLimit;

    try {
        const query = { isActive: true };

        // Lọc theo danh mục nếu có
        if (category) {
            query.categories = mongoose.Types.ObjectId(category);
        }

        const products = await Product.find(query)
            .populate('mainCategory', 'name slug')
            .populate('seller', 'username shopName avatar')
            .sort({ 'ratings.avg': -1, soldCount: -1 })
            .skip(skipCount)
            .limit(parsedLimit);

        const total = await Product.countDocuments(query);

        return successResponse(res, "Danh sách sản phẩm nổi bật", {
            products,
            pagination: {
                page: parseInt(page),
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (err) {
        return errorResponse(res, "Lỗi khi lấy sản phẩm nổi bật", 500, err.message);
    }
};

//Lấy danh sách sản phẩm gợi ý (dựa theo hành vi UserInteraction + random fallback)
exports.getSuggestedProducts = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.actor._id.toString();;
    const parsedLimit = parseInt(limit);
    const skipCount = (parseInt(page) - 1) * parsedLimit;

    try {
        let products;
        let total;

        if (userId) {
            // Lấy các danh mục và hashhashtags từ sản phẩm mà user đã tương tác
            const interactions = await UserInteraction.find({
                userId,
                targetType: 'product',
                action: { $in: ['click', 'view', 'like', 'purchase'] }
            }).sort({ timestamp: -1 }).limit(50);

            const productIds = interactions.map(i => i.targetId);

            const interactedProducts = await Product.find({ _id: { $in: productIds } });

            const hashtagset = new Set();
            const categorySet = new Set();

            interactedProducts.forEach(p => {
                p.hashtags?.forEach(tag => hashtagset.add(tag));
                p.categories?.forEach(cat => categorySet.add(cat.toString()));
            });

            // Tìm các sản phẩm có cùng hashtags hoặc categories
            products = await Product.find({
                isActive: true,
                $or: [
                    { hashtags: { $in: Array.from(hashtagset) } },
                    { categories: { $in: Array.from(categorySet).map(id => mongoose.Types.ObjectId(id)) } }
                ],
                _id: { $nin: productIds } // Loại bỏ các sản phẩm đã tương tác
            })
                .populate('mainCategory', 'name slug')
                .populate('seller', 'username shopName avatar')
                .sort({ 'ratings.avg': -1, soldCount: -1 })
                .skip(skipCount)
                .limit(parsedLimit);

            total = await Product.countDocuments({
                isActive: true,
                $or: [
                    { hashtags: { $in: Array.from(hashtagset) } },
                    { categories: { $in: Array.from(categorySet).map(id => mongoose.Types.ObjectId(id)) } }
                ],
                _id: { $nin: productIds }
            });

            // Nếu không đủ sản phẩm, fallback sang random
            if (products.length < parsedLimit) {
                const extraProducts = await Product.aggregate([
                    {
                        $match: {
                            isActive: true,
                            _id: { $nin: [...productIds, ...products.map(p => p._id)] }
                        }
                    },
                    { $sample: { size: parsedLimit - products.length } }
                ]);

                // Populate các trường cần thiết cho các sản phẩm từ aggregation
                if (extraProducts.length > 0) {
                    const extraProductIds = extraProducts.map(p => p._id);
                    const populatedExtra = await Product.find({ _id: { $in: extraProductIds } })
                        .populate('mainCategory', 'name slug')
                        .populate('seller', 'username shopName avatar');

                    products = [...products, ...populatedExtra];
                }
            }
        } else {
            // Fallback cho khách (random + featured mix)
            const featuredProducts = await Product.find({ isActive: true })
                .populate('mainCategory', 'name slug')
                .populate('seller', 'username shopName avatar')
                .sort({ 'ratings.avg': -1, soldCount: -1 })
                .limit(parsedLimit / 2);

            const randomProducts = await Product.aggregate([
                {
                    $match: {
                        isActive: true,
                        _id: { $nin: featuredProducts.map(p => p._id) }
                    }
                },
                { $sample: { size: parsedLimit - featuredProducts.length } }
            ]);

            // Populate cho randomProducts
            const randomProductIds = randomProducts.map(p => p._id);
            const populatedRandom = await Product.find({ _id: { $in: randomProductIds } })
                .populate('mainCategory', 'name slug')
                .populate('seller', 'username shopName avatar');

            products = [...featuredProducts, ...populatedRandom];
            total = await Product.countDocuments({ isActive: true });
        }

        return successResponse(res, "Gợi ý sản phẩm dành cho bạn", {
            products,
            pagination: {
                page: parseInt(page),
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (err) {
        return errorResponse(res, "Lỗi khi lấy sản phẩm gợi ý", 500, err.message);
    }
};

// Lấy tất cả sản phẩm thuộc 1 shop (seller) hiển thị cho user
exports.getProductsByShopForUser = async (req, res) => {
    const { seller } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;
    const parsedLimit = parseInt(limit);
    const skipCount = (parseInt(page) - 1) * parsedLimit;

    try {
        // Xác định cách sắp xếp
        let sortOption = {};
        switch (sort) {
            case 'price_asc':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
                sortOption = { price: -1 };
                break;
            case 'popular':
                sortOption = { soldCount: -1 };
                break;
            case 'rating':
                sortOption = { 'ratings.avg': -1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1 };
        }

        const products = await Product.find({
            seller: seller,
            isActive: true
        })
            .populate('mainCategory', 'name slug')
            .sort(sortOption)
            .skip(skipCount)
            .limit(parsedLimit);

        const total = await Product.countDocuments({
            seller: seller,
            isActive: true
        });

        return successResponse(res, 'Lấy sản phẩm của shop thành công', {
            products,
            pagination: {
                page: parseInt(page),
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy sản phẩm theo shop', 500, err.message);
    }
};

//Lấy chi tiết sản phẩm cho user
exports.getProductDetailForUser = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req?.actor?._id.toString();

        // Query params cho reviews
        const { reviewPage = 1, reviewLimit = 5, sortBy = 'newest' } = req.query;

        // Lấy thông tin sản phẩm (chỉ sản phẩm đang bán)
        const product = await Product.findOne({
            slug: slug,
            isActive: true
        })
            .populate('seller', 'name avatar slug stats.rating.avg')
            .populate('mainCategory', 'name slug')
            .populate('categories', 'name slug');

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán', 404);
        }

        // Lấy sản phẩm liên quan (cùng danh mục)
        const relatedProducts = await Product.find({
            mainCategory: product.mainCategory,
            _id: { $ne: product._id },
            isActive: true
        })
            .populate('seller', 'name avatar slug')
            .sort({ 'ratings.avg': -1 })
            .limit(6);

        // Xác định cách sắp xếp reviews
        let reviewSort = {};
        switch (sortBy) {
            case 'oldest':
                reviewSort = { createdAt: 1 };
                break;
            case 'rating_high':
                reviewSort = { rating: -1, createdAt: -1 };
                break;
            case 'rating_low':
                reviewSort = { rating: 1, createdAt: -1 };
                break;
            case 'most_liked':
                reviewSort = { 'likes.length': -1, createdAt: -1 };
                break;
            default: // newest
                reviewSort = { createdAt: -1 };
        }

        const reviewSkip = (parseInt(reviewPage) - 1) * parseInt(reviewLimit);

        // Lấy danh sách reviews của sản phẩm với populate và phân trang
        const [reviews, totalReviews] = await Promise.all([
            ProductReviews.find({
                product: product._id,
                status: 'active'
            })
                .populate({
                    path: 'reviewer._id',
                    select: 'fullName name avatar', // User sẽ có fullName, Shop sẽ có name
                    refPath: 'reviewer.type'
                })
                .populate({
                    path: 'order',
                    select: 'createdAt items',
                    populate: {
                        path: 'items.product',
                        select: 'name variants'
                    }
                })
                // .populate({
                //     path: 'replies',
                //     populate: {
                //         path: 'author._id',
                //         select: 'name avatar',
                //         refPath: 'author.type'
                //     }
                // })
                .select('rating title content images videos likes isVerified createdAt reviewer order')
                .sort(reviewSort)
                .skip(reviewSkip)
                .limit(parseInt(reviewLimit))
                .lean(),

            ProductReviews.countDocuments({
                product: product._id,
                status: 'active'
            })
        ]);

        // Tính toán thông tin phân trang reviews
        const reviewPagination = {
            currentPage: parseInt(reviewPage),
            totalPages: Math.ceil(totalReviews / parseInt(reviewLimit)),
            totalReviews,
            hasNext: parseInt(reviewPage) < Math.ceil(totalReviews / parseInt(reviewLimit)),
            hasPrev: parseInt(reviewPage) > 1
        };

        // Format review statistics
        const ratingBreakdown = {
            5: product.reviewStats?.ratingDistribution?.five || 0,
            4: product.reviewStats?.ratingDistribution?.four || 0,
            3: product.reviewStats?.ratingDistribution?.three || 0,
            2: product.reviewStats?.ratingDistribution?.two || 0,
            1: product.reviewStats?.ratingDistribution?.one || 0
        };

        // ✅ THÊM THÔNG TIN PHẦN TRĂM
        const ratingPercentage = {
            5: product.reviewStats?.ratingPercentage?.five || 0,
            4: product.reviewStats?.ratingPercentage?.four || 0,
            3: product.reviewStats?.ratingPercentage?.three || 0,
            2: product.reviewStats?.ratingPercentage?.two || 0,
            1: product.reviewStats?.ratingPercentage?.one || 0
        };

        // Thêm thông tin likes count cho mỗi review
        const reviewsWithLikesCount = reviews.map(review => ({
            ...review,
            likesCount: review.likes ? review.likes.length : 0,
            isLikedByUser: userId ? (review.likes || []).includes(userId) : false,
            reviewerName: review.reviewer.type === 'User'
                ? review.reviewer._id?.fullName
                : review.reviewer._id?.name,
            // Thêm thông tin variant đã mua (nếu có)
            purchasedVariant: review.order?.items?.find(item =>
                item.product._id.toString() === product._id.toString()
            )?.selectedVariant
        }));

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', {
            product,
            relatedProducts,
            reviews: {
                data: reviewsWithLikesCount,
                pagination: reviewPagination,
                stats: {
                    totalReviews: product.reviewStats?.totalReviews || 0,
                    verifiedReviews: product.reviewStats?.verifiedReviews || 0,
                    averageRating: product.reviewStats?.averageRating || product.ratings.avg || 0,

                    // THÔNG TIN CHI TIẾT VỀ ĐÁNH GIÁ
                    ratingBreakdown,
                    ratingPercentage,

                    // THÊM CÁC THÔNG TIN CHẤT LƯỢNG
                    qualityScore: product.reviewStats?.qualityScore || 0,
                    totalLikes: product.reviewStats?.totalLikes || 0,
                    reviewsWithImages: product.reviewStats?.reviewsWithImages || 0,
                    reviewsWithVideos: product.reviewStats?.reviewsWithVideos || 0,
                    reviewsWithMedia: product.reviewStats?.reviewsWithMedia || 0,

                    // THỜI GIAN CÂP NHẬT CUỐI
                    lastUpdated: product.reviewStats?.lastUpdated
                }
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin sản phẩm', 500, error.message);
    }
};

// Lấy tất cả sản phẩm thuộc 1 shop (seller) hiển thị cho seller
exports.getProductsByShopForShop = async (req, res) => {
    const { seller } = req.params;
    const { page = 1, limit = 20, status, sort = 'newest', search } = req.query;
    const parsedLimit = parseInt(limit);
    const skipCount = (parseInt(page) - 1) * parsedLimit;

    try {
        // Xây dựng query
        const query = { seller: seller };

        // Lọc theo trạng thái nếu có
        if (status === 'active') {
            query.isActive = true;
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        // Tìm kiếm theo tên hoặc mô tả nếu có
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        // Xác định cách sắp xếp
        let sortOption = {};
        switch (sort) {
            case 'price_asc':
                sortOption = { price: 1 };
                break;
            case 'price_desc':
                sortOption = { price: -1 };
                break;
            case 'popular':
                sortOption = { soldCount: -1 };
                break;
            case 'rating':
                sortOption = { 'ratings.avg': -1 };
                break;
            case 'newest':
            default:
                sortOption = { createdAt: -1 };
        }

        const products = await Product.find(query)
            .populate('mainCategory', 'name slug')
            .populate('categories', 'name slug')
            .sort(sortOption)
            .skip(skipCount)
            .limit(parsedLimit);

        const total = await Product.countDocuments(query);

        // Thống kê tổng quan
        const stats = {
            total,
            active: await Product.countDocuments({ seller, isActive: true }),
            inactive: await Product.countDocuments({ seller, isActive: false }),
            outOfStock: await Product.countDocuments({ seller, stock: 0 }),
            lowStock: await Product.countDocuments({ seller, stock: { $gt: 0, $lte: 5 } })
        };

        return successResponse(res, 'Lấy sản phẩm của shop thành công', {
            products,
            stats,
            pagination: {
                page: parseInt(page),
                limit: parsedLimit,
                total,
                totalPages: Math.ceil(total / parsedLimit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy sản phẩm theo shop', 500, err.message);
    }
};

// Lấy chi tiết sản phẩm cho seller
exports.getProductDetailForSeller = async (req, res) => {
    try {
        const { slug } = req.params;
        const actorId = req.actor._id.toString();

        // Lấy thông tin sản phẩm (bao gồm cả sản phẩm đã ngừng bán)
        const product = await Product.findOne({
            slug: slug,
            seller: actorId
        })
            .populate('seller', 'username avatar shopName')
            .populate('mainCategory', 'name slug')
            .populate('categories', 'name slug')
            .populate('categoryPath', 'name slug');

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền truy cập', 404);
        }

        // Thống kê hiệu suất sản phẩm (có thể mở rộng)
        const stats = {
            views: await UserInteraction.countDocuments({
                targetId: product._id,
                action: 'view'
            }),
            purchases: await UserInteraction.countDocuments({
                targetId: product._id,
                action: 'purchase'
            })
        };

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', { product, stats });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin sản phẩm', 500, error.message);
    }
};

// Tìm kiếm sản phẩm bằng slug
exports.getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.actor._id.toString();
        const sessionId = req.sessionId;
        const ip = req.ip;
        const userAgent = req.headers['user-agent'];

        // Lấy thông tin sản phẩm (chỉ sản phẩm đang bán)
        const product = await Product.findOne({
            slug,
            isActive: true
        })
            .populate('seller', 'username avatar shopName')
            .populate('mainCategory', 'name slug')
            .populate('categories', 'name slug');

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán', 404);
        }

        // Ghi lại hành vi xem sản phẩm nếu người dùng đã đăng nhập
        if (userId) {
            await UserInteraction.create({
                author: {
                    type: "Shop",
                    _id: userId
                },
                targetType: 'product',
                targetId: product._id,
                action: 'view',
                sessionId,
                deviceInfo: {
                    userAgent,
                    ip,
                    platform: req.headers['sec-ch-ua-platform'] || 'unknown',
                    browser: req.headers['user-agent'].match(/(Chrome|Firefox|Safari|Edge)/)?.[0] || 'unknown'
                },
                location: geoip.lookup(ip) || {},
                metadata: {
                    mainCategory: product.mainCategory,
                    categories: product.categories,
                    price: product.price,
                    hashtags: product.hashtags,
                    via: 'slug_search'
                }
            });
        }

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', product);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin sản phẩm', 500, error.message);
    }
};

// Lấy danh sách bài viết của sản phẩm
exports.getProductPosts = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skipCount = (parseInt(page) - 1) * parseInt(limit);

        // Kiểm tra sản phẩm tồn tại
        const product = await Product.findById(productId)
            .populate('posts', 'content images videos likesCount commentsCount createdAt')
            .populate({
                path: 'posts',
                populate: {
                    path: 'author._id',
                    select: 'username avatar shopName'
                }
            });

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
        }

        // Phân trang danh sách bài viết
        const posts = product.posts.slice(skipCount, skipCount + parseInt(limit));
        const total = product.posts.length;

        return successResponse(res, 'Danh sách bài viết của sản phẩm', {
            posts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy danh sách bài viết', 500, error.message);
    }
};

// Thêm bài viết vào sản phẩm
exports.addPostToProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { postId } = req.body;
        const actorId = req.actor._id;

        // Kiểm tra sản phẩm tồn tại và thuộc quyền sở hữu
        const product = await Product.findOne({
            _id: productId,
            seller: actorId
        });

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền', 404);
        }

        // Kiểm tra bài viết tồn tại
        const post = await Post.findById(postId);
        if (!post) {
            return errorResponse(res, 'Bài viết không tồn tại', 404);
        }

        // Kiểm tra bài viết đã thuộc sản phẩm chưa
        if (product.posts.includes(postId)) {
            return errorResponse(res, 'Bài viết đã được thêm vào sản phẩm trước đó', 400);
        }

        // Thêm bài viết vào sản phẩm
        product.posts.push(postId);
        await product.save();

        // Cập nhật productIds trong Post
        if (!post.productIds.includes(productId)) {
            post.productIds.push(productId);
            await post.save();
        }

        return successResponse(res, 'Đã thêm bài viết vào sản phẩm', { productId, postId });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi thêm bài viết vào sản phẩm', 500, error.message);
    }
};

// Xóa bài viết khỏi sản phẩm
exports.removePostFromProduct = async (req, res) => {
    try {
        const { productId, postId } = req.params;
        const actorId = req.actor._id;

        // Kiểm tra sản phẩm tồn tại và thuộc quyền sở hữu
        const product = await Product.findOne({
            _id: productId,
            seller: actorId
        });

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền', 404);
        }

        // Kiểm tra bài viết có trong sản phẩm không
        if (!product.posts.includes(postId)) {
            return errorResponse(res, 'Bài viết không thuộc sản phẩm này', 400);
        }

        // Xóa bài viết khỏi sản phẩm
        product.posts = product.posts.filter(id => id.toString() !== postId);
        await product.save();

        // Cập nhật productIds trong Post
        const post = await Post.findById(postId);
        if (post && post.productIds.includes(productId)) {
            post.productIds = post.productIds.filter(id => id.toString() !== productId);
            await post.save();
        }

        return successResponse(res, 'Đã xóa bài viết khỏi sản phẩm', { productId, postId });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi xóa bài viết khỏi sản phẩm', 500, error.message);
    }
};