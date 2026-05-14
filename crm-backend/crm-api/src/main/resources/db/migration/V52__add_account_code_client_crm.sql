-- V52 : Ajout du code client CRM interne sur les comptes
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('accounts') AND name = 'code_client_crm'
)
    ALTER TABLE accounts ADD code_client_crm NVARCHAR(50) NULL;
GO

-- Index unique sparse (NULL non indexé)
IF NOT EXISTS (
    SELECT name FROM sys.indexes
    WHERE name = 'uq_accounts_code_client_crm' AND object_id = OBJECT_ID('accounts')
)
    EXEC('CREATE UNIQUE INDEX uq_accounts_code_client_crm ON accounts(code_client_crm)
          WHERE code_client_crm IS NOT NULL');
GO
