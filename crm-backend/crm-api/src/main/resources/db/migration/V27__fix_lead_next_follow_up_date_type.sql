SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Fix: next_follow_up_date was created as DATETIME2 (V22) but the entity maps it as LocalDate (DATE type)
-- Convert DATETIME2 to DATE
ALTER TABLE leads ALTER COLUMN next_follow_up_date DATE;