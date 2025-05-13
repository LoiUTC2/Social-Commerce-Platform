const Product = require('../models/Product');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const slugify = require("slugify");

//Tạo slug khác biệt
const generateUniqueSlug = async (name) => {
    let slug = slugify(name, { lower: true, strict: true });
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

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const sellerId = req.user.userId;
        const slug = await generateUniqueSlug(req.body.name);
        const sku = await generateSKU(req.body.name, sellerId);

        const requiredFields = ['name', 'description', 'price', 'stock', 'category'];
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

        // Tạo sản phẩm mới với dữ liệu đã được validate
        const productData = {
            seller: sellerId,
            name: req.body.name,
            slug,
            sku,
            description: req.body.description,
            price: req.body.price,
            stock: req.body.stock,
            category: req.body.category,
            images: req.body.images || [],
            videos: req.body.videos || [],
            discount: req.body.discount || 0,
            brand: req.body.brand,
            condition: req.body.condition || 'new',
            variants: req.body.variants || [],
            tags: req.body.tags || []
        };

        const product = await Product.create(productData);

        // Ghi lại hành vi tạo sản phẩm để phân tích sau này
        await UserInteraction.create({
            userId: sellerId,
            targetType: 'product',
            targetId: product._id,
            action: 'create',
            metadata: {
                price: product.price,
                category: product.category,
                brand: product.brand
            }
        });

        return successResponse(res, 'Thêm sản phẩm thành công', product, 201);

    } catch (error) {
        // Xử lý lỗi duplicate slug
        if (error.code === 11000 && error.keyPattern?.slug) {
            return errorResponse(res, 'Slug sản phẩm đã tồn tại', 400);
        }
        if (error.code === 11000 && error.keyPattern?.sku) {
            return errorResponse(res, 'SKU sản phẩm đã tồn tại', 400);
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
        const userId = req.user.userId;
        if (req.body.discount !== undefined) {
            const discount = Number(req.body.discount);
            if (isNaN(discount)) {
                return errorResponse(res, 'Giảm giá phải là số', 400);
            }

            // Lấy giá hiện tại để so sánh
            const currentProduct = await Product.findOne({ slug, seller: userId });
            if (!currentProduct) {
                return errorResponse(res, 'Không tìm thấy sản phẩm', 404);
            }

            const priceToCompare = req.body.price !== undefined
                ? Number(req.body.price)
                : currentProduct.price;

            if (discount < 0) {
                return errorResponse(res, 'Giảm giá phải là số không âm', 400);
            }
            if (discount > priceToCompare) {
                return errorResponse(res, 'Giảm giá không được lớn hơn giá sản phẩm', 400);
            }
        }
        const updatedProduct = await Product.findOneAndUpdate(
            { slug: slug, seller: userId },
            { $set: req.body },
            { new: true }
        );

        if (!updatedProduct) return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền', 404);

        await UserInteraction.create({
            userId,
            targetType: 'product',
            targetId: updatedProduct._id,
            action: 'update',
            metadata: req.body
        });

        return successResponse(res, 'Cập nhật sản phẩm thành công', updatedProduct);
    } catch (error) {
        return errorResponse(res, 'Cập nhật sản phẩm thất bại', 500, error.message);
    }
};

//Xóa sản phẩm
exports.deleteProduct = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 'Không tìm thấy sản phẩm', 404);

        await Product.findByIdAndDelete(productId);

        return successResponse(res, 'Đã xóa sản phẩm khỏi hệ thống');
    } catch (error) {
        return errorResponse(res, 'Lỗi khi xóa sản phẩm', 500, error.message);
    }
};

//Chuyển đổi trạng thái sản phẩm (đang bán hoặc ngừng bán)
exports.toggleProductActiveStatus = async (req, res) => {
    try {
        const { productId } = req.params;

        const product = await Product.findById(productId);
        if (!product) return errorResponse(res, 'Không tìm thấy sản phẩm', 404);

        product.isActive = !product.isActive;
        await product.save();

        const statusText = product.isActive ? 'Sản phẩm đã được mở bán' : 'Sản phẩm đã ngừng bán';

        return successResponse(res, statusText, { isActive: product.isActive, product });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái sản phẩm', 500, error.message);
    }
};

// Lấy danh sách sản phẩm nổi bật (dựa vào soldCount và rating)
exports.getFeaturedProducts = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    try {
        const products = await Product.find({ isActive: true })
            .sort({ 'ratings.avg': -1, soldCount: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Product.countDocuments({ isActive: true });

        return successResponse(res, "Danh sách sản phẩm nổi bật", {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, "Lỗi khi lấy sản phẩm nổi bật", 500, err);
    }
};

//Lấy danh sách sản phẩm gợi ý (dựa theo hành vi UserInteraction + random fallback)
exports.getSuggestedProducts = async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.userId;

    try {
        let products;
        let total;

        if (userId) {
            // Lấy các tags từ sản phẩm mà user đã xem, like, purchase,...
            const interactions = await UserInteraction.find({
                userId,
                targetType: 'product',
                action: { $in: ['click', 'view', 'like', 'purchase'] }
            }).sort({ timestamp: -1 }).limit(50);

            const productIds = interactions.map(i => i.targetId);

            const interactedProducts = await Product.find({ _id: { $in: productIds } });

            const tagSet = new Set();
            interactedProducts.forEach(p => p.tags?.forEach(tag => tagSet.add(tag)));

            // Tìm các sản phẩm có cùng tags
            products = await Product.find({
                isActive: true,
                tags: { $in: Array.from(tagSet) }
            })
                .sort({ 'ratings.avg': -1, soldCount: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit));

            total = await Product.countDocuments({
                isActive: true,
                tags: { $in: Array.from(tagSet) }
            });

            // Nếu không đủ sản phẩm, fallback sang random
            if (products.length < limit) {
                const extraProducts = await Product.aggregate([
                    { $match: { isActive: true } },
                    { $sample: { size: limit - products.length } }
                ]);
                products = products.concat(extraProducts);
            }
        } else {
            // Fallback cho khách (random)
            products = await Product.aggregate([
                { $match: { isActive: true } },
                { $sample: { size: parseInt(limit) } }
            ]);
            total = products.length;
        }

        return successResponse(res, "Gợi ý sản phẩm dành cho bạn", {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, "Lỗi khi lấy sản phẩm gợi ý", 500, err);
    }
};

// Lấy tất cả sản phẩm thuộc 1 shop (seller), sort mới nhất
exports.getProductsByShopForUser = async (req, res) => {
    const { seller } = req.params;
    const { page = 1, limit = 20 } = req.query;

    try {
        const products = await Product.find({ seller: seller, isActive: true })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Product.countDocuments({ seller: seller, isActive: true });

        return successResponse(res, 'Lấy sản phẩm của shop thành công', {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
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
        const userId = req.user?.userId;

        // Lấy thông tin sản phẩm (chỉ sản phẩm đang bán)
        const product = await Product.findOne({
            slug: slug,
            isActive: true
        }).populate('seller', 'username avatar shopName');

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán', 404);
        }

        // Ghi lại hành vi xem sản phẩm nếu người dùng đã đăng nhập
        if (userId) {
            await UserInteraction.create({
                userId,
                targetType: 'product',
                targetId: product._id,
                action: 'view',
                metadata: {
                    category: product.category,
                    price: product.price,
                    tags: product.tags
                }
            });
        }

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', product);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin sản phẩm', 500, error.message);
    }
};

// Lấy tất cả sản phẩm thuộc 1 shop (seller), sort mới nhất
exports.getProductsByShopForShop = async (req, res) => {
    const { seller } = req.params;
    const { page = 1, limit = 20 } = req.query;

    try {
        const products = await Product.find({ seller: seller })
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Product.countDocuments({ seller: seller });

        return successResponse(res, 'Lấy sản phẩm của shop thành công', {
            products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy sản phẩm theo shop', 500, err.message);
    }
};

//Lấy chi tiết sản phẩm cho seller
exports.getProductDetailForSeller = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.userId;

        // Lấy thông tin sản phẩm (bao gồm cả sản phẩm đã ngừng bán)
        const product = await Product.findOne({
            slug: slug,
            seller: userId
        }).populate('seller', 'username avatar shopName');

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc không có quyền truy cập', 404);
        }

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', product);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin sản phẩm', 500, error.message);
    }
};

exports.getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user?.userId;

        // Lấy thông tin sản phẩm (chỉ sản phẩm đang bán)
        const product = await Product.findOne({
            slug,
            isActive: true
        }).populate('seller', 'username avatar shopName');

        if (!product) {
            return errorResponse(res, 'Không tìm thấy sản phẩm hoặc sản phẩm đã ngừng bán', 404);
        }

        // Ghi lại hành vi xem sản phẩm nếu người dùng đã đăng nhập
        if (userId) {
            await UserInteraction.create({
                userId,
                targetType: 'product',
                targetId: product._id,
                action: 'view',
                metadata: {
                    category: product.category,
                    price: product.price,
                    tags: product.tags,
                    via: 'slug_search' // Đánh dấu truy cập qua tìm kiếm slug
                }
            });
        }

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', product);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin sản phẩm', 500, error.message);
    }
};