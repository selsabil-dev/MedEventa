// controllers/question.controller.js
const { validationResult } = require('express-validator');
const db = require('../db');
const { createQuestion ,voteQuestion } = require('../models/question.model');

// POST /events/:eventId/questions/submit
const submitQuestionController = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Données invalides',
      errors: errors.array(),
    });
  }

  const eventId = req.params.eventId;

  if (!req.user || !req.user.id) {
    return res.status(401).json({ message: 'Utilisateur non authentifié' });
  }
  const userId = req.user.id;

  // Vérifier que l'événement existe
  const sqlEvent = `
    SELECT id FROM evenement
    WHERE id = ?
  `;

  db.query(sqlEvent, [eventId], (err, results) => {
    if (err) {
      console.error('Erreur vérification événement (question):', err);
      return res.status(500).json({ message: 'Erreur serveur' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Événement non trouvé' });
    }

    const data = { contenu: req.body.contenu };

    createQuestion(eventId, userId, data, (err2, questionId) => {
      if (err2) {
        return res.status(500).json({
          message: 'Erreur lors de la création de la question',
        });
      }

      // Ici plus tard : Socket.io pour notifier en temps réel

      return res.status(201).json({
        message: 'Question soumise avec succès',
        eventId: Number(eventId),
        questionId,
      });
    });
  });
};
// même helper que tout à l’heure pour vérifier session active
const doesQuestionExist = (questionId, callback) => {
  const sql = `
    SELECT id
    FROM question
    WHERE id = ?
  `;
  db.query(sql, [questionId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(null, false); // question inexistante
    callback(null, true);
  });
}

const voteQuestionController = (req, res) => {
  const questionId = parseInt(req.params.questionId, 10);
  const userId = req.user.id;

  if (isNaN(questionId)) {
    return res.status(400).json({ message: 'questionId invalide' });
  }

  doesQuestionExist(questionId, (checkErr, isActive) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(500).json({ message: 'Erreur serveur (vérification session)' });
    }

    if (!isActive) {
      return res.status(400).json({ message: 'La question n’appartient pas à une session active' });
    }

    voteQuestion(questionId, userId, (voteErr, totals) => {
      if (voteErr) {
        console.error(voteErr);
        return res.status(500).json({ message: 'Erreur lors de l’enregistrement du like' });
      }

      return res.status(200).json({
        message: 'Like enregistré avec succès',
        questionId,
        totals,
      });
    });
  });
};
const { getQuestionsByEvent } = require('../models/question.model');

const getQuestionsByEventController = (req, res) => {
  const eventId = parseInt(req.params.eventId, 10);

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'eventId invalide' });
  }

  getQuestionsByEvent(eventId, (err, questions) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des questions' });
    }

    return res.status(200).json({
      eventId,
      questions: questions.map((q) => ({
        id: q.id,
        content: q.content,
        likes: q.likes,
        user: {
          id: q.userId,
          name: q.userName,
        },
      })),
    });
  });
};
module.exports = {
  submitQuestionController,voteQuestionController,getQuestionsByEventController,
};
