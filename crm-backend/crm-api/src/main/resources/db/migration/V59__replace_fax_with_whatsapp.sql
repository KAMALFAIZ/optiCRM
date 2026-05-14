-- Remplacer le champ fax par whatsapp dans la table accounts
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'fax')
    ALTER TABLE accounts DROP COLUMN fax;

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'whatsapp')
    ALTER TABLE accounts ADD whatsapp NVARCHAR(50) NULL;
