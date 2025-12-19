// controllers/submission.controller.js
const fs = require('fs');
const path = require('path');

const {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
} = require('../models/submission.model');

const { isSubmissionOpen } = require('../models/event.model');

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
      auteur_id: req.user.id, // ✅ colonne DB
    };

    createSubmission(data, (err2, submissionId) => {
      if (err2) {
        console.error('DB error createSubmission:', err2);
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

  // 1) récupérer la soumission pour vérifier propriétaire + eventId + ancien fichier
  getSubmissionById(Number(submissionId), (err, submission) => {
    if (err) {
      console.error('DB error getSubmissionById:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (!submission) {
      return res.status(404).json({ message: 'Soumission introuvable' });
    }

    // 2) autorisation: propriétaire OU admin (SUPER_ADMIN / ORGANISATEUR)
    const isOwner = submission.auteur_id === req.user.id;
    const isAdmin = req.user.role === 'SUPER_ADMIN' || req.user.role === 'ORGANISATEUR';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Accès interdit (pas propriétaire)' });
    }

    // 3) deadline (bloque update après date limite)
    isSubmissionOpen(Number(submission.evenement_id), (err2, check) => {
      if (err2) {
        console.error('DB error isSubmissionOpen:', err2);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      if (!check.ok && check.reason === 'DEADLINE_PASSED') {
        return res.status(403).json({
          message: 'Modifications interdites (date limite dépassée)',
          deadline: check.deadline,
        });
      }

      // 4) construire data: on update seulement les champs envoyés
      const newData = {
        titre: titre ?? null,
        resume: resume ?? null,
        type: type ?? null,
        fichier_pdf: null,
      };

      // 5) remplacement PDF (optionnel)
      let oldFileToDelete = null;
      if (req.file) {
        newData.fichier_pdf = req.file.path;
        oldFileToDelete = submission.fichier_pdf;
      }

      updateSubmission(Number(submissionId), newData, (err3, affectedRows) => {
        if (err3) {
          console.error('DB error updateSubmission:', err3);
          return res.status(500).json({ message: 'Erreur serveur' });
        }
        if (!affectedRows) {
          return res.status(404).json({ message: 'Soumission introuvable' });
        }

        // 6) supprimer l’ancien PDF si un nouveau a été uploadé (best-effort)
        if (oldFileToDelete) {
          const abs = path.isAbsolute(oldFileToDelete)
            ? oldFileToDelete
            : path.join(process.cwd(), oldFileToDelete);

          fs.unlink(abs, () => {});
        }

        return res.status(200).json({ message: 'Soumission mise à jour' });
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

        // best-effort: supprimer le pdf du disque
        if (submission.fichier_pdf) {
          const abs = path.isAbsolute(submission.fichier_pdf)
            ? submission.fichier_pdf
            : path.join(process.cwd(), submission.fichier_pdf);

          fs.unlink(abs, () => {});
        }

        return res.status(200).json({ message: 'Soumission supprimée' });
      });
    });
  });
};

module.exports = {
  createSubmissionController,
  updateSubmissionController,
  deleteSubmissionController,
};
