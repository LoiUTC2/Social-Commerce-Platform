const User = require('../models/User');
const Shop = require('../models/Shop');
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');
const { trackInteraction } = require('../middleware/interactionMiddleware');

// Helper function để cập nhật số lượng follow (tính toán lại chính xác)
async function updateFollowCounts(entityId, entityType) {
    try {
        // Tính followers count (số người follow entity này)
        const followersCount = await UserInteraction.countDocuments({
            targetType: entityType,
            targetId: entityId,
            action: 'follow'
        });

        // Tính following count (số entity mà entity này đang follow)
        const authorType = entityType === 'user' ? 'User' : 'Shop';
        const followingCount = await UserInteraction.countDocuments({
            'author._id': entityId,
            'author.type': authorType,
            action: 'follow'
        });

        // Cập nhật vào database
        if (entityType === 'user') {
            await User.findByIdAndUpdate(
                entityId,
                {
                    'stats.followersCount': followersCount,
                    'stats.followingCount': followingCount,
                    updatedAt: new Date()
                },
                { new: true }
            );
        } else if (entityType === 'shop') {
            await Shop.findByIdAndUpdate(
                entityId,
                {
                    'stats.followersCount': followersCount,
                    'stats.followingCount': followingCount,
                    updatedAt: new Date()
                },
                { new: true }
            );
        }

        console.log(`Updated ${entityType} ${entityId} - Followers: ${followersCount}, Following: ${followingCount}`);

        return { followersCount, followingCount };
    } catch (error) {
        console.error(`Error updating follow counts for ${entityType} ${entityId}:`, error);
        throw error; // Throw error để có thể handle ở level cao hơn
    }
}

// Helper function để cập nhật follow count cho một entity cụ thể
async function updateSingleEntityFollowCount(entityId, entityType, countType) {
    try {
        let count = 0;

        if (countType === 'followers') {
            // Đếm số followers thực tế từ UserInteraction
            count = await UserInteraction.countDocuments({
                targetType: entityType,
                targetId: entityId,
                action: 'follow'
            });
        } else if (countType === 'following') {
            // Đếm số following thực tế từ UserInteraction
            const authorType = entityType === 'user' ? 'User' : 'Shop';
            count = await UserInteraction.countDocuments({
                'author._id': entityId,
                'author.type': authorType,
                action: 'follow'
            });
        }

        const updateField = `stats.${countType}Count`;

        if (entityType === 'user') {
            await User.findByIdAndUpdate(
                entityId,
                {
                    [updateField]: count,
                    updatedAt: new Date()
                },
                { new: true }
            );
        } else if (entityType === 'shop') {
            await Shop.findByIdAndUpdate(
                entityId,
                {
                    [updateField]: count,
                    updatedAt: new Date()
                },
                { new: true }
            );
        }

        console.log(`Updated ${entityType} ${entityId} ${countType}: ${count}`);
        return count;
    } catch (error) {
        console.error(`Error updating ${countType} count:`, error);
        throw error;
    }
}

exports.toggleFollow = async (req, res) => {
    try {
        const actor = req.actor;
        const { targetId, targetType } = req.body;

        if (!targetId || !targetType) {
            return errorResponse(res, 'Thiếu targetId hoặc targetType', 400);
        }

        if (!['user', 'shop'].includes(targetType)) {
            return errorResponse(res, 'Loại đối tượng không hợp lệ', 400);
        }

        // Kiểm tra target có tồn tại không
        let targetEntity;
        if (targetType === 'user') {
            targetEntity = await User.findById(targetId);
        } else {
            targetEntity = await Shop.findById(targetId);
        }

        if (!targetEntity) {
            return errorResponse(res, `Không tìm thấy ${targetType} với ID này`, 404);
        }

        // Không cho phép follow chính mình
        if (actor._id.toString() === targetId.toString()) {
            return errorResponse(res, 'Không thể follow chính mình', 400);
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

        // Cập nhật follow counts cho cả target và actor
        try {
            // Cập nhật followers count của target
            const targetFollowersCount = await updateSingleEntityFollowCount(targetId, targetType, 'followers');

            // Cập nhật following count của actor
            const actorType = actor.type === 'shop' ? 'shop' : 'user';
            const actorFollowingCount = await updateSingleEntityFollowCount(actor._id, actorType, 'following');

            return successResponse(res, `${interactionAction === 'follow' ? 'Follow' : 'Unfollow'} thành công`, {
                isFollowing,
                targetFollowersCount,
                actorFollowingCount,
                target: {
                    id: targetId,
                    type: targetType,
                    followersCount: targetFollowersCount
                },
                actor: {
                    id: actor._id,
                    type: actorType,
                    followingCount: actorFollowingCount
                }
            });
        } catch (countError) {
            console.error('Error updating follow counts:', countError);
            // Vẫn trả về success vì interaction đã được xử lý thành công
            return successResponse(res, `${interactionAction === 'follow' ? 'Follow' : 'Unfollow'} thành công`, {
                isFollowing,
                note: 'Follow thành công nhưng có lỗi khi cập nhật số liệu thống kê'
            });
        }
    } catch (err) {
        console.error('Toggle follow error:', err);
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
// exports.getFollowList = async (req, res) => {
//     try {
//         const { slug, listType } = req.params;
//         const { entityType = 'all', page = 1, limit = 10 } = req.query;
//         const skip = (parseInt(page) - 1) * parseInt(limit);

//         const viewer = req.actor; // Có thể undefined nếu chưa đăng nhập

//         if (!['followers', 'following'].includes(listType)) {
//             return errorResponse(res, 'listType phải là "followers" hoặc "following"', 400);
//         }

//         // Tìm entity theo slug
//         let target, targetModel, targetType;
//         const user = await User.findOne({ slug }).select('_id fullName avatar slug');
//         if (user) {
//             target = user;
//             targetModel = 'User';
//             targetType = 'user';
//         } else {
//             const shop = await Shop.findOne({ slug }).select('_id name avatar slug');
//             if (shop) {
//                 target = shop;
//                 targetModel = 'Shop';
//                 targetType = 'shop';
//             }
//         }

//         if (!target) {
//             return errorResponse(res, 'Không tìm thấy user hoặc shop với slug này', 404);
//         }

//         // Truy vấn tương tác
//         const matchQuery = { action: 'follow' };
//         if (listType === 'followers') {
//             matchQuery.targetType = targetType;
//             matchQuery.targetId = target._id;
//         } else {
//             matchQuery['author.type'] = targetModel;
//             matchQuery['author._id'] = target._id;
//         }

//         const total = await UserInteraction.countDocuments(matchQuery);
//         const interactions = await UserInteraction.find(matchQuery)
//             .sort({ timestamp: -1 })
//             .skip(skip)
//             .limit(parseInt(limit))
//             .lean();

//         const ids = interactions.map(i =>
//             listType === 'followers' ? i.author._id : i.targetId
//         );

//         const [users, shops] = await Promise.all([
//             entityType !== 'shop'
//                 ? User.find({ _id: { $in: ids } }).select('fullName avatar slug').lean()
//                 : [],
//             entityType !== 'user'
//                 ? Shop.find({ _id: { $in: ids } }).select('name avatar slug').lean()
//                 : []
//         ]);

//         const results = [];

//         for (const i of interactions) {
//             const id = listType === 'followers' ? i.author._id.toString() : i.targetId.toString();
//             const type = listType === 'followers' ? i.author.type : i.targetType;

//             let entry = null;

//             if (type === 'User') {
//                 const found = users.find(u => u._id.toString() === id);
//                 if (found) {
//                     entry = { ...found, type: 'user' };
//                 }
//             } else if (type === 'Shop') {
//                 const found = shops.find(s => s._id.toString() === id);
//                 if (found) {
//                     entry = { ...found, type: 'shop' };
//                 }
//             }

//             if (entry && viewer) {
//                 const viewerType = viewer.type === 'shop' ? 'Shop' : 'User';

//                 const isFollowing = await UserInteraction.exists({
//                     'author._id': viewer._id,
//                     'author.type': viewerType,
//                     targetId: entry._id,
//                     targetType: entry.type,
//                     action: 'follow'
//                 });

//                 entry.isFollowing = !!isFollowing;
//             }

//             if (entry) results.push(entry);
//         }

//         return successResponse(res, `Danh sách ${listType} của ${slug}`, {
//             list: results,
//             pagination: {
//                 page: parseInt(page),
//                 limit: parseInt(limit),
//                 total,
//                 totalPages: Math.ceil(total / limit)
//             },
//             entity: {
//                 _id: target._id,
//                 slug: target.slug,
//                 type: targetType,
//                 followersCount: targetType === 'user'
//                     ? target.stats?.followersCount || 0
//                     : target.stats?.followersCount || 0,
//                 followingCount: targetType === 'user'
//                     ? target.stats?.followingCount || 0
//                     : target.stats?.followingCount || 0
//             }
//         });
//     } catch (err) {
//         return errorResponse(res, 'Lỗi khi lấy danh sách follow', 500, err.message);
//     }
// };

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
        const user = await User.findOne({ slug }).select('_id fullName avatar slug stats');
        if (user) {
            target = user;
            targetModel = 'User';
            targetType = 'user';
        } else {
            const shop = await Shop.findOne({ slug }).select('_id name avatar slug stats');
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
        let matchQuery = { action: 'follow' };
        let populateField = ''; // Để xác định field nào cần populate

        if (listType === 'followers') {
            // Lấy danh sách những người follow target này
            matchQuery.targetType = targetType;
            matchQuery.targetId = target._id;
            populateField = 'author'; // Populate author (người follow)
        } else { // following
            // Lấy danh sách những người/shop mà target này đang follow
            matchQuery['author.type'] = targetModel;
            matchQuery['author._id'] = target._id;
            populateField = 'target'; // Populate target (người được follow)
        }

        // Đếm tổng số
        const total = await UserInteraction.countDocuments(matchQuery);

        // Lấy danh sách interactions
        const interactions = await UserInteraction.find(matchQuery)
            .sort({ timestamp: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        if (interactions.length === 0) {
            return successResponse(res, `Danh sách ${listType} của ${slug}`, {
                list: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    totalPages: 0
                },
                entity: {
                    _id: target._id,
                    slug: target.slug,
                    type: targetType,
                    followersCount: target.stats?.followersCount || 0,
                    followingCount: target.stats?.followingCount || 0
                }
            });
        }

        // Tách ra các ID và type cần query
        const userIds = [];
        const shopIds = [];

        for (const interaction of interactions) {
            if (listType === 'followers') {
                // Lấy thông tin những người follow
                if (interaction.author.type === 'User') {
                    userIds.push(interaction.author._id);
                } else if (interaction.author.type === 'Shop') {
                    shopIds.push(interaction.author._id);
                }
            } else { // following
                // Lấy thông tin những người được follow
                if (interaction.targetType === 'user') {
                    userIds.push(interaction.targetId);
                } else if (interaction.targetType === 'shop') {
                    shopIds.push(interaction.targetId);
                }
            }
        }

        // Query thông tin users và shops
        const [users, shops] = await Promise.all([
            userIds.length > 0 && entityType !== 'shop'
                ? User.find({ _id: { $in: userIds } })
                    .select('_id fullName avatar slug stats')
                    .lean()
                : [],
            shopIds.length > 0 && entityType !== 'user'
                ? Shop.find({ _id: { $in: shopIds } })
                    .select('_id name avatar slug stats')
                    .lean()
                : []
        ]);

        // Xây dựng kết quả
        const results = [];

        for (const interaction of interactions) {
            let entityId, entityType_internal, entityData = null;

            if (listType === 'followers') {
                entityId = interaction.author._id.toString();
                entityType_internal = interaction.author.type;
            } else { // following
                entityId = interaction.targetId.toString();
                entityType_internal = interaction.targetType;
            }

            // Tìm thông tin entity
            if (entityType_internal === 'User' || entityType_internal === 'user') {
                const found = users.find(u => u._id.toString() === entityId);
                if (found) {
                    entityData = {
                        _id: found._id,
                        fullName: found.fullName,
                        avatar: found.avatar,
                        slug: found.slug,
                        type: 'user',
                        followersCount: found.stats?.followersCount || 0,
                        followingCount: found.stats?.followingCount || 0,
                        followedAt: interaction.timestamp
                    };
                }
            } else if (entityType_internal === 'Shop' || entityType_internal === 'shop') {
                const found = shops.find(s => s._id.toString() === entityId);
                if (found) {
                    entityData = {
                        _id: found._id,
                        name: found.name,
                        avatar: found.avatar,
                        slug: found.slug,
                        type: 'shop',
                        followersCount: found.stats?.followersCount || 0,
                        followingCount: found.stats?.followingCount || 0,
                        followedAt: interaction.timestamp
                    };
                }
            }

            // Kiểm tra trạng thái follow của viewer với entity này
            if (entityData && viewer) {
                const viewerType = viewer.type === 'shop' ? 'Shop' : 'User';

                const isFollowing = await UserInteraction.exists({
                    'author._id': viewer._id,
                    'author.type': viewerType,
                    targetId: entityData._id,
                    targetType: entityData.type,
                    action: 'follow'
                });

                entityData.isFollowing = !!isFollowing;
            } else if (entityData) {
                entityData.isFollowing = false;
            }

            if (entityData) {
                results.push(entityData);
            }
        }

        return successResponse(res, `Danh sách ${listType} của ${slug}`, {
            list: results,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            },
            entity: {
                _id: target._id,
                slug: target.slug,
                name: targetType === 'user' ? target.fullName : target.name,
                type: targetType,
                followersCount: target.stats?.followersCount || 0,
                followingCount: target.stats?.followingCount || 0
            }
        });
    } catch (err) {
        console.error('Get follow list error:', err);
        return errorResponse(res, 'Lỗi khi lấy danh sách follow', 500, err.message);
    }
};


