SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V39 : Ajout du champ représentant Sage 100C
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'representant')
    ALTER TABLE accounts ADD representant NVARCHAR(150);