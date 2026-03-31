SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V41 : Supprimer la contrainte UNIQUE sur champ_source (permet plusieurs mappings avec le même champ source)
IF EXISTS (SELECT name FROM sys.indexes WHERE name = 'field_mappings_champ_source_key' AND object_id = OBJECT_ID('field_mappings'))
    DROP INDEX field_mappings_champ_source_key ON field_mappings;