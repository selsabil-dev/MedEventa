// models/stats.model.js
const db = require('../db');

// 1) Nombre de soumissions
function countSubmissions(eventId, callback) {
  const sql = `
    SELECT COUNT(*) AS total
    FROM communication
    WHERE evenement_id = ?
  `;
  db.query(sql, [eventId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0]?.total || 0);
  });
}

// 2) Taux d’acceptation (accepted / total * 100)
function acceptanceRate(eventId, callback) {
  const sql = `
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN etat = 'acceptee' THEN 1 ELSE 0 END) AS accepted
    FROM communication
    WHERE evenement_id = ?
  `;
  db.query(sql, [eventId], (err, rows) => {
    if (err) return callback(err);

    const total = Number(rows[0]?.total || 0);
    const accepted = Number(rows[0]?.accepted || 0);
    const rate = total === 0 ? 0 : Number(((accepted / total) * 100).toFixed(2));

    callback(null, { total, accepted, rate });
  });
}

// 3) Répartition des soumissions par institution (institution تاع auteur)
function submissionsByInstitution(eventId, callback) {
  const sql = `
    SELECT
      COALESCE(u.institution, 'Non renseignée') AS institution,
      COUNT(*) AS total
    FROM communication c
    JOIN utilisateur u ON u.id = c.auteur_id
    WHERE c.evenement_id = ?
    GROUP BY COALESCE(u.institution, 'Non renseignée')
    ORDER BY total DESC
  `;
  db.query(sql, [eventId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

// 4) Participation par pays (pays تاع participant اللي راهو inscrit)
function participantsByCountry(eventId, callback) {
  const sql = `
    SELECT
      COALESCE(u.pays, 'Non renseigné') AS pays,
      COUNT(*) AS total
    FROM inscription i
    JOIN utilisateur u ON u.id = i.participant_id
    WHERE i.evenement_id = ?
    GROUP BY COALESCE(u.pays, 'Non renseigné')
    ORDER BY total DESC
  `;
  db.query(sql, [eventId], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
}

module.exports = {
  countSubmissions,
  acceptanceRate,
  submissionsByInstitution,
  participantsByCountry
};
