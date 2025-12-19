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
// Récupérer les détails de l'évaluation (formulaire) pour un évaluateur
const getEvaluationForm = (evaluationId, callback) => {
  const sql = `
    SELECT 
      e.id AS evaluation_id,
      c.id AS communication_id,
      c.titre,
      c.resume,
      c.type,
      u.nom AS auteur_nom,
      u.prenom AS auteur_prenom,
      u.email AS auteur_email,
      e.pertinence,
      e.qualite_scientifique,
      e.originalite,
      e.commentaire,
      e.decision,
      e.date_evaluation
    FROM evaluation e
    JOIN communication c ON e.communication_id = c.id
    JOIN utilisateur u ON c.auteur_id = u.id
    WHERE e.id = ?
  `;

  db.query(sql, [evaluationId], (err, results) => {
    if (err) {
      console.error('Erreur getEvaluationForm:', err);
      return callback(err, null);
    }
    if (results.length === 0) {
      return callback(null, null);
    }
    callback(null, results[0]);
  });
};

// Soumettre/mettre à jour une évaluation avec les scores
const submitEvaluation = (evaluationId, scores, callback) => {
  const {
    pertinence,
    qualite_scientifique,
    originalite,
    commentaire,
    decision,
  } = scores;

  const sql = `
    UPDATE evaluation
    SET 
      pertinence = ?,
      qualite_scientifique = ?,
      originalite = ?,
      commentaire = ?,
      decision = ?,
      date_evaluation = NOW()
    WHERE id = ?
  `;

  db.query(
    sql,
    [
      pertinence,
      qualite_scientifique,
      originalite,
      commentaire || null,
      decision,
      evaluationId,
    ],
    (err, result) => {
      if (err) {
        console.error('Erreur submitEvaluation:', err);
        return callback(err, null);
      }
      if (result.affectedRows === 0) {
        return callback(null, null); // évaluation non trouvée
      }
      callback(null, result);
    }
  );
};

module.exports = {
  assignManual, getEvaluationForm,
  submitEvaluation,
};
