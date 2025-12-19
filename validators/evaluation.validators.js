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
// Validation pour la soumission d'une évaluation (Phase 2)
const submitEvaluationValidation = [
  body('pertinence')
    .isInt({ min: 1, max: 5 })
    .withMessage('pertinence doit être entre 1 et 5'),

  body('qualite_scientifique')
    .isInt({ min: 1, max: 5 })
    .withMessage('qualite_scientifique doit être entre 1 et 5'),

  body('originalite')
    .isInt({ min: 1, max: 5 })
    .withMessage('originalite doit être entre 1 et 5'),

  body('commentaire')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('commentaire max 1000 caractères'),

  body('decision')
    .isIn(['accepter', 'refuser', 'corriger'])
    .withMessage("decision doit être: 'accepter', 'refuser' ou 'corriger'"),
];
module.exports = {
  assignManualValidation, submitEvaluationValidation,
};
