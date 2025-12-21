// models/session.model.js
const db = require('../db');

// Créer une session pour un événement
const createSession = (eventId, data, callback) => {
  const { titre, horaire, salle, president_id } = data;

  const sql = `
    INSERT INTO session (
      evenement_id,
      titre,
      horaire,
      salle,
      president_id
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(
    sql,
    [eventId, titre, horaire, salle, president_id],
    (err, result) => {
      if (err) {
        console.error('Erreur createSession:', err);
        return callback(err, null);
      }
      callback(null, result.insertId);
    }
  );
};

const assignCommunication = (sessionId, communicationId, callback) => {
  // On ne met à jour que si la communication est acceptée ET pas déjà attribuée
  const sql = `
    UPDATE communication
    SET session_id = ?
    WHERE id = ?
      AND decision = 'accepter'
      AND (session_id IS NULL OR session_id = 0)
  `;

  db.query(sql, [sessionId, communicationId], (err, result) => {
    if (err) {
      console.error('Erreur assignCommunication:', err);
      return callback(err, null);
    }
    callback(null, result.affectedRows); // 1 si ok, 0 si rien mis à jour
  });
};
module.exports = {
  createSession,assignCommunication,
};
