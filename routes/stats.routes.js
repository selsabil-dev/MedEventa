// routes/stats.routes.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permissions');

const { validateEventIdParam } = require('../validators/stats.validators');
const { getEventStats } = require('../controllers/stats.controller');

// GET /api/events/:eventId/stats
router.get(
  '/events/:eventId/stats',
  verifyToken,
  requirePermission('view_stats'),
  validateEventIdParam,
  getEventStats
);

module.exports = router;
