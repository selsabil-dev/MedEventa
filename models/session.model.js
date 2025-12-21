// controllers/session.controller.js
const db = require('../db');
const { validationResult } = require('express-validator');

const {
  createSession,
  assignCommunication,
  getProgram,
  getDetailedProgram,
  updateSession,
} = require('../models/session.model');

// ------------------------------------------------------
// PHASE 1 : création de session
// POST /events/:eventId/sessions/create
// ------------------------------------------------------
const createSessionController = (req, res) => {
  // validations express-validator
  const errors = validationResult(req);
  if (!errors || !errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { eventId } = req.params;
  const { titre, horaire, salle, president_id } = req.body;
  const userId = req.user.id;

  const sqlCheck = `
    SELECT id, id_organisateur
    FROM evenement
    WHERE id = ?
  `;

  db.query(sqlCheck, [eventId], (err, rows) => {
    if (err) {
      console.error('Erreur vérif événement:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    if (rows[0].id_organisateur !== userId) {
      return res.status(403).json({
        message: "Vous n'êtes pas l'organisateur de cet événement",
      });
    }

    const data = { titre, horaire, salle, president_id };

    createSession(eventId, data, (err2, sessionId) => {
      if (err2) {
        console.error('Erreur createSession:', err2);
        return res
          .status(500)
          .json({ message: 'Erreur lors de la création de la session' });
      }

      return res.status(201).json({
        message: 'Session créée avec succès',
        eventId: Number(eventId),
        sessionId,
      });
    });
  });
};

// ------------------------------------------------------
// PHASE 2 : affectation d’une communication à une session
// POST /sessions/:sessionId/assign-communication
// ------------------------------------------------------
const assignCommunicationController = (req, res) => {
  const { sessionId } = req.params;
  const { communicationId } = req.body;
  const userId = req.user.id;

  if (!communicationId) {
    return res
      .status(400)
      .json({ message: 'communicationId est obligatoire' });
  }

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

    assignCommunication(sessionId, communicationId, (err2, affected) => {
      if (err2) {
        console.error('Erreur assignCommunication:', err2);
        return res.status(500).json({
          message: "Erreur lors de l'attribution de la communication",
        });
      }

      if (affected === 0) {
        return res.status(400).json({
          message:
            "La communication n'est pas acceptée ou est déjà attribuée à une session",
        });
      }

      return res.status(200).json({
        message: 'Communication attribuée à la session',
        sessionId: Number(sessionId),
        communicationId: Number(communicationId),
      });
    });
  });
};

// ------------------------------------------------------
// PHASE 3 : programme global
// GET /events/:eventId/program
// ------------------------------------------------------
const getProgramController = (req, res) => {
  const { eventId } = req.params;

  getProgram(eventId, (err, rows) => {
    if (err) {
      console.error('Erreur getProgram:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    const sessionsMap = {};

    rows.forEach((row) => {
      if (!sessionsMap[row.session_id]) {
        sessionsMap[row.session_id] = {
          id: row.session_id,
          titre: row.session_titre,
          horaire: row.horaire,
          salle: row.salle,
          president: {
            nom: row.president_nom,
            prenom: row.president_prenom,
          },
          communications: [],
        };
      }

      if (row.communication_id) {
        sessionsMap[row.session_id].communications.push({
          id: row.communication_id,
          titre: row.communication_titre,
        });
      }
    });

    return res.json({
      eventId: Number(eventId),
      sessions: Object.values(sessionsMap),
    });
  });
};

// ------------------------------------------------------
// PHASE 3 : programme détaillé par jour
// GET /events/:eventId/program/detailed?date=YYYY-MM-DD
// ------------------------------------------------------
const getDetailedProgramController = (req, res) => {
  const { eventId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ message: 'date est obligatoire' });
  }

  getDetailedProgram(eventId, date, (err, rows) => {
    if (err) {
      console.error('Erreur getDetailedProgram:', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    const sessionsMap = {};

    rows.forEach((row) => {
      if (!sessionsMap[row.session_id]) {
        sessionsMap[row.session_id] = {
          id: row.session_id,
          titre: row.session_titre,
          horaire: row.horaire,
          salle: row.salle,
          president: {
            nom: row.president_nom,
            prenom: row.president_prenom,
          },
          communications: [],
        };
      }

      if (row.communication_id) {
        sessionsMap[row.session_id].communications.push({
          id: row.communication_id,
          titre: row.communication_titre,
        });
      }
    });

    return res.json({
      eventId: Number(eventId),
      date,
      sessions: Object.values(sessionsMap),
    });
  });
};

// ------------------------------------------------------
// PHASE 4 : mise à jour d’une session
// PUT /sessions/:sessionId/update
// ------------------------------------------------------
const updateSessionController = (req, res) => {
  const errors = validationResult(req);
  if (!errors || !errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { sessionId } = req.params;
  const { titre, horaire, salle, president_id } = req.body;
  const userId = req.user.id;

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
  updateSessionController,
};
