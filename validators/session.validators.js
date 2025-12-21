// validators/session.validators.js
const { body, validationResult } = require('express-validator');

const createSessionValidation = [
  body('titre').notEmpty().withMessage('Le titre est obligatoire'),
  body('horaire')
    .isISO8601()
    .withMessage('L\'horaire doit être une date valide (ISO8601)'),
  body('salle').notEmpty().withMessage('La salle est obligatoire'),
  body('id_president')
    .isInt()
    .withMessage('id_president doit être un entier'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  },
];

module.exports = {
  createSessionValidation,
};
