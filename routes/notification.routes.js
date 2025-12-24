const express = require('express');
const router = express.Router();

const { 
  createTestNotification, 
  getNotifications, 
  markNotificationRead 
} = require('../controllers/notification.controller');

const { testNotificationValidation } = require('../validators/notification.validators');

const { verifyToken } = require('../middlewares/auth.middlewares'); 

// Route de test pour créer une notif à la main
router.post('/notifications/test', verifyToken, testNotificationValidation, createTestNotification);

// Récupérer les notifications de l'utilisateur connecté
router.get('/notifications', verifyToken, getNotifications);

// Marquer une notification comme lue
router.put('/notifications/:id/read', verifyToken, markNotificationRead);

module.exports = router;
