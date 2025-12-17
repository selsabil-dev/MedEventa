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

module.exports = { registerInscription };
