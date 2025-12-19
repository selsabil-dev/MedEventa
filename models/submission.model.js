// models/submission.model.js
const db = require('../db');

const createSubmission = (data, callback) => {
  const sql = `
    INSERT INTO communication
      (titre, resume, type, fichier_pdf, etat, auteur_id, evenement_id)
    VALUES (?, ?, ?, ?, 'en_attente', ?, ?)
  `;

  const params = [
    data.titre,
    data.resume,
    data.type,
    data.fichier_pdf,
    data.auteur_id,
    data.evenement_id
  ];

  db.query(sql, params, (err, result) => {
    if (err) return callback(err);
    return callback(null, result.insertId);
  });
};

const getSubmissionById = (submissionId, callback) => {
  const sql = `
    SELECT id, titre, resume, type, fichier_pdf, etat, auteur_id, evenement_id
    FROM communication
    WHERE id = ?
    LIMIT 1
  `;
  db.query(sql, [submissionId], (err, rows) => {
    if (err) return callback(err);
    if (!rows || rows.length === 0) return callback(null, null);
    return callback(null, rows[0]);
  });
};

const updateSubmission = (submissionId, data, callback) => {
  // update partiel: COALESCE(?, col) => si null, garde ancienne valeur
  const sql = `
    UPDATE communication
    SET
      titre = COALESCE(?, titre),
      resume = COALESCE(?, resume),
      type = COALESCE(?, type),
      fichier_pdf = COALESCE(?, fichier_pdf)
    WHERE id = ?
  `;

  const params = [
    data.titre,
    data.resume,
    data.type,
    data.fichier_pdf,
    submissionId
  ];

  db.query(sql, params, (err, result) => {
    if (err) return callback(err);
    return callback(null, result.affectedRows);
  });
};

const deleteSubmission = (submissionId, callback) => {
  const sql = `DELETE FROM communication WHERE id = ?`;
  db.query(sql, [submissionId], (err, result) => {
    if (err) return callback(err);
    return callback(null, result.affectedRows);
  });
};

module.exports = {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
};
