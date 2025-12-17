const mysql = require('mysql');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
});

db.getConnection((err, connection) => {
  if (err) {
    console.error('Erreur de connexion à la DB:', err.message);
    return;
  }
  console.log('Connecté à la base de données MySQL');
  connection.release();
});

module.exports = db;
