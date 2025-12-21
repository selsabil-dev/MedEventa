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

// Attribuer une communication acceptée à une session
const assignCommunication = (sessionId, communicationId, callback) => {
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

// Programme global par événement
const getProgram = (eventId, callback) => {
  const sql = `
    SELECT
      s.id AS session_id,
      s.titre AS session_titre,
      s.horaire,
      s.salle,
      u.nom AS president_nom,
      u.prenom AS president_prenom,
      c.id AS communication_id,
      c.titre AS communication_titre
    FROM session s
    LEFT JOIN utilisateur u ON s.president_id = u.id
    LEFT JOIN communication c ON c.session_id = s.id
    WHERE s.evenement_id = ?
    ORDER BY s.horaire ASC
  `;

  db.query(sql, [eventId], (err, rows) => {
    if (err) {
      console.error('Erreur getProgram:', err);
      return callback(err, null);
    }
    callback(null, rows);
  });
};

// Programme détaillé pour un jour précis
const getDetailedProgram = (eventId, date, callback) => {
  const sql = `
    SELECT
      s.id AS session_id,
      s.titre AS session_titre,
      s.horaire,
      s.salle,
      u.nom AS president_nom,
      u.prenom AS president_prenom,
      c.id AS communication_id,
      c.titre AS communication_titre
    FROM session s
    LEFT JOIN utilisateur u ON s.president_id = u.id
    LEFT JOIN communication c ON c.session_id = s.id
    WHERE s.evenement_id = ?
      AND DATE(s.horaire) = ?
    ORDER BY s.horaire ASC
  `;

  db.query(sql, [eventId, date], (err, rows) => {
    if (err) {
      console.error('Erreur getDetailedProgram:', err);
      return callback(err, null);
    }
    callback(null, rows);
  });
};

module.exports = {
  createSession,
  assignCommunication,
  getProgram,
  getDetailedProgram,
};
