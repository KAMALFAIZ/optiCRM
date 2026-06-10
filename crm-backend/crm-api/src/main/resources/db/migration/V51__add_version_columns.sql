SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Ajout des colonnes de version pour l'optimistic locking (gestion des conflits offline)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts')      AND name = 'version')
    ALTER TABLE accounts      ADD version BIGINT DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('contacts')      AND name = 'version')
    ALTER TABLE contacts      ADD version BIGINT DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads')         AND name = 'version')
    ALTER TABLE leads         ADD version BIGINT DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('opportunities') AND name = 'version')
    ALTER TABLE opportunities ADD version BIGINT DEFAULT 0;
GO

UPDATE accounts      SET version = 0 WHERE version IS NULL;
UPDATE contacts      SET version = 0 WHERE version IS NULL;
UPDATE leads         SET version = 0 WHERE version IS NULL;
UPDATE opportunities SET version = 0 WHERE version IS NULL;
GO
