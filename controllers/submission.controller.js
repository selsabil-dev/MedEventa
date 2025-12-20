// controllers/submission.controller.js
const fs = require('fs');
const path = require('path');

const {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  setSubmissionStatus,

  // phase 4
  logSubmissionHistory,
  withdrawSubmission,
} = require('../models/submission.model');

const { isSubmissionOpen } = require('../models/event.model');

// Statuts autorisés (selon TON ENUM DB)
const ALLOWED_STATUS = ['en_attente', 'acceptee', 'refusee', 'en_revision', 'retire'];

// Petit helper: suppression best-effort
const safeUnlink = (filePath) => {
  if (!filePath) return;
  const abs = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  fs.unlink(abs, () => {});
};

// CREATE
const createSubmissionController = (req, res) => {
  const { eventId } = req.params;
  const { titre, resume, type } = req.body;

  if (!titre || !resume || !type) {
    return res.status(400).json({ message: 'Champs requis: titre, resume, type' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'Fichier PDF requis (champ: resumePdf)' });
  }

  isSubmissionOpen(Number(eventId), (err, check) => {
    if (err) {
      console.error('DB error isSubmissionOpen:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (!check.ok) {
      if (check.reason === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ message: 'Événement introuvable' });
      }
      if (check.reason === 'DEADLINE_PASSED') {
        return res.status(403).json({
          message: 'Les soumissions sont fermées (date limite dépassée)',
          deadline: check.deadline,
        });
      }
      return res.status(403).json({ message: 'Soumission non autorisée' });
    }

    const data = {
      titre,
      resume,
      type,
      fichier_pdf: req.file.path,
      evenement_id: Number(eventId),
      auteur_id: req.user.id,
    };

    createSubmission(data, (err2, submissionId) => {
      if (err2) {
        console.error('DB error createSubmission:', err2);
        safeUnlink(req.file?.path);
        return res.status(500).json({ message: 'Erreur serveur' });
      }

      return res.status(201).json({
        message: 'Soumission créée avec succès',
        submissionId,
      });
    });
  });
};

// UPDATE (PUT /submissions/:submissionId)
const updateSubmissionController = (req, res) => {
  const { submissionId } = req.params;
  const { titre, resume, type } = req.body;

  getSubmissionById(Number(submissionId), (err, submission) => {
    if (err) {
      console.error('DB error getSubmissionById:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!submission) {
      safeUnlink(req.file?.path);
      return res.status(404).json({ message: 'Soumission introuvable' });
    }

    const isOwner = submission.auteur_id === req.user.id;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORGANISATEUR';
    if (!isOwner && !isAdmin) {
      safeUnlink(req.file?.path);
      return res.status(403).json({ message: 'Accès interdit (pas propriétaire)' });
    }

    isSubmissionOpen(Number(submission.evenement_id), (err2, check) => {
      if (err2) {
        console.error('DB error isSubmissionOpen:', err2);
        safeUnlink(req.file?.path);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (!check.ok && check.reason === 'DEADLINE_PASSED') {
        safeUnlink(req.file?.path);
        return res.status(403).json({
          message: 'Modifications interdites (date limite dépassée)',
          deadline: check.deadline,
        });
      }

      const newData = {};
      if (titre !== undefined) newData.titre = titre;
      if (resume !== undefined) newData.resume = resume;
      if (type !== undefined) newData.type = type;

      let oldFileToDelete = null;
      if (req.file) {
        newData.fichier_pdf = req.file.path;
        oldFileToDelete = submission.fichier_pdf;
      }

      if (Object.keys(newData).length === 0) {
        return res.status(400).json({ message: 'Aucune donnée à mettre à jour' });
      }

      updateSubmission(Number(submissionId), newData, (err3, affectedRows) => {
        if (err3) {
          console.error('DB error updateSubmission:', err3);
          safeUnlink(req.file?.path);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (!affectedRows) {
          safeUnlink(req.file?.path);
          return res.status(404).json({ message: 'Soumission introuvable' });
        }

        if (oldFileToDelete) safeUnlink(oldFileToDelete);

        // Phase 4: log UPDATE (best-effort)
        const oldValue = {
          titre: submission.titre,
          resume: submission.resume,
          type: submission.type,
          fichier_pdf: submission.fichier_pdf,
        };
        const newValue = { ...oldValue, ...newData };

        logSubmissionHistory(Number(submissionId), 'UPDATE', oldValue, newValue, req.user.id, (e) => {
          if (e) console.error('History log error (UPDATE):', e);
          return res.status(200).json({ message: 'Soumission mise à jour' });
        });
      });
    });
  });
};

// DELETE (DELETE /submissions/:submissionId)
const deleteSubmissionController = (req, res) => {
  const { submissionId } = req.params;

  getSubmissionById(Number(submissionId), (err, submission) => {
    if (err) {
      console.error('DB error getSubmissionById:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!submission) {
      return res.status(404).json({ message: 'Soumission introuvable' });
    }

    const isOwner = submission.auteur_id === req.user.id;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORGANISATEUR';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Accès interdit (pas propriétaire)' });
    }

    isSubmissionOpen(Number(submission.evenement_id), (err2, check) => {
      if (err2) {
        console.error('DB error isSubmissionOpen:', err2);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (!check.ok && check.reason === 'DEADLINE_PASSED') {
        return res.status(403).json({
          message: 'Suppression interdite (date limite dépassée)',
          deadline: check.deadline,
        });
      }

      deleteSubmission(Number(submissionId), (err3, affectedRows) => {
        if (err3) {
          console.error('DB error deleteSubmission:', err3);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (!affectedRows) {
          return res.status(404).json({ message: 'Soumission introuvable' });
        }

        safeUnlink(submission.fichier_pdf);

        return res.status(200).json({ message: 'Soumission supprimée' });
      });
    });
  });
};

// Phase 3: PUT /submissions/:submissionId/status
const updateStatusController = (req, res) => {
  const { submissionId } = req.params;
  const { status } = req.body;

  if (!status || !ALLOWED_STATUS.includes(status)) {
    return res.status(400).json({
      message: 'Statut invalide',
      allowed: ALLOWED_STATUS,
    });
  }

  getSubmissionById(Number(submissionId), (err, submission) => {
    if (err) {
      console.error('DB error getSubmissionById:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!submission) {
      return res.status(404).json({ message: 'Soumission introuvable' });
    }

    const oldValue = { etat: submission.etat };
    const newValue = { etat: status };

    setSubmissionStatus(Number(submissionId), status, req.user.id, (err2, affectedRows) => {
      if (err2) {
        console.error('DB error setSubmissionStatus:', err2);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (!affectedRows) {
        return res.status(404).json({ message: 'Soumission introuvable' });
      }

      // Phase 4: log STATUS_CHANGE (best-effort)
      logSubmissionHistory(Number(submissionId), 'STATUS_CHANGE', oldValue, newValue, req.user.id, (e) => {
        if (e) console.error('History log error (STATUS_CHANGE):', e);

        getSubmissionById(Number(submissionId), (err3, updated) => {
          if (err3) {
            console.error('DB error getSubmissionById (after update):', err3);
            return res.status(500).json({ message: 'Erreur serveur' });
          }

          return res.status(200).json({
            message: 'Statut mis à jour',
            submission: updated,
          });
        });
      });
    });
  });
};

// ===== Phase 4: withdraw قبل deadline =====
const withdrawController = (req, res) => {
  const { submissionId } = req.params;

  getSubmissionById(Number(submissionId), (err, submission) => {
    if (err) {
      console.error('DB error getSubmissionById:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!submission) {
      return res.status(404).json({ message: 'Soumission introuvable' });
    }

    // owner فقط
    const isOwner = submission.auteur_id === req.user.id;
    if (!isOwner) {
      return res.status(403).json({ message: 'Accès interdit (pas propriétaire)' });
    }

    isSubmissionOpen(Number(submission.evenement_id), (err2, check) => {
      if (err2) {
        console.error('DB error isSubmissionOpen:', err2);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (!check.ok && check.reason === 'DEADLINE_PASSED') {
        return res.status(403).json({
          message: 'Retrait interdit (date limite dépassée)',
          deadline: check.deadline,
        });
      }

      if (submission.etat === 'retire') {
        return res.status(400).json({ message: 'Soumission déjà retirée' });
      }

      withdrawSubmission(Number(submissionId), req.user.id, (err3, affectedRows) => {
        if (err3) {
          console.error('DB error withdrawSubmission:', err3);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (!affectedRows) {
          return res.status(404).json({ message: 'Soumission introuvable' });
        }

        logSubmissionHistory(
          Number(submissionId),
          'WITHDRAW',
          { etat: submission.etat },
          { etat: 'retire' },
          req.user.id,
          (e) => {
            if (e) console.error('History log error (WITHDRAW):', e);
            return res.status(200).json({ message: 'Soumission retirée' });
          }
        );
      });
    });
  });
};

module.exports = {
  createSubmissionController,
  updateSubmissionController,
  deleteSubmissionController,
  updateStatusController,
  withdrawController,
};
