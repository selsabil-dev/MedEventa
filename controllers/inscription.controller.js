// controllers/inscription.controller.js
const { validationResult } = require('express-validator');
const { registerInscription } = require('../models/inscription.model');
const { inscriptionValidationByProfile } = require('../validators/inscription.validators');

// Middleware qui applique la validation dynamique
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
const register = (req, res) => {
  const { eventId } = req.params;
  const { profil } = req.body;

  const userId = req.user && req.user.id;
  if (!userId) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }

  registerInscription(eventId, userId, profil, (err, inscriptionId) => {
    if (err) {
      return res.status(500).json({ message: "Erreur lors de l'inscription" });
    }

    res.status(201).json({
      message: "Inscription effectuée avec succès",
      inscriptionId,
      profil,
    });
  });
};

module.exports = {
  validateInscription,
  register,
};
