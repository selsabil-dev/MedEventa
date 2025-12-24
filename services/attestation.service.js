// services/attestation.service.js

const path = require("path");
const fs = require("fs");
const fsp = require("fs/promises");
const crypto = require("crypto");
const PDFDocument = require("pdfkit");

const db = require("../db"); // mysql pool (callbacks)

const BASE_DIR = path.join(process.cwd(), "uploads", "attestations");
const ALLOWED_TYPES = ["participant", "communicant", "membre_comite", "organisateur"];

// ✅ wrapper باش نخدمو بـ async/await فوق mysql callback
function queryAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

class AttestationService {
  static generateUniqueCode() {
    return crypto.randomBytes(16).toString("hex"); // 32 chars
  }

  static async ensureDir(eventId, type) {
    const dir = path.join(BASE_DIR, String(eventId), String(type));
    await fsp.mkdir(dir, { recursive: true });
    return dir;
  }

  static buildPdfPath(eventId, type, uniqueCode) {
    return path.join(BASE_DIR, String(eventId), String(type), `${uniqueCode}.pdf`);
  }

  static async fetchData({ eventId, userId }) {
    const eventRows = await queryAsync(
      "SELECT id, titre, date_debut, date_fin, lieu FROM evenement WHERE id = ?",
      [eventId]
    );
    if (!eventRows.length) throw new Error("Evenement introuvable");

    const userRows = await queryAsync(
      "SELECT id, nom, prenom, email, institution FROM utilisateur WHERE id = ?",
      [userId]
    );
    if (!userRows.length) throw new Error("Utilisateur introuvable");

    return { event: eventRows[0], user: userRows[0] };
  }

  static async writePdf({ event, user, type, uniqueCode, pdfPath }) {
    await this.ensureDir(event.id, type);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      doc.fontSize(22).text("ATTESTATION", { align: "center" });
      doc.moveDown(0.5);
      doc.fontSize(12).text(`Type: ${type}`, { align: "center" });
      doc.moveDown();

      doc.fontSize(11).text(`Certifie que: ${user.prenom} ${user.nom}`);
      doc.text(`Email: ${user.email}`);
      if (user.institution) doc.text(`Institution: ${user.institution}`);
      doc.moveDown();

      doc.text(`Événement: ${event.titre}`);
      if (event.lieu) doc.text(`Lieu: ${event.lieu}`);
      if (event.date_debut) doc.text(`Date début: ${new Date(event.date_debut).toLocaleDateString("fr-FR")}`);
      if (event.date_fin) doc.text(`Date fin: ${new Date(event.date_fin).toLocaleDateString("fr-FR")}`);

      doc.moveDown(2);
      doc.fontSize(9).text(`Code de vérification: ${uniqueCode}`, { align: "center" });
      doc.text(`Généré le: ${new Date().toLocaleString("fr-FR")}`, { align: "center" });

      doc.end();

      stream.on("finish", resolve);
      stream.on("error", reject);
    });
  }

  // ✅ Phase 3: générer PDF seulement
  static async generateAttestationPdf({ eventId, userId, type }) {
    if (!ALLOWED_TYPES.includes(type)) throw new Error("type invalide");

    const { event, user } = await this.fetchData({ eventId, userId });

    const uniqueCode = this.generateUniqueCode();
    const pdfPath = this.buildPdfPath(eventId, type, uniqueCode);

    await this.writePdf({ event, user, type, uniqueCode, pdfPath });

    return { pdfPath, uniqueCode };
  }

  static async getPdfPath({ eventId, userId, type }) {
    const rows = await queryAsync(
      "SELECT fichier_pdf FROM attestation WHERE utilisateur_id=? AND evenement_id=? AND type=? LIMIT 1",
      [userId, eventId, type]
    );
    return rows.length ? rows[0].fichier_pdf : null;
  }
}

module.exports = AttestationService;
