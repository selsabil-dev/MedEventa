// controllers/stats.controller.js
const { validationResult } = require('express-validator');
const StatsModel = require('../models/stats.model');

function getEventStats(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const eventId = Number(req.params.eventId);

  StatsModel.countSubmissions(eventId, (e1, submissionsCount) => {
    if (e1) return res.status(500).json({ message: 'Erreur serveur', error: e1 });

    StatsModel.acceptanceRate(eventId, (e2, acceptance) => {
      if (e2) return res.status(500).json({ message: 'Erreur serveur', error: e2 });

      StatsModel.submissionsByInstitution(eventId, (e3, submissionsInst) => {
        if (e3) return res.status(500).json({ message: 'Erreur serveur', error: e3 });

        StatsModel.participantsByCountry(eventId, (e4, participantsCountry) => {
          if (e4) return res.status(500).json({ message: 'Erreur serveur', error: e4 });

          return res.status(200).json({
            eventId,
            submissionsCount,
            acceptanceRate: acceptance, // { total, accepted, rate }
            submissionsByInstitution: submissionsInst,
            participantsByCountry: participantsCountry
          });
        });
      });
    });
  });
}

module.exports = { getEventStats };
