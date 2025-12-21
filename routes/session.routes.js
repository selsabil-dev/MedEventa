const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth.middleware');
const { requirePermission } = require('../middleware/permissions');
const { createSessionValidation } = require('../validators/session.validators');
const { createSessionController } = require('../controllers/session.controller');

// POST /events/:eventId/sessions/create
router.post(
  '/events/:eventId/sessions/create',
  verifyToken,
  requirePermission('manage_program'),
  createSessionValidation,
  createSessionController
);

module.exports = router;
