SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Étend la colonne ICE de 15 à 30 caractères
-- Nécessaire car les valeurs ICE dans Sage peuvent dépasser 15 caractères
ALTER TABLE accounts ALTER COLUMN ice NVARCHAR(30);