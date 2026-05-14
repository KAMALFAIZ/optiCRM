SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Add Moroccan business identification fields to accounts table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'ice')
ALTER TABLE accounts ADD ice NVARCHAR(15);
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'identifiant_fiscal')
ALTER TABLE accounts ADD identifiant_fiscal NVARCHAR(20);
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'rc')
ALTER TABLE accounts ADD rc NVARCHAR(50);
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'cnss')
ALTER TABLE accounts ADD cnss NVARCHAR(20);
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'patente')
ALTER TABLE accounts ADD patente NVARCHAR(20);

-- Add missing audit column to quotes table (from BaseEntity)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('quotes') AND name = 'updated_by_id')
ALTER TABLE quotes ADD updated_by_id UNIQUEIDENTIFIER REFERENCES users(id);

-- Fix version column type to match JPA Long type
-- Note: ALTER COLUMN type change - SQL Server syntax
ALTER TABLE quotes ALTER COLUMN version BIGINT;