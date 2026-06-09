-- ============================================================================
-- Migration: Add tenant_id to all tables in opticrm_default
-- Target DB: opticrm_default
-- Default Tenant UUID: 00000000-0000-0000-0000-000000000001
-- ============================================================================

USE opticrm_default;
GO

SET NOCOUNT ON;
GO

-- ============================================================================
-- STEP 1: Add tenant_id UNIQUEIDENTIFIER NULL to all business tables
-- ============================================================================

DECLARE @sql NVARCHAR(MAX) = N'';

SELECT @sql = @sql +
  N'IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N''' + TABLE_NAME + N''') AND name = N''tenant_id'') '
  + N'ALTER TABLE [' + TABLE_NAME + N'] ADD tenant_id UNIQUEIDENTIFIER NULL;' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME NOT IN ('flyway_schema_history', 'sysdiagrams');

EXEC sp_executesql @sql;
PRINT 'STEP 1 OK: tenant_id column added to all tables';
GO

-- ============================================================================
-- STEP 2: Set all NULL tenant_id to default tenant UUID
-- ============================================================================

DECLARE @sql2 NVARCHAR(MAX) = N'';
DECLARE @uuid NVARCHAR(36) = N'00000000-0000-0000-0000-000000000001';

SELECT @sql2 = @sql2 +
  N'UPDATE [' + TABLE_NAME + N'] SET tenant_id = N''' + @uuid + N''' WHERE tenant_id IS NULL;' + CHAR(13)
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_TYPE = 'BASE TABLE'
  AND TABLE_NAME NOT IN ('flyway_schema_history', 'sysdiagrams');

EXEC sp_executesql @sql2;
PRINT 'STEP 2 OK: tenant_id set to 00000000-0000-0000-0000-000000000001';
GO

-- ============================================================================
-- STEP 3: Make tenant_id NOT NULL on critical tables + create indexes
-- ============================================================================

-- users: NOT NULL + unique index on (email, tenant_id)
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'tenant_id' AND is_nullable = 1)
BEGIN
    ALTER TABLE users ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
    PRINT 'users.tenant_id set to NOT NULL';
END
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_users_email_tenant' AND object_id = OBJECT_ID('users'))
    CREATE UNIQUE INDEX idx_users_email_tenant ON users(email, tenant_id);
GO

-- accounts
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE accounts ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_tenant' AND object_id = OBJECT_ID('accounts'))
    CREATE INDEX idx_accounts_tenant ON accounts(tenant_id);
GO

-- contacts
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('contacts') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE contacts ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_contacts_tenant' AND object_id = OBJECT_ID('contacts'))
    CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
GO

-- leads
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('leads') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE leads ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_leads_tenant' AND object_id = OBJECT_ID('leads'))
    CREATE INDEX idx_leads_tenant ON leads(tenant_id);
GO

-- opportunities
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('opportunities') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE opportunities ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_opportunities_tenant' AND object_id = OBJECT_ID('opportunities'))
    CREATE INDEX idx_opportunities_tenant ON opportunities(tenant_id);
GO

-- quotes
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('quotes') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE quotes ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_quotes_tenant' AND object_id = OBJECT_ID('quotes'))
    CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);
GO

-- invoices
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('invoices') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE invoices ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_invoices_tenant' AND object_id = OBJECT_ID('invoices'))
    CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
GO

-- products
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE products ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_products_tenant' AND object_id = OBJECT_ID('products'))
    CREATE INDEX idx_products_tenant ON products(tenant_id);
GO

-- chantiers
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('chantiers') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE chantiers ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_tenant' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_tenant ON chantiers(tenant_id);
GO

-- roles
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('roles') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE roles ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- teams
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('teams') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE teams ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- activities
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('activities') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE activities ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- visits
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE visits ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- tasks
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('tasks') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE tasks ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- notifications
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('notifications') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE notifications ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- sales_orders
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sales_orders') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE sales_orders ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- sav_tickets
IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sav_tickets') AND name = 'tenant_id' AND is_nullable = 1)
    ALTER TABLE sav_tickets ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

PRINT '=== MIGRATION COMPLETE: opticrm_default is now tenant-ready ===';
GO
