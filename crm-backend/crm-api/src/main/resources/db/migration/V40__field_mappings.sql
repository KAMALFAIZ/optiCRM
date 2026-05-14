SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V40 : Table de mapping de champs (intégration générique)

IF OBJECT_ID('field_mappings', 'U') IS NULL
BEGIN
CREATE TABLE field_mappings (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    champ_source  NVARCHAR(100) NOT NULL UNIQUE,  -- nom du champ dans la requête externe
    champ_opticrm NVARCHAR(100) NOT NULL,          -- champ correspondant dans OptiCRM (comptes)
    actif         BIT          NOT NULL DEFAULT 1,
    created_at    DATETIME2    DEFAULT CURRENT_TIMESTAMP
)
END;