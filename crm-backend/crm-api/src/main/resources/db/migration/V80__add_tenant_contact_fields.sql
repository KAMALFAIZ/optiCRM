-- V80: Add contact/business fields to tenants table + fix nullable constraints
-- These columns enrich the SaaS client creation form

-- New tenant contact/business fields
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tenants' AND COLUMN_NAME = 'phone')
    ALTER TABLE tenants ADD phone NVARCHAR(30) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tenants' AND COLUMN_NAME = 'address')
    ALTER TABLE tenants ADD address NVARCHAR(500) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tenants' AND COLUMN_NAME = 'city')
    ALTER TABLE tenants ADD city NVARCHAR(100) NULL;

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'tenants' AND COLUMN_NAME = 'ice')
    ALTER TABLE tenants ADD ice NVARCHAR(30) NULL;

-- Fix: refresh_tokens.tenant_id must be nullable (RefreshToken entity has no tenant_id field)
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'tenant_id' AND IS_NULLABLE = 'NO'
)
    ALTER TABLE refresh_tokens ALTER COLUMN tenant_id UNIQUEIDENTIFIER NULL;

-- Fix: password_reset_tokens.tenant_id must be nullable (same reason)
IF EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'password_reset_tokens' AND COLUMN_NAME = 'tenant_id' AND IS_NULLABLE = 'NO'
)
    ALTER TABLE password_reset_tokens ALTER COLUMN tenant_id UNIQUEIDENTIFIER NULL;
