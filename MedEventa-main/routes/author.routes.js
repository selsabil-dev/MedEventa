// routes/author.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middlewares');
const { getAuthorStats, getAuthorSubmissions } = require('../controllers/author.controller');

// GET /api/author/stats
router.get('/stats', verifyToken, getAuthorStats);

// GET /api/author/submissions
router.get('/submissions', verifyToken, getAuthorSubmissions);

module.exports = router;
