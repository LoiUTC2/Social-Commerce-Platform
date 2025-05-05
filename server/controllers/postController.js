const Post = require('../models/Post');
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
      userId: req.user.userId,
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
        .populate('userId', 'fullName avatar')
        .populate({
          path: 'sharedPost',
          select: 'content images videos privacy createdAt',
          populate: {
            path: 'userId',
            select: 'fullName avatar'
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
      .populate('userId', 'fullName avatar')
      .populate('productIds');
    if (!post) return errorResponse(res, 'Bài viết không tồn tại', 404);
    return successResponse(res, 'Chi tiết bài viết', post);
  } catch (err) {
    return errorResponse(res, 'Lỗi khi lấy chi tiết bài viết', 500, err.message);
  }
};

exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return errorResponse(res, 'Bài viết không tồn tại', 404);
    if (post.userId.toString() !== req.user.userId)
      return errorResponse(res, 'Bạn không có quyền xoá bài viết này', 403);

    await post.deleteOne();
    return successResponse(res, 'Xoá bài viết thành công');
  } catch (err) {
    return errorResponse(res, 'Lỗi khi xoá bài viết', 500, err.message);
  }
};
