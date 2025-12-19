// routes/evaluation.routes.js
const express = require('express');
const router = express.Router();

const { assignManually } = require('../controllers/evaluation.controller');
const { assignManualValidation } = require('../validators/evaluation.validators');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permissions');

// POST /api/evaluations/event/:eventId/assign-manual
router.post(
  '/event/:eventId/assign-manual',
  verifyToken,
  requirePermission('manage_evaluations'),   // à ajouter dans permissions.js si pas encore fait
  assignManualValidation,
  assignManually
);

module.exports = router;
