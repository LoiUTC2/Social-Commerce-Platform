const jwt = require('jsonwebtoken');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Post = require('../models/Post');

exports.verifyToken = (req, res, next) => {
    const token = req.cookies.accessToken; // Lấy từ cookie, tại vì có gửi accessToken qua cookie khi đăng nhập, nên lấy được
    // const authHeader = req.headers.authorization; //nằm trong header có dạng Authorization: Bearer <token>
    // const token = authHeader && authHeader.split(" ")[1]; //Tách chuỗi Bearer <token> thành mảng ["Bearer", "<token>"], lấy phần tử thứ 1 (<token>).

    if (!token) return res.status(401).json({ message: "Chưa đăng nhập" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); //giải mã và xác minh token, trả về dữ liệu đã mã hóa (userId, email,...)
        req.user = decoded; // lưu thông tin user vào request
        next();
    } catch (err) {
        res.status(403).json({ message: "Token không hợp lệ" });
    }
};

// Chặn route nếu không đúng vai trò
exports.requireRole = (roles = []) => {  //roles là danh sách vai trò được phép thực hiện hành động đó.
    if (typeof roles === "string") roles = [roles];

    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Không có quyền truy cập" });
        }
        next();
    };
};

exports.checkProductOwnership = async (req, res, next) => {
    const { slug, productId } = req.params; // Chỉ lấy từ req.params
    try {
        let product;
        if (slug) {
            product = await Product.findOne({ slug });// Tìm sản phẩm bằng slug
        } else if (productId) {
            product = await Product.findById(productId); // Tìm sản phẩm bằng _id
        } else {
            return res.status(400).json({ message: "Thiếu slug hoặc productId" });
        }

        if (!product) {
            return res.status(404).json({ message: "Sản phẩm không tồn tại" });
        }

        // Kiểm tra quyền sở hữu
        if (product.seller.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền thao tác với sản phẩm này" });
        }

        req.product = product; // Lưu sản phẩm vào req để controller dùng tiếp nếu cần
        next();
    } catch (err) {
        return res.status(500).json({ message: "Lỗi máy chủ", error: err.message });
    }
};

// Check ownership for Post
exports.checkPostOwnership = async (req, res, next) => {
    const postId = req.params.postId || req.body.postId;
    try {
        const post = await Post.findById(postId);
        if (!post) return res.status(404).json({ message: "Bài viết không tồn tại" });

        if (post.author.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền thao tác với bài viết này" });
        }

        next();
    } catch (err) {
        return res.status(500).json({ message: "Lỗi máy chủ", error: err });
    }
};

// Check ownership for Comment
exports.checkCommentOwnership = async (req, res, next) => {
    const commentId = req.params.commentId || req.body.commentId;
    try {
        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ message: "Bình luận không tồn tại" });

        if (comment.author.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền thao tác với bình luận này" });
        }

        next();
    } catch (err) {
        return res.status(500).json({ message: "Lỗi máy chủ", error: err });
    }
};

// Check ownership for Shop
exports.checkShopOwnership = async (req, res, next) => {
    const shopId = req.params.shopId || req.body.shopId;
    try {
        const shop = await Shop.findById(shopId);
        if (!shop) return res.status(404).json({ message: "Cửa hàng không tồn tại" });

        // Nếu chưa được duyệt thì không cho thao tác
        if (!shop.isApproved) {
            return res.status(403).json({ message: 'Shop chưa được duyệt. Bạn chưa thể thực hiện thao tác này.' });
        }

        if (shop.owner.toString() !== req.user.userId && req.user.role !== 'admin') {
            return res.status(403).json({ message: "Bạn không có quyền thao tác với cửa hàng này" });
        }

        req.shop = shop;
        next();
    } catch (err) {
        return errorResponse(res, "Lỗi máy chủ khi kiểm tra chủ sở hữu shop", 500, err.message);
    }
};
