const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    author: {
        type: {
            type: String,
            enum: ['User', 'Shop'],
            required: true
        },
        _id: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'author.type' } //refPath: 'author.type' cho phép Mongoose populate linh hoạt theo kiểu (User hoặc Shop).
    },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, //id của comment cha, nếu có thì nó là reply, còn null thì nó là comment
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, refPath: 'author.type' }],
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Comment', commentSchema);
