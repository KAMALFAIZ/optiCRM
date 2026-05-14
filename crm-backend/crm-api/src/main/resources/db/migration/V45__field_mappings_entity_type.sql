SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V45 : Ajouter entity_type aux field_mappings pour distinguer comptes / produits
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('field_mappings') AND name = 'entity_type')
    ALTER TABLE field_mappings ADD entity_type NVARCHAR(30) NOT NULL DEFAULT 'ACCOUNTS';

-- Index pour filtrage rapide par type
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_field_mappings_entity_type' AND object_id = OBJECT_ID('field_mappings'))
    CREATE INDEX idx_field_mappings_entity_type ON field_mappings(entity_type);