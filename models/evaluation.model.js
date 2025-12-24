// models/evaluation.model.js
const db = require('../db');

// Affectation MANUELLE d'une proposition à plusieurs membres du comité
const assignManual = (communicationId, evaluateurIds, callback) => {
  const values = evaluateurIds.map((membreComiteId) => [
    communicationId,
    membreComiteId,
    null, // note
    null, // commentaire
    null, // decision
    null, // date_evaluation
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
    callback(null, {
      affectedRows: result.affectedRows,
      insertedIdsStart: result.insertId,
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
        return callback(null, null);
      }
      callback(null, result);
    }
  );
};

// Générer un rapport d'évaluation (agrège toutes les évaluations d'une proposition)
const generateReport = (propositionId, callback) => {
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

    const moyPertinence =
      evals.reduce((sum, e) => sum + e.pertinence, 0) / evals.length;
    const moyQualite =
      evals.reduce((sum, e) => sum + e.qualite_scientifique, 0) / evals.length;
    const moyOriginalite =
      evals.reduce((sum, e) => sum + e.originalite, 0) / evals.length;

    const decisions = evals.map((e) => e.decision);
    const decisionMajoritaire = decisions.sort(
      (a, b) =>
        decisions.filter((x) => x === a).length -
        decisions.filter((x) => x === b).length
    )[0];

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

    const sqlInsert = `
      INSERT INTO rapport_evaluation (proposition_id, contenu_rapport)
      VALUES (?, ?)
    `;

    db.query(sqlInsert, [propositionId, JSON.stringify(rapport)], (err2) => {
      if (err2) {
        console.error('Erreur generateReport (INSERT):', err2);
        return callback(err2, null);
      }
      callback(null, rapport);
    });
  });
};

// PHASE 5: check if a report exists (lock)
const hasReportForProposition = (propositionId) => {
  return new Promise((resolve, reject) => {
    const sql = 'SELECT id FROM rapport_evaluation WHERE proposition_id = ?';
    db.query(sql, [propositionId], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.length > 0);
    });
  });
};

// PHASE 5: simple pagination for evaluations
const listEvaluationsModel = ({ page, limit, eventId, search }, callback) => {
  const offset = (page - 1) * limit;
  const params = [];
  let where = 'WHERE 1=1';

  if (eventId) {
    where += ' AND c.evenement_id = ?';
    params.push(eventId);
  }

  if (search) {
    where += ' AND c.titre LIKE ?';
    params.push(`%${search}%`);
  }

  const sql = `
    SELECT e.*, c.titre AS communication_titre
    FROM evaluation e
    JOIN communication c ON e.communication_id = c.id
    ${where}
    ORDER BY e.date_evaluation DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  db.query(sql, params, (err, rows) => {
    if (err) return callback(err);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM evaluation e
      JOIN communication c ON e.communication_id = c.id
      ${where}
    `;
    db.query(countSql, params.slice(0, params.length - 2), (err2, countRows) => {
      if (err2) return callback(err2);
      callback(null, {
        data: rows,
        pagination: { page, limit, total: countRows[0].total },
      });
    });
  });
};

// PHASE 5: simple pagination for reports
const listReportsModel = ({ page, limit, eventId, search }, callback) => {
  const offset = (page - 1) * limit;
  const params = [];
  let where = 'WHERE 1=1';

  if (eventId) {
    where += ' AND c.evenement_id = ?';
    params.push(eventId);
  }

  if (search) {
    where += ' AND c.titre LIKE ?';
    params.push(`%${search}%`);
  }

  const sql = `
    SELECT r.*, c.titre AS communication_titre
    FROM rapport_evaluation r
    JOIN communication c ON r.proposition_id = c.id
    ${where}
    ORDER BY r.date_generation DESC
    LIMIT ? OFFSET ?
  `;
  params.push(limit, offset);

  db.query(sql, params, (err, rows) => {
    if (err) return callback(err);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM rapport_evaluation r
      JOIN communication c ON r.proposition_id = c.id
      ${where}
    `;
    db.query(countSql, params.slice(0, params.length - 2), (err2, countRows) => {
      if (err2) return callback(err2);
      callback(null, {
        data: rows,
        pagination: { page, limit, total: countRows[0].total },
      });
    });
  });
};

module.exports = {
  assignManual,
  getEvaluationForm,
  submitEvaluation,
  generateReport,
  hasReportForProposition,
  listEvaluationsModel,
  listReportsModel,
};
