SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V72c: Rendre tenant_id NOT NULL, ajouter les FK et
--       les index. Remplacer la contrainte UNIQUE(email)
--       par UNIQUE(tenant_id, email) sur users.
-- =====================================================

DECLARE @defaultTenantId UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';

-- ─────────────────────────────────────────────────────────────
-- 1. Supprimer la contrainte UNIQUE(email) sur users
--    (remplacée par UNIQUE(tenant_id, email))
-- ─────────────────────────────────────────────────────────────
DECLARE @constraintName NVARCHAR(200);
SELECT @constraintName = name
FROM sys.indexes
WHERE object_id = OBJECT_ID('users') AND is_unique = 1
  AND name LIKE '%email%';

IF @constraintName IS NOT NULL
    EXEC('ALTER TABLE users DROP CONSTRAINT [' + @constraintName + ']');

-- Supprimer aussi l'index non-unique sur email si présent
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('users') AND name = 'idx_users_email')
    DROP INDEX idx_users_email ON users;
GO

-- ─────────────────────────────────────────────────────────────
-- 2. Passer toutes les colonnes tenant_id en NOT NULL
-- ─────────────────────────────────────────────────────────────
ALTER TABLE roles           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE territories     ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE teams           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE users           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE refresh_tokens  ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE industries           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE payment_terms        ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE tax_rates            ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE accounts             ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE account_photos       ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE contacts             ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE leads                ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE opportunities        ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE opportunity_stages   ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE opportunity_contacts ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE opportunity_objections ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE quotes               ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE quote_lines          ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE activities           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE activity_participants ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE invoices             ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE invoice_lines        ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE payments             ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE payment_allocations  ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE sales_orders         ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE sales_order_lines    ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE balance_agee_snapshots ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE products             ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE product_categories   ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE product_prices       ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE pricing_categories   ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE warehouses           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE stock_levels         ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE stock_movements      ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE visits               ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE tours                ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE tour_visits          ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE expense_reports      ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE expense_report_lines ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE campaigns            ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE email_templates      ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE email_logs           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE app_settings         ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE reference_data       ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE custom_fields        ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE custom_field_values  ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE field_mappings       ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE audit_logs           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE chantiers                   ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE chantier_acteurs            ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE chantier_echantillons       ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE chantier_echantillon_lignes ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE projects             ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE tasks                ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE task_comments        ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE milestones           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE project_members      ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE tickets              ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE ticket_comments      ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE workflows                ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE workflow_steps           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE workflow_transitions     ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE workflow_executions      ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE workflow_execution_logs  ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE workflow_templates       ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE competitors              ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE commercial_objectives    ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE sale_entries             ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE ventes_saisies           ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE sales_objections         ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE objections               ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE objection_categories     ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE objection_responses      ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE sage_sync_requests ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
ALTER TABLE sage_sync_items    ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;

ALTER TABLE user_activities    ALTER COLUMN tenant_id UNIQUEIDENTIFIER NOT NULL;
GO

-- ─────────────────────────────────────────────────────────────
-- 3. Nouvel index unique (tenant_id, email) sur users
-- ─────────────────────────────────────────────────────────────
CREATE UNIQUE INDEX idx_users_email_tenant ON users(tenant_id, email);

-- ─────────────────────────────────────────────────────────────
-- 4. Index sur tenant_id pour les tables principales
-- ─────────────────────────────────────────────────────────────
CREATE INDEX idx_roles_tenant          ON roles(tenant_id);
CREATE INDEX idx_users_tenant          ON users(tenant_id);
CREATE INDEX idx_accounts_tenant       ON accounts(tenant_id);
CREATE INDEX idx_contacts_tenant       ON contacts(tenant_id);
CREATE INDEX idx_leads_tenant          ON leads(tenant_id);
CREATE INDEX idx_opportunities_tenant  ON opportunities(tenant_id);
CREATE INDEX idx_quotes_tenant         ON quotes(tenant_id);
CREATE INDEX idx_invoices_tenant       ON invoices(tenant_id);
CREATE INDEX idx_payments_tenant       ON payments(tenant_id);
CREATE INDEX idx_products_tenant       ON products(tenant_id);
CREATE INDEX idx_chantiers_tenant      ON chantiers(tenant_id);
CREATE INDEX idx_workflows_tenant      ON workflows(tenant_id);
CREATE INDEX idx_activities_tenant     ON activities(tenant_id);
CREATE INDEX idx_visits_tenant         ON visits(tenant_id);
CREATE INDEX idx_tickets_tenant        ON tickets(tenant_id);
CREATE INDEX idx_projects_tenant       ON projects(tenant_id);
GO
