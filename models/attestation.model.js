// models/attestation.model.js
const db = require('../db'); // ✅ هذا الصحيح في مشروعك

// data = { evenementId, utilisateurId, type, fichierPdf, uniqueCode }
function createAttestation(data, callback) {
  // ✅ نخلي MySQL يحط التاريخ (DATE) مباشرة
  const sql = `
    INSERT INTO attestation (utilisateur_id, evenement_id, type, date_generation, fichier_pdf, unique_code)
    VALUES (?, ?, ?, CURRENT_DATE, ?, ?)
  `;

  const params = [
    data.utilisateurId,
    data.evenementId,
    data.type,
    data.fichierPdf,
    data.uniqueCode || null // ✅ يسمح NULL و UNIQUE ما يمنعش NULLs [web:196]
  ];

  db.query(sql, params, (err, result) => {
    if (err) return callback(err);

    const created = {
      id: result.insertId,
      utilisateur_id: data.utilisateurId,
      evenement_id: data.evenementId,
      type: data.type,
      date_generation: new Date(), // display فقط (DB راهي CURRENT_DATE)
      fichier_pdf: data.fichierPdf,
      unique_code: data.uniqueCode || null
    };

    callback(null, created);
  });
}

function getAttestationById(id, callback) {
  const sql = `SELECT * FROM attestation WHERE id = ?`;
  db.query(sql, [id], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0] || null);
  });
}

function getAttestationByUser(evenementId, utilisateurId, type, callback) {
  const sql = `
    SELECT * FROM attestation
    WHERE evenement_id = ? AND utilisateur_id = ? AND type = ?
    LIMIT 1
  `;
  db.query(sql, [evenementId, utilisateurId, type], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0] || null);
  });
}

function listAttestationsByEvent(evenementId, callback) {
  const sql = `
    SELECT * FROM attestation
    WHERE evenement_id = ?
    ORDER BY date_generation DESC
  `;
  db.query(sql, [evenementId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

function listAttestationsByUser(utilisateurId, evenementId, callback) {
  const params = [utilisateurId];
  let sql = `
    SELECT * FROM attestation
    WHERE utilisateur_id = ?
  `;

  if (evenementId) {
    sql += ` AND evenement_id = ?`;
    params.push(evenementId);
  }

  sql += ` ORDER BY date_generation DESC`;

  db.query(sql, params, (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

function deleteAttestation(id, callback) {
  const sql = `DELETE FROM attestation WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) return callback(err);
    callback(null, result);
  });
}

module.exports = {
  createAttestation,
  getAttestationById,
  getAttestationByUser,
  listAttestationsByEvent,
  listAttestationsByUser,
  deleteAttestation
};
