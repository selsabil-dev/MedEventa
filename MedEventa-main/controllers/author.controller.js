// controllers/author.controller.js
const db = require('../db');

const getAuthorStats = (req, res) => {
    const authorId = req.user.id;
    const sql = `
    SELECT 
      SUM(CASE WHEN etat = 'acceptee' THEN 1 ELSE 0 END) as accepted,
      SUM(CASE WHEN etat = 'en_attente' OR etat = 'en_revision' THEN 1 ELSE 0 END) as pending,
      0 as views -- Placeholder as we don't track views per submission yet
    FROM communication
    WHERE auteur_id = ?
  `;

    db.query(sql, [authorId], (err, results) => {
        if (err) {
            console.error('Error fetching author stats:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        const stats = results[0] || { accepted: 0, pending: 0, views: 0 };
        res.json({
            accepted: stats.accepted || 0,
            pending: stats.pending || 0,
            views: 0
        });
    });
};

const getAuthorSubmissions = (req, res) => {
    const authorId = req.user.id;
    const sql = `
    SELECT id, titre as title, resume as abstract, type, etat as status, evenement_id, created_at as date
    FROM communication
    WHERE auteur_id = ?
    ORDER BY created_at DESC
  `;

    db.query(sql, [authorId], (err, results) => {
        if (err) {
            console.error('Error fetching author submissions:', err);
            return res.status(500).json({ message: 'Erreur serveur' });
        }
        res.json(results);
    });
};

module.exports = {
    getAuthorStats,
    getAuthorSubmissions,
};
