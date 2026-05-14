-- Table de données de référence paramétrables
CREATE TABLE reference_data (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    category        NVARCHAR(50)     NOT NULL,
    ref_value       NVARCHAR(100)    NOT NULL,
    label           NVARCHAR(150)    NOT NULL,
    color           NVARCHAR(30)     NULL,
    sort_order      INT              NOT NULL DEFAULT 0,
    active          BIT              NOT NULL DEFAULT 1,
    created_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2        NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_reference_data PRIMARY KEY (id),
    CONSTRAINT uq_reference_data_cat_val UNIQUE (category, ref_value)
);

-- ═══════════════════════════════════════════════════════════════════
-- Catégorie client
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO reference_data (id, category, ref_value, label, color, sort_order) VALUES
(NEWID(), 'CATEGORIE_CLIENT', 'REVENDEUR',    'Revendeur',              NULL, 1),
(NEWID(), 'CATEGORIE_CLIENT', 'GROSSISTE',    'Grossiste',              NULL, 2),
(NEWID(), 'CATEGORIE_CLIENT', 'CHANTIER',     'Chantier',               NULL, 3),
(NEWID(), 'CATEGORIE_CLIENT', 'DISTRIBUTION', 'Distribution',           NULL, 4),
(NEWID(), 'CATEGORIE_CLIENT', 'PROMOTEUR',    'Promoteur immobilier',   NULL, 5),
(NEWID(), 'CATEGORIE_CLIENT', 'SHOWROOM',     'Showroom',               NULL, 6),
(NEWID(), 'CATEGORIE_CLIENT', 'EXPORT',       'Export',                 NULL, 7),
(NEWID(), 'CATEGORIE_CLIENT', 'PARTICULIER',  'Particulier',            NULL, 8),
(NEWID(), 'CATEGORIE_CLIENT', 'ADMINISTRAT',  'Administration',         NULL, 9),
(NEWID(), 'CATEGORIE_CLIENT', 'INDUSTRIE',    'Industrie',              NULL, 10),
(NEWID(), 'CATEGORIE_CLIENT', 'AUTRES',       'Autres',                 NULL, 11);

-- ═══════════════════════════════════════════════════════════════════
-- Société d'affectation
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO reference_data (id, category, ref_value, label, color, sort_order) VALUES
(NEWID(), 'SOCIETE_AFFECTATION', 'Sanitaire AL Boughaze', 'Sanitaire AL Boughaze', NULL, 1),
(NEWID(), 'SOCIETE_AFFECTATION', 'Odyssée',               'Odyssée',               NULL, 2);

-- ═══════════════════════════════════════════════════════════════════
-- Type de compte
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO reference_data (id, category, ref_value, label, color, sort_order) VALUES
(NEWID(), 'TYPE_COMPTE', 'Prospect',    'Prospect',    'blue',   1),
(NEWID(), 'TYPE_COMPTE', 'Client',      'Client',      'green',  2),
(NEWID(), 'TYPE_COMPTE', 'Partenaire',  'Partenaire',  'purple', 3),
(NEWID(), 'TYPE_COMPTE', 'Fournisseur', 'Fournisseur', 'orange', 4);

-- ═══════════════════════════════════════════════════════════════════
-- Type de compte ODYSSÉE
-- ═══════════════════════════════════════════════════════════════════
INSERT INTO reference_data (id, category, ref_value, label, color, sort_order) VALUES
(NEWID(), 'TYPE_COMPTE_ODYSSEE', 'REVENDEUR_SPECIALISE',  'Revendeur spécialisé sanitaire', NULL, 1),
(NEWID(), 'TYPE_COMPTE_ODYSSEE', 'INSTALLATEUR_PLOMBIER', 'Installateur / Plombier',        NULL, 2),
(NEWID(), 'TYPE_COMPTE_ODYSSEE', 'SHOWROOM',               'Showroom',                       NULL, 3),
(NEWID(), 'TYPE_COMPTE_ODYSSEE', 'DISTRIBUTEUR_BTP',       'Distributeur BTP',               NULL, 4),
(NEWID(), 'TYPE_COMPTE_ODYSSEE', 'CANAL_MODERNE',          'Canal moderne',                  NULL, 5),
(NEWID(), 'TYPE_COMPTE_ODYSSEE', 'AUTRE',                  'Autre',                          NULL, 6);
