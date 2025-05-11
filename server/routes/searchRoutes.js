const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { verifyAccessToken } = require('../middleware/authMiddleware'); 

router.get('/', searchController.search);

module.exports = router;
