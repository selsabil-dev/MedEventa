// controllers/attestation.controller.js
const path = require('path');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { validationResult } = require('express-validator');
const db = require('../db');

const {
  createAttestation,
  upsertAttestation,
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
  isGuestSpeakerForEvent,
  isEventFinished,
} = require('../utils/attestationEligibility');

const AttestationService = require("../services/attestation.service");


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

  if (type === 'invite') {
    return isGuestSpeakerForEvent(evenementId, utilisateurId, (err, ok) => {
      if (err) return callback(err);
      if (!ok) return callback(null, { ok: false, reason: 'NOT_SPEAKER' });
      return callback(null, { ok: true });
    });
  }

  return callback(null, { ok: false, reason: 'TYPE_INVALIDE' });
}

/**
 * ============================
 * Phase 3: PDF unique + stockage
 * ============================
 * POST /api/attestations/me/generate
 */
function generateMyAttestation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const utilisateurId = req.user.id;
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

        // 4) Phase 3: توليد PDF عبر service (uniqueCode + stockage منظم)
        AttestationService.generateAttestationPdf({
          eventId: evenementId,
          userId: utilisateurId,
          type
        })
          .then(({ pdfPath, uniqueCode }) => {
            const attData = {
              evenementId,
              utilisateurId,
              type,
              fichierPdf: pdfPath,
              uniqueCode // ⚠️ model لازم يدعمو (أو تجاهلو مؤقتاً)
            };

            // 5) إنشاء attestation في DB (insert)
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
          })
          .catch((pdfErr) => {
            return res.status(500).json({
              message: 'Erreur génération PDF (service)',
              error: pdfErr.message || pdfErr
            });
          });
      });
    });
  });
}

/**
 * Phase 3: download (وإذا ماكانش يولّد)
 * GET /api/attestations/me/download?evenementId=&type=
 */
function downloadMyAttestation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const utilisateurId = req.user.id;
  const { evenementId, type } = req.query;

  // 0) type validate سريع (باش ما ندخلوش للـ DB بلا لازمة)
  const allowed = ['participant', 'communicant', 'membre_comite', 'organisateur', 'invite'];
  if (!allowed.includes(type)) {
    return res.status(400).json({ message: 'Type invalide', reason: 'TYPE_INVALIDE' });
  }

  // 1) نجيب attestation من DB
  getAttestationByUser(evenementId, utilisateurId, type, (err, attestation) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }

    // 2) إذا ماكانتش attestation → نقدر نولدها ثم نحمّلها (Phase 3)
    if (!attestation) {
      // لازم نفس شروط Phase 2
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

          AttestationService.generateAttestationPdf({
            eventId: evenementId,
            userId: utilisateurId,
            type
          })
            .then(({ pdfPath, uniqueCode }) => {
              const attData = {
                evenementId,
                utilisateurId,
                type,
                fichierPdf: pdfPath,
                uniqueCode
              };

              createAttestation(attData, (createErr, created) => {
                if (createErr) {
                  return res.status(500).json({
                    message: 'Erreur création attestation',
                    error: createErr
                  });
                }

                if (!fs.existsSync(pdfPath)) {
                  return res.status(404).json({ message: 'Fichier PDF introuvable sur le serveur' });
                }

                return res.download(pdfPath, `attestation_${type}.pdf`); // téléchargement [web:222]
              });
            })
            .catch((pdfErr) => {
              return res.status(500).json({
                message: 'Erreur génération PDF (service)',
                error: pdfErr.message || pdfErr
              });
            });
        });
      });

      return;
    }

    // 3) attestation موجودة → حمل الملف من fichier_pdf
    const filePath = attestation.fichier_pdf;

    if (!filePath || !fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Fichier PDF introuvable sur le serveur' });
    }

    return res.download(filePath, `attestation_${type}.pdf`); // téléchargement [web:222]
  });
}

/**
 * POST /api/attestations/admin/generate
 * Phase 5:
 * - cache: إذا attestation موجودة ما نعاودش نولدها
 * - force=true: نعاود نولد PDF ونحدث row (upsert)
 */
function generateAttestationForUser(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { evenementId, utilisateurId, type, force } = req.body;

  getAttestationByUser(evenementId, utilisateurId, type, (err, existing) => {
    if (err) {
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }

    // ✅ cache
    if (existing && !force) {
      return res.status(200).json({
        message: 'Attestation déjà générée (cache)',
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

      // 2) vérifier l’éligibilité
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

        // 3) توليد PDF عبر service
        AttestationService.generateAttestationPdf({
          eventId: evenementId,
          userId: utilisateurId,
          type
        })
          .then(({ pdfPath, uniqueCode }) => {
            const attData = {
              evenementId,
              utilisateurId,
              type,
              fichierPdf: pdfPath,
              uniqueCode
            };

            // ✅ Phase 5: upsert (إذا كان موجود و force=true راح يحدّث)
            upsertAttestation(attData, (saveErr, savedRow) => {
              if (saveErr) {
                return res.status(500).json({
                  message: 'Erreur création/mise à jour attestation',
                  error: saveErr
                });
              }

              return res.status(existing ? 200 : 201).json({
                message: existing
                  ? 'Attestation régénérée (force=true)'
                  : 'Attestation générée (admin)',
                attestation: savedRow
              });
            });
          })
          .catch((pdfErr) => {
            return res.status(500).json({
              message: 'Erreur génération PDF (service)',
              error: pdfErr.message || pdfErr
            });
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



// GET /api/attestations/me/list
function listMyAttestations(req, res) {
  const utilisateurId = req.user.id;

  // Custom query to join with event title
  const sql = `
    SELECT a.*, e.titre as event_title
    FROM attestation a
    JOIN evenement e ON a.evenement_id = e.id
    WHERE a.utilisateur_id = ?
    ORDER BY a.date_generation DESC
  `;

  db.query(sql, [utilisateurId], (err, rows) => {
    if (err) {
      console.error('Error listing user attestations:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }
    return res.status(200).json(rows);
  });
}

// GET /api/attestations/me/eligibility
function listMyEligibility(req, res) {
  const utilisateurId = req.user.id;

  // This query finds events where user is eligible but no attestation exists.
  // We check for: Participant, Communicant, Invite (Speaker), Membre Comite, Organisateur.
  // We only include events that have 'ended' (using a simplified NOW() check, 
  // though the generation itself will use the more robust isEventFinished logic).
  const sql = `
    SELECT evenement_id, event_title, type FROM (
      -- 1. Participants
      SELECT 
        e.id as evenement_id, e.titre as event_title, 'participant' as type
      FROM evenement e
      JOIN inscription i ON i.evenement_id = e.id
      WHERE i.participant_id = ? AND (e.date_fin IS NOT NULL AND e.date_fin <= NOW())
      AND NOT EXISTS (SELECT 1 FROM attestation a WHERE a.evenement_id = e.id AND a.utilisateur_id = ? AND a.type = 'participant')

      UNION ALL

      -- 2. Communicants (Authors)
      SELECT 
        e.id as evenement_id, e.titre as event_title, 'communicant' as type
      FROM evenement e
      JOIN communication c ON c.evenement_id = e.id
      WHERE (c.auteur_id = ?) AND c.etat = 'acceptee' AND (e.date_fin IS NOT NULL AND e.date_fin <= NOW())
      AND NOT EXISTS (SELECT 1 FROM attestation a WHERE a.evenement_id = e.id AND a.utilisateur_id = ? AND a.type = 'communicant')

      UNION ALL

      -- 3. Invited Speakers (Chairs/Authors in sessions)
      SELECT 
        e.id as evenement_id, e.titre as event_title, 'invite' as type
      FROM evenement e
      JOIN session s ON s.evenement_id = e.id
      LEFT JOIN communication c ON c.session_id = s.id
      WHERE (s.president_id = ? OR c.auteur_id = ?) AND (e.date_fin IS NOT NULL AND e.date_fin <= NOW())
      AND NOT EXISTS (SELECT 1 FROM attestation a WHERE a.evenement_id = e.id AND a.utilisateur_id = ? AND a.type = 'invite')

      UNION ALL

      -- 4. Committee Members
      SELECT 
        e.id as evenement_id, e.titre as event_title, 'membre_comite' as type
      FROM evenement e
      JOIN comite_scientifique cs ON cs.evenement_id = e.id
      JOIN membre_comite mc ON mc.comite_id = cs.id
      WHERE mc.utilisateur_id = ? AND (e.date_fin IS NOT NULL AND e.date_fin <= NOW())
      AND NOT EXISTS (SELECT 1 FROM attestation a WHERE a.evenement_id = e.id AND a.utilisateur_id = ? AND a.type = 'membre_comite')

      UNION ALL

      -- 5. Organizers
      SELECT 
        e.id as evenement_id, e.titre as event_title, 'organisateur' as type
      FROM evenement e
      WHERE e.id_organisateur = ? AND (e.date_fin IS NOT NULL AND e.date_fin <= NOW())
      AND NOT EXISTS (SELECT 1 FROM attestation a WHERE a.evenement_id = e.id AND a.utilisateur_id = ? AND a.type = 'organisateur')
    ) as eligibility
    ORDER BY evenement_id DESC
  `;

  // Note: For now, I'm excluding presentateur_id check in SQL to avoid potential column errors 
  // if not yet migrated, sticking to auteur_id which is guaranteed.
  const params = [
    utilisateurId, utilisateurId, // participant
    utilisateurId, utilisateurId, // communicant
    utilisateurId, utilisateurId, utilisateurId, // invite
    utilisateurId, utilisateurId, // membre_comite
    utilisateurId, utilisateurId  // organisateur
  ];

  db.query(sql, params, (err, rows) => {
    if (err) {
      console.error('Error listing user eligibility:', err);
      return res.status(500).json({ message: 'Erreur serveur', error: err });
    }
    return res.status(200).json(rows);
  });
}

module.exports = {
  generateMyAttestation,
  downloadMyAttestation,
  generateAttestationForUser,
  listEventAttestations,
  listMyAttestations,
  listMyEligibility
};
