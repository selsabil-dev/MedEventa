const { body } = require('express-validator');

const createSessionValidation = [
  body('titre')
    .notEmpty().withMessage('Titre obligatoire')
    .isLength({ max: 255 }).withMessage('Titre trop long (max 255 caractères)'),
  body('horaire')
    .notEmpty().withMessage('Horaire obligatoire')
    .isISO8601().withMessage('Horaire invalide (utilisez YYYY-MM-DDTHH:MM:SS)'),
  body('salle')
    .notEmpty().withMessage('Salle obligatoire')
    .isLength({ max: 100 }).withMessage('Salle trop long (max 100 caractères)'),
  body('president_id')
    .isInt({ min: 1 }).withMessage('ID président doit être un entier positif')
];
// Pour update : tous les champs sont optionnels, mais contrôlés s’ils existent
const updateSessionValidation = [
  body('titre')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 255 }).withMessage('Titre trop long'),
  body('horaire')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601().withMessage('Horaire invalide'),
  body('salle')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 100 }).withMessage('Salle trop long'),
  body('president_id')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 1 }).withMessage('ID président doit être un entier positif'),
];
module.exports = {
  createSessionValidation,updateSessionValidation,
};
