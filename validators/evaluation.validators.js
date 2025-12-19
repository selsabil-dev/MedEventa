// validators/evaluation.validators.js
const { body } = require('express-validator');


// La vérification "existe en BD + rôle MEMBRE_COMITE" sera faite dans le controller.

const assignManualValidation = [
  body('propositionId')
    .isInt({ min: 1 })
    .withMessage('propositionId doit être un entier positif'),

  body('evaluateurIds')
    .isArray({ min: 1 })
    .withMessage('evaluateurIds doit être un tableau non vide'),

  body('evaluateurIds.*')
    .isInt({ min: 1 })
    .withMessage('Chaque evaluateurId doit être un entier positif'),
];

module.exports = {
  assignManualValidation,
};
