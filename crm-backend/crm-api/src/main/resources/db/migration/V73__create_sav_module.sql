-- ============================================================================
-- V73: Module SAV IA Multi-Agent KASOFT
-- Référence : KASOFT-SAV-2026 | Version 1.0
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

-- ============================================================
-- TABLE 1 : Articles de la Knowledge Base
-- (créée en premier car référencée par sav_tickets)
-- ============================================================
CREATE TABLE kb_articles (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    code_article        NVARCHAR(20)     NOT NULL,
    categorie           NVARCHAR(30)     NOT NULL,
    sous_categorie      NVARCHAR(50),
    titre_fr            NVARCHAR(300)    NOT NULL,
    titre_ar            NVARCHAR(300),
    symptomes_fr        NVARCHAR(MAX),
    symptomes_ar        NVARCHAR(MAX),
    causes_fr           NVARCHAR(MAX),
    causes_ar           NVARCHAR(MAX),
    solution_expert_fr  NVARCHAR(MAX),
    solution_expert_ar  NVARCHAR(MAX),
    solution_inter_fr   NVARCHAR(MAX),
    solution_inter_ar   NVARCHAR(MAX),
    solution_debut_fr   NVARCHAR(MAX),
    solution_debut_ar   NVARCHAR(MAX),
    prerequis_fr        NVARCHAR(MAX),
    prerequis_ar        NVARCHAR(MAX),
    tags                NVARCHAR(500),
    mots_cles_fr        NVARCHAR(MAX),
    mots_cles_ar        NVARCHAR(MAX),
    criticite_defaut    NVARCHAR(5)      NOT NULL DEFAULT 'P2',
    niveau_difficulte   NVARCHAR(20)     NOT NULL DEFAULT 'INTERMEDIAIRE',
    necessite_acces_sql BIT              NOT NULL DEFAULT 0,
    necessite_rdv       BIT              NOT NULL DEFAULT 0,
    nb_utilisations     INT              NOT NULL DEFAULT 0,
    nb_succes           INT              NOT NULL DEFAULT 0,
    source              NVARCHAR(20)     NOT NULL DEFAULT 'MANUEL',
    id_ticket_source    UNIQUEIDENTIFIER,
    actif               BIT              NOT NULL DEFAULT 1,
    valide_par_kamal    BIT              NOT NULL DEFAULT 0,
    created_at          DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at          DATETIME2,
    date_validation     DATETIME2,
    CONSTRAINT pk_kb_articles PRIMARY KEY (id),
    CONSTRAINT uq_kb_articles_code UNIQUE (code_article)
);

CREATE INDEX IX_kb_articles_categorie ON kb_articles(categorie);
CREATE INDEX IX_kb_articles_actif ON kb_articles(actif, valide_par_kamal);

-- ============================================================
-- TABLE 2 : Embeddings vectoriels de la KB
-- ============================================================
CREATE TABLE kb_embeddings (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    id_article       UNIQUEIDENTIFIER NOT NULL,
    chunk_index      INT              NOT NULL DEFAULT 0,
    chunk_texte      NVARCHAR(MAX)    NOT NULL,
    langue           NVARCHAR(5)      NOT NULL DEFAULT 'FR',
    vecteur_json     NVARCHAR(MAX)    NOT NULL,
    modele_embedding NVARCHAR(100),
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT pk_kb_embeddings PRIMARY KEY (id),
    CONSTRAINT fk_kb_embeddings_article FOREIGN KEY (id_article) REFERENCES kb_articles(id) ON DELETE CASCADE,
    CONSTRAINT uq_kb_embeddings UNIQUE (id_article, chunk_index, langue)
);

CREATE INDEX IX_kb_embeddings_article ON kb_embeddings(id_article, langue);

-- ============================================================
-- TABLE 3 : Profils SAV des clients KASOFT
-- ============================================================
CREATE TABLE sav_profil_client (
    id                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    account_id         UNIQUEIDENTIFIER NOT NULL,
    niveau_technique   NVARCHAR(20)     NOT NULL DEFAULT 'INTERMEDIAIRE',
    langue_preferee    NVARCHAR(10)     NOT NULL DEFAULT 'FR',
    produits_json      NVARCHAR(MAX),
    environnement_json NVARCHAR(MAX),
    preferences_json   NVARCHAR(MAX),
    tel_whatsapp       NVARCHAR(20),
    email_contact      NVARCHAR(200),
    created_at         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at         DATETIME2,
    CONSTRAINT pk_sav_profil_client PRIMARY KEY (id),
    CONSTRAINT fk_sav_profil_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT uq_sav_profil_account UNIQUE (account_id)
);

-- ============================================================
-- TABLE 4 : Tickets SAV
-- ============================================================
CREATE TABLE sav_tickets (
    id                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    numero_ticket        NVARCHAR(20)     NOT NULL,
    account_id           UNIQUEIDENTIFIER NOT NULL,
    canal_entree         NVARCHAR(20)     NOT NULL DEFAULT 'WEB',
    langue_detectee      NVARCHAR(5)      NOT NULL DEFAULT 'FR',
    texte_original       NVARCHAR(MAX)    NOT NULL,
    texte_normalise      NVARCHAR(MAX),
    domaine              NVARCHAR(30),
    type_ticket          NVARCHAR(20),
    criticite            NVARCHAR(5),
    sla_heures           INT,
    sla_echeance         DATETIME2,
    statut               NVARCHAR(20)     NOT NULL DEFAULT 'OUVERT',
    score_confiance      FLOAT,
    id_kb_article        UNIQUEIDENTIFIER,
    solution_proposee    NVARCHAR(MAX),
    solution_langue      NVARCHAR(5),
    resolu_par           NVARCHAR(20),
    confirmed_resolution BIT              NOT NULL DEFAULT 0,
    created_at           DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    date_prise_en_charge DATETIME2,
    date_resolution      DATETIME2,
    date_fermeture       DATETIME2,
    notes_internes       NVARCHAR(MAX),
    CONSTRAINT pk_sav_tickets PRIMARY KEY (id),
    CONSTRAINT uq_sav_tickets_numero UNIQUE (numero_ticket),
    CONSTRAINT fk_sav_tickets_account FOREIGN KEY (account_id) REFERENCES accounts(id),
    CONSTRAINT fk_sav_tickets_kb FOREIGN KEY (id_kb_article) REFERENCES kb_articles(id)
);

CREATE INDEX IX_sav_tickets_statut ON sav_tickets(statut);
CREATE INDEX IX_sav_tickets_account ON sav_tickets(account_id);
CREATE INDEX IX_sav_tickets_criticite ON sav_tickets(criticite);
CREATE INDEX IX_sav_tickets_date ON sav_tickets(created_at);

-- ============================================================
-- TABLE 5 : Messages du ticket (conversation)
-- ============================================================
CREATE TABLE sav_messages (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    id_ticket     UNIQUEIDENTIFIER NOT NULL,
    expediteur    NVARCHAR(20)     NOT NULL,
    contenu       NVARCHAR(MAX)    NOT NULL,
    langue        NVARCHAR(5)              DEFAULT 'FR',
    canal         NVARCHAR(20)             DEFAULT 'WEB',
    metadata_json NVARCHAR(MAX),
    date_envoi    DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    lu            BIT              NOT NULL DEFAULT 0,
    CONSTRAINT pk_sav_messages PRIMARY KEY (id),
    CONSTRAINT fk_sav_messages_ticket FOREIGN KEY (id_ticket) REFERENCES sav_tickets(id) ON DELETE CASCADE
);

CREATE INDEX IX_sav_messages_ticket ON sav_messages(id_ticket);

-- ============================================================
-- TABLE 6 : Escalades vers Kamal
-- ============================================================
CREATE TABLE sav_escalades (
    id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    id_ticket               UNIQUEIDENTIFIER NOT NULL,
    raison_escalade         NVARCHAR(500),
    score_confiance         FLOAT,
    tentatives_ia_json      NVARCHAR(MAX),
    dossier_complet         NVARCHAR(MAX),
    statut                  NVARCHAR(20)     NOT NULL DEFAULT 'EN_ATTENTE',
    notif_whatsapp_envoye   BIT              NOT NULL DEFAULT 0,
    notif_dashboard_envoye  BIT              NOT NULL DEFAULT 1,
    created_at              DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    date_prise_en_charge    DATETIME2,
    CONSTRAINT pk_sav_escalades PRIMARY KEY (id),
    CONSTRAINT fk_sav_escalades_ticket FOREIGN KEY (id_ticket) REFERENCES sav_tickets(id)
);

-- ============================================================
-- TABLE 7 : SLA et configurations
-- ============================================================
CREATE TABLE sav_config_sla (
    id                    UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    criticite             NVARCHAR(5)      NOT NULL,
    libelle               NVARCHAR(100),
    sla_heures            INT              NOT NULL,
    seuil_escalade_score  FLOAT            NOT NULL DEFAULT 0.75,
    actif                 BIT              NOT NULL DEFAULT 1,
    CONSTRAINT pk_sav_config_sla PRIMARY KEY (id),
    CONSTRAINT uq_sav_config_sla_criticite UNIQUE (criticite)
);

INSERT INTO sav_config_sla (id, criticite, libelle, sla_heures, seuil_escalade_score, actif)
VALUES
    (NEWID(), 'P1', 'Bloquant production', 2, 0.80, 1),
    (NEWID(), 'P2', 'Impact partiel', 4, 0.75, 1),
    (NEWID(), 'P3', 'Question / mineur', 24, 0.70, 1);

-- ============================================================
-- TABLE 8 : Evaluations / Satisfaction
-- ============================================================
CREATE TABLE sav_evaluations (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    id_ticket       UNIQUEIDENTIFIER NOT NULL,
    note            INT,
    commentaire     NVARCHAR(500),
    date_evaluation DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT pk_sav_evaluations PRIMARY KEY (id),
    CONSTRAINT uq_sav_eval_ticket UNIQUE (id_ticket),
    CONSTRAINT fk_sav_eval_ticket FOREIGN KEY (id_ticket) REFERENCES sav_tickets(id)
);

-- ============================================================
-- TABLE 9 : Auth SAV clients (portail web public / OTP)
-- ============================================================
CREATE TABLE sav_auth_clients (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    account_id          UNIQUEIDENTIFIER NOT NULL,
    tel_whatsapp        NVARCHAR(20)     NOT NULL,
    otp_code            NVARCHAR(6),
    otp_expiration      DATETIME2,
    otp_utilise         BIT              NOT NULL DEFAULT 0,
    session_token       NVARCHAR(255),
    session_expiration  DATETIME2,
    derniere_connexion  DATETIME2,
    created_at          DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT pk_sav_auth_clients PRIMARY KEY (id),
    CONSTRAINT uq_sav_auth_tel UNIQUE (tel_whatsapp),
    CONSTRAINT fk_sav_auth_account FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- ============================================================
-- TABLE 10 : Log pipeline agents IA (audit)
-- ============================================================
CREATE TABLE sav_agent_logs (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    id_ticket       UNIQUEIDENTIFIER NOT NULL,
    agent_nom       NVARCHAR(50)     NOT NULL,
    statut          NVARCHAR(20),
    input_json      NVARCHAR(MAX),
    output_json     NVARCHAR(MAX),
    tokens_utilises INT,
    duree_ms        INT,
    erreur_message  NVARCHAR(MAX),
    date_execution  DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT pk_sav_agent_logs PRIMARY KEY (id),
    CONSTRAINT fk_sav_agent_logs_ticket FOREIGN KEY (id_ticket) REFERENCES sav_tickets(id)
);

CREATE INDEX IX_sav_agent_logs_ticket ON sav_agent_logs(id_ticket);
