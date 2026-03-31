-- V53 : Société d'affectation du compte (Sanitaire AL Boughaze, Odyssée, etc.)
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('accounts') AND name = 'societe_affectation'
)
    ALTER TABLE accounts ADD societe_affectation NVARCHAR(100) NULL;
GO
