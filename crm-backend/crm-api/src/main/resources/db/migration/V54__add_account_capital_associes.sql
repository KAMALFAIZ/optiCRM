-- V54 : Ajout capital social et associés sur la table accounts
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'capital_social')
    ALTER TABLE accounts ADD capital_social DECIMAL(18,2) NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'associes')
    ALTER TABLE accounts ADD associes NVARCHAR(MAX) NULL;
