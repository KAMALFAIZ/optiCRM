SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V26: Nouveaux champs de qualification avancés pour les leads
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'qualification_notes')
    ALTER TABLE leads ADD qualification_notes   NVARCHAR(MAX);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'competitor')
    ALTER TABLE leads ADD competitor            NVARCHAR(200);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'product_demo_requested')
    ALTER TABLE leads ADD product_demo_requested BIT NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'meeting_scheduled_at')
    ALTER TABLE leads ADD meeting_scheduled_at  DATETIMEOFFSET;

GO

-- Index pour les réunions planifiées
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_leads_meeting' AND object_id = OBJECT_ID('leads'))
    EXEC('CREATE INDEX idx_leads_meeting ON leads(meeting_scheduled_at) WHERE meeting_scheduled_at IS NOT NULL AND is_converted = 0');