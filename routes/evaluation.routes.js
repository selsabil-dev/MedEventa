// routes/evaluation.routes.js
const express = require('express');
const router = express.Router();

const {
  assignManually,
  getEvaluationFormController,
  submitEvaluationController,
  generateReportController,
} = require('../controllers/evaluation.controller');

const {
  assignManualValidation,
  submitEvaluationValidation,
} = require('../validators/evaluation.validators');

const { verifyToken } = require('../middlewares/auth.middlewares');
const { requirePermission } = require('../middlewares/permissions');

// POST /api/evaluations/event/:eventId/assign-manual
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

// POST /api/evaluations/proposition/:propositionId/generate-report (Phase 4)
router.post(
  '/proposition/:propositionId/generate-report',
  verifyToken,
  requirePermission('manage_evaluations'),
  generateReportController
);

// PHASE 5 – simple pagination for organiser
router.get(
  '/evaluations',
  verifyToken,
  requirePermission('manage_evaluations'),
  require('../controllers/evaluation.controller').listEvaluations
);

router.get(
  '/rapports',
  verifyToken,
  requirePermission('manage_evaluations'),
  require('../controllers/evaluation.controller').listReports
);

module.exports = router;
