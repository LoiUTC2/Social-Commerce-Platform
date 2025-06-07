const SavedPost = require('../models/SavedPost');
const { successResponse, errorResponse } = require('../utils/response');

exports.savePost = async (req, res) => {
    try {
        const userId = req.actor?._id;
        const { postId } = req.params;

        if (!userId) return errorResponse(res, 'Không xác định được người dùng', 403);

        const existing = await SavedPost.findOne({ user: userId, post: postId });
        if (existing) {
            return errorResponse(res, 'Bạn đã lưu bài viết này trước đó', 400);
        }

        const saved = await SavedPost.create({ user: userId, post: postId });

        // Tự gọi trackInteraction middleware để ghi hành vi 'save'
        req.body = {
            targetType: 'post',
            targetId: postId,
            action: 'save'
        };

        await trackInteraction(req, res, () => { });

        return successResponse(res, 'Đã lưu bài viết thành công', saved);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lưu bài viết', 500, err.message);
    }
};

exports.unsavePost = async (req, res) => {
    try {
        const userId = req.actor?._id;
        const { postId } = req.params;

        if (!userId) return errorResponse(res, 'Không xác định được người dùng', 403);

        const saved = await SavedPost.findOneAndDelete({ user: userId, post: postId });
        if (!saved) {
            return errorResponse(res, 'Bạn chưa lưu bài viết này', 400);
        }

        // Tự gọi trackInteraction middleware để ghi hành vi 'unsave'
        req.body = {
            targetType: 'post',
            targetId: postId,
            action: 'unsave'
        };

        await trackInteraction(req, res, () => { });

        return successResponse(res, 'Đã bỏ lưu bài viết');
    } catch (err) {
        return errorResponse(res, 'Lỗi khi bỏ lưu bài viết', 500, err.message);
    }
};

exports.getSavedPosts = async (req, res) => {
    try {
        const userId = req.actor?._id;
        const { page = 1, limit = 10 } = req.query;

        if (!userId) return errorResponse(res, 'Không xác định được người dùng', 403);

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [savedPosts, total] = await Promise.all([
            SavedPost.find({ user: userId })
                .populate({
                    path: 'post',
                    select: 'content images videos author createdAt', // tùy chọn field
                    populate: { path: 'author', select: 'fullName avatar' }
                })
                .sort({ savedAt: -1 })
                .skip(skip)
                .limit(parseInt(limit)),
            SavedPost.countDocuments({ user: userId })
        ]);

        return successResponse(res, 'Lấy danh sách bài viết đã lưu thành công', {
            items: savedPosts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách bài viết đã lưu', 500, err.message);
    }
};

//kiểm tra xem người dùng đã lưu bài viết này chưa
exports.checkSavedPost = async (req, res) => {
    try {
        const userId = req.actor?._id;
        const { postId } = req.params;

        if (!userId) return errorResponse(res, 'Không xác định được người dùng', 403);

        const exists = await SavedPost.exists({ user: userId, post: postId });

        return successResponse(res, 'Kiểm tra trạng thái lưu thành công', {
            isSaved: !!exists
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi kiểm tra lưu bài viết', 500, err.message);
    }
};