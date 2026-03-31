-- V55: Ajout du champ installateur sur la table chantiers
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'installateur')
    ALTER TABLE chantiers ADD installateur NVARCHAR(255) NULL;
