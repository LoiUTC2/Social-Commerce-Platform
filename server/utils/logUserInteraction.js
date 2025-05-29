const UserInteraction = require('../models/UserInteraction');

/**
 * Ghi nhận hành vi người dùng hoặc shop
 * @param {Object} actor - từ req.actor
 * @param {Object} options
 * @param {String} options.targetType - 'post' | 'product' | ...
 * @param {String} options.targetId - ID đối tượng tương tác
 * @param {String} options.action - 'like' | 'save' | ...
 * @param {Object} [options.metadata] - thêm thông tin nếu cần
 */
const logUserInteraction = async (actor, { targetType, targetId, action, metadata = {} }) => {
    try {
        if (!actor || !actor._id || !actor.type) return;

        await UserInteraction.create({
            author: {
                _id: actor._id,
                type: actor.type === "shop" ? "Shop" : "User" 
            },
            targetType,
            targetId,
            action,
            metadata
        });
    } catch (err) {
        console.error('Ghi hành vi thất bại:', err.message);
    }
};

module.exports = logUserInteraction;
