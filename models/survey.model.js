// models/survey.model.js
const db = require('../db');

const createSurvey = (eventId, data, callback) => {
  const { title, questions } = data;

  const insertSurveySql = `
    INSERT INTO survey (event_id, title)
    VALUES (?, ?)
  `;

  db.query(insertSurveySql, [eventId, title], (err, result) => {
    if (err) return callback(err);

    const surveyId = result.insertId;

    if (!questions || questions.length === 0) {
      return callback(null, { surveyId });
    }

    const insertQuestionSql = `
      INSERT INTO survey_question (survey_id, question_text)
      VALUES ?
    `;
    const values = questions.map((q) => [surveyId, q]);

    db.query(insertQuestionSql, [values], (qErr) => {
      if (qErr) return callback(qErr);
      callback(null, { surveyId });
    });
  });
};

const submitResponse = (surveyId, userId, responses, callback) => {
  // responses: array d’objets { questionId, answer }
  if (!responses || responses.length === 0) {
    return callback(null);
  }

  const insertSql = `
    INSERT INTO survey_response (survey_id, user_id, question_id, answer_text)
    VALUES ?
  `;

  const values = responses.map((r) => [
    surveyId,
    userId,
    r.questionId,
    r.answer,
  ]);

  db.query(insertSql, [values], (err) => {
    if (err) return callback(err);
    callback(null);
  });
};
const getSurveyResults = (surveyId, callback) => {
  const sql = `
    SELECT 
      q.id AS questionId,
      q.question_text AS questionText,
      r.user_id AS userId,
      u.nom AS userName,
      r.answer_text AS answer
    FROM survey_question q
    LEFT JOIN survey_response r 
      ON r.question_id = q.id AND r.survey_id = ?
    LEFT JOIN utilisateur u 
      ON u.id = r.user_id
    WHERE q.survey_id = ?
    ORDER BY q.id ASC, r.id ASC
  `;

  db.query(sql, [surveyId, surveyId], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
};
module.exports = {
  createSurvey,
  submitResponse,getSurveyResults,
};
