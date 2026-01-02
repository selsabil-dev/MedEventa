const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");
const crypto = require("crypto"); // pour les codes temporaires
const nodemailer = require("nodemailer"); // pour envoyer les emails

// Tous les rôles possibles (doivent être les mêmes que l'ENUM dans la table utilisateur)
const ALL_ROLES = [
  "SUPER_ADMIN",
  "ORGANISATEUR",
  "COMMUNICANT",
  "PARTICIPANT",
  "MEMBRE_COMITE",
  "INVITE",
  "RESP_WORKSHOP",
];

// REGISTER
const register = async (req, res) => {
  let {
    nom,
    prenom,
    email,
    mot_de_passe,
    role,
    photo,
    institution,
    domaine_recherche,
  } = req.body;

  // Vérifier que le rôle envoyé est valide
  if (!ALL_ROLES.includes(role)) {
    return res.status(400).json({ message: "Rôle invalide" });
  }

  try {
    // Vérifier si l'email existe déjà
    db.query(
      "SELECT * FROM utilisateur WHERE email = ?",
      [email],
      async (err, result) => {
        if (err) {
          console.error("Erreur DB:", err);
          return res.status(500).json({ message: "Erreur serveur" });
        }

        if (result.length > 0) {
          return res.status(400).json({ message: "Email déjà utilisé" });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(mot_de_passe, 10);

        // Insertion en DB
        const sql = `
        INSERT INTO utilisateur 
          (nom, prenom, email, mot_de_passe, role, photo, institution, domaine_recherche)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;

        db.query(
          sql,
          [
            nom,
            prenom,
            email,
            hashedPassword,
            role,
            photo,
            institution,
            domaine_recherche,
          ],
          (err, resultInsert) => {
            if (err) {
              console.error("Erreur insertion:", err);
              return res
                .status(500)
                .json({ message: "Erreur serveur lors de l'inscription" });
            }

            res.status(201).json({
              message: "Utilisateur créé avec succès",
              userId: resultInsert.insertId,
              role, // pour vérifier côté front
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Erreur:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};

// LOGIN
const login = (req, res) => {
  console.log('Login request body:', req.body);
  const { email, mot_de_passe } = req.body;

  if (!email || !mot_de_passe) {
    console.log('Login failed: missing email or password');
    return res.status(400).json({ message: "Email et mot de passe requis" });
  }

  db.query(
    "SELECT * FROM utilisateur WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        console.error("Erreur DB:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }

      if (result.length === 0) {
        console.log('Login failed: user not found', email);
        return res
          .status(400)
          .json({ message: "Email ou mot de passe incorrect" });
      }

      const user = result[0];

      const isMatch = await bcrypt.compare(mot_de_passe, user.mot_de_passe);
      if (!isMatch) {
        console.log('Login failed: password mismatch', email);
        return res
          .status(400)
          .json({ message: "Email ou mot de passe incorrect" });
      }

      // Générer un token JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" } // durée 1 jour
      );

      console.log('Login successful:', email, user.role);
      res.json({
        message: "Authentification réussie",
        token,
        user: {
          id: user.id,
          nom: user.nom,
          prenom: user.prenom,
          email: user.email,
          role: user.role,
          photo: user.photo,
          institution: user.institution,
          domaine_recherche: user.domaine_recherche,
        },
      });
    }
  );
};

// FORGOT PASSWORD
const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "email requis" });
  }

  db.query(
    "SELECT id FROM utilisateur WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "erreur serveur" });
      }
      if (result.length === 0) {
        return res.json({
          message: "si cet email existe,un lien a été envoyé",
        });
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const codeHash = crypto.createHash("sha256").update(code).digest("hex");
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      db.query(
        `UPDATE utilisateur
         SET reset_token_hash = ?, reset_token_expires = ?
         WHERE email = ?`,
        [codeHash, expiresAt, email],
        async (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: "erreur serveur" });
          }
          try {
            await sendResetEmail(email, code);
          } catch (e) {
            console.error("Erreur envoi email:", e);
            return res
              .status(500)
              .json({ message: "Impossible d'envoyer l'email pour le moment" });
          }
          res.json({ message: "si cet email existe,un code a été envoyé" });
        }
      );
    }
  );
};

// RESET PASSWORD
const resetPassword = async (req, res) => {
  const { email, code, nouveau_mot_de_passe } = req.body;
  if (!email || !code || !nouveau_mot_de_passe) {
    return res.status(400).json({ message: "Données manquantes" });
  }

  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  db.query(
    `SELECT id, reset_token_expires
     FROM utilisateur
     WHERE email = ? AND reset_token_hash = ?`,
    [email, codeHash],
    async (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "erreur serveur" });
      }
      if (result.length === 0) {
        return res.status(400).json({ message: "code invalide" });
      }

      const user = result[0];
      if (new Date(user.reset_token_expires) < new Date()) {
        return res.status(400).json({ message: "code expiré" });
      }

      const hashedPassword = await bcrypt.hash(nouveau_mot_de_passe, 10);

      db.query(
        `UPDATE utilisateur
         SET mot_de_passe = ?,
             reset_token_hash = NULL,
             reset_token_expires = NULL
         WHERE id = ?`,
        [hashedPassword, user.id],
        (err2) => {
          if (err2) {
            console.error(err2);
            return res.status(500).json({ message: "erreur serveur" });
          }
          res.json({ message: "mot de passe modifié avec succès" });
        }
      );
    }
  );
};

const sendResetEmail = async (to, code) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "Réinitialisation du mot de passe",
    html: `<p>Votre code (valide 5min) : <b>${code}</b></p>`,
  });
};

const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email requis" });

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Reuse existing nodemailer setup or creating new one to be safe and "minimal changes"
    // User asked "Use my backend code". I will use the same env vars.
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"MedEventa Support" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Votre code de vérification MedEventa",
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Bienvenue sur MedEventa !</h2>
          <p>Voici votre code de vérification :</p>
          <h1 style="color: #09e0c7; letter-spacing: 2px;">${code}</h1>
          <p>Valide pour 10 minutes.</p>
        </div>
      `,
    });

    // Simple in-memory store
    if (!global.verificationStore) global.verificationStore = new Map();
    global.verificationStore.set(email, {
      code,
      expires: Date.now() + 10 * 60 * 1000,
    });

    res.json({ message: "Code de vérification envoyé" });
  } catch (error) {
    console.error("Erreur envoi code:", error);
    res
      .status(500)
      .json({ message: error.message || "Impossible d'envoyer l'email" });
  }
};

const verifyVerificationCode = (req, res) => {
  let { email, code } = req.body;
  email = email ? email.trim() : "";
  code = code ? code.trim() : "";
  if (!email || !code)
    return res.status(400).json({ message: "Email et code requis" });

  if (!global.verificationStore)
    return res.status(400).json({ message: "Aucun code demandé." });

  const record = global.verificationStore.get(email);
  if (!record) return res.status(400).json({ message: "Aucun code trouvé." });
  if (Date.now() > record.expires)
    return res.status(400).json({ message: "Code expiré." });
  if (record.code !== code)
    return res.status(400).json({ message: "Code invalide." });

  global.verificationStore.delete(email);
  res.json({ message: "Vérifié avec succès" });
};

const getMe = (req, res) => {
  const userId = req.user.id;

  db.query(
    `SELECT id, nom, prenom, email, role, photo, institution, domaine_recherche
     FROM utilisateur
     WHERE id = ?
     LIMIT 1`,
    [userId],
    (err, rows) => {
      if (err) {
        console.error("Erreur DB getMe:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "Utilisateur introuvable" });
      }
      return res.json({ user: rows[0] });
    }
  );
};

// UPDATE ME (partial update)
const updateMe = (req, res) => {
  const userId = req.user.id;

  const allowed = [
    "nom",
    "prenom",
    "email",
    "photo",
    "institution",
    "domaine_recherche",
  ];
  const updates = {};
  for (const k of allowed) {
    if (req.body[k] !== undefined) updates[k] = req.body[k];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "Aucun champ à mettre à jour" });
  }

  // بناء SET ديناميكي
  const keys = Object.keys(updates);
  const setSql = keys.map((k) => `${k} = ?`).join(", ");
  const values = keys.map((k) => updates[k]);

  const sql = `UPDATE utilisateur SET ${setSql} WHERE id = ?`;

  db.query(sql, [...values, userId], (err, result) => {
    if (err) {
      // إذا email unique ودار conflict يطيح هنا (ER_DUP_ENTRY)
      console.error("Erreur DB updateMe:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }

    return res.json({ message: "Profil mis à jour" });
  });
};

// DELETE USER
const deleteUser = (req, res) => {
  const { userId } = req.params;

  db.query("DELETE FROM utilisateur WHERE id = ?", [userId], (err, result) => {
    if (err) {
      console.error("Erreur suppression user:", err);
      // Prevent deleting if constraints fail (e.g., linked data)
      if (err.code === "ER_ROW_IS_REFERENCED_2") {
        return res.status(400).json({
          message:
            "Impossible de supprimer cet utilisateur car il a des données liées (événements, soumissions, etc.)",
        });
      }
      return res.status(500).json({ message: "Erreur serveur" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.json({ message: "Utilisateur supprimé avec succès" });
  });
};

// CREATE USER (Admin/SuperAdmin) - Already handled by register but let's confirm if we need specific admin create
// For now reusing register flow from frontend.

// GET users by role (for dropdowns)
const getUsersByRole = (req, res) => {
  const { roles } = req.query; // ?roles=ORGANISATEUR,MEMBRE_COMITE

  if (!roles) {
    return res.status(400).json({ message: "Roles parameter required" });
  }

  const roleList = roles.split(",");
  // Secure: ensure roleList only contains valid roles to prevent injection if raw SQL was used (though prepared statements handle values safely) but good for logic check
  const validRoles = ALL_ROLES.filter((r) => roleList.includes(r));

  if (validRoles.length === 0) {
    return res.status(400).json({ message: "No valid roles provided" });
  }

  // Dynamically build placeholders based on number of roles
  const placeholders = validRoles.map(() => "?").join(",");
  const sql = `SELECT id, nom, prenom, email, role FROM utilisateur WHERE role IN (${placeholders}) ORDER BY nom, prenom`;

  db.query(sql, validRoles, (err, rows) => {
    if (err) {
      console.error("Erreur getUsersByRole:", err);
      return res.status(500).json({ message: "Erreur serveur" });
    }
    res.json(rows);
  });
};

// SOCIAL LOGIN (Google)
const socialLogin = async (req, res) => {
  const { email, nom, prenom, photo } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Email requis" });
  }

  db.query(
    "SELECT * FROM utilisateur WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        console.error("Erreur DB:", err);
        return res.status(500).json({ message: "Erreur serveur" });
      }

      if (result.length === 0) {
        // Create user if doesn't exist
        const defaultRole = "PARTICIPANT";
        const dummyPassword = await bcrypt.hash(Math.random().toString(36), 10);

        db.query(
          "INSERT INTO utilisateur (nom, prenom, email, mot_de_passe, role, photo) VALUES (?, ?, ?, ?, ?, ?)",
          [nom || "", prenom || "", email, dummyPassword, defaultRole, photo || ""],
          (err2, insertResult) => {
            if (err2) {
              console.error("Erreur insertion:", err2);
              return res.status(500).json({ message: "Erreur création utilisateur" });
            }

            const newUserId = insertResult.insertId;
            const token = jwt.sign(
              { id: newUserId, email, role: defaultRole },
              process.env.JWT_SECRET,
              { expiresIn: "1d" }
            );

            res.json({
              message: "Compte créé et authentifié",
              token,
              user: {
                id: newUserId,
                nom: nom || "",
                prenom: prenom || "",
                email,
                role: defaultRole,
                photo: photo || ""
              }
            });
          }
        );
      } else {
        const user = result[0];
        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "1d" }
        );

        res.json({
          message: "Authentification réussie",
          token,
          user: {
            id: user.id,
            nom: user.nom,
            prenom: user.prenom,
            email: user.email,
            role: user.role,
            photo: user.photo,
            institution: user.institution,
            domaine_recherche: user.domaine_recherche,
          }
        });
      }
    }
  );
};

module.exports = {
  register,
  login,
  socialLogin,
  forgotPassword,
  resetPassword,
  sendVerificationCode,
  verifyVerificationCode,
  getMe,
  updateMe,
  deleteUser,
  getUsersByRole, // export new function
};
