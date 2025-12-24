// routes/attestation.routes.js
const express = require('express');
const router = express.Router();

// ✅ paths الصحيحين حسب مشروعك
const { verifyToken } = require('../middlewares/auth.middleware');
const { requirePermission } = require('../middlewares/permissions');

const {
  validateGenerateMyAttestation,
  validateGenerateAttestationForUser,
  validateListEventAttestations,
  validateDownloadMyAttestation
} = require('../validators/attestation.validators');

const {
  generateMyAttestation,
  downloadMyAttestation,
  generateAttestationForUser,
  listEventAttestations
} = require('../controllers/attestation.controller');

// ===============================
// Utilisateur normal
// ===============================
router.post(
  '/me/generate',
  verifyToken,
  validateGenerateMyAttestation,
  generateMyAttestation
);

// ✅ Phase 3: نفس الـ endpoint، لكن controller يولي:
// - يجيب fichier_pdf من DB
// - إذا ماكانش: يولّد PDF unique ويحفظه ثم يحمّله
router.get(
  '/me/download',
  verifyToken,
  validateDownloadMyAttestation,
  downloadMyAttestation
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

router.get(
  '/evenement/:evenementId',
  verifyToken,
  requirePermission('view_attestations'),
  validateListEventAttestations,
  listEventAttestations
);

/**
 * ✅ OPTIONNEL (إذا تحب URL أحسن):
 * GET /api/attestations/me/download/1/participant
 *
 * ملاحظة: إذا زدتها لازم تزيد validator جديد للـ params
 * ولا تقدر تخليها بلا validator (مش مستحسن).
 */
// router.get(
//   '/me/download/:evenementId/:type',
//   verifyToken,
//   downloadMyAttestation
// );

module.exports = router;
