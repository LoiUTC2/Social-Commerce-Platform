// routes/interactionRoutes.js
const express = require('express');
const router = express.Router();
const { verifyToken, setActor} = require('../middleware/authMiddleware');
const interactionController = require('../controllers/interactionController');

router.post('/', verifyToken, setActor, interactionController.recordInteraction);

module.exports = router;
