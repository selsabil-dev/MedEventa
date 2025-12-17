const db = require('../db');

// Créer une session pour un événement
const createSession = (eventId, data, callback) => {
  const { titre, horaire, salle, president_id } = data;
  const sql = `
    INSERT INTO session (evenement_id, titre, horaire, salle, president_id)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [eventId, titre, horaire, salle, president_id], (err, result) => {
    if (err) {
      console.error('Erreur création session :', err);
      return callback(err, null);
    }
    callback(null, result.insertId);
  });
};

// Récupérer toutes les sessions d’un événement
const getSessionsByEvent = (eventId, callback) => {
  const sql = `
    SELECT id, titre, horaire, salle, president_id
    FROM session
    WHERE evenement_id = ?
    ORDER BY horaire ASC
  `;
  db.query(sql, [eventId], (err, results) => {
    if (err) {
      console.error('Erreur récupération sessions :', err);
      return callback(err);
    }
    callback(null, results);
  });
};

// Récupérer une session par id
const getSessionById = (id, callback) => {
  const sql = `
    SELECT id, evenement_id, titre, horaire, salle, president_id
    FROM session
    WHERE id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Erreur récupération session :', err);
      return callback(err, null);
    }
    if (results.length === 0) return callback(null, null);
    callback(null, results[0]);
  });
};

// Mettre à jour une session
const updateSession = (id, data, callback) => {
  const { titre, horaire, salle, president_id } = data;
  const sql = `
    UPDATE session
    SET titre = ?, horaire = ?, salle = ?, president_id = ?
    WHERE id = ?
  `;
  db.query(sql, [titre, horaire, salle, president_id, id], (err, result) => {
    if (err) {
      console.error('Erreur mise à jour session :', err);
      return callback(err);
    }
    callback(null, result.affectedRows);
  });
};

// Supprimer une session
const deleteSession = (id, callback) => {
  const sql = `DELETE FROM session WHERE id = ?`;
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Erreur suppression session :', err);
      return callback(err);
    }
    callback(null, result.affectedRows);
  });
};

module.exports = {
  createSession,
  getSessionsByEvent,
  getSessionById,
  updateSession,
  deleteSession,
};
