-- Ajout des colonnes concurrent/déciseur pour niveau d'opportunité FERME
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'concurrent_ferme')
    ALTER TABLE chantiers ADD concurrent_ferme NVARCHAR(255) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'deciseur_ferme')
    ALTER TABLE chantiers ADD deciseur_ferme NVARCHAR(255) NULL;
