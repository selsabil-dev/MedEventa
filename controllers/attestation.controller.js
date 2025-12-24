// controllers/attestation.controller.js
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit'); // npm install pdfkit
const { validationResult } = require('express-validator');

const {
  createAttestation,
  getAttestationByUser,
  listAttestationsByEvent
} = require('../models/attestation.model');

const { getUserById } = require('../models/user.model');
const { getEventById } = require('../models/event.model');

const {
  isParticipantInscrit,
  hasAcceptedCommunication,
  isMembreComiteForEvent,
  isOrganisateurForEvent,
  isEventFinished, 
} = require('../utils/attestationEligibility');


const ATTESTATIONS_DIR = path.join(__dirname, '..', 'uploads', 'attestations');

if (!fs.existsSync(ATTESTATIONS_DIR)) {
  fs.mkdirSync(ATTESTATIONS_DIR, { recursive: true });
}

function generateAttestationPdf({ filename, user, event, type }, callback) {
  const filePath = path.join(ATTESTATIONS_DIR, filename);

  const doc = new PDFDocument({ margin: 50 });
  const stream = fs.createWriteStream(filePath);
  doc.pipe(stream);

  const nomComplet = `${user.prenom || ''} ${user.nom || ''}`.trim();

  doc.fontSize(20).text('Attestation', { align: 'center' });
  doc.moveDown();

  doc.fontSize(14).text(`Nom : ${nomComplet}`);
  doc.text(`Événement : ${event.titre || ''}`);
  doc.text(`Type : ${type}`);
  doc.text(`Institution : ${user.institution || ''}`);
  doc.text(`Pays : ${user.pays || ''}`);
  doc.moveDown();
  doc.text(
    'Cette attestation certifie la participation à l’événement scientifique.',
    { align: 'left' }
  );

  doc.end();

  stream.on('finish', () => callback(null, filePath));
  stream.on('error', (err) => callback(err));
}

// charger user + event
function getUserAndEventInfo(evenementId, utilisateurId, callback) {
  getUserById(utilisateurId, (errUser, user) => {
    if (errUser) return callback(errUser);
    if (!user) return callback(new Error('UTILISATEUR_INTRouvable'));

    getEventById(evenementId, (errEvent, event) => {
      if (errEvent) return callback(errEvent);
      if (!event) return callback(new Error('EVENEMENT_INTRouvable'));

      callback(null, { user, event });
    });
  });
}

// vérifier l’éligibilité selon type demandé
function checkEligibility(evenementId, utilisateurId, type, callback) {
  if (type === 'participant') {
    return isParticipantInscrit(evenementId, utilisateurId, (err, ok) => {
      if (err) return callback(err);
      if (!ok) return callback(null, { ok: false, reason: 'NOT_REGISTERED' });
      return callback(null, { ok: true });
    });
  }

  if (type === 'communicant') {
    return hasAcceptedCommunication(evenementId, utilisateurId, (err, ok) => {
      if (err) return callback(err);
      if (!ok) {
        return callback(null, { ok: false, reason: 'NO_ACCEPTED_COMMUNICATION' });
      }
      return callback(null, { ok: true });
    });
  }

  if (type === 'membre_comite') {
    return isMembreComiteForEvent(evenementId, utilisateurId, (err, ok) => {
      if (err) return callback(err);
      if (!ok) return callback(null, { ok: false, reason: 'NOT_COMMITTEE_MEMBER' });
      return callback(null, { ok: true });
    });
  }

  if (type === 'organisateur') {
    return isOrganisateurForEvent(evenementId, utilisateurId, (err, ok) => {
      if (err) return callback(err);
      if (!ok) return callback(null, { ok: false, reason: 'NOT_ORGANIZER' });
      return callback(null, { ok: true });
    });
  }

  return callback(null, { ok: false, reason: 'TYPE_INVALIDE' });
}


// POST /api/attestations/me/generate
function generateMyAttestation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const utilisateurId = req.user.id; // { id, email, role } depuis auth.middleware
  const { evenementId, type } = req.body;

  // 1) vérifier si attestation existe déjà
  getAttestationByUser(evenementId, utilisateurId, type, (err, existing) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }

    if (existing) {
      return res.status(200).json({
        message: 'Attestation déjà générée',
        attestation: existing
      });
    }

    // 2) vérifier que l'événement est terminé
    isEventFinished(evenementId, (evErr, evResult) => {
      if (evErr) {
        return res.status(500).json({ message: 'Erreur vérification événement', error: evErr });
      }
      if (!evResult.ok && evResult.reason === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ message: 'Événement introuvable' });
      }
      if (!evResult.ok && evResult.reason === 'EVENT_NOT_FINISHED') {
        return res.status(403).json({
          message: 'Attestation non disponible avant la fin de l’événement',
          reason: 'EVENT_NOT_FINISHED'
        });
      }

      // 3) vérifier l’éligibilité selon le type
      checkEligibility(evenementId, utilisateurId, type, (eligErr, result) => {
        if (eligErr) {
          return res.status(500).json({ message: 'Erreur serveur', error: eligErr });
        }
        if (!result.ok) {
          return res.status(403).json({
            message: 'Utilisateur non éligible pour ce type d’attestation',
            reason: result.reason
          });
        }

        // 4) charger infos user + event
        getUserAndEventInfo(evenementId, utilisateurId, (infoErr, data) => {
          if (infoErr) {
            return res.status(500).json({
              message: 'Erreur chargement infos',
              error: infoErr.message
            });
          }

          const { user, event } = data;
          const filename = `attestation_${evenementId}_${utilisateurId}_${type}.pdf`;

          generateAttestationPdf(
            { filename, user, event, type },
            (pdfErr, filePath) => {
              if (pdfErr) {
                return res.status(500).json({
                  message: 'Erreur génération PDF',
                  error: pdfErr
                });
              }

              const attData = {
                evenementId,
                utilisateurId,
                type,
                fichierPdf: filePath
              };

              createAttestation(attData, (createErr, created) => {
                if (createErr) {
                  return res.status(500).json({
                    message: 'Erreur création attestation',
                    error: createErr
                  });
                }

                return res.status(201).json({
                  message: 'Attestation générée',
                  attestation: created
                });
              });
            }
          );
        });
      });
    });
  });
}


// GET /api/attestations/me/download?evenementId=&type=
function downloadMyAttestation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const utilisateurId = req.user.id;
  const { evenementId, type } = req.query;

  getAttestationByUser(evenementId, utilisateurId, type, (err, attestation) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }
    if (!attestation) {
      return res.status(404).json({ message: 'Attestation introuvable' });
    }

    const filePath = attestation.fichier_pdf;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier PDF introuvable sur le serveur' });
    }

    res.download(filePath, `attestation_${type}.pdf`);
  });
}

// POST /api/attestations/admin/generate
function generateAttestationForUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { evenementId, utilisateurId, type } = req.body;

  getAttestationByUser(evenementId, utilisateurId, type, (err, existing) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }

    if (existing) {
      return res.status(200).json({
        message: 'Attestation déjà générée',
        attestation: existing
      });
    }

    // 1) vérifier fin d'événement
    isEventFinished(evenementId, (evErr, evResult) => {
      if (evErr) {
        return res.status(500).json({ message: 'Erreur vérification événement', error: evErr });
      }
      if (!evResult.ok && evResult.reason === 'EVENT_NOT_FOUND') {
        return res.status(404).json({ message: 'Événement introuvable' });
      }
      if (!evResult.ok && evResult.reason === 'EVENT_NOT_FINISHED') {
        return res.status(403).json({
          message: 'Attestation non disponible avant la fin de l’événement',
          reason: 'EVENT_NOT_FINISHED'
        });
      }

      // 2) (optionnel) vérifier l’éligibilité aussi pour l’admin
      checkEligibility(evenementId, utilisateurId, type, (eligErr, result) => {
        if (eligErr) {
          return res.status(500).json({ message: 'Erreur serveur', error: eligErr });
        }
        if (!result.ok) {
          return res.status(403).json({
            message: 'Utilisateur non éligible pour ce type d’attestation',
            reason: result.reason
          });
        }

        // 3) charger infos user + event
        getUserAndEventInfo(evenementId, utilisateurId, (infoErr, data) => {
          if (infoErr) {
            return res.status(500).json({
              message: 'Erreur chargement infos',
              error: infoErr.message
            });
          }

          const { user, event } = data;
          const filename = `attestation_${evenementId}_${utilisateurId}_${type}.pdf`;

          generateAttestationPdf(
            { filename, user, event, type },
            (pdfErr, filePath) => {
              if (pdfErr) {
                return res.status(500).json({
                  message: 'Erreur génération PDF',
                  error: pdfErr
                });
              }

              const attData = {
                evenementId,
                utilisateurId,
                type,
                fichierPdf: filePath
              };

              createAttestation(attData, (createErr, created) => {
                if (createErr) {
                  return res.status(500).json({
                    message: 'Erreur création attestation',
                    error: createErr
                  });
                }

                return res.status(201).json({
                  message: 'Attestation générée (admin)',
                  attestation: created
                });
              });
            }
          );
        });
      });
    });
  });
}


// GET /api/attestations/evenement/:evenementId
function listEventAttestations(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const evenementId = req.params.evenementId;

  listAttestationsByEvent(evenementId, (err, rows) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }
    return res.status(200).json(rows);
  });
}

module.exports = {
  generateMyAttestation,
  downloadMyAttestation,
  generateAttestationForUser,
  listEventAttestations
};
