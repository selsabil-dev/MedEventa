// routes/session.routes.js
const express = require('express');
const router = express.Router();

const {
  createSessionController,
  assignCommunicationController,
  getProgramController,
  getDetailedProgramController,
} = require('../controllers/session.controller');

const { createSessionValidation } = require('../validators/session.validators');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permissions');

// PHASE 1 : création de session
// POST /events/:eventId/sessions/create
router.post(
  '/events/:eventId/sessions/create',
  verifyToken,
  requirePermission('manage_program'),
  createSessionValidation,
  createSessionController
);

// PHASE 2 : affectation d’une communication à une session
// POST /sessions/:sessionId/assign-communication
router.post(
  '/sessions/:sessionId/assign-communication',
  verifyToken,
  requirePermission('manage_program'),
  assignCommunicationController
);

// PHASE 3 : visualisation du programme (global)
// GET /events/:eventId/program  (publique)
router.get('/events/:eventId/program', getProgramController);

// PHASE 3 : visualisation détaillée par jour
// GET /events/:eventId/program/detailed?date=YYYY-MM-DD  (publique)
router.get('/events/:eventId/program/detailed', getDetailedProgramController);

module.exports = router;
