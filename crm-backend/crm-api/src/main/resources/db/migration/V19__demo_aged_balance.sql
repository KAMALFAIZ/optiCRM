SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V19 — Données démo Balance Âgée
-- Désactivé : référençait des UUIDs hardcodés inexistants sur BDD fraîche.
-- La balance âgée se peuple via la sync Sage en production.
PRINT 'V19 : skipped (demo data, no-op)';
GO
