SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V71: Tenant infrastructure (SaaS + On-Premise)
-- =====================================================

-- Plans d'abonnement (table système, pas de tenant_id)
CREATE TABLE subscription_plans (
    id              NVARCHAR(50)   NOT NULL PRIMARY KEY,
    name            NVARCHAR(100)  NOT NULL,
    description     NVARCHAR(MAX),
    price_monthly   DECIMAL(10,2)  DEFAULT 0,
    price_yearly    DECIMAL(10,2)  DEFAULT 0,
    max_users       INT            DEFAULT -1,
    max_accounts    INT            DEFAULT -1,
    features        NVARCHAR(MAX)  NOT NULL DEFAULT '{}',
    is_active       BIT            NOT NULL DEFAULT 1,
    sort_order      INT            DEFAULT 0,
    created_at      DATETIME2      DEFAULT GETUTCDATE()
);

-- Tenants (table système, pas de tenant_id)
CREATE TABLE tenants (
    id                      UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    slug                    NVARCHAR(100)    NOT NULL,
    name                    NVARCHAR(255)    NOT NULL,
    status                  NVARCHAR(30)     NOT NULL DEFAULT 'TRIAL',
    plan_id                 NVARCHAR(50)     REFERENCES subscription_plans(id),
    logo_url                NVARCHAR(500),
    primary_color           NVARCHAR(10)     DEFAULT '#1890ff',
    custom_domain           NVARCHAR(255),
    -- On-premise
    license_key             NVARCHAR(MAX),
    license_expires_at      DATETIME2,
    max_users               INT              DEFAULT -1,
    -- SaaS
    stripe_customer_id      NVARCHAR(100),
    stripe_subscription_id  NVARCHAR(100),
    trial_ends_at           DATETIME2,
    admin_email             NVARCHAR(255),
    -- Database provisioning (SaaS database-per-tenant)
    db_name                 NVARCHAR(200),
    db_provisioned          BIT              NOT NULL DEFAULT 0,
    db_provisioned_at       DATETIME2,
    created_at              DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at              DATETIME2        DEFAULT GETUTCDATE()
);

CREATE UNIQUE INDEX uq_tenants_slug         ON tenants(slug);
CREATE INDEX        idx_tenants_status      ON tenants(status);
CREATE INDEX        idx_tenants_custom_domain ON tenants(custom_domain) WHERE custom_domain IS NOT NULL;

-- Clés de licence on-premise (table système)
CREATE TABLE license_keys (
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    tenant_id   UNIQUEIDENTIFIER NOT NULL REFERENCES tenants(id),
    key_hash    NVARCHAR(500)    NOT NULL,
    plan_id     NVARCHAR(50)     REFERENCES subscription_plans(id),
    max_users   INT              DEFAULT 10,
    issued_at   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    expires_at  DATETIME2,
    revoked_at  DATETIME2,
    metadata    NVARCHAR(MAX)
);

CREATE INDEX idx_license_keys_tenant ON license_keys(tenant_id);

-- ─────────────────────────────────────────────────────────────
-- Données initiales
-- ─────────────────────────────────────────────────────────────

INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, max_users, max_accounts, features, sort_order) VALUES
('FREE',       'Gratuit',    'Pour essayer OptiCRM',               0,    0,    3,   100,  '{"ai":false,"workflows":false,"api_access":false,"white_label":false}', 1),
('STARTER',    'Démarrage',  'Pour les petites équipes',         299,  2990,  10,   500,  '{"ai":false,"workflows":true,"api_access":false,"white_label":false}',  2),
('PRO',        'Pro',        'Pour les équipes en croissance',   799,  7990,  30,  2000,  '{"ai":true,"workflows":true,"api_access":true,"white_label":false}',    3),
('ENTERPRISE', 'Entreprise', 'Pour les grandes organisations',     0,     0,  -1,    -1,  '{"ai":true,"workflows":true,"api_access":true,"white_label":true}',     4);

-- Tenant par défaut pour les installations on-premise et les données existantes
INSERT INTO tenants (id, slug, name, status, plan_id, admin_email)
VALUES ('00000000-0000-0000-0000-000000000001', 'default', 'OptiCRM', 'ACTIVE', 'ENTERPRISE', 'admin@opticrm.local');
GO
