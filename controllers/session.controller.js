const {
  createSession,
  getSessionsByEvent,
  getSessionById,
  updateSession,
  deleteSession,
} = require('../models/session.model');

// POST /api/events/:eventId/sessions
const createSessionController = (req, res) => {
  const { eventId } = req.params;
  const { titre, horaire, salle, president_id } = req.body;

  if (!titre || !horaire) {
    return res.status(400).json({ message: 'titre et horaire sont requis' });
  }

  const data = { titre, horaire, salle, president_id };

  createSession(eventId, data, (err, sessionId) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la création de la session' });
    }
    res.status(201).json({
      message: 'Session créée avec succès',
      sessionId,
    });
  });
};

// GET /api/events/:eventId/sessions
const getSessionsByEventController = (req, res) => {
  const { eventId } = req.params;

  getSessionsByEvent(eventId, (err, sessions) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la récupération des sessions' });
    }
    res.json({ sessions });
  });
};

// GET /api/sessions/:id
const getSessionByIdController = (req, res) => {
  const { id } = req.params;

  getSessionById(id, (err, session) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la récupération de la session' });
    }
    if (!session) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    res.json({ session });
  });
};

// PUT /api/sessions/:id
const updateSessionController = (req, res) => {
  const { id } = req.params;
  const { titre, horaire, salle, president_id } = req.body;

  const data = { titre, horaire, salle, president_id };

  updateSession(id, data, (err, affected) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la mise à jour de la session' });
    }
    if (affected === 0) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    res.json({ message: 'Session mise à jour avec succès' });
  });
};

// DELETE /api/sessions/:id
const deleteSessionController = (req, res) => {
  const { id } = req.params;

  deleteSession(id, (err, affected) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur lors de la suppression de la session' });
    }
    if (affected === 0) {
      return res.status(404).json({ message: 'Session non trouvée' });
    }
    res.json({ message: 'Session supprimée avec succès' });
  });
};

module.exports = {
  createSessionController,
  getSessionsByEventController,
  getSessionByIdController,
  updateSessionController,
  deleteSessionController,
};
