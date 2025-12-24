// models/question.model.js
const db = require('../db');

// Créer une question pour un événement
const createQuestion = (eventId, userId, data, callback) => {
  const { contenu } = data;

  const sql = `
    INSERT INTO question (
      evenement_id,
      utilisateur_id,
      contenu
    ) VALUES (?, ?, ?)
  `;

  db.query(sql, [eventId, userId, contenu], (err, result) => {
    if (err) {
      console.error('Erreur createQuestion:', err);
      return callback(err, null);
    }
    callback(null, result.insertId); // ID de la question créée
  });
};
// Like = créer (ou maintenir) un vote pour (question, user)
const voteQuestion = (questionId, userId, callback) => {
  const sql = `
    INSERT INTO vote (question_id, user_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE user_id = user_id
  `;

  db.query(sql, [questionId, userId], (err) => {
    if (err) return callback(err);

    const countSql = `
      SELECT COUNT(*) AS likes
      FROM vote
      WHERE question_id = ?
    `;

    db.query(countSql, [questionId], (countErr, results) => {
      if (countErr) return callback(countErr);
      const likes = results[0]?.likes || 0;
      callback(null, { likes });
    });
  });
};
// Récupérer les questions d'un événement avec nombre de likes
const getQuestionsByEvent = (eventId, callback) => {
  const sql = `
    SELECT 
      q.id,
      q.contenu AS content,
      q.utilisateur_id AS userId,
      u.nom AS userName,
      COUNT(v.id) AS likes
    FROM question q
    LEFT JOIN vote v ON v.question_id = q.id
    LEFT JOIN utilisateur u ON u.id = q.utilisateur_id
    WHERE q.evenement_id = ?
    GROUP BY q.id, q.contenu, q.utilisateur_id, u.nom
    ORDER BY likes DESC, q.id ASC
  `;

  db.query(sql, [eventId], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};

module.exports = {
  createQuestion,voteQuestion,getQuestionsByEvent,
};
