// routes/interactionRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const interactionController = require('../controllers/interactionController');

router.post('/', verifyToken, interactionController.recordInteraction);

module.exports = router;
