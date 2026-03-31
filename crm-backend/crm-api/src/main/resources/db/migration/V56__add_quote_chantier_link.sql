-- V56: Liaison entre devis (quotes) et chantier
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('quotes') AND name = 'chantier_id')
    ALTER TABLE quotes ADD chantier_id UNIQUEIDENTIFIER NULL;

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_quotes_chantier_id')
    CREATE INDEX idx_quotes_chantier_id ON quotes(chantier_id);
