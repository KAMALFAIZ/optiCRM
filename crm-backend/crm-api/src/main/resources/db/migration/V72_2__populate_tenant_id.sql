SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V72b: Peupler tenant_id avec le tenant par défaut
--       pour toutes les données existantes.
--       Mise à jour par lots pour éviter les locks.
-- =====================================================

DECLARE @defaultTenantId UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';

-- Modules Auth
UPDATE roles          SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE territories    SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE teams          SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE users          SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE refresh_tokens SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'password_reset_tokens')
    UPDATE password_reset_tokens SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- CRM Core
UPDATE industries           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE payment_terms        SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE tax_rates            SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE accounts             SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE account_photos       SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE contacts             SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE leads                SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE opportunities        SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE opportunity_stages   SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE opportunity_contacts SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE opportunity_objections SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE quotes               SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE quote_lines          SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE activities           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE activity_participants SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Finance
UPDATE invoices             SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE invoice_lines        SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE payments             SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE payment_allocations  SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE sales_orders         SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE sales_order_lines    SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE balance_agee_snapshots SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Stock
UPDATE products             SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE product_categories   SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE product_prices       SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE pricing_categories   SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE warehouses           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE stock_levels         SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE stock_movements      SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Terrain
UPDATE visits               SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE tours                SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE tour_visits          SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE expense_reports      SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE expense_report_lines SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Communication
UPDATE campaigns            SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE email_templates      SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE email_logs           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Paramétrage
UPDATE app_settings         SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE reference_data       SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE custom_fields        SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE custom_field_values  SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE field_mappings       SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE audit_logs           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Chantiers
UPDATE chantiers                   SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE chantier_acteurs            SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE chantier_echantillons       SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE chantier_echantillon_lignes SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Projets / Tickets
UPDATE projects             SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE tasks                SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE task_comments        SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE milestones           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE project_members      SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE tickets              SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE ticket_comments      SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Workflows
UPDATE workflows                SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE workflow_steps           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE workflow_transitions     SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE workflow_executions      SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE workflow_execution_logs  SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE workflow_templates       SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Commercial / Reporting
UPDATE competitors              SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE commercial_objectives    SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE sale_entries             SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE ventes_saisies           SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE sales_objections         SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE objections               SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE objection_categories     SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE objection_responses      SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Sage / Sync
UPDATE sage_sync_requests SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
UPDATE sage_sync_items    SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

-- Notifications
UPDATE user_activities SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'push_subscriptions')
    UPDATE push_subscriptions SET tenant_id = @defaultTenantId WHERE tenant_id IS NULL;
GO
