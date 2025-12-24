// validators/stats.validators.js
const { param } = require('express-validator');

const validateEventIdParam = [
  param('eventId')
    .isInt({ min: 1 })
    .withMessage('eventId doit être un entier positif')
];

module.exports = { validateEventIdParam };
