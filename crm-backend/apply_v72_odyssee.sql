SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- Script consolidé : V72a + V76 + V72b + V72c
-- Applique tenant_id à toutes les tables,
-- crée le tenant Odyssée, peuple les données,
-- puis rend NOT NULL + indexes.
-- =====================================================

PRINT '=== STEP 1: Add tenant_id (nullable) to all tables ==='

-- Auth & Admin
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('roles') AND name='tenant_id')
    ALTER TABLE roles ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('territories') AND name='tenant_id')
    ALTER TABLE territories ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('teams') AND name='tenant_id')
    ALTER TABLE teams ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('users') AND name='tenant_id')
    ALTER TABLE users ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('refresh_tokens') AND name='tenant_id')
    ALTER TABLE refresh_tokens ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('password_reset_tokens') AND name='tenant_id')
    ALTER TABLE password_reset_tokens ADD tenant_id UNIQUEIDENTIFIER NULL;

-- CRM Core
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('industries') AND name='tenant_id')
    ALTER TABLE industries ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('payment_terms') AND name='tenant_id')
    ALTER TABLE payment_terms ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tax_rates') AND name='tenant_id')
    ALTER TABLE tax_rates ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('accounts') AND name='tenant_id')
    ALTER TABLE accounts ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('account_photos') AND name='tenant_id')
    ALTER TABLE account_photos ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('contacts') AND name='tenant_id')
    ALTER TABLE contacts ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('leads') AND name='tenant_id')
    ALTER TABLE leads ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('opportunities') AND name='tenant_id')
    ALTER TABLE opportunities ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('opportunity_stages') AND name='tenant_id')
    ALTER TABLE opportunity_stages ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('opportunity_contacts') AND name='tenant_id')
    ALTER TABLE opportunity_contacts ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('opportunity_objections') AND name='tenant_id')
    ALTER TABLE opportunity_objections ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('quotes') AND name='tenant_id')
    ALTER TABLE quotes ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('quote_lines') AND name='tenant_id')
    ALTER TABLE quote_lines ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('activities') AND name='tenant_id')
    ALTER TABLE activities ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('activity_participants') AND name='tenant_id')
    ALTER TABLE activity_participants ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Finance
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('invoices') AND name='tenant_id')
    ALTER TABLE invoices ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('invoice_lines') AND name='tenant_id')
    ALTER TABLE invoice_lines ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('payments') AND name='tenant_id')
    ALTER TABLE payments ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('payment_allocations') AND name='tenant_id')
    ALTER TABLE payment_allocations ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sales_orders') AND name='tenant_id')
    ALTER TABLE sales_orders ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sales_order_lines') AND name='tenant_id')
    ALTER TABLE sales_order_lines ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('balance_agee_snapshots') AND name='tenant_id')
    ALTER TABLE balance_agee_snapshots ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Stock
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('products') AND name='tenant_id')
    ALTER TABLE products ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('product_categories') AND name='tenant_id')
    ALTER TABLE product_categories ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('product_prices') AND name='tenant_id')
    ALTER TABLE product_prices ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('pricing_categories') AND name='tenant_id')
    ALTER TABLE pricing_categories ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('warehouses') AND name='tenant_id')
    ALTER TABLE warehouses ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('stock_levels') AND name='tenant_id')
    ALTER TABLE stock_levels ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('stock_movements') AND name='tenant_id')
    ALTER TABLE stock_movements ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('product_batch') AND name='tenant_id')
    ALTER TABLE product_batch ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Terrain
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('visits') AND name='tenant_id')
    ALTER TABLE visits ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tours') AND name='tenant_id')
    ALTER TABLE tours ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tour_visits') AND name='tenant_id')
    ALTER TABLE tour_visits ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('expense_reports') AND name='tenant_id')
    ALTER TABLE expense_reports ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('expense_report_lines') AND name='tenant_id')
    ALTER TABLE expense_report_lines ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Communication
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('campaigns') AND name='tenant_id')
    ALTER TABLE campaigns ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('email_templates') AND name='tenant_id')
    ALTER TABLE email_templates ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('email_logs') AND name='tenant_id')
    ALTER TABLE email_logs ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Parametrage
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('app_settings') AND name='tenant_id')
    ALTER TABLE app_settings ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('reference_data') AND name='tenant_id')
    ALTER TABLE reference_data ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('custom_fields') AND name='tenant_id')
    ALTER TABLE custom_fields ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('custom_field_values') AND name='tenant_id')
    ALTER TABLE custom_field_values ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('field_mappings') AND name='tenant_id')
    ALTER TABLE field_mappings ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('audit_logs') AND name='tenant_id')
    ALTER TABLE audit_logs ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Chantiers
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('chantiers') AND name='tenant_id')
    ALTER TABLE chantiers ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('chantier_acteurs') AND name='tenant_id')
    ALTER TABLE chantier_acteurs ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('chantier_echantillons') AND name='tenant_id')
    ALTER TABLE chantier_echantillons ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('chantier_echantillon_lignes') AND name='tenant_id')
    ALTER TABLE chantier_echantillon_lignes ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('chantier_photos') AND name='tenant_id')
    ALTER TABLE chantier_photos ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Projets/Tickets
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('projects') AND name='tenant_id')
    ALTER TABLE projects ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tasks') AND name='tenant_id')
    ALTER TABLE tasks ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('task_comments') AND name='tenant_id')
    ALTER TABLE task_comments ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('milestones') AND name='tenant_id')
    ALTER TABLE milestones ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('project_members') AND name='tenant_id')
    ALTER TABLE project_members ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('tickets') AND name='tenant_id')
    ALTER TABLE tickets ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ticket_comments') AND name='tenant_id')
    ALTER TABLE ticket_comments ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Workflows
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('workflows') AND name='tenant_id')
    ALTER TABLE workflows ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('workflow_steps') AND name='tenant_id')
    ALTER TABLE workflow_steps ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('workflow_transitions') AND name='tenant_id')
    ALTER TABLE workflow_transitions ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('workflow_executions') AND name='tenant_id')
    ALTER TABLE workflow_executions ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('workflow_execution_logs') AND name='tenant_id')
    ALTER TABLE workflow_execution_logs ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('workflow_templates') AND name='tenant_id')
    ALTER TABLE workflow_templates ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Commercial/Reporting
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('competitors') AND name='tenant_id')
    ALTER TABLE competitors ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('commercial_objectives') AND name='tenant_id')
    ALTER TABLE commercial_objectives ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sale_entries') AND name='tenant_id')
    ALTER TABLE sale_entries ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('ventes_saisies') AND name='tenant_id')
    ALTER TABLE ventes_saisies ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sales_objections') AND name='tenant_id')
    ALTER TABLE sales_objections ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('objections') AND name='tenant_id')
    ALTER TABLE objections ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('objection_categories') AND name='tenant_id')
    ALTER TABLE objection_categories ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('objection_responses') AND name='tenant_id')
    ALTER TABLE objection_responses ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Sage/Sync
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sage_sync_requests') AND name='tenant_id')
    ALTER TABLE sage_sync_requests ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sage_sync_items') AND name='tenant_id')
    ALTER TABLE sage_sync_items ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Notifications/Push
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('user_activities') AND name='tenant_id')
    ALTER TABLE user_activities ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('notifications') AND name='tenant_id')
    ALTER TABLE notifications ADD tenant_id UNIQUEIDENTIFIER NULL;

-- SAV module
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_tickets') AND name='tenant_id')
    ALTER TABLE sav_tickets ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_messages') AND name='tenant_id')
    ALTER TABLE sav_messages ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_evaluations') AND name='tenant_id')
    ALTER TABLE sav_evaluations ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_escalades') AND name='tenant_id')
    ALTER TABLE sav_escalades ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_config_sla') AND name='tenant_id')
    ALTER TABLE sav_config_sla ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_auth_clients') AND name='tenant_id')
    ALTER TABLE sav_auth_clients ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_agent_logs') AND name='tenant_id')
    ALTER TABLE sav_agent_logs ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('sav_profil_client') AND name='tenant_id')
    ALTER TABLE sav_profil_client ADD tenant_id UNIQUEIDENTIFIER NULL;

-- KB
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('kb_articles') AND name='tenant_id')
    ALTER TABLE kb_articles ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('kb_embeddings') AND name='tenant_id')
    ALTER TABLE kb_embeddings ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Audit trail
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('audit_trail') AND name='tenant_id')
    ALTER TABLE audit_trail ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Delivery extras (pre_order, offline_sync, rep_location, rep_objective)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('pre_order') AND name='tenant_id')
    ALTER TABLE pre_order ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('pre_order_item') AND name='tenant_id')
    ALTER TABLE pre_order_item ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('offline_sync_log') AND name='tenant_id')
    ALTER TABLE offline_sync_log ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('rep_location') AND name='tenant_id')
    ALTER TABLE rep_location ADD tenant_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('rep_objective') AND name='tenant_id')
    ALTER TABLE rep_objective ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Supervisor assignments
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('supervisor_assignments') AND name='tenant_id')
    ALTER TABLE supervisor_assignments ADD tenant_id UNIQUEIDENTIFIER NULL;

PRINT 'STEP 1 DONE: tenant_id added to all tables';
GO

-- =====================================================
-- STEP 2: Seed Odyssée tenant record
-- =====================================================
PRINT '=== STEP 2: Seed Odyssee tenant ==='

IF NOT EXISTS (SELECT 1 FROM tenants WHERE slug = 'odyssee')
    INSERT INTO tenants (id, slug, name, status, plan_id, admin_email, primary_color, db_name, db_provisioned, db_provisioned_at)
    VALUES (
        '00000000-0000-0000-0000-000000000002',
        'odyssee',
        N'Odyssée',
        'ACTIVE',
        'ENTERPRISE',
        'admin@odyssee.ma',
        '#0F6CBD',
        'opticrm_odyssee',
        1,
        SYSUTCDATETIME()
    );

-- Also mark the default tenant as provisioned pointing to the same DB
UPDATE tenants SET db_name = 'opticrm_odyssee', db_provisioned = 1, db_provisioned_at = SYSUTCDATETIME()
WHERE slug = 'default' AND (db_name IS NULL OR db_provisioned = 0);

PRINT 'STEP 2 DONE: Odyssee tenant seeded';
GO

-- =====================================================
-- STEP 3: Populate tenant_id on ALL rows
-- Use Odyssee UUID since this IS the Odyssee database
-- =====================================================
PRINT '=== STEP 3: Populate tenant_id ==='

DECLARE @tid UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000002';

UPDATE roles SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE territories SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE teams SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE users SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE refresh_tokens SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE password_reset_tokens SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE industries SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE payment_terms SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE tax_rates SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE accounts SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE account_photos SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE contacts SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE leads SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE opportunities SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE opportunity_stages SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE opportunity_contacts SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE opportunity_objections SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE quotes SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE quote_lines SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE activities SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE activity_participants SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE invoices SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE invoice_lines SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE payments SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE payment_allocations SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sales_orders SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sales_order_lines SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE balance_agee_snapshots SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE products SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE product_categories SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE product_prices SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE pricing_categories SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE warehouses SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE stock_levels SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE stock_movements SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE product_batch SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE visits SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE tours SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE tour_visits SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE expense_reports SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE expense_report_lines SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE campaigns SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE email_templates SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE email_logs SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE app_settings SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE reference_data SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE custom_fields SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE custom_field_values SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE field_mappings SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE audit_logs SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE chantiers SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE chantier_acteurs SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE chantier_echantillons SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE chantier_echantillon_lignes SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE chantier_photos SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE projects SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE tasks SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE task_comments SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE milestones SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE project_members SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE tickets SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE ticket_comments SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE workflows SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE workflow_steps SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE workflow_transitions SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE workflow_executions SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE workflow_execution_logs SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE workflow_templates SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE competitors SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE commercial_objectives SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sale_entries SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE ventes_saisies SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sales_objections SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE objections SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE objection_categories SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE objection_responses SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sage_sync_requests SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sage_sync_items SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE user_activities SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE notifications SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_tickets SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_messages SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_evaluations SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_escalades SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_config_sla SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_auth_clients SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_agent_logs SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE sav_profil_client SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE kb_articles SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE kb_embeddings SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE audit_trail SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE pre_order SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE pre_order_item SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE offline_sync_log SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE rep_location SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE rep_objective SET tenant_id = @tid WHERE tenant_id IS NULL;
UPDATE supervisor_assignments SET tenant_id = @tid WHERE tenant_id IS NULL;

-- Also update delivery tables that already had tenant_id but with default value
UPDATE delivery_line SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE delivery_line_bonus SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE delivery_price_override SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE delivery_promotion SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE delivery_tour SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE return_entry SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE settlement_report SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE stock_replenishment SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE stock_replenishment_item SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE vehicle_load SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE vehicle_unload SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
UPDATE vehicle_unload_item SET tenant_id = @tid WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

PRINT 'STEP 3 DONE: tenant_id populated';
GO

-- =====================================================
-- STEP 4: Make tenant_id NOT NULL on critical tables
-- =====================================================
PRINT '=== STEP 4: Make tenant_id NOT NULL + indexes ==='

-- Drop existing email unique constraint/index if exists
DECLARE @constraintName NVARCHAR(200);
SELECT @constraintName = name FROM sys.indexes
WHERE object_id = OBJECT_ID('users') AND is_unique = 1 AND name LIKE '%email%';
IF @constraintName IS NOT NULL
    EXEC('ALTER TABLE users DROP CONSTRAINT [' + @constraintName + ']');
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('users') AND name = 'idx_users_email')
    DROP INDEX idx_users_email ON users;
GO

-- Make NOT NULL on key tables
ALTER TABLE users ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE roles ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE accounts ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE contacts ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE leads ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE opportunities ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE products ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE chantiers ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE activities ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE visits ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE invoices ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE payments ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE quotes ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE tickets ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE projects ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE workflows ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- Create indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('users') AND name='idx_users_email_tenant')
    CREATE UNIQUE INDEX idx_users_email_tenant ON users(tenant_id, email);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('users') AND name='idx_users_tenant')
    CREATE INDEX idx_users_tenant ON users(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('roles') AND name='idx_roles_tenant')
    CREATE INDEX idx_roles_tenant ON roles(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('accounts') AND name='idx_accounts_tenant')
    CREATE INDEX idx_accounts_tenant ON accounts(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('contacts') AND name='idx_contacts_tenant')
    CREATE INDEX idx_contacts_tenant ON contacts(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('leads') AND name='idx_leads_tenant')
    CREATE INDEX idx_leads_tenant ON leads(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('opportunities') AND name='idx_opportunities_tenant')
    CREATE INDEX idx_opportunities_tenant ON opportunities(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('products') AND name='idx_products_tenant')
    CREATE INDEX idx_products_tenant ON products(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('chantiers') AND name='idx_chantiers_tenant')
    CREATE INDEX idx_chantiers_tenant ON chantiers(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('activities') AND name='idx_activities_tenant')
    CREATE INDEX idx_activities_tenant ON activities(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('visits') AND name='idx_visits_tenant')
    CREATE INDEX idx_visits_tenant ON visits(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('invoices') AND name='idx_invoices_tenant')
    CREATE INDEX idx_invoices_tenant ON invoices(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('payments') AND name='idx_payments_tenant')
    CREATE INDEX idx_payments_tenant ON payments(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('quotes') AND name='idx_quotes_tenant')
    CREATE INDEX idx_quotes_tenant ON quotes(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('tickets') AND name='idx_tickets_tenant')
    CREATE INDEX idx_tickets_tenant ON tickets(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('projects') AND name='idx_projects_tenant')
    CREATE INDEX idx_projects_tenant ON projects(tenant_id);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id=OBJECT_ID('workflows') AND name='idx_workflows_tenant')
    CREATE INDEX idx_workflows_tenant ON workflows(tenant_id);

PRINT 'STEP 4 DONE: NOT NULL + indexes created';
GO

-- =====================================================
-- STEP 5: Record migrations in flyway_schema_history
-- =====================================================
PRINT '=== STEP 5: Record in flyway_schema_history ==='

IF NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '72')
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    VALUES (
        (SELECT ISNULL(MAX(installed_rank),0)+1 FROM flyway_schema_history),
        '72', 'add tenant id columns', 'SQL', 'V72__add_tenant_id.sql', 0, 'sa', GETDATE(), 0, 1
    );

IF NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '75')
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    VALUES (
        (SELECT ISNULL(MAX(installed_rank),0)+1 FROM flyway_schema_history),
        '75', 'seed delivery data', 'SQL', 'V75__seed_delivery_data.sql', 0, 'sa', GETDATE(), 0, 1
    );

IF NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '76')
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    VALUES (
        (SELECT ISNULL(MAX(installed_rank),0)+1 FROM flyway_schema_history),
        '76', 'seed tenant odyssee', 'SQL', 'V76__seed_tenant_odyssee.sql', 0, 'sa', GETDATE(), 0, 1
    );

IF NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '77')
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    VALUES (
        (SELECT ISNULL(MAX(installed_rank),0)+1 FROM flyway_schema_history),
        '77', 'add superviseur role', 'SQL', 'V77__add_superviseur_role.sql', 0, 'sa', GETDATE(), 0, 1
    );

IF NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '78')
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    VALUES (
        (SELECT ISNULL(MAX(installed_rank),0)+1 FROM flyway_schema_history),
        '78', 'supervisor assignments', 'SQL', 'V78__supervisor_assignments.sql', 0, 'sa', GETDATE(), 0, 1
    );

IF NOT EXISTS (SELECT 1 FROM flyway_schema_history WHERE version = '79')
    INSERT INTO flyway_schema_history (installed_rank, version, description, type, script, checksum, installed_by, installed_on, execution_time, success)
    VALUES (
        (SELECT ISNULL(MAX(installed_rank),0)+1 FROM flyway_schema_history),
        '79', 'seed demo supervisor data', 'SQL', 'V79__seed_demo_supervisor_data.sql', 0, 'sa', GETDATE(), 0, 1
    );

PRINT 'STEP 5 DONE: flyway_schema_history updated';
PRINT '=== ALL DONE ==='
GO
