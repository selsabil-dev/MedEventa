const express = require('express');
const router = express.Router();
const {
  createSessionController,
  getSessionsByEventController,
  getSessionByIdController,
  updateSessionController,
  deleteSessionController,
} = require('../controllers/session.controller');

// Middleware d’auth si besoin, par ex. :
const { verifyToken } = require('../middlewares/auth.middleware');

// Sessions liées à un événement
router.post('/events/:eventId/sessions', verifyToken, createSessionController);
router.get('/events/:eventId/sessions', getSessionsByEventController);

// Opérations sur une session individuelle
router.get('/sessions/:id', getSessionByIdController);
router.put('/sessions/:id', verifyToken, updateSessionController);
router.delete('/sessions/:id', verifyToken, deleteSessionController);

module.exports = router;
