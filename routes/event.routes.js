// routes/event.routes.js
const express = require('express');
const router = express.Router();

const {
  createEventController,
  addComiteController,
  addInviteController,
  getEventsController,
  getEventDetailsController,
} = require('../controllers/event.controller');

const { verifyToken } = require('../middlewares/auth.middlewares');
const { hasPermission } = require('../middlewares/permissions');
const { createEventValidation, validate } = require('../middlewares/event.validators');

// Middleware pour vérifier une permission
const requirePermission = (permission) => (req, res, next) => {
  console.log('User in requirePermission:', req.user);
  console.log('Role:', req.user && req.user.role);
  console.log('Permission needed:', permission);

  if (!req.user || !hasPermission(req.user.role, permission)) {
    return res.status(403).json({ message: 'Permission refusée' });
  }
  next();
};

// Route pour créer un événement
router.post(
  '/create',
  verifyToken,
  requirePermission('create_event'),
  createEventValidation,
  validate,
  createEventController
);

// Ajouter des membres au comité
router.post(
  '/:eventId/add-comite',
  verifyToken,
  requirePermission('create_event'),
  addComiteController
);

// Ajouter des invités
router.post(
  '/:eventId/add-invite',
  verifyToken,
  requirePermission('create_event'),
  addInviteController
);

// Récupérer la liste des événements
router.get('/', getEventsController);

// Récupérer les détails d’un événement
router.get('/:id', getEventDetailsController);

module.exports = router;
