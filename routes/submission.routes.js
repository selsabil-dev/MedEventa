// routes/submission.routes.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth.middlewares');
const { uploadSubmissionPdf } = require('../middlewares/uploadPdf');
const { createSubmissionController } = require('../controllers/submission.controller');

const {
  createSubmissionValidation,
  validateSubmission,
} = require('../middlewares/submission.validators');

// POST /api/events/:eventId/submissions
router.post(
  '/:eventId/submissions',
  verifyToken,
  uploadSubmissionPdf.single('fichier_pdf'),
  createSubmissionValidation,
  validateSubmission,
  createSubmissionController
);

module.exports = router;
