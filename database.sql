-- ============================================
-- DATABASE: event_management
-- ============================================
DROP DATABASE IF EXISTS event_management;
CREATE DATABASE event_management;
USE event_management;

-- ============================================
-- TABLE UTILISATEUR
-- ============================================
CREATE TABLE utilisateur (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM(
        'SUPER_ADMIN',
        'ORGANISATEUR',
        'COMMUNICANT',
        'PARTICIPANT',
        'MEMBRE_COMITE',
        'INVITE',
        'RESP_WORKSHOP'
    ) NOT NULL,
    photo VARCHAR(255),
    institution VARCHAR(255),
    domaine_recherche VARCHAR(255),
    biographie TEXT,
    pays VARCHAR(100),
<<<<<<< HEAD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- TABLE EVENEMENT
-- ============================================
=======
    -- champs ajoutés
    reset_token_hash VARCHAR(255),
    reset_token_expires DATETIME
);

>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
CREATE TABLE evenement (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    date_debut DATE,
    date_fin DATE,
    lieu VARCHAR(255),
    thematique VARCHAR(255),
    contact VARCHAR(255),
    id_organisateur INT,
<<<<<<< HEAD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_organisateur) REFERENCES utilisateur(id) ON DELETE SET NULL
=======
    -- champ ajouté
    date_limite_communication DATETIME,
    FOREIGN KEY (id_organisateur) REFERENCES utilisateur(id)
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
);

-- ============================================
-- TABLE INSCRIPTION
-- ============================================
CREATE TABLE inscription (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    evenement_id INT NOT NULL,
<<<<<<< HEAD
    statut_paiement ENUM('a_payer', 'paye_sur_place', 'paye') DEFAULT 'a_payer',
    badge VARCHAR(255),
    date_inscription DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
=======
    -- défaut ajouté
    statut_paiement ENUM('a_payer', 'paye_sur_place', 'paye') DEFAULT 'a_payer',
    badge VARCHAR(255),
    date_inscription DATE,
    FOREIGN KEY (participant_id) REFERENCES utilisateur(id),
    FOREIGN KEY (evenement_id) REFERENCES evenement(id),
    -- contrainte ajoutée
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
    UNIQUE (participant_id, evenement_id)
);

-- ============================================
-- TABLE PRESENCE
-- ============================================
CREATE TABLE presence (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    evenement_id INT NOT NULL,
    type VARCHAR(50),
<<<<<<< HEAD
    date_presence DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE COMITE_SCIENTIFIQUE
-- ============================================
=======
    date_presence DATETIME,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
    FOREIGN KEY (evenement_id) REFERENCES evenement(id),
    -- contrainte ajoutée
    UNIQUE (utilisateur_id, evenement_id, date_presence)
);

>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
CREATE TABLE comite_scientifique (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evenement_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE MEMBRE_COMITE
-- ============================================
CREATE TABLE membre_comite (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    comite_id INT NOT NULL,
<<<<<<< HEAD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (comite_id) REFERENCES comite_scientifique(id) ON DELETE CASCADE,
=======
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
    FOREIGN KEY (comite_id) REFERENCES comite_scientifique(id),
    -- contrainte ajoutée
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
    UNIQUE (utilisateur_id, comite_id)
);

-- ============================================
-- TABLE COMMUNICATION
-- ============================================
CREATE TABLE communication (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titre VARCHAR(255) NOT NULL,
    resume TEXT,
    -- NOT NULL ajouté
    type ENUM('orale', 'affiche', 'poster') NOT NULL,
    fichier_pdf VARCHAR(255),
<<<<<<< HEAD
    etat ENUM('en_attente', 'acceptee', 'refusee', 'en_revision') DEFAULT 'en_attente',
    auteur_id INT,
    evenement_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (auteur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE
=======
    -- valeurs ajoutées + défaut
    etat ENUM('en_attente', 'acceptee', 'refusee', 'en_revision', 'retire')
        NOT NULL DEFAULT 'en_attente',
    -- NOT NULL ajoutés
    auteur_id INT NOT NULL,
    evenement_id INT NOT NULL,
    -- champs ajoutés
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    decided_by INT,
    FOREIGN KEY (auteur_id) REFERENCES utilisateur(id),
    FOREIGN KEY (evenement_id) REFERENCES evenement(id)
    -- PAS de fk sur decided_by puisque tu as demandé de ne pas ajouter de nouvelle contrainte
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
);

-- ============================================
-- TABLE EVALUATION (MODIFIÉE AVEC LES 3 COLONNES)
-- ============================================
CREATE TABLE evaluation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    communication_id INT NOT NULL,
    membre_comite_id INT NOT NULL,
    -- type ajusté
    note TINYINT,
    commentaire TEXT,
<<<<<<< HEAD
    decision ENUM('accepter', 'refuser', 'corriger'),
    pertinence INT DEFAULT NULL,
    qualite_scientifique INT DEFAULT NULL,
    originalite INT DEFAULT NULL,
    date_evaluation DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (communication_id) REFERENCES communication(id) ON DELETE CASCADE,
    FOREIGN KEY (membre_comite_id) REFERENCES membre_comite(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE RAPPORT_EVALUATION (NOUVELLE)
-- ============================================
CREATE TABLE rapport_evaluation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    proposition_id INT NOT NULL,
    contenu_rapport JSON,
    date_generation DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (proposition_id) REFERENCES communication(id) ON DELETE CASCADE,
    UNIQUE (proposition_id)
);

-- ============================================
-- TABLE SESSION
-- ============================================
=======
    -- NOT NULL ajouté
    decision ENUM('accepter', 'refuser', 'corriger') NOT NULL,
    date_evaluation DATE,
    -- champs ajoutés
    pertinence TINYINT,
    qualite_scientifique TINYINT,
    originalite TINYINT,
    FOREIGN KEY (communication_id) REFERENCES communication(id),
    FOREIGN KEY (membre_comite_id) REFERENCES membre_comite(id)
);

>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
CREATE TABLE session (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evenement_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    horaire DATETIME,
    salle VARCHAR(80),
    president_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
    FOREIGN KEY (president_id) REFERENCES utilisateur(id) ON DELETE SET NULL
);

-- ============================================
-- TABLE WORKSHOP
-- ============================================
CREATE TABLE workshop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evenement_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    responsable_id INT NOT NULL,
    date DATETIME,
    nb_places INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
    FOREIGN KEY (responsable_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE INSCRIPTION_WORKSHOP
-- ============================================
CREATE TABLE inscription_workshop (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participant_id INT NOT NULL,
    workshop_id INT NOT NULL,
<<<<<<< HEAD
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (participant_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (workshop_id) REFERENCES workshop(id) ON DELETE CASCADE,
=======
    FOREIGN KEY (participant_id) REFERENCES utilisateur(id),
    FOREIGN KEY (workshop_id) REFERENCES workshop(id),
    -- contrainte ajoutée
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
    UNIQUE (participant_id, workshop_id)
);

-- ============================================
-- TABLE SUPPORT_ATELIER
-- ============================================
CREATE TABLE support_atelier (
    id INT PRIMARY KEY AUTO_INCREMENT,
    workshop_id INT NOT NULL,
    type VARCHAR(50),
    url VARCHAR(255),
    titre VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workshop_id) REFERENCES workshop(id) ON DELETE CASCADE
);

<<<<<<< HEAD
-- ============================================
-- TABLE INVITE
-- ============================================
=======
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
CREATE TABLE invite (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150),
    evenement_id INT NOT NULL,
    sujet_conference VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE ATTESTATION
-- ============================================
CREATE TABLE attestation (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    evenement_id INT NOT NULL,
    type ENUM('participant', 'communicant', 'membre_comite', 'organisateur') NOT NULL,
    date_generation DATE,
    fichier_pdf VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
    UNIQUE (utilisateur_id, evenement_id, type)
);

-- ============================================
-- TABLE STATISTIQUE
-- ============================================
CREATE TABLE statistique (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evenement_id INT NOT NULL,
    nb_soumissions INT DEFAULT 0,
    taux_acceptation FLOAT DEFAULT 0,
    repartition_par_institution TEXT,
    participation_par_pays TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
    UNIQUE (evenement_id)
);

<<<<<<< HEAD
-- ============================================
-- TABLE MESSAGE_INTERNE
-- ============================================
=======
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
CREATE TABLE message_interne (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expediteur_id INT NOT NULL,
    destinataire_id INT NOT NULL,
    evenement_id INT,
    contenu TEXT NOT NULL,
<<<<<<< HEAD
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    type ENUM('notif', 'reponse', 'modif_prog'),
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expediteur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (destinataire_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE SET NULL
=======
    -- défaut ajouté
    date_envoi DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- NOT NULL ajouté
    type ENUM('notif', 'reponse', 'modif_prog') NOT NULL,
    FOREIGN KEY (expediteur_id) REFERENCES utilisateur(id),
    FOREIGN KEY (destinataire_id) REFERENCES utilisateur(id),
    FOREIGN KEY (evenement_id) REFERENCES evenement(id)
>>>>>>> 474392008d5cf99afa343fff9ca5be470cad575f
);

-- ============================================
-- TABLE NOTIFICATION
-- ============================================
CREATE TABLE notification (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    evenement_id INT NULL,
    type VARCHAR(50),
    message TEXT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    lu BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE SONDAGE
-- ============================================
CREATE TABLE sondage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evenement_id INT NOT NULL,
    titre VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE CHOIX_SONDAGE
-- ============================================
CREATE TABLE choix_sondage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sondage_id INT NOT NULL,
    libelle VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sondage_id) REFERENCES sondage(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE REPONSE_SONDAGE
-- ============================================
CREATE TABLE reponse_sondage (
    id INT PRIMARY KEY AUTO_INCREMENT,
    utilisateur_id INT NOT NULL,
    sondage_id INT NOT NULL,
    choix_id INT NOT NULL,
    date_reponse DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    FOREIGN KEY (sondage_id) REFERENCES sondage(id) ON DELETE CASCADE,
    FOREIGN KEY (choix_id) REFERENCES choix_sondage(id) ON DELETE CASCADE,
    UNIQUE (utilisateur_id, sondage_id)
);

-- ============================================
-- TABLE QUESTION
-- ============================================
CREATE TABLE question (
    id INT PRIMARY KEY AUTO_INCREMENT,
    evenement_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    contenu TEXT NOT NULL,
    date_creation DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evenement_id) REFERENCES evenement(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE
);

-- ============================================
-- TABLE VOTE_QUESTION
-- ============================================
CREATE TABLE vote_question (
    id INT PRIMARY KEY AUTO_INCREMENT,
    question_id INT NOT NULL,
    utilisateur_id INT NOT NULL,
    valeur INT DEFAULT 1,
    date_vote DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE,
    FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id) ON DELETE CASCADE,
    UNIQUE (question_id, utilisateur_id)
);

-- ============================================
-- INDEXES POUR OPTIMISER LES PERFORMANCES
-- ============================================
CREATE INDEX idx_utilisateur_email ON utilisateur(email);
CREATE INDEX idx_utilisateur_role ON utilisateur(role);
CREATE INDEX idx_evenement_organisateur ON evenement(id_organisateur);
CREATE INDEX idx_inscription_participant ON inscription(participant_id);
CREATE INDEX idx_inscription_evenement ON inscription(evenement_id);
CREATE INDEX idx_communication_auteur ON communication(auteur_id);
CREATE INDEX idx_communication_evenement ON communication(evenement_id);
CREATE INDEX idx_communication_etat ON communication(etat);
CREATE INDEX idx_evaluation_communication ON evaluation(communication_id);
CREATE INDEX idx_evaluation_membre ON evaluation(membre_comite_id);
CREATE INDEX idx_rapport_proposition ON rapport_evaluation(proposition_id);
CREATE INDEX idx_message_expediteur ON message_interne(expediteur_id);
CREATE INDEX idx_message_destinataire ON message_interne(destinataire_id);
CREATE INDEX idx_notification_utilisateur ON notification(utilisateur_id);
CREATE INDEX idx_presence_utilisateur ON presence(utilisateur_id);
CREATE INDEX idx_presence_evenement ON presence(evenement_id);

CREATE TABLE survey (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_id INT NOT NULL,
  title VARCHAR(255) NOT NULL
);

CREATE TABLE survey_question (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_id INT NOT NULL,
  question_text TEXT NOT NULL
);

CREATE TABLE survey_response (
  id INT AUTO_INCREMENT PRIMARY KEY,
  survey_id INT NOT NULL,
  user_id INT NOT NULL,
  question_id INT NOT NULL,
  answer_text TEXT NOT NULL
);
