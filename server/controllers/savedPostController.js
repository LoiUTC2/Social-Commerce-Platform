const SavedPost = require('../models/SavedPost');
const { successResponse, errorResponse } = require('../utils/response');
const { trackInteraction } = require('../middleware/interactionMiddleware');
const Post = require('../models/Post');
const { populatePostDetails } = require('../utils/populatePost');

exports.toggleSavePost = async (req, res) => {
    try {
        const userId = req.actor?._id;
        const userType = req.actor?.role === 'shop' ? 'Shop' : 'User';
        const { postId } = req.params;

        if (!userId) return errorResponse(res, 'Không xác định được người dùng', 403);

        const existing = await SavedPost.findOne({
            'user._id': userId,
            'user.type': userType,
            post: postId
        });

        if (existing) {
            await SavedPost.findOneAndDelete({
                'user._id': userId,
                'user.type': userType,
                post: postId
            });

            // Track interaction: unsave
            req.body = {
                targetType: 'post',
                targetId: postId,
                action: 'unsave'
            };
            await trackInteraction(req, res, () => { });

            return successResponse(res, 'Đã bỏ lưu bài viết');
        } else {
            const saved = await SavedPost.create({
                user: {
                    type: userType,
                    _id: userId
                },
                post: postId
            });

            // Track interaction: save
            req.body = {
                targetType: 'post',
                targetId: postId,
                action: 'save'
            };
            await trackInteraction(req, res, () => { });

            return successResponse(res, 'Đã lưu bài viết thành công', saved);
        }
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lưu/bỏ lưu bài viết', 500, err.message);
    }
};

exports.getSavedPosts = async (req, res) => {
    try {
        const userId = req.actor?._id;
        const userType = req.actor?.role === 'shop' ? 'Shop' : 'User';
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        if (!userId) return errorResponse(res, 'Không xác định được người dùng', 403);

        // Tìm tất cả postId đã lưu
        const savedDocs = await SavedPost.find({
            'user._id': userId,
            'user.type': userType
        })
            .sort({ savedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select('post');

        const postIds = savedDocs.map(doc => doc.post);

        const total = await SavedPost.countDocuments({
            'user._id': userId,
            'user.type': userType
        });

        let posts = [];
        if (postIds.length > 0) {
            const populatedPosts = await populatePostDetails(
                Post.find({ _id: { $in: postIds } })
            );

            // Giữ nguyên thứ tự đã lưu (vì `$in` không đảm bảo thứ tự)
            posts = postIds.map(id => populatedPosts.find(p => p._id.toString() === id.toString())).filter(Boolean);
        }

        const totalPages = Math.ceil(total / limit);
        const hasMore = skip + posts.length < total;

        return successResponse(res, 'Lấy danh sách bài viết đã lưu thành công', {
            posts,
            pagination: {
                currentPage: page,
                limit,
                totalPages,
                totalResults: total,
                hasMore
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách bài viết đã lưu', 500, err.message);
    }
};

exports.checkSavedPost = async (req, res) => {
    try {
        const userId = req.actor?._id;
        const userType = req.actor?.role === 'shop' ? 'Shop' : 'User';
        const { postId } = req.params;

        if (!userId) return errorResponse(res, 'Không xác định được người dùng', 403);

        const exists = await SavedPost.exists({
            'user._id': userId,
            'user.type': userType,
            post: postId
        });

        return successResponse(res, 'Kiểm tra trạng thái lưu thành công', {
            isSaved: !!exists
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi kiểm tra lưu bài viết', 500, err.message);
    }
};