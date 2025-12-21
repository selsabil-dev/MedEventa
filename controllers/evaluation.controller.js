// controllers/evaluation.controller.js
const { validationResult } = require('express-validator');
const db = require('../db');
const {
  assignManual,
  getEvaluationForm,
  submitEvaluation,
  generateReport,
  hasReportForProposition,
  listEvaluationsModel,
  listReportsModel,
} = require('../models/evaluation.model');

// POST /api/evaluations/event/:eventId/assign-manual
// Body: { "propositionId": 3, "evaluateurIds": [1, 2, 5] }
const assignManually = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventId } = req.params;
  const { propositionId, evaluateurIds } = req.body;

  // 1) Vérifier que la communication existe et appartient bien à l'événement
  const sqlComm = `
    SELECT id, evenement_id
    FROM communication
    WHERE id = ?
  `;

  db.query(sqlComm, [propositionId], (err, commRows) => {
    if (err) {
      console.error('Erreur SELECT communication:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (commRows.length === 0) {
      return res.status(404).json({ message: 'Proposition non trouvée' });
    }
    if (commRows[0].evenement_id !== Number(eventId)) {
      return res
        .status(400)
        .json({ message: "Cette proposition n'appartient pas à cet événement" });
    }

    // 2) Vérifier que chaque evaluateurId correspond bien à un membre_comite de CE même event
    const ids = evaluateurIds.map((id) => Number(id));
    const placeholders = ids.map(() => '?').join(',');

    const sqlMembres = `
      SELECT mc.id
      FROM membre_comite mc
      JOIN comite_scientifique cs ON mc.comite_id = cs.id
      WHERE cs.evenement_id = ?
        AND mc.id IN (${placeholders})
    `;

    db.query(sqlMembres, [eventId, ...ids], (err2, membreRows) => {
      if (err2) {
        console.error('Erreur SELECT membre_comite:', err2);
        return res.status(500).json({ message: 'Erreur serveur' });
      }

      if (membreRows.length !== ids.length) {
        return res.status(400).json({
          message:
            "Certains évaluateurs ne sont pas des membres du comité de cet événement",
        });
      }

      const membreComiteIds = membreRows.map((row) => row.id);

      // 3) Appeler le modèle pour insérer dans evaluation
      assignManual(propositionId, membreComiteIds, (err3, result) => {
        if (err3) {
          return res
            .status(500)
            .json({ message: "Erreur lors de l'affectation manuelle" });
        }

        res.status(201).json({
          message: 'Affectations créées avec succès',
          propositionId,
          eventId: Number(eventId),
          nbAffectations: result.affectedRows,
        });
      });
    });
  });
};

// GET /api/evaluations/evaluation/:evaluationId/form
// Récupérer le formulaire d'évaluation (pour l'évaluateur connecté)
const getEvaluationFormController = (req, res) => {
  const { evaluationId } = req.params;
  const userId = req.user.id; // ID de l'évaluateur connecté

  // Vérifier que l'évaluateur est bien assigné à cette évaluation
  const sqlCheck = `
    SELECT e.id, e.membre_comite_id
    FROM evaluation e
    JOIN membre_comite mc ON e.membre_comite_id = mc.id
    WHERE e.id = ? AND mc.utilisateur_id = ?
  `;

  db.query(sqlCheck, [evaluationId, userId], (err, rows) => {
    if (err) {
      console.error('Erreur vérif assignation:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (rows.length === 0) {
      return res.status(403).json({
        message: "Vous n'êtes pas assigné à cette évaluation",
      });
    }

    // Récupérer le formulaire
    getEvaluationForm(evaluationId, (err2, formData) => {
      if (err2) {
        console.error('Erreur getEvaluationForm:', err2);
        return res
          .status(500)
          .json({ message: 'Erreur serveur', error: err2.message });
      }
      if (!formData) {
        return res.status(404).json({ message: 'Évaluation non trouvée' });
      }

      res.json({
        message: "Formulaire d'évaluation",
        evaluation: formData,
      });
    });
  });
};

// POST /api/evaluations/evaluation/:evaluationId/submit
// Soumettre les scores et recommandation
const submitEvaluationController = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { evaluationId } = req.params;
  const userId = req.user.id;
  const {
    pertinence,
    qualite_scientifique,
    originalite,
    commentaire,
    decision,
  } = req.body;

  // Vérifier que l'évaluateur est bien assigné
  const sqlCheck = `
    SELECT e.id, e.membre_comite_id, e.communication_id
    FROM evaluation e
    JOIN membre_comite mc ON e.membre_comite_id = mc.id
    WHERE e.id = ? AND mc.utilisateur_id = ?
  `;

  db.query(sqlCheck, [evaluationId, userId], async (err, rows) => {
    if (err) {
      console.error('Erreur vérif assignation:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (rows.length === 0) {
      return res.status(403).json({
        message: "Vous n'êtes pas assigné à cette évaluation",
      });
    }

    const communicationId = rows[0].communication_id;

    // PHASE 5: lock simple
    try {
      const locked = await hasReportForProposition(communicationId);
      if (locked) {
        return res.status(400).json({
          message:
            'Les évaluations ne peuvent plus être modifiées (rapport généré).',
        });
      }
    } catch (e) {
      console.error('Erreur check rapport:', e);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    // Soumettre l'évaluation
    const scores = {
      pertinence,
      qualite_scientifique,
      originalite,
      commentaire,
      decision,
    };

    submitEvaluation(evaluationId, scores, (err2) => {
      if (err2) {
        return res
          .status(500)
          .json({ message: 'Erreur lors de la soumission' });
      }

      res.status(200).json({
        message: 'Évaluation soumise avec succès',
        evaluationId,
        scores,
      });
    });
  });
};

// POST /api/evaluations/proposition/:propositionId/generate-report
// Générer le rapport final d'une proposition (après toutes les évaluations)
const generateReportController = (req, res) => {
  const { propositionId } = req.params;

  // Vérifier que la proposition existe
  const sqlComm = `
    SELECT id FROM communication WHERE id = ?
  `;

  db.query(sqlComm, [propositionId], (err, commRows) => {
    if (err) {
      console.error('Erreur vérif proposition:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (commRows.length === 0) {
      return res.status(404).json({ message: 'Proposition non trouvée' });
    }

    // Générer le rapport
    generateReport(propositionId, (err2, rapport) => {
      if (err2) {
        console.error('Erreur generateReport:', err2);
        return res.status(500).json({ message: 'Erreur génération rapport' });
      }

      if (!rapport) {
        return res.status(400).json({
          message:
            "Pas assez d'évaluations complètes pour générer le rapport",
        });
      }

      res.status(201).json({
        message: 'Rapport généré avec succès',
        propositionId,
        rapport,
      });
    });
  });
};

// PHASE 5: list evaluations with pagination
const listEvaluations = (req, res) => {
  const { page = 1, limit = 10, eventId, search } = req.query;

  listEvaluationsModel(
    {
      page: Number(page),
      limit: Number(limit),
      eventId: eventId ? Number(eventId) : null,
      search: search || null,
    },
    (err, data) => {
      if (err) {
        console.error('Erreur listEvaluations:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      res.json(data);
    }
  );
};

// PHASE 5: list reports with pagination
const listReports = (req, res) => {
  const { page = 1, limit = 10, eventId, search } = req.query;

  listReportsModel(
    {
      page: Number(page),
      limit: Number(limit),
      eventId: eventId ? Number(eventId) : null,
      search: search || null,
    },
    (err, data) => {
      if (err) {
        console.error('Erreur listReports:', err);
        return res.status(500).json({ message: 'Erreur serveur' });
      }
      res.json(data);
    }
  );
};

module.exports = {
  assignManually,
  getEvaluationFormController,
  submitEvaluationController,
  generateReportController,
  listEvaluations,
  listReports,
};
