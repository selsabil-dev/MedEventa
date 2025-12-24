// routes/submission.routes.js
const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middlewares/auth.middleware');
const { uploadSubmissionPdf } = require('../middlewares/uploadPdf');
const submissionController = require('../controllers/submission.controller');
const { requirePermission } = require('../middlewares/permissions');
// POST /api/events/:eventId/submissions
router.post(
  '/:eventId/submissions',
  verifyToken,
  requirePermission('create_submission'),
  uploadSubmissionPdf.single('resumePdf'),
  submissionController.createSubmissionController
);

// PUT /api/events/submissions/:submissionId
router.put(
  '/submissions/:submissionId',
  verifyToken,
  requirePermission('update_submission'),
  uploadSubmissionPdf.single('resumePdf'),
  submissionController.updateSubmissionController
);

// DELETE /api/events/submissions/:submissionId
router.delete(
  '/submissions/:submissionId',
  verifyToken,
  requirePermission('delete_submission'),
  submissionController.deleteSubmissionController
);

// PUT /api/events/submissions/:submissionId/status
router.put(
  '/submissions/:submissionId/status',
  verifyToken,
  requirePermission('decide_submission'),
  submissionController.updateStatusController
);

// POST /api/events/submissions/:submissionId/withdraw
router.post(
  '/submissions/:submissionId/withdraw',
  verifyToken,
  requirePermission('withdraw_submission'),
  submissionController.withdrawController
);

module.exports = router;
