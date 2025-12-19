// routes/evaluation.routes.js
const express = require('express');
const router = express.Router();

const { assignManually , getEvaluationFormController,
  submitEvaluationController,} = require('../controllers/evaluation.controller');
const { assignManualValidation ,submitEvaluationValidation, } = require('../validators/evaluation.validators');
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
// POST /api/evaluations/event/:eventId/assign-manual (Phase 1)
router.post(
  '/event/:eventId/assign-manual',
  verifyToken,
  requirePermission('manage_evaluations'),
  assignManualValidation,
  assignManually
);

// GET /api/evaluations/evaluation/:evaluationId/form (Phase 2)
router.get(
  '/evaluation/:evaluationId/form',
  verifyToken,
  requirePermission('evaluate_communications'),
  getEvaluationFormController
);

// POST /api/evaluations/evaluation/:evaluationId/submit (Phase 2)
router.post(
  '/evaluation/:evaluationId/submit',
  verifyToken,
  requirePermission('evaluate_communications'),
  submitEvaluationValidation,
  submitEvaluationController
);
module.exports = router;
