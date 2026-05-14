SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V25: Champs avancés pipeline pour les opportunités
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('opportunities') AND name = 'forecast_category')
    ALTER TABLE opportunities ADD forecast_category   NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('opportunities') AND name = 'next_followup_date')
    ALTER TABLE opportunities ADD next_followup_date  DATE;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('opportunities') AND name = 'competitor_name')
    ALTER TABLE opportunities ADD competitor_name     NVARCHAR(100);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('opportunities') AND name = 'lost_reason_detail')
    ALTER TABLE opportunities ADD lost_reason_detail  NVARCHAR(MAX);

GO

-- Index sur next_followup_date pour les relances
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_opp_next_followup' AND object_id = OBJECT_ID('opportunities'))
    EXEC('CREATE INDEX idx_opp_next_followup ON opportunities(next_followup_date) WHERE next_followup_date IS NOT NULL AND is_closed = 0');