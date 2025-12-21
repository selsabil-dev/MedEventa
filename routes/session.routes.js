// routes/session.routes.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth.middlewares');
const { requirePermission } = require('../middlewares/permissions');
const { createSessionValidation } = require('../validators/session.validators');
const { createSessionController } = require('../controllers/session.controller');

// Phase 1 : création de session scientifique
// POST /events/:eventId/sessions/create
router.post(
  '/events/:eventId/sessions/create',
  verifyToken,
  requirePermission('manage_program'),
  createSessionValidation,
  createSessionController
);

module.exports = router;
