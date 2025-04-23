const mongoose = require('mongoose');

const userInteractionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'product'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  action: { 
    type: String, 
    enum: ['like', 'comment', 'share', 'click', 'view', 'save', 'purchase'], 
    required: true 
  },
  metadata: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserInteraction', userInteractionSchema);
