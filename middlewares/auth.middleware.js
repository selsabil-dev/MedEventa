// middlewares/auth.middleware.js
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization']; // "Bearer xxxxx"
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, email, role }
    next();
  } catch (err) {
    console.error('JWT error:', err.message);
    return res.status(403).json({ message: 'Token invalide ou expiré' });
  }
};

// middleware pour vérifier un rôle
const requireRole = (roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  next();
};

module.exports = { 
  verifyToken, 
  requireRole 
};
