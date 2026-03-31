-- Ajout des colonnes manquantes pour la table chantiers
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'promoteur')
BEGIN
    ALTER TABLE chantiers ADD promoteur NVARCHAR(255) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'installateur')
BEGIN
    ALTER TABLE chantiers ADD installateur NVARCHAR(255) NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'temoin')
BEGIN
    ALTER TABLE chantiers ADD temoin BIT NOT NULL DEFAULT 0;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'stade_changed_at')
BEGIN
    ALTER TABLE chantiers ADD stade_changed_at DATETIME2 NULL;
END

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'segment_taille')
BEGIN
    ALTER TABLE chantiers ADD segment_taille AS (CASE WHEN nombre_unites IS NULL THEN NULL WHEN nombre_unites < 20 THEN 'S' WHEN nombre_unites < 50 THEN 'M' WHEN nombre_unites < 100 THEN 'L' ELSE 'XL' END);
END
