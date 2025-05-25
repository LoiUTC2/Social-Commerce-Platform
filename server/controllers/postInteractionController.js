const Post = require('../models/Post');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const Comment = require('../models/Comment');
const mongoose = require('mongoose');


exports.likePost = async (req, res) => {
    try {
        // const { userId } = req.user;
        const actor = req.actor; // [Grok] Lấy thông tin actor từ middleware setActor, chứa _id và type (user/shop)
        const { id: postId } = req.params;

        const existing = await UserInteraction.findOne({
            "author._id": actor._id,
            "author.type": actor.type === 'shop' ? 'Shop' : 'User', // [Grok] Kiểm tra cả type và _id của author để xác định tương tác trước đó
            targetType: 'post',
            targetId: postId,
            action: 'like'
        });

        let message = '';
        let newLikesCount = 0;

        if (existing) {
            // Unlike
            await existing.deleteOne();
            const updated = await Post.findByIdAndUpdate(
                postId,
                { $inc: { likesCount: -1 } },
                { new: true }
            );
            message = 'Đã bỏ thích bài viết';
            newLikesCount = updated.likesCount;
        } else {
            // Like
            await UserInteraction.create({
                author: {
                    type: actor.type === 'shop' ? 'Shop' : 'User',
                    _id: actor._id
                }, // [Grok] Lưu author với type và _id thay vì userId
                targetType: 'post',
                targetId: postId,
                action: 'like',
            });
            const updated = await Post.findByIdAndUpdate(
                postId,
                { $inc: { likesCount: 1 } },
                { new: true }
            );
            message = 'Đã thích bài viết';
            newLikesCount = updated.likesCount;
        }
        return successResponse(res, message, { likesCount: newLikesCount });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi thích bài viết', 500, err.message);
    }
};

exports.getPostLikes = async (req, res) => {
    try {
        const { postId } = req.params;

        const interactions = await UserInteraction.find({
            targetType: 'post',
            targetId: postId,
            action: 'like'
        }).populate('author._id', 'fullName avatar name slug'); // [Grok] Populate author._id để lấy thông tin User hoặc Shop

        const authors = interactions.map(interaction => ({
            type: interaction.author.type,
            ...interaction.author._id._doc
        })); // [Grok] Trả về thông tin author bao gồm type và các trường đã populate
        return successResponse(res, 'Danh sách người dùng đã thích bài viết', authors);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách like', 500, err.message);
    }
};

// Bình luận bài viết hoặc reply
exports.commentOrReply = async (req, res) => {
    try {
        const actor = req.actor;
        const { postId } = req.params;
        const { text, parentId } = req.body;

        const comment = new Comment({
            postId,
            author: {
                type: actor.type === 'shop' ? 'Shop' : 'User',
                _id: actor._id
            },
            text,
            parentId: parentId || null
        });

        await comment.save();

        // Populate thông tin author (User hoặc Shop)
        const populatedComment = await Comment.findById(comment._id)
            .populate({
                path: 'author._id',
                select: actor.type === 'shop' ? 'name avatar slug' : 'fullName avatar slug',
                model: actor.type === 'shop' ? 'Shop' : 'User'
            })
            .lean();

        let commentsCount = 0;
        let replyCount = 0;

        if (!parentId) {
            // Tạo interaction cho bình luận bài viết
            await UserInteraction.create({
                author: {
                    type: actor.type === 'shop' ? 'Shop' : 'User',
                    _id: actor._id
                },
                targetType: 'post',
                targetId: postId,
                action: 'comment',
                metadata: { text }
            });

            // Cập nhật số lượng bình luận của bài viết
            const post = await Post.findByIdAndUpdate(postId, { $inc: { commentsCount: 1 } }, { new: true });
            commentsCount = post.commentsCount;
        } else {
            // Tạo interaction cho reply comment
            await UserInteraction.create({
                author: {
                    type: actor.type === 'shop' ? 'Shop' : 'User',
                    _id: actor._id
                },
                targetType: 'comment',
                targetId: parentId,
                action: 'comment',
                metadata: { text }
            });

            // Đếm số lượng reply của comment cha
            replyCount = await Comment.countDocuments({ parentId });
        }

        return successResponse(res, 'Bình luận thành công', {
            comment: populatedComment,
            commentsCount,
            replyCount
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi bình luận', 500, err.message);
    }
};

// Thích / Bỏ thích comment
exports.likeComment = async (req, res) => {
    try {
        const actor = req.actor; // [Grok] Sử dụng actor thay vì userId chưa định nghĩa
        const { commentId } = req.params;

        const comment = await Comment.findById(commentId);
        if (!comment) {
            return errorResponse(res, 'Không tìm thấy bình luận', 404);
        }

        let isLiked = false;

        if (comment.likes.includes(actor._id)) {
            // 👎 Nếu đã like → bỏ like
            await Comment.findByIdAndUpdate(commentId, { $pull: { likes: actor._id } });

            await UserInteraction.deleteOne({
                "author._id": actor._id,
                "author.type": actor.type === 'shop' ? 'Shop' : 'User', // [Grok] Xóa tương tác dựa trên cả author._id và author.type
                targetType: 'comment',
                targetId: commentId,
                action: 'like'
            });
        } else {
            // 👍 Nếu chưa like → thêm like
            await Comment.findByIdAndUpdate(commentId, { $addToSet: { likes: actor._id } });

            await UserInteraction.create({
                author: {
                    type: actor.type === 'shop' ? 'Shop' : 'User',
                    _id: actor._id
                }, // [Grok] Lưu author thay vì userId
                targetType: 'comment',
                targetId: commentId,
                action: 'like'
            });

            isLiked = true;
        }
        const updatedComment = await Comment.findById(commentId);
        const totalLikes = updatedComment.likes.length;

        return successResponse(res, isLiked ? 'Đã thích bình luận' : 'Đã bỏ thích bình luận', { totalLikes, isLiked });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi thích bình luận', 500, err.message);
    }
};

// Lấy danh sách like bình luận/reply
exports.getCommentLikes = async (req, res) => {
    try {
        const { commentId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Lấy comment và populate thông tin likes
        const comment = await Comment.findById(commentId)
            .select('likes')
            .lean();

        if (!comment) {
            return errorResponse(res, 'Không tìm thấy bình luận', 404);
        }

        // Lấy danh sách ID từ trường likes
        const likeIds = comment.likes || [];
        const totalLikes = likeIds.length;

        // Phân trang
        const paginatedIds = likeIds.slice(skip, skip + limitNumber);

        // Tạo các promise để populate thông tin User/Shop
        const userPromises = paginatedIds.map(id =>
            mongoose.model('User').findById(id)
                .select('fullName avatar slug')
                .lean()
                .then(user => user ? { ...user, type: 'User' } : null)
        );

        const shopPromises = paginatedIds.map(id =>
            mongoose.model('Shop').findById(id)
                .select('name avatar slug')
                .lean()
                .then(shop => shop ? { ...shop, type: 'Shop' } : null)
        );

        // Chạy song song cả 2 loại query
        const [userResults, shopResults] = await Promise.all([
            Promise.all(userPromises),
            Promise.all(shopPromises)
        ]);

        // Kết hợp kết quả, ưu tiên User trước nếu tồn tại
        const likes = userResults.map((user, index) =>
            user || shopResults[index]
        ).filter(Boolean);

        return successResponse(res, 'Danh sách like bình luận', {
            likes,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                total: totalLikes,
                totalPages: Math.ceil(totalLikes / limitNumber)
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách like bình luận', 500, err.message);
    }
};

//Lấy bình luận dạng cây đến 3 tầng
exports.getCommentsByPost = async (req, res) => {
    try {
        const actor = req.actor || {}; // [Grok] Cho phép truy cập không cần đăng nhập, actor rỗng nếu chưa đăng nhập
        const { postId } = req.params;
        const { sortBy = 'newest', page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        let sortQuery = {};
        if (sortBy === 'newest') {
            sortQuery = { createdAt: -1 };
        } else if (sortBy === 'oldest') {
            sortQuery = { createdAt: 1 };
        } else {
            // Mặc định sort theo createdAt nếu không phải top
            sortQuery = { createdAt: -1 };
        }

        // Lấy tầng 1 (bình luận gốc)
        let comments = await Comment.find({ postId, parentId: null })
            .populate('author._id', 'fullName avatar name slug')
            .sort(sortQuery);

        // ✅ Nếu sortBy là 'top', sort theo số lượng likes trong JavaScript
        if (sortBy === 'top') {
            comments = comments.sort((a, b) => {
                const likesA = a.likes?.length || 0;
                const likesB = b.likes?.length || 0;

                // Sort theo likes giảm dần, nếu bằng nhau thì sort theo createdAt mới nhất
                if (likesB !== likesA) {
                    return likesB - likesA;
                }
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
        }

        // Apply pagination sau khi sort
        const paginatedComments = comments.slice(skip, skip + limitNumber);
        
        const commentMap = {};

        // Map tầng 1
        for (let c of comments) {
            const replyCount = await Comment.countDocuments({ parentId: c._id });
            commentMap[c._id] = {
                ...c._doc,
                isLiked: actor._id ? c.likes.includes(actor._id) : false,
                likeCount: c.likes.length,
                replyCount,
                replies: []
            };
        }

        const parentIdsLevel1 = comments.map(c => c._id);

        // Lấy tầng 2
        const level2Replies = await Comment.find({ parentId: { $in: parentIdsLevel1 } })
            .populate('author._id', 'fullName avatar name slug')
            .sort({ createdAt: 1 });

        const parentIdsLevel2 = [];

        for (let r of level2Replies) {
            parentIdsLevel2.push(r._id);

            const replyCount = await Comment.countDocuments({ parentId: r._id });

            if (commentMap[r.parentId]) {
                commentMap[r.parentId].replies.push({
                    ...r._doc,
                    isLiked: actor._id ? r.likes.includes(actor._id) : false,
                    likeCount: r.likes.length,
                    replyCount,
                    replies: []
                });
            }
        }

        // Lấy tất cả replies sâu hơn (tầng 4, 5, ...)
        const deepReplies = await Comment.find({
            parentId: { $nin: parentIdsLevel1 } // loại các replies tầng 2 ra, chỉ lấy sâu hơn
        })
            .populate('author._id', 'fullName avatar name slug')
            .sort({ createdAt: 1 })

        // Gắn các replies sâu hơn này vào reply tương ứng:
        for (let r of deepReplies) {
            if (!r?.parentId) continue; // Bỏ qua nếu không có parent

            for (let c of Object.values(commentMap)) {
                for (let replyLv2 of c.replies) {
                    if (!replyLv2?._id) continue;

                    if (replyLv2._id.toString() === r.parentId.toString()) {
                        replyLv2.replies.push({
                            ...r._doc,
                            isLiked: actor._id ? r.likes.includes(actor._id) : false,
                            likeCount: r.likes.length,
                            replies: []
                        });
                        break;
                    }

                    // Duyệt sâu hơn
                    const stack = [...(replyLv2.replies || [])];
                    while (stack.length) {
                        const node = stack.pop();
                        if (!node?._id) continue;


                        if (node._id.toString() === r.parentId.toString()) {
                            node.replies = node.replies || [];
                            node.replies.push({
                                ...r._doc,
                                isLiked: actor._id ? r.likes.includes(actor._id) : false,
                                likeCount: r.likes.length,
                                replies: [],
                                replyingToName: node.author?.type === 'User'
                                    ? node.author?._id?.fullName
                                    : node.author?._id?.name,
                            });

                            break;
                        }
                        if (node.replies?.length) stack.push(...node.replies);
                    }
                }
            }
        }

        const result = Object.values(commentMap);
        const totalComments = await Comment.countDocuments({ postId, parentId: null });

        return successResponse(res, 'Danh sách bình luận dạng cây (3 tầng) + số like và phản hồi ', {
            comments: result,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalComments / limitNumber),
                totalComments
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy bình luận', 500, err.message);
    }
};

//share bài viết
exports.sharePost = async (req, res) => {
    try {
        const actor = req.actor; // [Grok] Sử dụng actor thay vì req.user
        const { id: postId } = req.params;
        const { content, privacy = 'public' } = req.body;

        console.log('Received data:', { content, privacy }); // Log để kiểm tra

        const originalPost = await Post.findById(postId);
        if (!originalPost) {
            return errorResponse(res, 'Không tìm thấy bài viết', 404);
        }

        // Tạo một bài viết mới dạng share
        const newPost = new Post({
            author: {
                type: actor.type === 'shop' ? 'Shop' : 'User',
                _id: actor._id
            }, // [Grok] Sử dụng author thay vì userId cho Post
            content: content || '',
            sharedPost: postId,
            privacy,
            type: 'share'
        });

        await newPost.save();

        await UserInteraction.create({
            author: {
                type: actor.type === 'shop' ? 'Shop' : 'User',
                _id: actor._id
            }, // [Grok] Lưu author thay vì userId
            targetType: 'post',
            targetId: postId,
            action: 'share',
            metadata: { sharedPostId: newPost._id }
        });

        await Post.findByIdAndUpdate(postId, { $inc: { sharesCount: 1 } });

        return successResponse(res, 'Đã chia sẻ bài viết', newPost);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi chia sẻ', 500, err.message);
    }
};

// Lấy danh sách các lần chia sẻ của bài viết
exports.getPostShares = async (req, res) => {
    try {
        const { postId } = req.params;
        const { page = 1, limit = 10 } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);
        const skip = (pageNumber - 1) * limitNumber;

        // Tìm tất cả bài viết share từ bài viết gốc này
        const shares = await Post.find({
            sharedPost: postId,
            type: 'share'
        })
            .populate('author._id', 'fullName avatar name') // [Grok] Populate author._id để lấy thông tin User hoặc Shop
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNumber);

        const totalShares = await Post.countDocuments({
            sharedPost: postId,
            type: 'share'
        });

        return successResponse(res, 'Danh sách chia sẻ bài viết', {
            shares,
            pagination: {
                page: pageNumber,
                limit: limitNumber,
                totalPages: Math.ceil(totalShares / limitNumber),
                totalItems: totalShares
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách chia sẻ', 500, err.message);
    }
};