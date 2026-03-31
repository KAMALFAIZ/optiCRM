SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Migration V31: Famille Chantiers (ODYSSÉE Phase MVP)
-- Table principale des chantiers BTP + table acteurs liés

IF OBJECT_ID('chantiers', 'U') IS NULL
BEGIN
CREATE TABLE chantiers (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),

    -- A. Identification
    nom                     NVARCHAR(255) NOT NULL,
    ville                   NVARCHAR(100),
    prefecture              NVARCHAR(100),
    latitude                DECIMAL(10, 8),
    longitude               DECIMAL(11, 8),

    -- B. Typologie du projet
    -- type_projet : RESIDENTIEL_COLLECTIF | RESIDENTIEL_INDIVIDUEL | TERTIAIRE_INSTITUTIONNEL | COMMERCIAL
    type_projet             NVARCHAR(50),
    -- sous_type_projet : LOGEMENT_SOCIAL | MOYEN_STANDING | HAUT_STANDING | VILLAS | LOTISSEMENT |
    --                    HOTEL | ECOLE | SANTE | ADMINISTRATION | BUREAUX |
    --                    CENTRE_COMMERCIAL | RETAIL | MIXTE
    sous_type_projet        NVARCHAR(50),

    -- C. Taille du projet
    nombre_unites           INTEGER,
    -- segment_taille calculé automatiquement : S (<20) | M (20-100) | L (100-300) | XL (>300)
    segment_taille          AS (
        CASE
            WHEN nombre_unites IS NULL THEN NULL
            WHEN nombre_unites < 20    THEN 'S'
            WHEN nombre_unites <= 100  THEN 'M'
            WHEN nombre_unites <= 300  THEN 'L'
            ELSE 'XL'
        END
    ) PERSISTED,

    -- D. Pipeline (stade du chantier)
    -- stade_chantier : ETUDE_CONCEPTION | AUTORISATION | GROS_OEUVRE | SECOND_OEUVRE |
    --                  PHASE_EQUIPEMENT | LIVRAISON | CLOTURE
    stade_chantier          NVARCHAR(30),
    stade_changed_at        DATETIMEOFFSET,

    -- F. Niveau d'opportunité (prescription)
    -- niveau_opportunite : FERME | PARTIELLEMENT_OUVERT | LIBRE
    niveau_opportunite      NVARCHAR(30),

    -- G. Suivi commercial
    -- statut_chantier : ACTIF | PRIORITAIRE | GAGNE | PERDU
    statut_chantier         NVARCHAR(20),
    action_suivante         NVARCHAR(500),
    date_prochaine_action   DATE,

    -- Relations
    assigned_to_id          UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
    territory_id            UNIQUEIDENTIFIER REFERENCES territories(id) ON DELETE SET NULL,

    -- Audit
    created_by_id           UNIQUEIDENTIFIER,
    created_at              DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at              DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
)
END;

-- E. Acteurs clés liés au chantier
-- Un chantier peut avoir plusieurs acteurs de différents rôles
IF OBJECT_ID('chantier_acteurs', 'U') IS NULL
BEGIN
CREATE TABLE chantier_acteurs (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    chantier_id     UNIQUEIDENTIFIER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,

    -- role_acteur : PROMOTEUR | ARCHITECTE | BUREAU_ETUDES | ENTREPRISE_GENERALE | INSTALLATEUR_PLOMBIER
    role_acteur     NVARCHAR(30) NOT NULL,
    nom             NVARCHAR(255) NOT NULL,
    telephone       NVARCHAR(20),

    created_at      DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
)
END;

-- Index
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_assigned_to' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_assigned_to    ON chantiers(assigned_to_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_stade' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_stade          ON chantiers(stade_chantier);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_statut' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_statut         ON chantiers(statut_chantier);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_type_projet' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_type_projet    ON chantiers(type_projet);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_prefecture' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_prefecture     ON chantiers(prefecture);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_ville' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_ville          ON chantiers(ville);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantier_acteurs_chantier' AND object_id = OBJECT_ID('chantier_acteurs'))
    CREATE INDEX idx_chantier_acteurs_chantier ON chantier_acteurs(chantier_id);