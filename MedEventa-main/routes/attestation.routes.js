// routes/attestation.routes.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth.middlewares');
const { requirePermission } = require('../middlewares/permissions');

const {
  validateGenerateMyAttestation,
  validateGenerateAttestationForUser,
  validateListEventAttestations,
  validateDownloadMyAttestation,

  // ✅ Phase 5
  validateVerifyAttestation,
  validateBatchGenerateAttestations
} = require('../validators/attestation.validators');

const {
  generateMyAttestation,
  downloadMyAttestation,
  generateAttestationForUser,
  listEventAttestations,
  listMyAttestations,
  listMyEligibility
} = require('../controllers/attestation.controller');

// ✅ Phase 5 controllers (جدد)
const { verifyAttestation } = require('../controllers/attestation.verify.controller');
const { generateBatchForEvent } = require('../controllers/attestation.batch.controller');

// ===============================
// Utilisateur normal
// ===============================
router.post(
  '/me/generate',
  verifyToken,
  validateGenerateMyAttestation,
  generateMyAttestation
);

router.get(
  '/me/list',
  verifyToken,
  listMyAttestations
);

router.get(
  '/me/eligibility',
  verifyToken,
  listMyEligibility
);

router.get(
  '/me/download',
  verifyToken,
  validateDownloadMyAttestation,
  downloadMyAttestation
);

// ===============================
// Phase 5: Verify (PUBLIC)
// ===============================
router.get(
  '/verify/:uniqueCode',
  validateVerifyAttestation,
  verifyAttestation
);

// ===============================
// Admin / organisateur
// ===============================
router.post(
  '/admin/generate',
  verifyToken,
  requirePermission('generate_attestation'),
  validateGenerateAttestationForUser,
  generateAttestationForUser
);

// ✅ Phase 5: Batch génération (ADMIN)
router.post(
  '/admin/batch/:eventId',
  verifyToken,
  requirePermission('generate_attestation'),
  validateBatchGenerateAttestations,
  generateBatchForEvent
);

router.get(
  '/evenement/:evenementId',
  verifyToken,
  requirePermission('view_attestations'),
  validateListEventAttestations,
  listEventAttestations
);

module.exports = router;
