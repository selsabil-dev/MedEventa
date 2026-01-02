// validators/attestation.validators.js
const { body, query, param } = require('express-validator');

const ALLOWED_TYPES = ['participant', 'communicant', 'membre_comite', 'organisateur', 'invite'];

// ===============================
// Phase 3 (existing)
// ===============================
const validateGenerateMyAttestation = [
  body('evenementId')
    .isInt({ min: 1 })
    .withMessage('evenementId doit être un entier positif'),

  body('type')
    .isIn(ALLOWED_TYPES)
    .withMessage('type invalide'),
];

const validateGenerateAttestationForUser = [
  body('evenementId')
    .isInt({ min: 1 })
    .withMessage('evenementId doit être un entier positif'),

  body('type')
    .isIn(ALLOWED_TYPES)
    .withMessage('type invalide'),

  // ✅ admin لازم يحدد utilisateurId (خليها NOT optional)
  body('utilisateurId')
    .isInt({ min: 1 })
    .withMessage('utilisateurId doit être un entier positif'),

  // ✅ Phase 5: cache bypass
  body('force')
    .optional()
    .isBoolean()
    .withMessage('force doit être boolean')
    .bail()
    .toBoolean(),
];

const validateListEventAttestations = [
  param('evenementId')
    .isInt({ min: 1 })
    .withMessage('evenementId doit être un entier positif'),
];

const validateDownloadMyAttestation = [
  query('evenementId')
    .isInt({ min: 1 })
    .withMessage('evenementId doit être un entier positif'),

  query('type')
    .isIn(ALLOWED_TYPES)
    .withMessage('type invalide'),
];

// ===============================
// Phase 5
// ===============================

// GET /api/attestations/verify/:uniqueCode
const validateVerifyAttestation = [
  param('uniqueCode')
    .isString()
    .withMessage('uniqueCode invalide')
    .trim()
    .isLength({ min: 8, max: 64 })
    .withMessage('uniqueCode invalide'),
];

// POST /api/attestations/admin/batch/:eventId?force=true
const validateBatchGenerateAttestations = [
  param('eventId')
    .isInt({ min: 1 })
    .withMessage('eventId doit être un entier positif'),

  query('force')
    .optional()
    .isBoolean()
    .withMessage('force doit être boolean')
    .bail()
    .toBoolean(),

  // ✅ NEW: لازم userIds في body (لأن batch controller يطلبهم)
  body('userIds')
    .isArray({ min: 1 })
    .withMessage('userIds doit être un tableau non vide'),

  // ✅ NEW: كل عنصر لازم يكون int
  body('userIds.*')
    .isInt({ min: 1 })
    .withMessage('Chaque userId doit être un entier positif'),

  // ✅ NEW: types optional (إذا ما تبعثوش يولي default في controller)
  body('types')
    .optional()
    .isArray()
    .withMessage('types doit être un tableau'),

  body('types.*')
    .optional()
    .isIn(ALLOWED_TYPES)
    .withMessage('type invalide'),
];

module.exports = {
  validateGenerateMyAttestation,
  validateGenerateAttestationForUser,
  validateListEventAttestations,
  validateDownloadMyAttestation,

  validateVerifyAttestation,
  validateBatchGenerateAttestations,

  ALLOWED_TYPES,
};
