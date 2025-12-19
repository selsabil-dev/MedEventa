// controllers/evaluation.controller.js
const { validationResult } = require('express-validator');
const db = require('../db');
const { assignManual } = require('../models/evaluation.model');

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

module.exports = {
  assignManually,
};
