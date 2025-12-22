// models/workshopRegistration.model.js
const db = require('../db');

const getWorkshopCapacity = (workshopId, callback) => {
  // Phase 4: on récupère date + flag "is_past"
  const sql = `
    SELECT id, nb_places, date,
           (date < NOW()) AS is_past
    FROM workshop
    WHERE id = ?
    LIMIT 1
  `;
  db.query(sql, [workshopId], (err, rows) => {
    if (err) return callback(err);
    return callback(null, rows[0] || null);
  });
};

const countRegistrations = (workshopId, callback) => {
  const sql = 'SELECT COUNT(*) AS total FROM inscription_workshop WHERE workshop_id = ?';
  db.query(sql, [workshopId], (err, rows) => {
    if (err) return callback(err);
    return callback(null, rows[0].total || 0);
  });
};

const registerToWorkshop = (workshopId, userId, callback) => {
  // 1) workshop exists + (phase 4) date + capacity
  getWorkshopCapacity(workshopId, (err, workshop) => {
    if (err) return callback(err);
    if (!workshop) return callback(null, { ok: false, reason: 'WORKSHOP_NOT_FOUND' });

    // Phase 4: refuser si workshop passé
    if (workshop.is_past) {
      return callback(null, { ok: false, reason: 'WORKSHOP_PAST' });
    }

    countRegistrations(workshopId, (err2, total) => {
      if (err2) return callback(err2);

      // nb_places peut être NULL (illimité)
      if (workshop.nb_places !== null && total >= workshop.nb_places) {
        return callback(null, { ok: false, reason: 'WORKSHOP_FULL', capacity: workshop.nb_places });
      }

      // 2) insert (UNIQUE(participant_id, workshop_id) empêche la duplication)
      const sql = `
        INSERT INTO inscription_workshop (participant_id, workshop_id)
        VALUES (?, ?)
      `;
      db.query(sql, [userId, workshopId], (err3, result) => {
        if (err3) {
          if (err3.code === 'ER_DUP_ENTRY') {
            return callback(null, { ok: false, reason: 'ALREADY_REGISTERED' });
          }
          return callback(err3);
        }
        return callback(null, { ok: true, registrationId: result.insertId });
      });
    });
  });
};

const unregisterFromWorkshop = (workshopId, userId, callback) => {
  const sql = `
    DELETE FROM inscription_workshop
    WHERE workshop_id = ? AND participant_id = ?
  `;
  db.query(sql, [workshopId, userId], (err, result) => {
    if (err) return callback(err);
    return callback(null, result.affectedRows);
  });
};

const listWorkshopRegistrations = (workshopId, callback) => {
  const sql = `
    SELECT iw.id AS inscription_id, iw.participant_id, iw.workshop_id,
           u.nom, u.prenom, u.email, u.role
    FROM inscription_workshop iw
    JOIN utilisateur u ON u.id = iw.participant_id
    WHERE iw.workshop_id = ?
    ORDER BY iw.id DESC
  `;
  db.query(sql, [workshopId], (err, rows) => {
    if (err) return callback(err);
    return callback(null, rows);
  });
};

module.exports = {
  registerToWorkshop,
  unregisterFromWorkshop,
  listWorkshopRegistrations,

  // helpers
  getWorkshopCapacity,
  countRegistrations,
};
