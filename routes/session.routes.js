// routes/session.routes.js
const express = require('express');
const router = express.Router();

const {
  createSessionController,
  assignCommunicationController,
  getProgramController,
  getDetailedProgramController,
  updateSessionController,      // ⬅️ importer
} = require('../controllers/session.controller');

const { createSessionValidation } = require('../validators/session.validators');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permissions');

// PHASE 1 : création de session
router.post(
  '/events/:eventId/sessions/create',
  verifyToken,
  requirePermission('manage_program'),
  createSessionValidation,
  createSessionController
);

// PHASE 2 : affectation d’une communication à une session
router.post(
  '/sessions/:sessionId/assign-communication',
  verifyToken,
  requirePermission('manage_program'),
  assignCommunicationController
);

// PHASE 3 : programme global
router.get('/events/:eventId/program', getProgramController);

// PHASE 3 : programme détaillé
router.get('/events/:eventId/program/detailed', getDetailedProgramController);

// PHASE 4 : mise à jour de session
router.put(
  '/sessions/:sessionId/update',
  verifyToken,
  requirePermission('manage_program'),
  createSessionValidation,     // optionnel mais conseillé pour revalider titre/horaire/salle/president_id
  updateSessionController
);

module.exports = router;
