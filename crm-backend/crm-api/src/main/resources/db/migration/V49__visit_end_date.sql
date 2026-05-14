SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Add visit_end_date column to visits table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'visit_end_date')
    ALTER TABLE visits ADD visit_end_date DATETIMEOFFSET;