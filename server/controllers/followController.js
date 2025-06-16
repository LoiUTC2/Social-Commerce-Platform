const User = require('../models/User');
const Shop = require('../models/Shop');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const { trackInteraction } = require('../middleware/interactionMiddleware');

exports.toggleFollow = async (req, res) => {
    try {
        const actor = req.actor;
        const { targetId, targetType } = req.body; //người bạn muốn follow

        if (!targetId || !targetType) {
            return errorResponse(res, 'Thiếu targetId hoặc targetType', 400);
        }

        if (!['user', 'shop'].includes(targetType)) {
            return errorResponse(res, 'Loại đối tượng không hợp lệ', 400);
        }

        const authorType = actor.type === 'shop' ? 'Shop' : 'User';

        const existing = await UserInteraction.findOne({
            'author._id': actor._id,
            'author.type': authorType,
            targetId,
            targetType,
            action: 'follow'
        });

        let isFollowing = false;
        let interactionAction = '';
        let metadata = {};

        if (existing) {
            // Nếu đã follow → unfollow
            await existing.deleteOne();
            interactionAction = 'unfollow';
            isFollowing = false;
            metadata.unfollowedAt = new Date().toISOString();
        } else {
            // Nếu chưa follow → follow
            interactionAction = 'follow';
            isFollowing = true;
            metadata.followedAt = new Date().toISOString();
        }

        // Ghi nhận hành vi follow/unfollow
        req.body = {
            targetType,
            targetId,
            action: interactionAction,
            metadata
        };
        await trackInteraction(req, res, () => { });

        // Đếm lại số lượng followers hiện tại
        const followerCount = await UserInteraction.countDocuments({
            targetType,
            targetId,
            action: 'follow'
        });

        return successResponse(res, `${interactionAction === 'follow' ? 'Follow' : 'Unfollow'} thành công`, {
            isFollowing,
            followerCount
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi toggle follow', 500, err.message);
    }
};

// Kiểm tra trạng thái follow của một target
exports.checkFollowStatus = async (req, res) => {
    try {
        const actor = req.actor;
        const { targetId, targetType } = req.params;

        if (!actor) {
            return successResponse(res, 'Trạng thái follow', {
                isFollowing: false
            });
        }

        if (!targetId || !targetType) {
            return errorResponse(res, 'Thiếu targetId hoặc targetType', 400);
        }

        if (!['user', 'shop'].includes(targetType)) {
            return errorResponse(res, 'Loại đối tượng không hợp lệ', 400);
        }

        const authorType = actor.type === 'shop' ? 'Shop' : 'User';

        const isFollowing = await UserInteraction.exists({
            'author._id': actor._id,
            'author.type': authorType,
            targetId,
            targetType,
            action: 'follow'
        });

        return successResponse(res, 'Trạng thái follow', {
            isFollowing: !!isFollowing
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi kiểm tra trạng thái follow', 500, err.message);
    }
};

// Kiểm tra trạng thái follow của nhiều targets (batch check)
exports.batchCheckFollowStatus = async (req, res) => {
    try {
        const actor = req.actor;
        const { targets } = req.body; // Array of {targetId, targetType}

        if (!actor) {
            const result = targets.reduce((acc, target) => {
                acc[`${target.targetId}_${target.targetType}`] = false;
                return acc;
            }, {});
            return successResponse(res, 'Trạng thái follow batch', result);
        }

        const authorType = actor.type === 'shop' ? 'Shop' : 'User';
        const result = {};

        for (const target of targets) {
            const isFollowing = await UserInteraction.exists({
                'author._id': actor._id,
                'author.type': authorType,
                targetId: target.targetId,
                targetType: target.targetType,
                action: 'follow'
            });
            
            result[`${target.targetId}_${target.targetType}`] = !!isFollowing;
        }

        return successResponse(res, 'Trạng thái follow batch', result);
    } catch (err) {
        return errorResponse(res, 'Lỗi khi kiểm tra trạng thái follow batch', 500, err.message);
    }
};

// Giả định viewer có trong req.actor
exports.getFollowList = async (req, res) => {
    try {
        const { slug, listType } = req.params;
        const { entityType = 'all', page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const viewer = req.actor; // Có thể undefined nếu chưa đăng nhập

        if (!['followers', 'following'].includes(listType)) {
            return errorResponse(res, 'listType phải là "followers" hoặc "following"', 400);
        }

        // Tìm entity theo slug
        let target, targetModel, targetType;
        const user = await User.findOne({ slug }).select('_id fullName slug');
        if (user) {
            target = user;
            targetModel = 'User';
            targetType = 'user';
        } else {
            const shop = await Shop.findOne({ slug }).select('_id name slug');
            if (shop) {
                target = shop;
                targetModel = 'Shop';
                targetType = 'shop';
            }
        }

        if (!target) {
            return errorResponse(res, 'Không tìm thấy user hoặc shop với slug này', 404);
        }

        // Truy vấn tương tác
        const matchQuery = { action: 'follow' };
        if (listType === 'followers') {
            matchQuery.targetType = targetType;
            matchQuery.targetId = target._id;
        } else {
            matchQuery['author.type'] = targetModel;
            matchQuery['author._id'] = target._id;
        }

        const total = await UserInteraction.countDocuments(matchQuery);
        const interactions = await UserInteraction.find(matchQuery)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        const ids = interactions.map(i =>
            listType === 'followers' ? i.author._id : i.targetId
        );

        const [users, shops] = await Promise.all([
            entityType !== 'shop'
                ? User.find({ _id: { $in: ids } }).select('fullName avatar slug').lean()
                : [],
            entityType !== 'user'
                ? Shop.find({ _id: { $in: ids } }).select('name avatar slug').lean()
                : []
        ]);

        const results = [];

        for (const i of interactions) {
            const id = listType === 'followers' ? i.author._id.toString() : i.targetId.toString();
            const type = listType === 'followers' ? i.author.type : i.targetType;

            let entry = null;

            if (type === 'User') {
                const found = users.find(u => u._id.toString() === id);
                if (found) {
                    entry = { ...found, type: 'user' };
                }
            } else if (type === 'Shop') {
                const found = shops.find(s => s._id.toString() === id);
                if (found) {
                    entry = { ...found, type: 'shop' };
                }
            }

            if (entry && viewer) {
                const viewerType = viewer.type === 'shop' ? 'Shop' : 'User';

                const isFollowing = await UserInteraction.exists({
                    'author._id': viewer._id,
                    'author.type': viewerType,
                    targetId: entry._id,
                    targetType: entry.type,
                    action: 'follow'
                });

                entry.isFollowing = !!isFollowing;
            }

            if (entry) results.push(entry);
        }

        return successResponse(res, `Danh sách ${listType} của ${slug}`, {
            list: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            },
            entity: {
                _id: target._id,
                slug: target.slug,
                type: targetType
            }
        });
    } catch (err) {
        return errorResponse(res, 'Lỗi khi lấy danh sách follow', 500, err.message);
    }
};


