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
    ) VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [eventId, titre, horaire, salle, president_id], (err, result) => {
    if (err) {
      console.error('Erreur createSession:', err);
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};
// Attribuer une communication à une session (Phase 2)
const assignCommunication = (sessionId, communicationId, callback) => {
  const sql = `
    UPDATE communication
    SET session_id = ?
    WHERE id = ?
      AND etat = 'acceptee'
      AND session_id IS NULL
  `;

  db.query(sql, [sessionId, communicationId], (err, result) => {
    if (err) {
      console.error('Erreur assignCommunication:', err);
      return callback(err, null);
    }
    // 1 si une communication a été mise à jour, 0 sinon
    callback(null, result.affectedRows);
  });
};
// Programme global d'un événement (toutes les sessions + communications)
const getProgram = (eventId, callback) => {
  const sql = `
    SELECT
      s.id               AS session_id,
      s.titre            AS session_titre,
      s.horaire          AS session_horaire,
      s.salle            AS session_salle,
      s.president_id     AS session_president_id,
      c.id               AS comm_id,
      c.titre            AS comm_titre,
      c.type             AS comm_type,
      c.etat             AS comm_etat
    FROM session s
    LEFT JOIN communication c
      ON c.session_id = s.id
    WHERE s.evenement_id = ?
    ORDER BY s.horaire ASC, s.id ASC, c.id ASC
  `;

  db.query(sql, [eventId], (err, rows) => {
    if (err) {
      console.error('Erreur getProgram:', err);
      return callback(err, null);
    }
    callback(null, rows);
  });
};

// Programme détaillé pour un jour précis (YYYY-MM-DD)
const getDetailedProgram = (eventId, date, callback) => {
  const sql = `
    SELECT
      s.id               AS session_id,
      s.titre            AS session_titre,
      s.horaire          AS session_horaire,
      s.salle            AS session_salle,
      s.president_id     AS session_president_id,
      c.id               AS comm_id,
      c.titre            AS comm_titre,
      c.type             AS comm_type,
      c.etat             AS comm_etat
    FROM session s
    LEFT JOIN communication c
      ON c.session_id = s.id
    WHERE s.evenement_id = ?
      AND DATE(s.horaire) = ?
    ORDER BY s.horaire ASC, s.id ASC, c.id ASC
  `;

  db.query(sql, [eventId, date], (err, rows) => {
    if (err) {
      console.error('Erreur getDetailedProgram:', err);
      return callback(err, null);
    }
    callback(null, rows);
  });
};
const updateSession = (sessionId, data, callback) => {
  const { titre, horaire, salle, president_id } = data;

  const sql = `
    UPDATE session
    SET
      titre = COALESCE(?, titre),
      horaire = COALESCE(?, horaire),
      salle = COALESCE(?, salle),
      president_id = COALESCE(?, president_id)
    WHERE id = ?
  `;

  db.query(
    sql,
    [titre || null, horaire || null, salle || null, president_id || null, sessionId],
    (err, result) => {
      if (err) {
        console.error('Erreur updateSession:', err);
        return callback(err, null);
      }
      callback(null, result.affectedRows);
    }
  );
};
module.exports = {
  createSession, assignCommunication,getProgram,
  getDetailedProgram,updateSession,
};
