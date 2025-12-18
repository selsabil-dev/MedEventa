// controllers/inscription.controller.js
const { validationResult } = require('express-validator');
const { inscriptionValidationByProfile } = require('../validators/inscription.validators');
const {
  registerInscription,
  getPaymentStatus,
  updatePaymentStatus,
  generateBadge,
  getBadgeByCode,
  getParticipants,
} = require('../models/inscription.model');

// Middleware qui applique la validation dynamique selon le profil
const validateInscription = (req, res, next) => {
  const profil = req.body.profil;
  const validators = inscriptionValidationByProfile(profil);

  Promise.all(validators.map((v) => v.run(req)))
    .then(() => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      next();
    })
    .catch((err) => {
      console.error('Erreur validation inscription:', err);
      res.status(500).json({ message: 'Erreur de validation' });
    });
};

// POST /api/inscriptions/register/:eventId
// Créer une inscription pour un user connecté sur un événement donné
const register = (req, res) => {
  const { eventId } = req.params;
  const { profil } = req.body;

  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  registerInscription(eventId, userId, profil, (err, inscriptionId) => {
    if (err) {
      console.error("Erreur registerInscription:", err);
      return res.status(500).json({ message: "Erreur lors de l'inscription" });
    }

    res.status(201).json({
      message: "Inscription effectuée avec succès",
      inscriptionId,
      profil,
    });
  });
};

// GET /api/inscriptions/:inscriptionId/payment-status
// Récupérer le statut de paiement d'une inscription
const getPaymentStatusController = (req, res) => {
  const { inscriptionId } = req.params;

  getPaymentStatus(inscriptionId, (err, status) => {
    if (err) {
      console.error('Erreur getPaymentStatus:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!status) {
      return res.status(404).json({ message: 'Inscription non trouvée' });
    }

    res.json({
      inscriptionId: Number(inscriptionId),
      statut_paiement: status,
    });
  });
};

// PUT /api/inscriptions/:inscriptionId/payment-status
// Mettre à jour le statut de paiement (orga/admin)
const updatePaymentStatusController = (req, res) => {
  const { inscriptionId } = req.params;
  const { statut_paiement } = req.body;

  const allowed = ['a_payer', 'paye_sur_place', 'paye_en_ligne'];
  if (!allowed.includes(statut_paiement)) {
    return res.status(400).json({ message: 'Statut_paiement invalide' });
  }

  updatePaymentStatus(inscriptionId, statut_paiement, (err, affected) => {
    if (err) {
      console.error('Erreur updatePaymentStatus:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (affected === 0) {
      return res.status(404).json({ message: 'Inscription non trouvée' });
    }

    res.json({
      message: 'Statut de paiement mis à jour',
      inscriptionId: Number(inscriptionId),
      statut_paiement,
    });
  });
};
// POST /api/inscriptions/:inscriptionId/generate-badge
// Générer (ou régénérer) un badge après paiement
const generateBadgeController = (req, res) => {
  const { inscriptionId } = req.params;

  generateBadge(inscriptionId, (err, code) => {
    if (err) {
      console.error('Erreur generateBadgeController:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!code) {
      return res.status(404).json({ message: 'Inscription non trouvée' });
    }

    res.status(201).json({
      message: 'Badge généré avec succès',
      inscriptionId: Number(inscriptionId),
      code_badge: code,
      lien: `/api/inscriptions/badge/${code}`,
    });
  });
};

// GET /api/inscriptions/badge/:code
// Récupérer les infos du badge (carte d'accès)
const getBadgeController = (req, res) => {
  const { code } = req.params;

  getBadgeByCode(code, (err, badgeData) => {
    if (err) {
      console.error('Erreur getBadgeController:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!badgeData) {
      return res.status(404).json({ message: 'Badge introuvable' });
    }

    res.json({
      message: 'Badge trouvé',
      badge: badgeData,
    });
  });
};
// GET /api/inscriptions/event/:eventId/participants?profil=PARTICIPANT
const getParticipantsController = (req, res) => {
  const { eventId } = req.params;
  const profil = req.query.profil || null; // optionnel

  getParticipants(eventId, profil, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    const participants = rows.map((row) => ({
      inscriptionId: row.inscription_id,
      utilisateurId: row.utilisateur_id,
      nom: row.nom,
      prenom: row.prenom,
      email: row.email,
      profil: row.profil,
      statut_paiement: row.statut_paiement,
      badge: row.badge,
      date_inscription: row.date_inscription,
    }));

    res.json({ eventId: Number(eventId), participants });
  });
};

module.exports = {
  validateInscription,
  register,
  getPaymentStatusController,
  updatePaymentStatusController,
  generateBadgeController,
  getBadgeController,
  getParticipantsController,

};
