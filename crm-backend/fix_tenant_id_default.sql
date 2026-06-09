-- Fix: SET QUOTED_IDENTIFIER ON before all operations on opticrm_default
USE opticrm_default;
GO
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
SET NOCOUNT ON;
GO

-- ============================================================
-- STEP 1: Update ALL tenant_id NULL values to default tenant
-- ============================================================
DECLARE @uuid UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';

UPDATE users SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE accounts SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE contacts SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE roles SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE visits SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE leads SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE activities SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE teams SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE territories SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE opportunities SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE quotes SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE quote_lines SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE invoices SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE invoice_lines SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE products SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE product_categories SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE product_prices SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE product_batch SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE chantiers SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE chantier_acteurs SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE chantier_photos SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE chantier_echantillons SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE chantier_echantillon_lignes SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sales_orders SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sales_order_lines SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_tickets SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_messages SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_evaluations SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_escalades SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE notifications SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE tasks SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE task_comments SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE workflows SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE workflow_templates SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE workflow_steps SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE workflow_transitions SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE workflow_executions SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE workflow_execution_logs SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE campaigns SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE email_templates SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE email_logs SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE audit_logs SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE audit_trail SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE payments SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE payment_allocations SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE payment_terms SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE tax_rates SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE custom_fields SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE custom_field_values SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE stock_levels SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE stock_movements SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE stock_replenishment SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE stock_replenishment_item SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE warehouses SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE tours SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE tour_visits SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE delivery_tour SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE delivery_line SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE delivery_line_bonus SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE delivery_price_override SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE delivery_promotion SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE pre_order SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE pre_order_item SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE vehicle_load SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE vehicle_load_item SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE vehicle_unload SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE vehicle_unload_item SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sale_entries SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE ventes_saisies SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE expense_reports SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE expense_report_lines SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE commercial_objectives SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE rep_objective SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE rep_location SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE balance_agee_snapshots SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE settlement_report SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE return_entry SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE projects SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE project_members SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE milestones SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE tickets SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE ticket_comments SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE competitors SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE industries SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE objections SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE objection_categories SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE objection_responses SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE opportunity_contacts SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE opportunity_objections SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE opportunity_stages SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sales_objections SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE activity_participants SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE account_photos SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE app_settings SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE field_mappings SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE kb_articles SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE kb_embeddings SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE offline_sync_log SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE password_reset_tokens SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE pricing_categories SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE reference_data SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE refresh_tokens SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sage_sync_items SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sage_sync_requests SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_agent_logs SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_auth_clients SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_config_sla SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE sav_profil_client SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE supervisor_assignments SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE user_activities SET tenant_id = @uuid WHERE tenant_id IS NULL;
UPDATE tenants SET tenant_id = @uuid WHERE tenant_id IS NULL;
PRINT 'STEP 1 OK: All NULL tenant_id values updated';
GO

-- ============================================================
-- STEP 2: NOT NULL on critical tables
-- ============================================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

ALTER TABLE users ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE accounts ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE contacts ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE leads ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE opportunities ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE quotes ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE invoices ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE products ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE chantiers ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE roles ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE teams ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE activities ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE visits ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE tasks ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE notifications ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE sales_orders ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE sav_tickets ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
PRINT 'STEP 2 OK: NOT NULL constraints applied';
GO

-- ============================================================
-- STEP 3: Indexes
-- ============================================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_users_email_tenant' AND object_id = OBJECT_ID('users'))
    CREATE UNIQUE INDEX idx_users_email_tenant ON users(email, tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_tenant' AND object_id = OBJECT_ID('accounts'))
    CREATE INDEX idx_accounts_tenant ON accounts(tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_contacts_tenant' AND object_id = OBJECT_ID('contacts'))
    CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_leads_tenant' AND object_id = OBJECT_ID('leads'))
    CREATE INDEX idx_leads_tenant ON leads(tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_opportunities_tenant' AND object_id = OBJECT_ID('opportunities'))
    CREATE INDEX idx_opportunities_tenant ON opportunities(tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_quotes_tenant' AND object_id = OBJECT_ID('quotes'))
    CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_invoices_tenant' AND object_id = OBJECT_ID('invoices'))
    CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_products_tenant' AND object_id = OBJECT_ID('products'))
    CREATE INDEX idx_products_tenant ON products(tenant_id);

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_chantiers_tenant' AND object_id = OBJECT_ID('chantiers'))
    CREATE INDEX idx_chantiers_tenant ON chantiers(tenant_id);

PRINT 'STEP 3 OK: Indexes created';
PRINT '=== MIGRATION COMPLETE ===';
GO
