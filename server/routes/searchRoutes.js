const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyToken, setActor } = require('../middleware/authMiddleware');
const { trackSearch, ensureSessionId, trackTiming } = require('../middleware/interactionMiddleware');

// Debug middleware để log requests
const debugMiddleware = (req, res, next) => {
    console.log(`🔍 Search request: ${req.method} ${req.path}`);
    console.log(`🔍 Query params:`, req.query);
    console.log(`🔍 Session ID:`, req.sessionId);
    next();
};

// Middleware áp dụng cho tất cả routes
router.use(debugMiddleware); // Debug logging
router.use(ensureSessionId); // Đảm bảo có sessionId
router.use(trackTiming); // Track thời gian response (optional)
router.use(verifyToken); // Verify JWT token (cho phép null)
router.use(setActor); // Set actor info

// Tìm kiếm tổng hợp (tất cả loại) - SỬ DỤNG trackSearch middleware
router.get('/all', trackSearch, searchController.searchAll);

// Tìm kiếm sản phẩm - SỬ DỤNG trackSearch middleware
router.get('/products', trackSearch, searchController.searchProducts);

// Tìm kiếm shop - SỬ DỤNG trackSearch middleware
router.get('/shops', trackSearch, searchController.searchShops);

// Tìm kiếm người dùng - SỬ DỤNG trackSearch middleware
router.get('/users', trackSearch, searchController.searchUsers);

// Tìm kiếm bài viết - SỬ DỤNG trackSearch middleware
router.get('/posts', trackSearch, searchController.searchPosts);

//Tìm kiếm theo Hashtag
router.get('/hashtag', trackSearch, searchController.searchByHashtag);

//Tìm kiếm theo Category
router.get('/category', trackSearch, searchController.searchByCategory);

// Lấy từ khóa tìm kiếm phổ biến (không cần track vì không phải search)
router.get('/popular', searchController.getPopularSearches);

// Gợi ý tìm kiếm (không cần track vì chỉ là gợi ý, không phải search thực sự)
router.get('/suggestions', searchController.searchSuggestions);

module.exports = router;