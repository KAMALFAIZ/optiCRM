SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Drop des index qui bloquent l'ALTER COLUMN
IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_sage_code' AND object_id = OBJECT_ID('accounts'))
    DROP INDEX idx_accounts_sage_code ON accounts;
GO

-- Étend les colonnes VARCHAR trop courtes pour les données Sage réelles
ALTER TABLE accounts ALTER COLUMN phone               NVARCHAR(50);
ALTER TABLE accounts ALTER COLUMN fax                 NVARCHAR(50);
ALTER TABLE accounts ALTER COLUMN sage_code           NVARCHAR(50);
ALTER TABLE accounts ALTER COLUMN billing_postal_code NVARCHAR(30);
ALTER TABLE accounts ALTER COLUMN shipping_postal_code NVARCHAR(30);
ALTER TABLE accounts ALTER COLUMN identifiant_fiscal  NVARCHAR(50);
ALTER TABLE accounts ALTER COLUMN cnss                NVARCHAR(50);
ALTER TABLE accounts ALTER COLUMN patente             NVARCHAR(50);
ALTER TABLE accounts ALTER COLUMN siret               NVARCHAR(30);
ALTER TABLE accounts ALTER COLUMN siren               NVARCHAR(20);
ALTER TABLE accounts ALTER COLUMN vat_number          NVARCHAR(50);
ALTER TABLE accounts ALTER COLUMN potentiel           NVARCHAR(50);
GO

-- Recrée l'index unique partiel
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_sage_code' AND object_id = OBJECT_ID('accounts'))
    EXEC('CREATE UNIQUE INDEX idx_accounts_sage_code ON accounts(sage_code) WHERE sage_code IS NOT NULL');
GO