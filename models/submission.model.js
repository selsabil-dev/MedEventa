// models/submission.model.js
const db = require('../db');

// ===== Phase 4: historique =====
const logSubmissionHistory = (submissionId, action, oldValue, newValue, userId, callback) => {
  const sql = `
    INSERT INTO proposition_history (submission_id, action, old_value, new_value, changed_by)
    VALUES (?, ?, ?, ?, ?)
  `;

  const params = [
    submissionId,
    action,
    oldValue !== undefined && oldValue !== null ? JSON.stringify(oldValue) : null,
    newValue !== undefined && newValue !== null ? JSON.stringify(newValue) : null,
    userId,
  ];

  db.query(sql, params, (err) => {
    if (err) return callback(err);
    return callback(null, true);
  });
};

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

    const submissionId = result.insertId;

    // Log CREATE
    const newValue = {
      titre: data.titre,
      resume: data.resume,
      type: data.type,
      fichier_pdf: data.fichier_pdf,
      etat: 'en_attente',
      auteur_id: data.auteur_id,
      evenement_id: data.evenement_id,
    };

    logSubmissionHistory(submissionId, 'CREATE', null, newValue, data.auteur_id, (err2) => {
      if (err2) return callback(err2);
      return callback(null, submissionId);
    });
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

// Phase 3: mise à jour du statut + decided_by
const setSubmissionStatus = (submissionId, status, decidedBy, callback) => {
  const sql = `
    UPDATE communication
    SET etat = ?, decided_by = ?
    WHERE id = ?
  `;

  db.query(sql, [status, decidedBy, submissionId], (err, result) => {
    if (err) return callback(err);
    return callback(null, result.affectedRows);
  });
};

// ===== Phase 4: withdraw =====
const withdrawSubmission = (submissionId, userId, callback) => {
  const sql = `
    UPDATE communication
    SET etat = 'retire', decided_by = ?
    WHERE id = ?
  `;
  db.query(sql, [userId, submissionId], (err, result) => {
    if (err) return callback(err);
    return callback(null, result.affectedRows);
  });
};

module.exports = {
  createSubmission,
  getSubmissionById,
  updateSubmission,
  deleteSubmission,
  setSubmissionStatus,

  // phase 4
  logSubmissionHistory,
  withdrawSubmission,
};
