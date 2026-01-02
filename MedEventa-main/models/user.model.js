// models/user.model.js
const db = require('../db');

const getUserById = (id, callback) => {
  const sql = `
    SELECT id, nom, prenom, email, role, institution, pays
    FROM utilisateur
    WHERE id = ?
    LIMIT 1
  `;
  db.query(sql, [id], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows[0] || null);
  });
};

const getUsersByRole = (role, callback) => {
  const sql = `
    SELECT id, nom, prenom, email, role, institution
    FROM utilisateur
    WHERE role = ?
    ORDER BY nom ASC, prenom ASC
  `;
  db.query(sql, [role], (err, rows) => {
    if (err) return callback(err);
    callback(null, rows);
  });
};

module.exports = {
  getUserById,
  getUsersByRole
};
