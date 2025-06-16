const Post = require('../models/Post');

const populatePostDetails = (query) => {
    return query
        .populate({
            path: 'author._id',
            select: 'fullName avatar name slug',
        })
        .populate({
            path: 'sharedPost',
            select: 'content images videos privacy createdAt author productIds',
            populate: [
                {
                    path: 'author._id',
                    select: 'fullName avatar name slug',
                },
                {
                    path: 'productIds',
                    select: 'name price discount images videos stock soldCount slug seller',
                    populate: {
                        path: 'seller',
                        select: 'name slug avatar',
                        model: 'Shop',
                    },
                },
            ],
        })
        .populate({
            path: 'productIds',
            select: 'name price discount images videos stock soldCount slug seller',
            populate: {
                path: 'seller',
                select: 'name slug avatar',
                model: 'Shop',
            }
        })
        .lean();
};

module.exports = { populatePostDetails };
