const Product = require('../models/Product');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const slugify = require("slugify");
const mongoose = require('mongoose');
const Category = require('../models/Category');


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

// Tạo sản phẩm mới
exports.createProduct = async (req, res) => {
    try {
        const sellerId = req.actor._id.toString(); //này là 1 shopId nhé, có middle ware check hết rồi nên bây giờ chắc chắn là seller(dùng shopId), còn model seller chỉ là thông tin bổ trợ cho shop thôi

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
            tags: req.body.tags || [],
            isActive: true,
        };

        const product = await Product.create(productData);

        // Ghi lại hành vi tạo sản phẩm để phân tích sau này
        await UserInteraction.create({
            author: {
                type: "Shop",
                _id: sellerId
            },
            targetType: 'product',
            targetId: product._id,
            action: 'create',
            metadata: {
                price: product.price,
                category: product.mainCategory,
                brand: product.brand
            }
        });

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

        if (!updatedProduct) {
            return errorResponse(res, 'Không thể cập nhật sản phẩm', 500);
        }

        // Ghi lại hành vi cập nhật sản phẩm
        await UserInteraction.create({
            author: {
                type: "Shop",
                _id: userId
            },
            targetType: 'product',
            targetId: updatedProduct._id,
            action: 'update',
            metadata: updateData
        });

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
        await UserInteraction.create({
            author: {
                type: "Shop",
                _id: userId
            },
            targetType: 'product',
            targetId: productId,
            action: 'delete'
        });

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
        //     metadata: { isActive: product.isActive }
        // });

        return successResponse(res, statusText, { isActive: product.isActive, product });
    } catch (error) {
        return errorResponse(res, 'Lỗi khi cập nhật trạng thái sản phẩm', 500, error.message);
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
            // Lấy các danh mục và tags từ sản phẩm mà user đã tương tác
            const interactions = await UserInteraction.find({
                userId,
                targetType: 'product',
                action: { $in: ['click', 'view', 'like', 'purchase'] }
            }).sort({ timestamp: -1 }).limit(50);

            const productIds = interactions.map(i => i.targetId);

            const interactedProducts = await Product.find({ _id: { $in: productIds } });

            const tagSet = new Set();
            const categorySet = new Set();

            interactedProducts.forEach(p => {
                p.tags?.forEach(tag => tagSet.add(tag));
                p.categories?.forEach(cat => categorySet.add(cat.toString()));
            });

            // Tìm các sản phẩm có cùng tags hoặc categories
            products = await Product.find({
                isActive: true,
                $or: [
                    { tags: { $in: Array.from(tagSet) } },
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
                    { tags: { $in: Array.from(tagSet) } },
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
        const userId = req.actor._id.toString();

        // Lấy thông tin sản phẩm (chỉ sản phẩm đang bán)
        const product = await Product.findOne({
            slug: slug,
            isActive: true
        })
            .populate('seller', 'username avatar shopName')
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
            .populate('seller', 'username shopName')
            .sort({ 'ratings.avg': -1 })
            .limit(6);

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
                metadata: {
                    mainCategory: product.mainCategory,
                    categories: product.categories,
                    price: product.price,
                    tags: product.tags
                }
            });
        }

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', {
            product,
            relatedProducts
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

//Lấy chi tiết sản phẩm cho seller
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

//  * Tìm kiếm sản phẩm bằng slug
exports.getProductBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.actor._id.toString();

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
                metadata: {
                    mainCategory: product.mainCategory,
                    categories: product.categories,
                    price: product.price,
                    tags: product.tags,
                    via: 'slug_search'
                }
            });
        }

        return successResponse(res, 'Lấy thông tin sản phẩm thành công', product);
    } catch (error) {
        return errorResponse(res, 'Lỗi khi lấy thông tin sản phẩm', 500, error.message);
    }
};