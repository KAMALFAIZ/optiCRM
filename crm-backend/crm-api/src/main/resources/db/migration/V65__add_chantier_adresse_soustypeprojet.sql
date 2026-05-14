-- Ajout des colonnes adresse et sous_type_projet manquantes
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'adresse')
    ALTER TABLE chantiers ADD adresse NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'sous_type_projet')
    ALTER TABLE chantiers ADD sous_type_projet NVARCHAR(50) NULL;
