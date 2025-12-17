// routes/inscription.routes.js
const express = require('express');
const router = express.Router();

const { register, validateInscription } = require('../controllers/inscription.controller');
const { verifyToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permissions');

// POST /api/inscriptions/register/:eventId
router.post(
  '/register/:eventId',
  verifyToken,
  requirePermission('register_event'),
  validateInscription,
  register
);

module.exports = router;
