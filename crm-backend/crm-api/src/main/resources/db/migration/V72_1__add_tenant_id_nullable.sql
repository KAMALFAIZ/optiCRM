SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V72a: Ajouter la colonne tenant_id (nullable) à toutes
--       les tables existantes.
--       Les données seront populées dans V72b.
-- =====================================================

-- Modules Auth & Administration
ALTER TABLE roles          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE territories    ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE teams          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE users          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE refresh_tokens ADD tenant_id UNIQUEIDENTIFIER NULL;

-- password_reset_tokens (si existe)
IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'password_reset_tokens')
    ALTER TABLE password_reset_tokens ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module CRM Core
ALTER TABLE industries          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE payment_terms       ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE tax_rates           ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE accounts            ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE account_photos      ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE contacts            ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE leads               ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE opportunities       ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE opportunity_stages  ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE opportunity_contacts ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE opportunity_objections ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE quotes              ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE quote_lines         ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE activities          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE activity_participants ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Finance
ALTER TABLE invoices            ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE invoice_lines       ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE payments            ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE payment_allocations ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE sales_orders        ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE sales_order_lines   ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE balance_agee_snapshots ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Stock
ALTER TABLE products            ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE product_categories  ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE product_prices      ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE pricing_categories  ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE warehouses          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE stock_levels        ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE stock_movements     ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Terrain (Visites, Tours)
ALTER TABLE visits              ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE tours               ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE tour_visits         ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE expense_reports     ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE expense_report_lines ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Communication
ALTER TABLE campaigns           ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE email_templates     ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE email_logs          ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Paramétrage
ALTER TABLE app_settings        ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE reference_data      ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE custom_fields       ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE custom_field_values ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE field_mappings      ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE audit_logs          ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Chantiers (ODYSSÉE)
ALTER TABLE chantiers                  ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE chantier_acteurs           ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE chantier_echantillons      ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE chantier_echantillon_lignes ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Projets / Tickets
ALTER TABLE projects            ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE tasks               ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE task_comments       ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE milestones          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE project_members     ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE tickets             ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE ticket_comments     ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Workflows
ALTER TABLE workflows                ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE workflow_steps           ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE workflow_transitions     ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE workflow_executions      ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE workflow_execution_logs  ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE workflow_templates       ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Commercial / Reporting
ALTER TABLE competitors             ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE commercial_objectives   ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE sale_entries            ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE ventes_saisies          ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE sales_objections        ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE objections              ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE objection_categories    ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE objection_responses     ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Module Sage / Sync
ALTER TABLE sage_sync_requests ADD tenant_id UNIQUEIDENTIFIER NULL;
ALTER TABLE sage_sync_items    ADD tenant_id UNIQUEIDENTIFIER NULL;

-- Notifications / Push
ALTER TABLE user_activities    ADD tenant_id UNIQUEIDENTIFIER NULL;

IF EXISTS (SELECT 1 FROM sys.tables WHERE name = 'push_subscriptions')
    ALTER TABLE push_subscriptions ADD tenant_id UNIQUEIDENTIFIER NULL;
GO
