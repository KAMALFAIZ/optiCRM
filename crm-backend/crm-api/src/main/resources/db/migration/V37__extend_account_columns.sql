SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
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