-- V51 : Ajout du champ "Témoin" sur les chantiers
-- Un chantier témoin est un chantier de référence livré / vitrine commerciale
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'temoin')
    ALTER TABLE chantiers ADD temoin BIT NOT NULL DEFAULT 0;
GO

-- Index pour filtrer rapidement les chantiers témoins
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_temoin' AND object_id = OBJECT_ID('chantiers'))
    EXEC('CREATE INDEX idx_chantiers_temoin ON chantiers(temoin) WHERE temoin = 1');
GO
