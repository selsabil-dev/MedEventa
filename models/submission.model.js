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
    data.auteur_id,        // ✅ auteur_id (colonne DB)
    data.evenement_id
  ];

  db.query(sql, params, (err, result) => {
    if (err) return callback(err);
    return callback(null, result.insertId);
  });
};

module.exports = { createSubmission };
