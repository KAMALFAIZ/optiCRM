SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Add insurance / risk fields to accounts
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'insurance_amount')
    ALTER TABLE accounts ADD insurance_amount   DECIMAL(15,2) DEFAULT 0;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'insurance_company')
    ALTER TABLE accounts ADD insurance_company  NVARCHAR(255);