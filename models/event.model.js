//Contient les requêtes SQL pour interagir avec les tables evenement, comite_scientifique, membre_comite, invite, session
// models/event.model.js
const db = require('../db');

const createEvent = (data, callback) => {
  const { titre, description, date_debut, date_fin, lieu, thematique, contact, id_organisateur } = data;
  const sql = `
    INSERT INTO evenement (titre, description, date_debut, date_fin, lieu, thematique, contact, id_organisateur)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [titre, description, date_debut, date_fin, lieu, thematique, contact, id_organisateur], (err, result) => {
    if (err) {
      console.error('Erreur insertion événement:', err);
      return callback(err, null);
    }
    callback(null, result.insertId); // Retourne l'ID de l'événement créé
  });
};
<<<<<<< HEAD

module.exports = { createEvent };
=======
const addComiteMember = (comiteId, userId, callback) => {
  const sql = `
    INSERT INTO membre_comite (utilisateur_id, comite_id)
    VALUES (?, ?)
  `;

  db.query(sql, [userId, comiteId], (err, result) => {
    if (err) {
      console.error('Erreur insertion membre_comite:', err);
      return callback(err);
    }
    callback(null, result.insertId); // id de la ligne membre_comite
  });
};
const addInvite = (eventId, inviteData, callback) => {
  const { nom, prenom, email, sujet_conference } = inviteData;

  const sql = `
    INSERT INTO invite (nom, prenom, email, evenement_id, sujet_conference)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(sql, [nom, prenom, email, eventId, sujet_conference], (err, result) => {
    if (err) {
      console.error('Erreur insertion invite:', err);
      return callback(err);
    }
    callback(null, result.insertId); // id de l’invité
  });
};
// Récupérer les événements (option status: 'upcoming' ou 'archived')
const getEvents = (status, callback) => {
  let sql = 'SELECT id, titre, description, date_debut, date_fin, lieu, thematique FROM evenement';
  const params = [];

  if (status === 'upcoming') {
    sql += ' WHERE date_debut >= CURRENT_DATE()';
  } else if (status === 'archived') {
    sql += ' WHERE date_fin < CURRENT_DATE()';
  }

  sql += ' ORDER BY date_debut ASC';

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Erreur récupération événements:', err);
      return callback(err);
    }
    callback(null, results);
  });
};
const getEventDetails = (eventId, callback) => {
  // 1) Récupérer l'événement
  const sqlEvent = `
    SELECT id, titre, description, date_debut, date_fin, lieu, thematique, contact
    FROM evenement
    WHERE id = ?
  `;

  db.query(sqlEvent, [eventId], (err, eventResult) => {
    if (err) {
      console.error('Erreur récupération événement:', err);
      return callback(err);
    }
    if (eventResult.length === 0) {
      return callback(null, null); // pas trouvé
    }

    const event = eventResult[0];

    // 2) Sessions
    const sqlSessions = `
      SELECT id, titre, horaire, salle, president_id
      FROM session
      WHERE evenement_id = ?
    `;

    db.query(sqlSessions, [eventId], (err, sessionsResult) => {
      if (err) {
        console.error('Erreur récupération sessions:', err);
        return callback(err);
      }

      // 3) Invités
      const sqlInvites = `
        SELECT id, nom, prenom, email, sujet_conference
        FROM invite
        WHERE evenement_id = ?
      `;

      db.query(sqlInvites, [eventId], (err, invitesResult) => {
        if (err) {
          console.error('Erreur récupération invités:', err);
          return callback(err);
        }

        // 4) Membres du comité (simple: on ramène les utilisateurs via un JOIN)
        const sqlComite = `
          SELECT u.id, u.nom, u.prenom, u.email
          FROM membre_comite mc
          JOIN comite_scientifique cs ON mc.comite_id = cs.id
          JOIN utilisateur u ON mc.utilisateur_id = u.id
          WHERE cs.evenement_id = ?
        `;

        db.query(sqlComite, [eventId], (err, comiteResult) => {
          if (err) {
            console.error('Erreur récupération comité:', err);
            return callback(err);
          }

          const details = {
            event,
            sessions: sessionsResult,
            invites: invitesResult,
            comite: comiteResult,
          };

          callback(null, details);
        });
      });
    });
  });
};

module.exports = {
  createEvent,
  addComiteMember,
  addInvite,
  getEvents,
  getEventDetails,
};
>>>>>>> 2c8c29f (import old project)
