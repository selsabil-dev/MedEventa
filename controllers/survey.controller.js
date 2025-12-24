// controllers/survey.controller.js
const { validationResult } = require('express-validator');
const db = require('../db');
const { createSurvey, submitResponse ,getSurveyResults } = require('../models/survey.model');

const checkEventOrganizer = (eventId, userId, callback) => {
  const sql = `
    SELECT id
    FROM evenement
    WHERE id = ?
      AND id_organisateur = ?
  `;
  db.query(sql, [eventId, userId], (err, results) => {
    if (err) return callback(err);
    if (results.length === 0) return callback(null, false);
    callback(null, true);
  });
};

const createSurveyController = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const eventId = parseInt(req.params.eventId, 10);
  const userId = req.user.id;
  const { title, questions } = req.body;

  if (isNaN(eventId)) {
    return res.status(400).json({ message: 'eventId invalide' });
  }

  checkEventOrganizer(eventId, userId, (checkErr, isOrganizer) => {
    if (checkErr) {
      console.error(checkErr);
      return res.status(500).json({ message: 'Erreur serveur (vérification organisateur)' });
    }

    if (!isOrganizer) {
      return res.status(403).json({ message: 'Vous n’êtes pas l’organisateur de cet événement' });
    }

    createSurvey(eventId, { title, questions }, (createErr, result) => {
      if (createErr) {
        console.error(createErr);
        return res.status(500).json({ message: 'Erreur lors de la création du sondage' });
      }

      return res.status(201).json({
        message: 'Sondage créé avec succès',
        eventId,
        surveyId: result.surveyId,
      });
    });
  });
};

const submitResponseController = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const surveyId = parseInt(req.params.surveyId, 10);
  const userId = req.user.id;
  const { responses } = req.body;

  if (isNaN(surveyId)) {
    return res.status(400).json({ message: 'surveyId invalide' });
  }

  submitResponse(surveyId, userId, responses, (err) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur lors de l’enregistrement des réponses' });
    }

    return res.status(201).json({
      message: 'Réponses enregistrées avec succès',
      surveyId,
    });
  });
};
const getSurveyResultsController = (req, res) => {
  const surveyId = parseInt(req.params.surveyId, 10);

  if (isNaN(surveyId)) {
    return res.status(400).json({ message: 'surveyId invalide' });
  }

  getSurveyResults(surveyId, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Erreur lors de la récupération des résultats' });
    }

    // Regrouper par question
    const questionsMap = {};
    rows.forEach((row) => {
      if (!questionsMap[row.questionId]) {
        questionsMap[row.questionId] = {
          questionId: row.questionId,
          questionText: row.questionText,
          responses: [],
        };
      }
      if (row.answer) {
        questionsMap[row.questionId].responses.push({
          userId: row.userId,
          userName: row.userName,
          answer: row.answer,
        });
      }
    });

    const questions = Object.values(questionsMap);

    return res.status(200).json({
      surveyId,
      questions,
    });
  });
}
module.exports = {
  createSurveyController,
  submitResponseController,
  getSurveyResultsController,
};
