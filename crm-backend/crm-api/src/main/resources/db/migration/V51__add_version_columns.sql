-- Ajout des colonnes de version pour l'optimistic locking (gestion des conflits offline)
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;
ALTER TABLE opportunities ADD COLUMN IF NOT EXISTS version BIGINT DEFAULT 0;

UPDATE accounts SET version = 0 WHERE version IS NULL;
UPDATE contacts SET version = 0 WHERE version IS NULL;
UPDATE leads SET version = 0 WHERE version IS NULL;
UPDATE opportunities SET version = 0 WHERE version IS NULL;
