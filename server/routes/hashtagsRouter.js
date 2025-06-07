const express = require('express');
const router = express.Router();
const {
    getPopularHashtags,
    searchHashtags
} = require('../controllers/hashtagsController');

// Routes công khai
router.get('/popular', getPopularHashtags);
router.get('/search', searchHashtags);

module.exports = router;