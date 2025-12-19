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
// Générer un rapport d'évaluation (agrège toutes les évaluations d'une proposition)
const generateReport = (propositionId, callback) => {
  // 1) Récupérer toutes les évaluations de cette proposition
  const sqlEvals = `
    SELECT 
      e.pertinence,
      e.qualite_scientifique,
      e.originalite,
      e.commentaire,
      e.decision
    FROM evaluation e
    WHERE e.communication_id = ?
    AND e.pertinence IS NOT NULL
  `;

  db.query(sqlEvals, [propositionId], (err, evals) => {
    if (err) {
      console.error('Erreur generateReport (SELECT):', err);
      return callback(err, null);
    }

    if (evals.length === 0) {
      return callback(null, null); // pas d'évaluations complètes
    }

    // 2) Calculer les moyennes et les recommandations
    const moyPertinence =
      evals.reduce((sum, e) => sum + e.pertinence, 0) / evals.length;
    const moyQualite =
      evals.reduce((sum, e) => sum + e.qualite_scientifique, 0) / evals.length;
    const moyOriginalite =
      evals.reduce((sum, e) => sum + e.originalite, 0) / evals.length;

    // Compter les décisions
    const decisions = evals.map((e) => e.decision);
    const decisionMajoritaire = decisions.sort(
      (a, b) =>
        decisions.filter((x) => x === a).length -
        decisions.filter((x) => x === b).length
    )[0];

    // 3) Construire le rapport JSON
    const rapport = {
      proposition_id: propositionId,
      nombre_evaluateurs: evals.length,
      scores_moyens: {
        pertinence: parseFloat(moyPertinence.toFixed(2)),
        qualite_scientifique: parseFloat(moyQualite.toFixed(2)),
        originalite: parseFloat(moyOriginalite.toFixed(2)),
      },
      decision_majoritaire: decisionMajoritaire,
      commentaires: evals
        .filter((e) => e.commentaire)
        .map((e) => e.commentaire),
      date_generation: new Date().toISOString(),
    };

    // 4) Insérer le rapport en BD
    const sqlInsert = `
      INSERT INTO rapport_evaluation (proposition_id, contenu_rapport)
      VALUES (?, ?)
    `;

    db.query(sqlInsert, [propositionId, JSON.stringify(rapport)], (err2, result) => {
      if (err2) {
        console.error('Erreur generateReport (INSERT):', err2);
        return callback(err2, null);
      }
      callback(null, rapport);
    });
  });
};
module.exports = {
  assignManual, getEvaluationForm,
  submitEvaluation,generateReport,
};
