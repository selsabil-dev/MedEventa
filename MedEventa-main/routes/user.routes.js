// routes/user.routes.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/auth.middlewares');
const { getUsersByRole } = require('../controllers/user.controller');

// GET /api/users/role/:role
router.get('/role/:role', verifyToken, getUsersByRole);

module.exports = router;
