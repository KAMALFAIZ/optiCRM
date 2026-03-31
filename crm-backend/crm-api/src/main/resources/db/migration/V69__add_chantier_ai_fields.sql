SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

ALTER TABLE chantiers ADD health_score INT NULL;
ALTER TABLE chantiers ADD conversion_probability DECIMAL(5,2) NULL;
ALTER TABLE chantiers ADD ai_summary NVARCHAR(MAX) NULL;
ALTER TABLE chantiers ADD last_ai_analysis_at DATETIME2 NULL;
GO
