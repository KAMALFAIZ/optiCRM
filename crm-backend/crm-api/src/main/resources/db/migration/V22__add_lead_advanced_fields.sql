SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V22: Champs avancés pour les pistes (leads)

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'fax')
    ALTER TABLE leads ADD fax              NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'linkedin_url')
    ALTER TABLE leads ADD linkedin_url     NVARCHAR(255);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'industry')
    ALTER TABLE leads ADD industry         NVARCHAR(100);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'num_employees')
    ALTER TABLE leads ADD num_employees    NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'annual_revenue')
    ALTER TABLE leads ADD annual_revenue   NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'priority')
    ALTER TABLE leads ADD priority         NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'do_not_call')
    ALTER TABLE leads ADD do_not_call      BIT NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'do_not_email')
    ALTER TABLE leads ADD do_not_email     BIT NOT NULL DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'next_follow_up_date')
    ALTER TABLE leads ADD next_follow_up_date DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'description')
    ALTER TABLE leads ADD description      NVARCHAR(MAX);