// routes/inscription.routes.js
const express = require('express');
const router = express.Router();

const {
  register,
  validateInscription,
  getPaymentStatusController,
  updatePaymentStatusController,
  generateBadgeController,
  getBadgeController,
  getParticipantsController,
} = require('../controllers/inscription.controller');

const { verifyToken } = require('../middlewares/auth.middlewares');
const { requirePermission } = require('../middlewares/permissions');

// POST /api/inscriptions/register/:eventId
router.post(
  '/register/:eventId',
  verifyToken,
  requirePermission('register_event'),
  validateInscription,
  register
);

// GET /api/inscriptions/:inscriptionId/payment-status (user connecté)
router.get(
  '/:inscriptionId/payment-status',
  verifyToken,
  getPaymentStatusController
);

// PUT /api/inscriptions/:inscriptionId/payment-status (admin/orga ONLY)
router.put(
  '/:inscriptionId/payment-status',
  verifyToken,
  requirePermission('manage_inscriptions'),
  updatePaymentStatusController
);

// POST /api/inscriptions/:inscriptionId/generate-badge (orga/admin)
router.post(
  '/:inscriptionId/generate-badge',
  verifyToken,
  requirePermission('manage_inscriptions'),
  generateBadgeController
);

// GET /api/inscriptions/badge/:code (afficher / vérifier le badge)
router.get(
  '/badge/:code',
  verifyToken,
  getBadgeController
);

// GET /api/inscriptions/event/:eventId/participants?profil=COMMUNICANT
router.get(
  '/event/:eventId/participants',
  verifyToken,
  requirePermission('manage_inscriptions'),
  getParticipantsController
);

module.exports = router;
