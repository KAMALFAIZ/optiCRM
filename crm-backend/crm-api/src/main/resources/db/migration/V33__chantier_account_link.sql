SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Liaison entre Chantier et Account (compte client)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'account_id')
    ALTER TABLE chantiers ADD account_id UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE SET NULL;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_account_id' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_account_id ON chantiers(account_id);