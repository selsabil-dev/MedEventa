// models/inscription.model.js
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const registerInscription = (eventId, userId, profil, callback) => {
  const badge = uuidv4();
  const sql = `
    INSERT INTO inscription (
      participant_id,
      evenement_id,
      statut_paiement,
      badge,
      date_inscription
    )
    VALUES (?, ?, 'a_payer', ?, CURRENT_DATE())
  `;
  db.query(sql, [userId, eventId, badge], (err, result) => {
    if (err) {
      console.error('Erreur insertion inscription:', err);
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};
const getPaymentStatus = (inscriptionId, callback) => {
  const sql = `
    SELECT statut_paiement
    FROM inscription
    WHERE id = ?
  `;
  db.query(sql, [inscriptionId], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null);
    callback(null, results[0].statut_paiement);
  });
};

const updatePaymentStatus = (inscriptionId, status, callback) => {
  const sql = `
    UPDATE inscription
    SET statut_paiement = ?
    WHERE id = ?
  `;
  db.query(sql, [status, inscriptionId], (err, result) => {
    if (err) return callback(err, null);
    callback(null, result.affectedRows);
  });
};
// Générer un badge unique pour une inscription
const generateBadge = (inscriptionId, callback) => {
  const code = uuidv4(); // code unique [web:49][web:173]

  const sql = `
    UPDATE inscription
    SET badge = ?
    WHERE id = ?
  `;

  db.query(sql, [code, inscriptionId], (err, result) => {
    if (err) {
      console.error('Erreur generateBadge:', err);
      return callback(err, null);
    }
    if (result.affectedRows === 0) {
      return callback(null, null); // inscription non trouvée
    }
    callback(null, code);
  });
};

const getBadgeByCode = (code, callback) => {
  const sql = `
    SELECT id, participant_id, evenement_id, badge, date_inscription
    FROM inscription
    WHERE badge = ?
  `;

  db.query(sql, [code], (err, results) => {
    if (err) return callback(err, null);
    if (results.length === 0) return callback(null, null);
    callback(null, results[0]);
  });
};
const getParticipants = (eventId, profil, callback) => {
  // profil peut être null → pas de filtre [web:191][web:197]
  let sql = `
    SELECT 
      i.id AS inscription_id,
      u.id AS utilisateur_id,
      u.nom,
      u.prenom,
      u.email,
      u.role AS profil,
      i.statut_paiement,
      i.badge,
      i.date_inscription
    FROM inscription i
    JOIN utilisateur u ON i.participant_id = u.id
    WHERE i.evenement_id = ?
  `;
  const params = [eventId];

  if (profil) {
    sql += ' AND u.role = ?';
    params.push(profil);
  }

  sql += ' ORDER BY i.date_inscription DESC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Erreur getParticipants:', err);
      return callback(err, null);
    }
    callback(null, results);
  });
};
module.exports = { registerInscription , getPaymentStatus,
  updatePaymentStatus,generateBadge,
  getBadgeByCode, getParticipants,};
