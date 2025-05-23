const Post = require('../models/Post');
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
    return successResponse(res, 'Tạo bài viết thành công', savedPost);
  } catch (err) {
    return errorResponse(res, 'Lỗi tạo bài viết', 500, err.message);
  }
};

// exports.getAllPosts = async (req, res) => {
//   const page = parseInt(req.query.page) || 1;
//   const limit = parseInt(req.query.limit) || 5;
//   const skip = (page - 1) * limit;
//   try {
//     const posts = await Post.find()
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limit)
//       .populate('userId', 'fullName avatar')
//     // .populate('productIds');
//     return successResponse(res, 'Lấy danh sách bài viết', posts);
//   } catch (err) {
//     return errorResponse(res, 'Lỗi khi lấy danh sách', 500, err.message);
//   }
// };

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
          select: 'content images videos privacy createdAt author',
          populate: {
            path: 'author._id',
            select: 'fullName avatar name slug'
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
      .populate('productIds');
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
          select: 'content images videos privacy createdAt author',
          populate: {
            path: 'author._id',
            select: 'fullName avatar coverImage name  slug'
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
