const Post = require('../models/Post');
const { successResponse, errorResponse } = require('../utils/response');

exports.createPost = async (req, res) => {
  try {
    const { content, images, productIds, hashtags, categories, location } = req.body;

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

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'fullName avatar')
      .populate('productIds');
    return successResponse(res, 'Lấy danh sách bài viết', posts);
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
