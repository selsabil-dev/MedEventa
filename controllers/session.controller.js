// controllers/session.controller.js
const db = require('../db');
const { validationResult } = require('express-validator');
const {
  createSession,
  assignCommunication,
  getProgram,
  getDetailedProgram,
  updateSession,          // ⬅️ à importer depuis le model
} = require('../models/session.model');

// ... tout ton code actuel inchangé ...

// PUT /sessions/:sessionId/update
const updateSessionController = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { sessionId } = req.params;
  const { titre, horaire, salle, president_id } = req.body;
  const userId = req.user.id;

  // Vérifier que la session existe et appartient à un événement de cet organisateur
  const sqlCheck = `
    SELECT s.id, s.evenement_id, e.id_organisateur
    FROM session s
    JOIN evenement e ON s.evenement_id = e.id
    WHERE s.id = ?
  `;

  db.query(sqlCheck, [sessionId], (err, rows) => {
    if (err) {
      console.error('Erreur vérif session:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    if (rows[0].id_organisateur !== userId) {
      return res.status(403).json({
        message: "Vous n'êtes pas l'organisateur de cet événement",
      });
    }

    const data = { titre, horaire, salle, president_id };

    updateSession(sessionId, data, (err2, affected) => {
      if (err2) {
        console.error('Erreur updateSession:', err2);
        return res
          .status(500)
          .json({ message: 'Erreur lors de la mise à jour de la session' });
      }
      if (affected === 0) {
        return res
          .status(400)
          .json({ message: 'Aucune modification appliquée' });
      }

      return res.status(200).json({
        message: 'Session mise à jour avec succès',
        sessionId: Number(sessionId),
        ...data,
      });
    });
  });
};

module.exports = {
  createSessionController,
  assignCommunicationController,
  getProgramController,
  getDetailedProgramController,
  updateSessionController,      // ⬅️ exporter
};
