// validators/question.validators.js
const { body } = require('express-validator');

const submitQuestionValidation = [
  body('contenu')
    .notEmpty().withMessage('Le contenu de la question est obligatoire')
    .isLength({ max: 500 }).withMessage('La question ne doit pas dépasser 500 caractères'),
];

module.exports = {
  submitQuestionValidation,
};
