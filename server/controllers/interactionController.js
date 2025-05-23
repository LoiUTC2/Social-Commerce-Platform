// controllers/interactionController.js
const UserInteraction = require('../models/UserInteraction');
const { successResponse, errorResponse } = require('../utils/response');

exports.recordInteraction = async (req, res) => {
  try {
    const actor = req.actor;
    const { targetType, targetId, action, metadata } = req.body;

    const interaction = new UserInteraction({
      author: {
        type: actor.type === "user" ? "User" : "Shop",
        _id: actor._id,
      },
      targetType,
      targetId,
      action,
      metadata
    });

    await interaction.save();
    return successResponse(res, "Ghi nhận hành vi thành công", interaction);
  } catch (err) {
    return errorResponse(res, "Lỗi ghi nhận hành vi", 500, err.message);
  }
};
