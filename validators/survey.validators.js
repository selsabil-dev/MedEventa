// validators/survey.validators.js
const { body } = require('express-validator');

const createSurveyValidation = [
  body('title')
    .notEmpty().withMessage('Titre obligatoire')
    .isLength({ max: 255 }).withMessage('Titre trop long'),
  body('questions')
    .isArray({ min: 1 }).withMessage('Questions doit être un tableau non vide'),
  body('questions.*')
    .isString().withMessage('Chaque question doit être une chaîne de caractères'),
];

const submitResponseValidation = [
  body('responses')
    .isArray({ min: 1 }).withMessage('Responses doit être un tableau non vide'),
  body('responses.*.questionId')
    .isInt().withMessage('questionId doit être un entier'),
  body('responses.*.answer')
    .notEmpty().withMessage('Réponse obligatoire'),
];

module.exports = {
  createSurveyValidation,
  submitResponseValidation,
};
