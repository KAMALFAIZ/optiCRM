SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V38 : Champs de classification Sage 100C sur le compte client
-- Mappés depuis la vue [Clients] de GROUPE_ALBOUGHAZE
-- Tous optionnels — seuls les champs présents dans Sage sont synchronisés

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'secteur_activite')
    ALTER TABLE accounts ADD secteur_activite    NVARCHAR(100);   -- Sage : [Secteur_]
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'categorie_client')
    ALTER TABLE accounts ADD categorie_client    NVARCHAR(100);   -- Sage : [Catégorie_]
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'categorie_tarifaire')
    ALTER TABLE accounts ADD categorie_tarifaire NVARCHAR(100);   -- Sage : [Catégorie tarifaire_]

-- Élargissement des colonnes ODYSSÉE existantes pour couvrir les libellés Sage réels
ALTER TABLE accounts ALTER COLUMN type_compte_odyssee NVARCHAR(100);  -- était VARCHAR(50)
ALTER TABLE accounts ALTER COLUMN statut_compte       NVARCHAR(100);  -- était VARCHAR(30)