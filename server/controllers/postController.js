const Post = require('../models/Post');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const User = require('../models/User');
const { successResponse, errorResponse } = require('../utils/response');

exports.createPost = async (req, res) => {
  try {
    const {
      content,
      images = [],
      videos = [],
      productIds = [],
      hashtags = [],
      categories = [],
      location = ''
    } = req.body;

    const newPost = new Post({
      author: {
        type: req.actor.type === 'shop' ? 'Shop' : 'User',
        _id: req.actor._id
      },
      content,
      images,
      videos,
      productIds,
      hashtags,
      categories,
      location,
    });

    const savedPost = await newPost.save();

    // Cập nhật trường posts trong Product nếu có productIds
    if (productIds && productIds.length > 0) {
      await Product.updateMany(
        {
          _id: { $in: productIds },
          allowPosts: true // Chỉ thêm vào sản phẩm cho phép đăng bài
        },
        { $addToSet: { posts: savedPost._id } }
      );
    }

    return successResponse(res, 'Tạo bài viết thành công', savedPost);
  } catch (err) {
    return errorResponse(res, 'Lỗi tạo bài viết', 500, err.message);
  }
};

// Cập nhật bài viết
exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const actorId = req.actor._id;

    // Tìm bài viết hiện tại
    const post = await Post.findById(id);
    if (!post) {
      return errorResponse(res, 'Bài viết không tồn tại', 404);
    }

    // Kiểm tra quyền sửa (chỉ author mới được sửa)
    if (post.author._id.toString() !== actorId.toString()) {
      return errorResponse(res, 'Bạn không có quyền sửa bài viết này', 403);
    }

    const {
      content,
      images = [],
      videos = [],
      productIds = [],
      hashtags = [],
      categories = [],
      location,
      privacy
    } = req.body;

    // Lưu lại productIds cũ để so sánh
    const oldProductIds = post.productIds.map(id => id.toString());
    const newProductIds = productIds.map(id => id.toString());

    // Cập nhật thông tin bài viết
    post.content = content || post.content;
    post.images = images || post.images;
    post.videos = videos || post.videos;
    post.productIds = productIds || post.productIds;
    post.hashtags = hashtags || post.hashtags;
    post.categories = categories || post.categories;
    post.location = location !== undefined ? location : post.location;
    post.privacy = privacy || post.privacy;
    post.updatedAt = Date.now();

    const updatedPost = await post.save();

    // Kiểm tra và cập nhật trường posts trong Product nếu có thay đổi productIds
    if (JSON.stringify(oldProductIds) !== JSON.stringify(newProductIds)) {
      await updateProductPosts(oldProductIds, newProductIds, post._id);
    }

    return successResponse(res, 'Cập nhật bài viết thành công', updatedPost);
  } catch (err) {
    return errorResponse(res, 'Lỗi khi cập nhật bài viết', 500, err.message);
  }
};

// Helper function để cập nhật trường posts trong Product
const updateProductPosts = async (oldProductIds, newProductIds, postId) => {
  try {
    const Product = mongoose.model('Product');

    // Xóa postId khỏi các product cũ (nếu có)
    if (oldProductIds.length > 0) {
      await Product.updateMany(
        { _id: { $in: oldProductIds } },
        { $pull: { posts: postId } }
      );
    }

    // Thêm postId vào các product mới (nếu có)
    if (newProductIds.length > 0) {
      await Product.updateMany(
        {
          _id: { $in: newProductIds },
          allowPosts: true // Chỉ thêm vào sản phẩm cho phép đăng bài
        },
        { $addToSet: { posts: postId } } // $addToSet để tránh trùng lặp
      );
    }
  } catch (error) {
    console.error('Error updating product posts:', error);
    throw error;
  }
};

exports.getAllPosts = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    const [posts, total] = await Promise.all([
      Post.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'author._id',
          select: 'fullName avatar name slug', // fullName nếu là User, name nếu là Shop
        })
        .populate({
          path: 'sharedPost',
          select: 'content images videos privacy createdAt author productIds',
          populate: [
            {
              path: 'author._id',
              select: 'fullName avatar name slug',
            },
            {
              path: 'productIds',
              select: 'name price discount images videos stock soldCount slug seller',
              populate: {
                path: 'seller',
                select: 'name slug avatar',
                model: 'Shop',
              },
            },
          ],
        })
        .populate({
          path: 'productIds',
          select: 'name price discount images videos stock soldCount slug seller', // Các trường cần thiết của sản phẩm
          populate: {
            path: 'seller',
            select: 'name slug avatar', // Thông tin cần thiết về người bán
            model: 'Shop' // Chỉ định model là Shop vì seller trong Product là ref đến Shop
          }
        }),
      Post.countDocuments()
    ]);

    const hasMore = skip + posts.length < total;

    console.log(`Page: ${page}, Skip: ${skip}, Limit: ${limit}, Returned: ${posts.length}, Total: ${total}, HasMore: ${hasMore}`);

    const post = await Post.find().skip(5).limit(5); // page 2
    console.log('Page 2:', post.length);

    return res.status(200).json({
      message: 'Lấy danh sách bài viết',
      data: posts,
      hasMore
    });
  } catch (err) {
    return errorResponse(res, 'Lỗi khi lấy danh sách', 500, err.message);
  }
};

exports.getPostById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author._id', 'fullName avatar name slug')
      .populate({
        path: 'sharedPost',
        select: 'content images videos privacy createdAt author productIds',
        populate: [
          {
            path: 'author._id',
            select: 'fullName avatar name slug',
          },
          {
            path: 'productIds',
            select: 'name price discount images videos stock soldCount slug seller',
            populate: {
              path: 'seller',
              select: 'name slug avatar',
              model: 'Shop',
            },
          },
        ],
      })
      .populate({
        path: 'productIds',
        select: 'name price discount images videos stock soldCount slug seller', // Các trường cần thiết của sản phẩm
        populate: {
          path: 'seller',
          select: 'name slug avatar', // Thông tin cần thiết về người bán
          model: 'Shop' // Chỉ định model là Shop vì seller trong Product là ref đến Shop
        }
      })
    if (!post) return errorResponse(res, 'Bài viết không tồn tại', 404);
    return successResponse(res, 'Chi tiết bài viết', post);
  } catch (err) {
    return errorResponse(res, 'Lỗi khi lấy chi tiết bài viết', 500, err.message);
  }
};

// Helper function để tìm author theo slug
const findAuthorBySlug = async (slug) => {
  // Thử tìm User trước
  const user = await User.findOne({ slug: slug }).select('_id fullName avatar coverImage slug');
  if (user) {
    return {
      _id: user._id,
      type: 'User',
      data: user
    };
  }

  // Nếu không tìm thấy User, thử tìm Shop
  const shop = await Shop.findOne({ slug: slug }).select('_id name avatar coverImage logo slug');
  if (shop) {
    return {
      _id: shop._id,
      type: 'Shop',
      data: shop
    };
  }

  return null;
};

exports.getPostsByAuthorSlug = async (req, res) => {
  const { slug } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;

  try {
    // Bước 1: Tìm User hoặc Shop theo slug
    const author = await findAuthorBySlug(slug);

    if (!author) {
      return errorResponse(res, 'Không tìm thấy tác giả với slug này', 404);
    }

    // Bước 2: Tìm bài viết theo authorId và authorType
    const query = {
      'author._id': author._id,
      'author.type': author.type
    };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'author._id',
          select: 'fullName avatar name coverImage slug', // Thêm slug để dễ xử lý frontend
        })
        .populate({
          path: 'sharedPost',
          select: 'content images videos privacy createdAt author productIds',
          populate: [
            {
              path: 'author._id',
              select: 'fullName avatar name slug',
            },
            {
              path: 'productIds',
              select: 'name price discount images videos stock soldCount slug seller',
              populate: {
                path: 'seller',
                select: 'name slug avatar',
                model: 'Shop',
              },
            },
          ],
        })
        .populate({
          path: 'productIds',
          select: 'name price discount images videos stock soldCount slug seller', // Các trường cần thiết của sản phẩm
          populate: {
            path: 'seller',
            select: 'name slug avatar', // Thông tin cần thiết về người bán
            model: 'Shop' // Chỉ định model là Shop vì seller trong Product là ref đến Shop
          }
        }),
      Post.countDocuments(query)
    ]);

    const hasMore = skip + posts.length < total;

    return successResponse(res, 'Lấy danh sách bài viết của tác giả thành công', {
      data: posts,
      hasMore,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalPosts: total,
      authorInfo: {
        _id: author._id,
        type: author.type,
        slug: slug,
        data: author.data
      }
    });
  } catch (err) {
    console.error('Error in getPostsByAuthorSlug:', err);
    return errorResponse(res, 'Lỗi khi lấy danh sách bài viết của tác giả', 500, err.message);
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 'Bài viết không tồn tại', 404);
    if (post.author._id.toString() !== req.actor._id)
      return errorResponse(res, 'Bạn không có quyền xoá bài viết này', 403);

    await post.deleteOne();
    return successResponse(res, 'Xoá bài viết thành công');
  } catch (err) {
    return errorResponse(res, 'Lỗi khi xoá bài viết', 500, err.message);
  }
};
