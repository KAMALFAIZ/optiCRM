SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Ajout des coordonnées GPS sur les comptes (adresse de facturation / siège)
ALTER TABLE accounts ADD latitude  DECIMAL(10, 8);
ALTER TABLE accounts ADD longitude DECIMAL(11, 8);