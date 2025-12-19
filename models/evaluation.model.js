// models/evaluation.model.js
const db = require('../db');

// Affectation MANUELLE d'une proposition à plusieurs membres du comité
// eventId sert juste pour vérifier que la communication et les membres
// appartiennent bien au bon événement (on pourra renforcer plus tard).
const assignManual = (communicationId, evaluateurIds, callback) => {
  // Préparer les valeurs pour INSERT multiple
  const values = evaluateurIds.map((membreComiteId) => [
    communicationId,
    membreComiteId,
    null,   // note
    null,   // commentaire
    null,   // decision
    null,   // date_evaluation
  ]);

  const sql = `
    INSERT INTO evaluation (
      communication_id,
      membre_comite_id,
      note,
      commentaire,
      decision,
      date_evaluation
    )
    VALUES ?
  `;

  db.query(sql, [values], (err, result) => {
    if (err) {
      console.error('Erreur assignManual (evaluation):', err);
      return callback(err, null);
    }
    // result.affectedRows = nb d'affectations créées [web:239]
    callback(null, {
      affectedRows: result.affectedRows,
      insertedIdsStart: result.insertId, // premier id inséré
    });
  });
};

module.exports = {
  assignManual,
};
