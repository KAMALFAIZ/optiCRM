SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V23: Add datasheet fields to products table
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'datasheet_url')
    ALTER TABLE products ADD datasheet_url  NVARCHAR(500);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'datasheet_name')
    ALTER TABLE products ADD datasheet_name NVARCHAR(255);