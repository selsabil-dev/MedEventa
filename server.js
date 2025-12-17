// server.js
require('dotenv').config();
const express = require('express');

const authRoutes = require('./routes/auth.routes');
const eventRoutes = require('./routes/event.routes');
const sessionRoutes = require('./routes/session.routes');
const inscriptionRoutes = require('./routes/inscription.routes');
const { verifyToken } = require('./middlewares/auth.middleware');

const app = express();
const port = process.env.PORT || 3000;

// Logger simple
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Pour parser le JSON
app.use(express.json());

// Routes principales
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api', sessionRoutes);              // /api/events/:eventId/sessions etc.
app.use('/api/inscriptions', inscriptionRoutes);

// Route profil protégée
app.get('/api/profile', verifyToken, (req, res) => {
  res.json({
    message: 'Profil accessible',
    user: req.user,
  });
});

// Route test
app.get('/test', (req, res) => {
  res.json({ message: 'Serveur fonctionne correctement!' });
});

// 404 en dernier
app.use((req, res) => {
  res.status(404).json({
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
  });
});

// Lancement serveur
app.listen(port, () => {
  console.log(`\nServeur Express démarré sur le port ${port}`);
  console.log(`Test:     http://localhost:${port}/test`);
  console.log(`Register: http://localhost:${port}/api/auth/register`);
  console.log(`Login:    http://localhost:${port}/api/auth/login\n`);
});
