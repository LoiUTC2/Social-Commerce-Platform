const mongoose = require('mongoose');

const questionnaireSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  interests: [String],
  shoppingGoals: [String],
  budgetRange: String,
  ageRange: String,
  gender: String,
  location: String,
  otherPreferences: String,
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Questionnaire', questionnaireSchema);
