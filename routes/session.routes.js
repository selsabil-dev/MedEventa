// routes/session.routes.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth.middlewares');
const { requirePermission } = require('../middlewares/permissions');
const { createSessionValidation , updateSessionValidation,} = require('../validators/session.validators');
const { createSessionController, assignCommunicationController ,getProgramController,
  getDetailedProgramController,updateSessionController,} = require('../controllers/session.controller');

// Phase 1 : création de session scientifique
// POST /events/:eventId/sessions/create
router.post(
  '/events/:eventId/sessions/create',
  verifyToken,
  requirePermission('manage_program'),
  createSessionValidation,
  createSessionController
);
// Phase 2 : attribution d'une communication acceptée à une session
router.post(
  '/sessions/:sessionId/assign-communication',
  verifyToken,
  requirePermission('manage_program'),
  assignCommunicationController
);
// Phase 3 : programme global (public)
router.get('/events/:eventId/program', getProgramController);

// Phase 3 : programme détaillé par jour (public)
router.get('/events/:eventId/program/detailed', getDetailedProgramController);

// Phase 4 : mise à jour de session
router.put(
  '/sessions/:sessionId/update',
  verifyToken,
  requirePermission('manage_program'),
  updateSessionValidation,
  updateSessionController
);
module.exports = router;
