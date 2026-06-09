SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- OptiCRM — Tenant Database Schema (consolidated)
-- Database-per-tenant: one database per client SaaS.
-- Compiled from migrations V1 through V79.
-- =====================================================

-- =====================================================
-- SECTION 1: Reference & Configuration Tables
-- =====================================================

CREATE TABLE roles (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    name            NVARCHAR(50) UNIQUE NOT NULL,
    description     NVARCHAR(MAX),
    permissions     NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    is_system       BIT DEFAULT 0,
    created_at      DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE territories (
    id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id             UNIQUEIDENTIFIER NOT NULL,
    name                  NVARCHAR(100) NOT NULL,
    description           NVARCHAR(MAX),
    region                NVARCHAR(100),
    country               NVARCHAR(100),
    postal_codes          NVARCHAR(MAX),
    parent_territory_id   UNIQUEIDENTIFIER REFERENCES territories(id),
    created_at            DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE teams (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    name            NVARCHAR(100) NOT NULL,
    description     NVARCHAR(MAX),
    manager_id      UNIQUEIDENTIFIER,
    parent_team_id  UNIQUEIDENTIFIER REFERENCES teams(id),
    created_at      DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE industries (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    code                NVARCHAR(20) UNIQUE NOT NULL,
    name                NVARCHAR(100) NOT NULL,
    parent_industry_id  UNIQUEIDENTIFIER REFERENCES industries(id),
    created_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE payment_terms (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    code        NVARCHAR(20) UNIQUE NOT NULL,
    name        NVARCHAR(100) NOT NULL,
    days        INT NOT NULL,
    description NVARCHAR(MAX),
    is_default  BIT DEFAULT 0,
    created_at  DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE tax_rates (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    code        NVARCHAR(20) UNIQUE NOT NULL,
    name        NVARCHAR(100) NOT NULL,
    rate        DECIMAL(5, 2) NOT NULL,
    is_default  BIT DEFAULT 0,
    is_active   BIT DEFAULT 1,
    created_at  DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE opportunity_stages (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    name        NVARCHAR(100) NOT NULL,
    code        NVARCHAR(50) UNIQUE NOT NULL,
    probability INT DEFAULT 0,
    sort_order  INT NOT NULL,
    is_closed   BIT DEFAULT 0,
    is_won      BIT DEFAULT 0,
    color       NVARCHAR(7),
    created_at  DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE competitors (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    name        NVARCHAR(255) NOT NULL,
    website     NVARCHAR(255),
    description NVARCHAR(MAX),
    strengths   NVARCHAR(MAX),
    weaknesses  NVARCHAR(MAX),
    is_active   BIT DEFAULT 1,
    created_at  DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE objection_categories (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    name        NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    color       NVARCHAR(7),
    sort_order  INT DEFAULT 0,
    is_active   BIT DEFAULT 1,
    created_at  DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE pricing_categories (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    code        NVARCHAR(50) NOT NULL UNIQUE,
    name        NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    is_default  BIT NOT NULL DEFAULT 0,
    is_active   BIT NOT NULL DEFAULT 1,
    sort_order  INT NOT NULL DEFAULT 0,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIMEOFFSET
);

CREATE TABLE app_settings (
    [key]       NVARCHAR(255) PRIMARY KEY,
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    value       NVARCHAR(MAX),
    category    NVARCHAR(100) NOT NULL DEFAULT 'general',
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE field_mappings (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    champ_source  NVARCHAR(100) NOT NULL UNIQUE,
    champ_opticrm NVARCHAR(100) NOT NULL,
    actif         BIT NOT NULL DEFAULT 1,
    created_at    DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE reference_data (
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    category    NVARCHAR(50) NOT NULL,
    ref_value   NVARCHAR(100) NOT NULL,
    label       NVARCHAR(150) NOT NULL,
    color       NVARCHAR(30),
    sort_order  INT NOT NULL DEFAULT 0,
    active      BIT NOT NULL DEFAULT 1,
    created_at  DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at  DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_reference_data PRIMARY KEY (id),
    CONSTRAINT uq_reference_data_cat_val UNIQUE (category, ref_value)
);

CREATE TABLE custom_fields (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    field_name    NVARCHAR(100) NOT NULL,
    field_key     NVARCHAR(100) NOT NULL,
    field_type    NVARCHAR(20) NOT NULL,
    field_options NVARCHAR(MAX),
    sort_order    INT NOT NULL DEFAULT 0,
    required      BIT NOT NULL DEFAULT 0,
    active        BIT NOT NULL DEFAULT 1,
    created_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_custom_fields PRIMARY KEY (id),
    CONSTRAINT uq_custom_fields_key UNIQUE (field_key)
);

CREATE TABLE workflow_templates (
    id                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
    tenant_id          UNIQUEIDENTIFIER NOT NULL,
    name               NVARCHAR(200) NOT NULL,
    description        NVARCHAR(MAX),
    category           NVARCHAR(100) NOT NULL,
    icon               NVARCHAR(100),
    entity_type        NVARCHAR(50) NOT NULL,
    trigger_type       NVARCHAR(50) NOT NULL,
    trigger_config     NVARCHAR(MAX),
    steps_config       NVARCHAR(MAX) NOT NULL,
    transitions_config NVARCHAR(MAX),
    tags               NVARCHAR(500),
    is_system          BIT NOT NULL DEFAULT 1,
    usage_count        INT NOT NULL DEFAULT 0,
    created_at         DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    updated_at         DATETIME2
);

CREATE TABLE warehouses (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    code                NVARCHAR(20) UNIQUE NOT NULL,
    name                NVARCHAR(100) NOT NULL,
    address_street      NVARCHAR(255),
    address_city        NVARCHAR(100),
    address_postal_code NVARCHAR(20),
    address_country     NVARCHAR(100),
    is_default          BIT DEFAULT 0,
    is_active           BIT DEFAULT 1,
    created_at          DATETIME2 DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 2: Users
-- =====================================================

CREATE TABLE users (
    id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id             UNIQUEIDENTIFIER NOT NULL,
    email                 NVARCHAR(255) NOT NULL,
    password_hash         NVARCHAR(255) NOT NULL,
    first_name            NVARCHAR(100) NOT NULL,
    last_name             NVARCHAR(100) NOT NULL,
    phone                 NVARCHAR(20),
    avatar_url            NVARCHAR(500),
    role_id               UNIQUEIDENTIFIER REFERENCES roles(id),
    team_id               UNIQUEIDENTIFIER REFERENCES teams(id),
    territory_id          UNIQUEIDENTIFIER REFERENCES territories(id),
    is_active             BIT DEFAULT 1,
    last_login_at         DATETIME2,
    password_changed_at   DATETIME2,
    failed_login_attempts INT DEFAULT 0,
    locked_until          DATETIME2,
    preferred_language    NVARCHAR(10) DEFAULT 'fr',
    timezone              NVARCHAR(50) DEFAULT 'Europe/Paris',
    created_at            DATETIME2 DEFAULT GETUTCDATE(),
    updated_at            DATETIME2 DEFAULT GETUTCDATE(),
    version               BIGINT DEFAULT 0,
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

ALTER TABLE teams ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_id) REFERENCES users(id);

CREATE TABLE refresh_tokens (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    token       NVARCHAR(255) UNIQUE NOT NULL,
    user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  DATETIME2 NOT NULL,
    created_at  DATETIME2 DEFAULT GETUTCDATE(),
    revoked_at  DATETIME2,
    ip_address  NVARCHAR(45),
    user_agent  NVARCHAR(MAX)
);

CREATE TABLE password_reset_tokens (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    token       NVARCHAR(255) NOT NULL UNIQUE,
    user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at  DATETIMEOFFSET NOT NULL,
    used_at     DATETIMEOFFSET,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE user_activities (
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id    UNIQUEIDENTIFIER NOT NULL,
    user_id      UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
    action       NVARCHAR(50) NOT NULL,
    details      NVARCHAR(MAX),
    performed_by UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at   DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE google_calendar_credentials (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID() PRIMARY KEY,
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    user_id       UNIQUEIDENTIFIER NOT NULL,
    access_token  NVARCHAR(MAX) NOT NULL,
    refresh_token NVARCHAR(MAX),
    token_expiry  BIGINT,
    google_email  NVARCHAR(255),
    calendar_id   NVARCHAR(255) NOT NULL DEFAULT 'primary',
    sync_enabled  BIT NOT NULL DEFAULT 1,
    created_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at    DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT uq_gc_credentials_user UNIQUE (user_id)
);

CREATE TABLE push_subscriptions (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    user_id     UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint    NVARCHAR(500) NOT NULL,
    p256dh_key  NVARCHAR(255) NOT NULL,
    auth_key    NVARCHAR(255) NOT NULL,
    created_at  DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE(user_id, endpoint)
);

CREATE TABLE supervisor_assignments (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    supervisor_id   UNIQUEIDENTIFIER NOT NULL,
    collaborator_id UNIQUEIDENTIFIER NOT NULL,
    assigned_at     DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    assigned_by_id  UNIQUEIDENTIFIER,
    notes           NVARCHAR(500),
    is_active       BIT NOT NULL DEFAULT 1,
    deactivated_at  DATETIME2,
    CONSTRAINT pk_supervisor_assignments PRIMARY KEY (id),
    CONSTRAINT fk_sa_supervisor   FOREIGN KEY (supervisor_id)   REFERENCES users(id),
    CONSTRAINT fk_sa_collaborator FOREIGN KEY (collaborator_id) REFERENCES users(id),
    CONSTRAINT fk_sa_assigned_by  FOREIGN KEY (assigned_by_id)  REFERENCES users(id),
    CONSTRAINT uq_sa_active_pair  UNIQUE (supervisor_id, collaborator_id, is_active)
);

-- =====================================================
-- SECTION 3: Accounts & Contacts
-- =====================================================

CREATE TABLE accounts (
    id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id             UNIQUEIDENTIFIER NOT NULL,
    name                  NVARCHAR(255) NOT NULL,
    legal_name            NVARCHAR(255),
    siret                 NVARCHAR(30),
    siren                 NVARCHAR(20),
    vat_number            NVARCHAR(50),
    account_type          NVARCHAR(50) NOT NULL,
    industry_id           UNIQUEIDENTIFIER REFERENCES industries(id),
    employee_count        INT,
    annual_revenue        DECIMAL(15, 2),
    revenue_currency      NVARCHAR(3) DEFAULT 'EUR',
    billing_street        NVARCHAR(255),
    billing_city          NVARCHAR(100),
    billing_state         NVARCHAR(100),
    billing_postal_code   NVARCHAR(30),
    billing_country       NVARCHAR(100),
    shipping_street       NVARCHAR(255),
    shipping_city         NVARCHAR(100),
    shipping_state        NVARCHAR(100),
    shipping_postal_code  NVARCHAR(30),
    shipping_country      NVARCHAR(100),
    website               NVARCHAR(255),
    phone                 NVARCHAR(50),
    whatsapp              NVARCHAR(50),
    account_score         INT DEFAULT 0,
    segment               NVARCHAR(50),
    tags                  NVARCHAR(MAX),
    credit_limit          DECIMAL(15, 2) DEFAULT 0,
    payment_terms_id      UNIQUEIDENTIFIER REFERENCES payment_terms(id),
    parent_account_id     UNIQUEIDENTIFIER REFERENCES accounts(id),
    assigned_to_id        UNIQUEIDENTIFIER REFERENCES users(id),
    territory_id          UNIQUEIDENTIFIER REFERENCES territories(id),
    created_by_id         UNIQUEIDENTIFIER REFERENCES users(id),
    created_at            DATETIME2 DEFAULT GETUTCDATE(),
    updated_at            DATETIME2 DEFAULT GETUTCDATE(),
    search_vector         NVARCHAR(MAX),
    ice                   NVARCHAR(30),
    identifiant_fiscal    NVARCHAR(50),
    rc                    NVARCHAR(50),
    cnss                  NVARCHAR(50),
    patente               NVARCHAR(50),
    latitude              DECIMAL(10, 8),
    longitude             DECIMAL(11, 8),
    logo_url              NVARCHAR(500),
    insurance_amount      DECIMAL(15,2) DEFAULT 0,
    insurance_company     NVARCHAR(255),
    pricing_category_id   UNIQUEIDENTIFIER REFERENCES pricing_categories(id),
    famille               NVARCHAR(50),
    type_compte_odyssee   NVARCHAR(100),
    prefecture            NVARCHAR(100),
    role_principal        NVARCHAR(30),
    statut_compte         NVARCHAR(100),
    potentiel             NVARCHAR(50),
    action_suivante       NVARCHAR(500),
    date_prochaine_action DATE,
    sage_code             NVARCHAR(50),
    sage_synced_at        DATETIME2,
    secteur_activite      NVARCHAR(100),
    categorie_client      NVARCHAR(100),
    categorie_tarifaire   NVARCHAR(100),
    representant          NVARCHAR(150),
    version               BIGINT DEFAULT 0,
    code_client_crm       NVARCHAR(50),
    societe_affectation   NVARCHAR(100),
    capital_social        DECIMAL(18,2),
    associes              NVARCHAR(MAX)
);

CREATE TABLE account_photos (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    account_id    UNIQUEIDENTIFIER NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
    url           NVARCHAR(500) NOT NULL,
    caption       NVARCHAR(255),
    display_order INT NOT NULL DEFAULT 0,
    uploaded_at   DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE custom_field_values (
    id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    account_id  UNIQUEIDENTIFIER NOT NULL,
    field_id    UNIQUEIDENTIFIER NOT NULL,
    field_value NVARCHAR(MAX),
    created_at  DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at  DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_custom_field_values PRIMARY KEY (id),
    CONSTRAINT uq_cfv_account_field UNIQUE (account_id, field_id),
    CONSTRAINT fk_cfv_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
    CONSTRAINT fk_cfv_field FOREIGN KEY (field_id) REFERENCES custom_fields(id) ON DELETE CASCADE
);

CREATE TABLE contacts (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    salutation          NVARCHAR(20),
    first_name          NVARCHAR(100) NOT NULL,
    last_name           NVARCHAR(100) NOT NULL,
    email               NVARCHAR(255),
    phone_mobile        NVARCHAR(20),
    phone_office        NVARCHAR(20),
    job_title           NVARCHAR(100),
    department          NVARCHAR(100),
    address_street      NVARCHAR(255),
    address_city        NVARCHAR(100),
    address_state       NVARCHAR(100),
    address_postal_code NVARCHAR(20),
    address_country     NVARCHAR(100),
    linkedin_url        NVARCHAR(255),
    twitter_handle      NVARCHAR(100),
    date_of_birth       DATE,
    preferred_language  NVARCHAR(10) DEFAULT 'fr',
    do_not_call         BIT DEFAULT 0,
    do_not_email        BIT DEFAULT 0,
    account_id          UNIQUEIDENTIFIER REFERENCES accounts(id),
    contact_role        NVARCHAR(50),
    reports_to_id       UNIQUEIDENTIFIER REFERENCES contacts(id),
    assigned_to_id      UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id       UNIQUEIDENTIFIER REFERENCES users(id),
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE(),
    search_vector       NVARCHAR(MAX),
    sage_contact_no     INTEGER,
    sage_synced_at      DATETIME2
);

-- =====================================================
-- SECTION 4: Campaigns, Leads, Opportunities
-- =====================================================

CREATE TABLE campaigns (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    name             NVARCHAR(255) NOT NULL,
    description      NVARCHAR(MAX),
    type             NVARCHAR(50),
    status           NVARCHAR(50) DEFAULT 'draft',
    start_date       DATE,
    end_date         DATE,
    budget           DECIMAL(15, 2),
    actual_cost      DECIMAL(15, 2),
    expected_revenue DECIMAL(15, 2),
    created_by_id    UNIQUEIDENTIFIER REFERENCES users(id),
    created_at       DATETIME2 DEFAULT GETUTCDATE(),
    updated_at       DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE leads (
    id                       UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id                UNIQUEIDENTIFIER NOT NULL,
    salutation               NVARCHAR(20),
    first_name               NVARCHAR(100),
    last_name                NVARCHAR(100) NOT NULL,
    email                    NVARCHAR(255),
    phone                    NVARCHAR(20),
    mobile                   NVARCHAR(20),
    company_name             NVARCHAR(255),
    job_title                NVARCHAR(100),
    website                  NVARCHAR(255),
    street                   NVARCHAR(255),
    city                     NVARCHAR(100),
    state                    NVARCHAR(100),
    postal_code              NVARCHAR(20),
    country                  NVARCHAR(100),
    status                   NVARCHAR(50) NOT NULL DEFAULT 'new',
    source                   NVARCHAR(50),
    source_details           NVARCHAR(255),
    rating                   NVARCHAR(20),
    lead_score               INT DEFAULT 0,
    interested_products      NVARCHAR(MAX),
    budget_range             NVARCHAR(50),
    decision_timeframe       NVARCHAR(50),
    assigned_to_id           UNIQUEIDENTIFIER REFERENCES users(id),
    territory_id             UNIQUEIDENTIFIER REFERENCES territories(id),
    campaign_id              UNIQUEIDENTIFIER REFERENCES campaigns(id),
    is_converted             BIT DEFAULT 0,
    converted_at             DATETIME2,
    converted_contact_id     UNIQUEIDENTIFIER REFERENCES contacts(id),
    converted_account_id     UNIQUEIDENTIFIER REFERENCES accounts(id),
    converted_opportunity_id UNIQUEIDENTIFIER,
    created_by_id            UNIQUEIDENTIFIER REFERENCES users(id),
    created_at               DATETIME2 DEFAULT GETUTCDATE(),
    updated_at               DATETIME2 DEFAULT GETUTCDATE(),
    last_activity_at         DATETIME2,
    search_vector            NVARCHAR(MAX),
    fax                      NVARCHAR(20),
    linkedin_url             NVARCHAR(255),
    industry                 NVARCHAR(100),
    num_employees            NVARCHAR(50),
    annual_revenue           NVARCHAR(50),
    priority                 NVARCHAR(20),
    do_not_call              BIT NOT NULL DEFAULT 0,
    do_not_email             BIT NOT NULL DEFAULT 0,
    next_follow_up_date      DATE,
    description              NVARCHAR(MAX),
    qualification_notes      NVARCHAR(MAX),
    competitor               NVARCHAR(200),
    product_demo_requested   BIT NOT NULL DEFAULT 0,
    meeting_scheduled_at     DATETIMEOFFSET,
    version                  BIGINT DEFAULT 0
);
GO

CREATE TABLE opportunities (
    id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id             UNIQUEIDENTIFIER NOT NULL,
    name                  NVARCHAR(255) NOT NULL,
    amount                DECIMAL(15, 2),
    currency              NVARCHAR(3) DEFAULT 'EUR',
    probability           INT DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    weighted_amount       AS (amount * probability / 100) PERSISTED,
    stage_id              UNIQUEIDENTIFIER REFERENCES opportunity_stages(id) NOT NULL,
    stage_changed_at      DATETIME2,
    close_date            DATE,
    actual_close_date     DATE,
    type                  NVARCHAR(50),
    lead_source           NVARCHAR(50),
    account_id            UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    primary_contact_id    UNIQUEIDENTIFIER REFERENCES contacts(id),
    assigned_to_id        UNIQUEIDENTIFIER REFERENCES users(id),
    lead_id               UNIQUEIDENTIFIER REFERENCES leads(id),
    campaign_id           UNIQUEIDENTIFIER REFERENCES campaigns(id),
    is_won                BIT,
    is_closed             BIT DEFAULT 0,
    close_reason          NVARCHAR(100),
    competitor_id         UNIQUEIDENTIFIER REFERENCES competitors(id),
    description           NVARCHAR(MAX),
    next_step             NVARCHAR(MAX),
    tags                  NVARCHAR(MAX),
    created_by_id         UNIQUEIDENTIFIER REFERENCES users(id),
    created_at            DATETIME2 DEFAULT GETUTCDATE(),
    updated_at            DATETIME2 DEFAULT GETUTCDATE(),
    search_vector         NVARCHAR(MAX),
    forecast_category     NVARCHAR(20),
    next_followup_date    DATE,
    competitor_name       NVARCHAR(100),
    lost_reason_detail    NVARCHAR(MAX),
    version               BIGINT DEFAULT 0
);
GO

ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_opportunity
    FOREIGN KEY (converted_opportunity_id) REFERENCES opportunities(id);

CREATE TABLE opportunity_contacts (
    opportunity_id UNIQUEIDENTIFIER REFERENCES opportunities(id) ON DELETE CASCADE,
    contact_id     UNIQUEIDENTIFIER REFERENCES contacts(id),
    role           NVARCHAR(50),
    is_primary     BIT DEFAULT 0,
    PRIMARY KEY (opportunity_id, contact_id)
);

-- =====================================================
-- SECTION 5: Products, Quotes, Orders, Invoices
-- =====================================================

CREATE TABLE product_categories (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    code                NVARCHAR(50) UNIQUE NOT NULL,
    name                NVARCHAR(100) NOT NULL,
    description         NVARCHAR(MAX),
    parent_category_id  UNIQUEIDENTIFIER REFERENCES product_categories(id),
    sort_order          INT DEFAULT 0,
    created_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE products (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    code                NVARCHAR(50) UNIQUE NOT NULL,
    name                NVARCHAR(255) NOT NULL,
    description         NVARCHAR(MAX),
    category_id         UNIQUEIDENTIFIER REFERENCES product_categories(id),
    brand               NVARCHAR(100),
    unit_price          DECIMAL(15, 2) NOT NULL,
    cost_price          DECIMAL(15, 2),
    currency            NVARCHAR(3) DEFAULT 'EUR',
    unit_of_measure     NVARCHAR(20) DEFAULT N'unité',
    is_stockable        BIT DEFAULT 1,
    min_stock_level     DECIMAL(15, 3) DEFAULT 0,
    reorder_level       DECIMAL(15, 3) DEFAULT 0,
    default_tax_rate_id UNIQUEIDENTIFIER REFERENCES tax_rates(id),
    is_active           BIT DEFAULT 1,
    is_sellable         BIT DEFAULT 1,
    is_purchasable      BIT DEFAULT 1,
    image_url           NVARCHAR(500),
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE(),
    search_vector       NVARCHAR(MAX),
    datasheet_url       NVARCHAR(500),
    datasheet_name      NVARCHAR(255),
    sage_code           NVARCHAR(50),
    sage_synced_at      DATETIMEOFFSET
);

CREATE TABLE product_prices (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    product_id          UNIQUEIDENTIFIER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    pricing_category_id UNIQUEIDENTIFIER NOT NULL REFERENCES pricing_categories(id),
    unit_price          DECIMAL(15,2) NOT NULL,
    currency            NVARCHAR(3) NOT NULL DEFAULT 'MAD',
    created_at          DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    UNIQUE (product_id, pricing_category_id)
);

-- Chantiers must be created before quotes/sales_orders (FK dependency)
CREATE TABLE chantiers (
    id                     UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id              UNIQUEIDENTIFIER NOT NULL,
    nom                    NVARCHAR(255) NOT NULL,
    ville                  NVARCHAR(100),
    prefecture             NVARCHAR(100),
    latitude               DECIMAL(10, 8),
    longitude              DECIMAL(11, 8),
    adresse                NVARCHAR(500),
    type_projet            NVARCHAR(50),
    sous_type_projet       NVARCHAR(50),
    nombre_unites          INTEGER,
    segment_taille         AS (
        CASE
            WHEN nombre_unites IS NULL THEN NULL
            WHEN nombre_unites < 20    THEN 'S'
            WHEN nombre_unites <= 100  THEN 'M'
            WHEN nombre_unites <= 300  THEN 'L'
            ELSE 'XL'
        END
    ) PERSISTED,
    stade_chantier         NVARCHAR(30),
    stade_changed_at       DATETIMEOFFSET,
    niveau_opportunite     NVARCHAR(30),
    statut_chantier        NVARCHAR(20),
    action_suivante        NVARCHAR(500),
    date_prochaine_action  DATE,
    assigned_to_id         UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
    territory_id           UNIQUEIDENTIFIER REFERENCES territories(id) ON DELETE SET NULL,
    account_id             UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE SET NULL,
    created_by_id          UNIQUEIDENTIFIER,
    created_at             DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at             DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    temoin                 BIT NOT NULL DEFAULT 0,
    installateur           NVARCHAR(255),
    promoteur              NVARCHAR(255),
    concurrent_ferme       NVARCHAR(255),
    deciseur_ferme         NVARCHAR(255),
    health_score           INT,
    conversion_probability DECIMAL(5,2),
    ai_summary             NVARCHAR(MAX),
    last_ai_analysis_at    DATETIME2
);
GO

CREATE TABLE chantier_acteurs (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    chantier_id UNIQUEIDENTIFIER NOT NULL REFERENCES chantiers(id) ON DELETE CASCADE,
    role_acteur NVARCHAR(30) NOT NULL,
    nom         NVARCHAR(255) NOT NULL,
    telephone   NVARCHAR(20),
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE chantier_echantillons (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    chantier_id     UNIQUEIDENTIFIER NOT NULL,
    notes           NVARCHAR(MAX),
    statut          NVARCHAR(30) NOT NULL DEFAULT 'ENVOYE',
    requested_by_id UNIQUEIDENTIFIER,
    created_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_chantier_echantillons PRIMARY KEY (id),
    CONSTRAINT fk_echantillon_chantier FOREIGN KEY (chantier_id)
        REFERENCES chantiers(id) ON DELETE CASCADE
);

CREATE TABLE chantier_echantillon_lignes (
    id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id      UNIQUEIDENTIFIER NOT NULL,
    echantillon_id UNIQUEIDENTIFIER NOT NULL,
    product_id     UNIQUEIDENTIFIER,
    product_code   NVARCHAR(50) NOT NULL,
    product_name   NVARCHAR(255) NOT NULL,
    quantite       INT NOT NULL DEFAULT 1,
    CONSTRAINT pk_echantillon_lignes PRIMARY KEY (id),
    CONSTRAINT fk_ligne_echantillon FOREIGN KEY (echantillon_id)
        REFERENCES chantier_echantillons(id) ON DELETE CASCADE
);

CREATE TABLE quotes (
    id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id             UNIQUEIDENTIFIER NOT NULL,
    quote_number          NVARCHAR(50) UNIQUE NOT NULL,
    opportunity_id        UNIQUEIDENTIFIER REFERENCES opportunities(id),
    account_id            UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    contact_id            UNIQUEIDENTIFIER REFERENCES contacts(id),
    status                NVARCHAR(50) NOT NULL DEFAULT 'draft',
    version               BIGINT DEFAULT 1,
    parent_quote_id       UNIQUEIDENTIFIER REFERENCES quotes(id),
    quote_date            DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    valid_until           DATE,
    subtotal              DECIMAL(15, 2) DEFAULT 0,
    discount_type         NVARCHAR(20),
    discount_value        DECIMAL(15, 2) DEFAULT 0,
    discount_amount       DECIMAL(15, 2) DEFAULT 0,
    tax_amount            DECIMAL(15, 2) DEFAULT 0,
    total                 DECIMAL(15, 2) DEFAULT 0,
    currency              NVARCHAR(3) DEFAULT 'EUR',
    billing_street        NVARCHAR(255),
    billing_city          NVARCHAR(100),
    billing_state         NVARCHAR(100),
    billing_postal_code   NVARCHAR(20),
    billing_country       NVARCHAR(100),
    shipping_street       NVARCHAR(255),
    shipping_city         NVARCHAR(100),
    shipping_state        NVARCHAR(100),
    shipping_postal_code  NVARCHAR(20),
    shipping_country      NVARCHAR(100),
    payment_terms_id      UNIQUEIDENTIFIER REFERENCES payment_terms(id),
    delivery_terms        NVARCHAR(MAX),
    notes                 NVARCHAR(MAX),
    terms_and_conditions  NVARCHAR(MAX),
    signed_at             DATETIME2,
    signed_by             NVARCHAR(255),
    signature_ip          NVARCHAR(45),
    pdf_url               NVARCHAR(500),
    assigned_to_id        UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id         UNIQUEIDENTIFIER REFERENCES users(id),
    updated_by_id         UNIQUEIDENTIFIER REFERENCES users(id),
    chantier_id           UNIQUEIDENTIFIER,
    created_at            DATETIME2 DEFAULT GETUTCDATE(),
    updated_at            DATETIME2 DEFAULT GETUTCDATE()
);
GO

CREATE TABLE quote_lines (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    quote_id        UNIQUEIDENTIFIER REFERENCES quotes(id) ON DELETE CASCADE,
    product_id      UNIQUEIDENTIFIER REFERENCES products(id),
    product_code    NVARCHAR(50),
    product_name    NVARCHAR(255) NOT NULL,
    description     NVARCHAR(MAX),
    quantity        DECIMAL(15, 3) NOT NULL DEFAULT 1,
    unit_price      DECIMAL(15, 2) NOT NULL,
    unit_of_measure NVARCHAR(20),
    discount_type   NVARCHAR(20),
    discount_value  DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    subtotal        AS (quantity * unit_price) PERSISTED,
    total           DECIMAL(15, 2),
    tax_rate_id     UNIQUEIDENTIFIER REFERENCES tax_rates(id),
    tax_rate        DECIMAL(5, 2),
    tax_amount      DECIMAL(15, 2),
    stock_available DECIMAL(15, 3),
    stock_status    NVARCHAR(20),
    sort_order      INT DEFAULT 0,
    created_at      DATETIME2 DEFAULT GETUTCDATE()
);
GO

CREATE TABLE sales_orders (
    id                      UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id               UNIQUEIDENTIFIER NOT NULL,
    order_number            NVARCHAR(50) UNIQUE NOT NULL,
    quote_id                UNIQUEIDENTIFIER REFERENCES quotes(id),
    account_id              UNIQUEIDENTIFIER REFERENCES accounts(id),
    contact_id              UNIQUEIDENTIFIER REFERENCES contacts(id),
    chantier_id             UNIQUEIDENTIFIER REFERENCES chantiers(id) ON DELETE SET NULL,
    status                  NVARCHAR(50) NOT NULL DEFAULT 'draft',
    order_date              DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    expected_delivery_date  DATE,
    subtotal                DECIMAL(15, 2) DEFAULT 0,
    discount_amount         DECIMAL(15, 2) DEFAULT 0,
    tax_amount              DECIMAL(15, 2) DEFAULT 0,
    total                   DECIMAL(15, 2) DEFAULT 0,
    currency                NVARCHAR(3) DEFAULT 'EUR',
    shipping_street         NVARCHAR(255),
    shipping_city           NVARCHAR(100),
    shipping_state          NVARCHAR(100),
    shipping_postal_code    NVARCHAR(20),
    shipping_country        NVARCHAR(100),
    notes                   NVARCHAR(MAX),
    assigned_to_id          UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id           UNIQUEIDENTIFIER REFERENCES users(id),
    sage_piece              NVARCHAR(20),
    sage_synced_at          DATETIME2,
    created_at              DATETIME2 DEFAULT GETUTCDATE(),
    updated_at              DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT chk_sales_order_account_or_chantier
        CHECK (account_id IS NOT NULL OR chantier_id IS NOT NULL)
);

CREATE TABLE sales_order_lines (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    sales_order_id   UNIQUEIDENTIFIER NOT NULL REFERENCES sales_orders(id) ON DELETE CASCADE,
    product_id       UNIQUEIDENTIFIER REFERENCES products(id) ON DELETE SET NULL,
    product_code     NVARCHAR(50),
    product_name     NVARCHAR(255) NOT NULL,
    description      NVARCHAR(MAX),
    quantity         DECIMAL(15,3) NOT NULL DEFAULT 1,
    unit_price       DECIMAL(15,2) NOT NULL DEFAULT 0,
    unit_of_measure  NVARCHAR(30) DEFAULT N'unité',
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    discount_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
    tax_rate         DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_amount       DECIMAL(15,2) NOT NULL DEFAULT 0,
    line_total       DECIMAL(15,2) NOT NULL DEFAULT 0,
    sort_order       INTEGER DEFAULT 0,
    created_at       DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE TABLE invoices (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    invoice_number      NVARCHAR(50) UNIQUE NOT NULL,
    invoice_type        NVARCHAR(20) NOT NULL DEFAULT 'invoice',
    status              NVARCHAR(50) NOT NULL DEFAULT 'draft',
    account_id          UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    contact_id          UNIQUEIDENTIFIER REFERENCES contacts(id),
    quote_id            UNIQUEIDENTIFIER REFERENCES quotes(id),
    order_id            UNIQUEIDENTIFIER REFERENCES sales_orders(id),
    invoice_date        DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    due_date            DATE NOT NULL,
    subtotal            DECIMAL(15, 2) DEFAULT 0,
    discount_amount     DECIMAL(15, 2) DEFAULT 0,
    tax_amount          DECIMAL(15, 2) DEFAULT 0,
    total               DECIMAL(15, 2) DEFAULT 0,
    amount_paid         DECIMAL(15, 2) DEFAULT 0,
    amount_due          AS (total - amount_paid) PERSISTED,
    currency            NVARCHAR(3) DEFAULT 'EUR',
    billing_name        NVARCHAR(255),
    billing_street      NVARCHAR(255),
    billing_city        NVARCHAR(100),
    billing_state       NVARCHAR(100),
    billing_postal_code NVARCHAR(20),
    billing_country     NVARCHAR(100),
    payment_terms_id    UNIQUEIDENTIFIER REFERENCES payment_terms(id),
    notes               NVARCHAR(MAX),
    pdf_url             NVARCHAR(500),
    created_by_id       UNIQUEIDENTIFIER REFERENCES users(id),
    sage_piece          NVARCHAR(20),
    sage_synced_at      DATETIME2,
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE(),
    sent_at             DATETIME2,
    paid_at             DATETIME2
);
GO

CREATE TABLE invoice_lines (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    invoice_id      UNIQUEIDENTIFIER REFERENCES invoices(id) ON DELETE CASCADE,
    product_id      UNIQUEIDENTIFIER REFERENCES products(id),
    product_code    NVARCHAR(50),
    description     NVARCHAR(255) NOT NULL,
    quantity        DECIMAL(15, 3) NOT NULL,
    unit_price      DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_rate        DECIMAL(5, 2),
    tax_amount      DECIMAL(15, 2),
    total           DECIMAL(15, 2),
    sort_order      INT DEFAULT 0,
    created_at      DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE payments (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    payment_number  NVARCHAR(50) UNIQUE NOT NULL,
    account_id      UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    payment_date    DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    amount          DECIMAL(15, 2) NOT NULL,
    currency        NVARCHAR(3) DEFAULT 'EUR',
    payment_method  NVARCHAR(50),
    reference       NVARCHAR(100),
    bank_account    NVARCHAR(100),
    status          NVARCHAR(50) DEFAULT 'received',
    notes           NVARCHAR(MAX),
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id),
    sage_reg_no     INTEGER,
    sage_synced_at  DATETIME2,
    created_at      DATETIME2 DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE payment_allocations (
    id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id  UNIQUEIDENTIFIER NOT NULL,
    payment_id UNIQUEIDENTIFIER REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UNIQUEIDENTIFIER REFERENCES invoices(id),
    amount     DECIMAL(15, 2) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(payment_id, invoice_id)
);

-- =====================================================
-- SECTION 6: Stock Management
-- =====================================================

CREATE TABLE stock_levels (
    id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id          UNIQUEIDENTIFIER NOT NULL,
    product_id         UNIQUEIDENTIFIER REFERENCES products(id) NOT NULL,
    warehouse_id       UNIQUEIDENTIFIER REFERENCES warehouses(id) NOT NULL,
    quantity_on_hand   DECIMAL(15, 3) DEFAULT 0,
    quantity_reserved  DECIMAL(15, 3) DEFAULT 0,
    quantity_available AS (quantity_on_hand - quantity_reserved) PERSISTED,
    quantity_on_order  DECIMAL(15, 3) DEFAULT 0,
    average_cost       DECIMAL(15, 2) DEFAULT 0,
    total_value        AS (quantity_on_hand * average_cost) PERSISTED,
    last_count_date    DATE,
    updated_at         DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(product_id, warehouse_id)
);
GO

CREATE TABLE stock_movements (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    product_id      UNIQUEIDENTIFIER REFERENCES products(id) NOT NULL,
    warehouse_id    UNIQUEIDENTIFIER REFERENCES warehouses(id) NOT NULL,
    movement_type   NVARCHAR(50) NOT NULL,
    quantity        DECIMAL(15, 3) NOT NULL,
    unit_cost       DECIMAL(15, 2),
    reference_type  NVARCHAR(50),
    reference_id    UNIQUEIDENTIFIER,
    quantity_after  DECIMAL(15, 3),
    notes           NVARCHAR(MAX),
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id),
    created_at      DATETIME2 DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 7: Activities, Visits, Tours
-- =====================================================

CREATE TABLE activities (
    id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id          UNIQUEIDENTIFIER NOT NULL,
    activity_type      NVARCHAR(50) NOT NULL,
    subject            NVARCHAR(255) NOT NULL,
    description        NVARCHAR(MAX),
    start_date         DATETIME2,
    end_date           DATETIME2,
    due_date           DATETIME2,
    completed_at       DATETIME2,
    duration           INT,
    location           NVARCHAR(255),
    location_type      NVARCHAR(50),
    status             NVARCHAR(50) DEFAULT 'planned',
    priority           NVARCHAR(20) DEFAULT 'normal',
    related_to_type    NVARCHAR(50),
    related_to_id      UNIQUEIDENTIFIER,
    call_direction     NVARCHAR(20),
    call_result        NVARCHAR(50),
    assigned_to_id     UNIQUEIDENTIFIER REFERENCES users(id),
    is_recurring       BIT DEFAULT 0,
    recurrence_rule    NVARCHAR(MAX),
    parent_activity_id UNIQUEIDENTIFIER REFERENCES activities(id),
    reminder_at        DATETIME2,
    reminder_sent      BIT DEFAULT 0,
    created_by_id      UNIQUEIDENTIFIER REFERENCES users(id),
    created_at         DATETIME2 DEFAULT GETUTCDATE(),
    updated_at         DATETIME2 DEFAULT GETUTCDATE(),
    objective          NVARCHAR(255),
    result             NVARCHAR(MAX),
    products_discussed NVARCHAR(MAX),
    estimated_revenue  DECIMAL(12,2),
    expenses           DECIMAL(12,2),
    transport_mode     NVARCHAR(50),
    mileage            DECIMAL(10,2),
    follow_up_date     DATETIME2,
    google_event_id    NVARCHAR(255)
);

CREATE TABLE activity_participants (
    activity_id      UNIQUEIDENTIFIER REFERENCES activities(id) ON DELETE CASCADE,
    participant_type NVARCHAR(50),
    participant_id   UNIQUEIDENTIFIER,
    status           NVARCHAR(50) DEFAULT 'invited',
    PRIMARY KEY (activity_id, participant_type, participant_id)
);

CREATE TABLE visits (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    contact_id          UNIQUEIDENTIFIER REFERENCES contacts(id),
    account_id          UNIQUEIDENTIFIER REFERENCES accounts(id),
    chantier_id         UNIQUEIDENTIFIER REFERENCES chantiers(id) ON DELETE SET NULL,
    visit_type          NVARCHAR(50) NOT NULL,
    subject             NVARCHAR(255) NOT NULL,
    description         NVARCHAR(MAX),
    visit_date          DATETIME2 NOT NULL,
    visit_end_date      DATETIMEOFFSET,
    duration            INT,
    status              NVARCHAR(50) DEFAULT 'planned',
    latitude            DECIMAL(10,8),
    longitude           DECIMAL(11,8),
    address             NVARCHAR(500),
    city                NVARCHAR(100),
    check_in_at         DATETIME2,
    check_out_at        DATETIME2,
    notes               NVARCHAR(MAX),
    outcome             NVARCHAR(50),
    next_action         NVARCHAR(MAX),
    assigned_to_id      UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id       UNIQUEIDENTIFIER REFERENCES users(id),
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE(),
    objective           NVARCHAR(255),
    interest_level      NVARCHAR(20),
    satisfaction        INT,
    competitor_detected NVARCHAR(255),
    products_presented  NVARCHAR(MAX),
    estimated_amount    DECIMAL(12,2),
    samples_delivered   NVARCHAR(255),
    transport_mode      NVARCHAR(50),
    mileage             DECIMAL(10,2),
    expenses            DECIMAL(12,2),
    follow_up_date      DATETIME2,
    follow_up_priority  NVARCHAR(20),
    next_visit_planned  BIT
);

CREATE TABLE tours (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    name             NVARCHAR(255) NOT NULL,
    description      NVARCHAR(MAX),
    tour_date        DATE NOT NULL,
    status           NVARCHAR(50) DEFAULT 'draft',
    region           NVARCHAR(100),
    assigned_to_id   UNIQUEIDENTIFIER REFERENCES users(id),
    total_visits     INT DEFAULT 0,
    completed_visits INT DEFAULT 0,
    total_distance   DECIMAL(10,2),
    start_address    NVARCHAR(500),
    end_address      NVARCHAR(500),
    notes            NVARCHAR(MAX),
    created_by_id    UNIQUEIDENTIFIER REFERENCES users(id),
    created_at       DATETIME2 DEFAULT GETUTCDATE(),
    updated_at       DATETIME2 DEFAULT GETUTCDATE(),
    objective        NVARCHAR(MAX),
    tour_result      NVARCHAR(MAX),
    estimated_revenue DECIMAL(12,2),
    actual_revenue   DECIMAL(12,2),
    vehicle_type     NVARCHAR(50),
    fuel_cost        DECIMAL(10,2),
    total_expenses   DECIMAL(12,2),
    start_time       DATETIME2,
    end_time         DATETIME2,
    follow_up_notes  NVARCHAR(MAX),
    start_latitude   DECIMAL(10,8),
    start_longitude  DECIMAL(11,8),
    end_latitude     DECIMAL(10,8),
    end_longitude    DECIMAL(11,8)
);

CREATE TABLE tour_visits (
    tour_id     UNIQUEIDENTIFIER REFERENCES tours(id) ON DELETE CASCADE,
    visit_id    UNIQUEIDENTIFIER REFERENCES visits(id) ON DELETE CASCADE,
    visit_order INT NOT NULL,
    PRIMARY KEY (tour_id, visit_id)
);

CREATE TABLE expense_reports (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    tour_id         UNIQUEIDENTIFIER NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    submitted_by_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id),
    report_number   NVARCHAR(50) NOT NULL UNIQUE,
    status          NVARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    title           NVARCHAR(255) NOT NULL,
    description     NVARCHAR(MAX),
    total_amount    DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    currency        NVARCHAR(3) NOT NULL DEFAULT 'MAD',
    submitted_at    DATETIME2,
    approved_at     DATETIME2,
    reimbursed_at   DATETIME2,
    approved_by_id  UNIQUEIDENTIFIER REFERENCES users(id),
    rejection_reason NVARCHAR(MAX),
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id),
    created_at      DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE expense_report_lines (
    id                UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    expense_report_id UNIQUEIDENTIFIER NOT NULL REFERENCES expense_reports(id) ON DELETE CASCADE,
    category          NVARCHAR(50) NOT NULL,
    description       NVARCHAR(500) NOT NULL,
    amount            DECIMAL(15,2) NOT NULL,
    expense_date      DATE NOT NULL,
    receipt_url       NVARCHAR(500),
    sort_order        INT DEFAULT 0,
    latitude          DECIMAL(10,8),
    longitude         DECIMAL(11,8),
    address           NVARCHAR(500),
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 8: Commercial Objectives & Sales
-- =====================================================

CREATE TABLE commercial_objectives (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    user_id       UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id    UNIQUEIDENTIFIER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    period_year   INT NOT NULL,
    period_month  INT CHECK (period_month BETWEEN 1 AND 12),
    target_qty    DECIMAL(15,3) NOT NULL DEFAULT 0,
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    notes         NVARCHAR(MAX),
    created_at    DATETIME2 DEFAULT GETUTCDATE(),
    updated_at    DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE (user_id, product_id, period_year, period_month)
);
GO

CREATE TABLE sale_entries (
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id    UNIQUEIDENTIFIER NOT NULL,
    user_id      UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id   UNIQUEIDENTIFIER NOT NULL REFERENCES products(id),
    account_id   UNIQUEIDENTIFIER REFERENCES accounts(id),
    sale_date    DATE NOT NULL,
    qty          DECIMAL(15,3) NOT NULL DEFAULT 0,
    unit_price   DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount AS (qty * unit_price) PERSISTED,
    notes        NVARCHAR(MAX),
    created_at   DATETIME2 DEFAULT GETUTCDATE(),
    updated_at   DATETIME2 DEFAULT GETUTCDATE()
);
GO

CREATE TABLE ventes_saisies (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    account_id    UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE SET NULL,
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE SET NULL,
    reference     NVARCHAR(100),
    date_vente    DATE NOT NULL,
    montant_ht    DECIMAL(15,2) NOT NULL DEFAULT 0,
    montant_ttc   DECIMAL(15,2) NOT NULL DEFAULT 0,
    description   NVARCHAR(MAX),
    statut        NVARCHAR(30) DEFAULT 'CONFIRME',
    created_at    DATETIMEOFFSET DEFAULT GETUTCDATE(),
    updated_at    DATETIMEOFFSET DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 9: Objections
-- =====================================================

CREATE TABLE sales_objections (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    code            NVARCHAR(20) UNIQUE NOT NULL,
    title           NVARCHAR(200) NOT NULL,
    description     NVARCHAR(MAX),
    category        NVARCHAR(50),
    response        NVARCHAR(MAX),
    contact_id      UNIQUEIDENTIFIER REFERENCES contacts(id),
    account_id      UNIQUEIDENTIFIER REFERENCES accounts(id),
    opportunity_id  UNIQUEIDENTIFIER REFERENCES opportunities(id),
    status          NVARCHAR(50) DEFAULT 'OPEN',
    priority        NVARCHAR(20) DEFAULT 'MEDIUM',
    source          NVARCHAR(50),
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id),
    assigned_to_id  UNIQUEIDENTIFIER REFERENCES users(id),
    resolved_at     DATETIME2,
    resolved_by_id  UNIQUEIDENTIFIER REFERENCES users(id),
    created_at      DATETIME2 DEFAULT GETUTCDATE(),
    updated_at      DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE objections (
    id                 UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id          UNIQUEIDENTIFIER NOT NULL,
    category_id        UNIQUEIDENTIFIER REFERENCES objection_categories(id),
    objection_text     NVARCHAR(MAX) NOT NULL,
    variants           NVARCHAR(MAX),
    severity           NVARCHAR(20) DEFAULT 'important',
    frequency_score    INT DEFAULT 0,
    related_products   NVARCHAR(MAX),
    related_industries NVARCHAR(MAX),
    is_active          BIT DEFAULT 1,
    created_by_id      UNIQUEIDENTIFIER REFERENCES users(id),
    created_at         DATETIME2 DEFAULT GETUTCDATE(),
    updated_at         DATETIME2 DEFAULT GETUTCDATE(),
    search_vector      NVARCHAR(MAX)
);

CREATE TABLE objection_responses (
    id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id      UNIQUEIDENTIFIER NOT NULL,
    objection_id   UNIQUEIDENTIFIER REFERENCES objections(id) ON DELETE CASCADE,
    response_type  NVARCHAR(50) NOT NULL,
    response_text  NVARCHAR(MAX) NOT NULL,
    success_rate   DECIMAL(5, 2),
    usage_count    INT DEFAULT 0,
    success_count  INT DEFAULT 0,
    attachments    NVARCHAR(MAX),
    is_approved    BIT DEFAULT 0,
    approved_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    approved_at    DATETIME2,
    created_by_id  UNIQUEIDENTIFIER REFERENCES users(id),
    created_at     DATETIME2 DEFAULT GETUTCDATE(),
    updated_at     DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE opportunity_objections (
    id                    UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id             UNIQUEIDENTIFIER NOT NULL,
    opportunity_id        UNIQUEIDENTIFIER REFERENCES opportunities(id) ON DELETE CASCADE,
    objection_id          UNIQUEIDENTIFIER REFERENCES objections(id),
    custom_objection_text NVARCHAR(MAX),
    response_id           UNIQUEIDENTIFIER REFERENCES objection_responses(id),
    custom_response_text  NVARCHAR(MAX),
    objection_date        DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    context               NVARCHAR(MAX),
    status                NVARCHAR(50) NOT NULL DEFAULT 'open',
    resolved_at           DATETIME2,
    notes                 NVARCHAR(MAX),
    created_by_id         UNIQUEIDENTIFIER REFERENCES users(id),
    created_at            DATETIME2 DEFAULT GETUTCDATE(),
    updated_at            DATETIME2 DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 10: Email, Audit
-- =====================================================

CREATE TABLE email_templates (
    id                  UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    name                NVARCHAR(100) NOT NULL,
    subject             NVARCHAR(255) NOT NULL,
    body_html           NVARCHAR(MAX) NOT NULL,
    body_text           NVARCHAR(MAX),
    category            NVARCHAR(50),
    available_variables NVARCHAR(MAX),
    usage_count         INT DEFAULT 0,
    open_rate           DECIMAL(5, 2),
    click_rate          DECIMAL(5, 2),
    is_active           BIT DEFAULT 1,
    created_by_id       UNIQUEIDENTIFIER REFERENCES users(id),
    created_at          DATETIME2 DEFAULT GETUTCDATE(),
    updated_at          DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE email_logs (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    to_email        NVARCHAR(255) NOT NULL,
    to_name         NVARCHAR(255),
    cc_emails       NVARCHAR(MAX),
    bcc_emails      NVARCHAR(MAX),
    subject         NVARCHAR(255) NOT NULL,
    body_html       NVARCHAR(MAX),
    template_id     UNIQUEIDENTIFIER REFERENCES email_templates(id),
    related_to_type NVARCHAR(50),
    related_to_id   UNIQUEIDENTIFIER,
    status          NVARCHAR(50) DEFAULT 'pending',
    sent_at         DATETIME2,
    delivered_at    DATETIME2,
    opened_at       DATETIME2,
    opened_count    INT DEFAULT 0,
    clicked_at      DATETIME2,
    clicked_links   NVARCHAR(MAX),
    error_message   NVARCHAR(MAX),
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id),
    created_at      DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE audit_logs (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    entity_type     NVARCHAR(50) NOT NULL,
    entity_id       UNIQUEIDENTIFIER NOT NULL,
    action          NVARCHAR(50) NOT NULL,
    old_values      NVARCHAR(MAX),
    new_values      NVARCHAR(MAX),
    changed_fields  NVARCHAR(MAX),
    ip_address      NVARCHAR(45),
    user_agent      NVARCHAR(MAX),
    user_id         UNIQUEIDENTIFIER REFERENCES users(id),
    created_at      DATETIME2 DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 11: Sage Integration
-- =====================================================

CREATE TABLE sage_sync_requests (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    entity_type     NVARCHAR(30) NOT NULL,
    label           NVARCHAR(255),
    source_format   NVARCHAR(20) DEFAULT 'CSV',
    status          NVARCHAR(20) NOT NULL DEFAULT 'PENDING',
    total_items     INTEGER DEFAULT 0,
    processed_items INTEGER DEFAULT 0,
    success_items   INTEGER DEFAULT 0,
    error_items     INTEGER DEFAULT 0,
    skip_items      INTEGER DEFAULT 0,
    period_year     INTEGER,
    period_month    INTEGER,
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id),
    processed_at    DATETIME2,
    created_at      DATETIME2 DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sage_sync_items (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    request_id    UNIQUEIDENTIFIER NOT NULL REFERENCES sage_sync_requests(id) ON DELETE CASCADE,
    row_index     INTEGER,
    sage_ref      NVARCHAR(100),
    crm_id        UNIQUEIDENTIFIER,
    action        NVARCHAR(20),
    status        NVARCHAR(20) DEFAULT 'PENDING',
    raw_data      NVARCHAR(MAX) NOT NULL,
    mapped_data   NVARCHAR(MAX),
    diff_data     NVARCHAR(MAX),
    error_message NVARCHAR(MAX),
    processed_at  DATETIME2,
    created_at    DATETIME2 DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE balance_agee_snapshots (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    sync_request_id UNIQUEIDENTIFIER REFERENCES sage_sync_requests(id) ON DELETE CASCADE,
    account_id      UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE SET NULL,
    sage_code       NVARCHAR(50) NOT NULL,
    non_echu        DECIMAL(15,2) DEFAULT 0,
    echu_1_30       DECIMAL(15,2) DEFAULT 0,
    echu_31_60      DECIMAL(15,2) DEFAULT 0,
    echu_61_90      DECIMAL(15,2) DEFAULT 0,
    echu_91_plus    DECIMAL(15,2) DEFAULT 0,
    total_du        DECIMAL(15,2) DEFAULT 0,
    synced_at       DATETIMEOFFSET DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 12: Tickets & Projects
-- =====================================================

CREATE TABLE tickets (
    id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id      UNIQUEIDENTIFIER NOT NULL,
    reference      NVARCHAR(20) NOT NULL UNIQUE,
    title          NVARCHAR(300) NOT NULL,
    description    NVARCHAR(MAX),
    category       NVARCHAR(50) NOT NULL DEFAULT 'AUTRE',
    priority       NVARCHAR(20) NOT NULL DEFAULT 'NORMALE',
    status         NVARCHAR(30) NOT NULL DEFAULT 'OUVERT',
    sla_deadline   DATETIMEOFFSET,
    resolved_at    DATETIMEOFFSET,
    closed_at      DATETIMEOFFSET,
    account_id     UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE NO ACTION,
    contact_id     UNIQUEIDENTIFIER REFERENCES contacts(id) ON DELETE NO ACTION,
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_by_id  UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at     DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at     DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE TABLE ticket_comments (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    ticket_id   UNIQUEIDENTIFIER NOT NULL REFERENCES tickets(id) ON DELETE NO ACTION,
    content     NVARCHAR(MAX) NOT NULL,
    is_internal BIT NOT NULL DEFAULT 0,
    author_id   UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE projects (
    id             UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id      UNIQUEIDENTIFIER NOT NULL,
    reference      NVARCHAR(20) NOT NULL UNIQUE,
    name           NVARCHAR(300) NOT NULL,
    description    NVARCHAR(MAX),
    status         NVARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    start_date     DATE,
    end_date       DATE,
    budget         DECIMAL(15,2),
    progress_pct   INTEGER NOT NULL DEFAULT 0,
    account_id     UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE NO ACTION,
    opportunity_id UNIQUEIDENTIFIER REFERENCES opportunities(id) ON DELETE NO ACTION,
    manager_id     UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_by_id  UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at     DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at     DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE TABLE project_members (
    id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id  UNIQUEIDENTIFIER NOT NULL,
    project_id UNIQUEIDENTIFIER NOT NULL REFERENCES projects(id) ON DELETE NO ACTION,
    user_id    UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE NO ACTION,
    role       NVARCHAR(30) NOT NULL DEFAULT 'MEMBRE',
    UNIQUE (project_id, user_id)
);

CREATE TABLE milestones (
    id          UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id   UNIQUEIDENTIFIER NOT NULL,
    project_id  UNIQUEIDENTIFIER NOT NULL REFERENCES projects(id) ON DELETE NO ACTION,
    name        NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    due_date    DATE,
    status      NVARCHAR(30) NOT NULL DEFAULT 'EN_ATTENTE',
    sort_order  INTEGER DEFAULT 0,
    created_at  DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

CREATE TABLE tasks (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    title           NVARCHAR(300) NOT NULL,
    description     NVARCHAR(MAX),
    status          NVARCHAR(30) NOT NULL DEFAULT 'A_FAIRE',
    priority        NVARCHAR(20) NOT NULL DEFAULT 'NORMALE',
    type            NVARCHAR(30) NOT NULL DEFAULT 'TACHE',
    estimated_hours DECIMAL(6,2),
    actual_hours    DECIMAL(6,2),
    start_date      DATE,
    due_date        DATE,
    completed_at    DATETIMEOFFSET,
    project_id      UNIQUEIDENTIFIER NOT NULL REFERENCES projects(id) ON DELETE NO ACTION,
    milestone_id    UNIQUEIDENTIFIER REFERENCES milestones(id) ON DELETE NO ACTION,
    parent_task_id  UNIQUEIDENTIFIER REFERENCES tasks(id) ON DELETE NO ACTION,
    assignee_id     UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at      DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE(),
    updated_at      DATETIMEOFFSET DEFAULT GETUTCDATE()
);

CREATE TABLE task_comments (
    id         UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id  UNIQUEIDENTIFIER NOT NULL,
    task_id    UNIQUEIDENTIFIER NOT NULL REFERENCES tasks(id) ON DELETE NO ACTION,
    content    NVARCHAR(MAX) NOT NULL,
    author_id  UNIQUEIDENTIFIER REFERENCES users(id) ON DELETE NO ACTION,
    created_at DATETIMEOFFSET NOT NULL DEFAULT GETUTCDATE()
);

-- =====================================================
-- SECTION 13: Workflows
-- =====================================================

CREATE TABLE workflows (
    id                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id          UNIQUEIDENTIFIER NOT NULL,
    name               NVARCHAR(200) NOT NULL,
    description        NVARCHAR(MAX),
    entity_type        NVARCHAR(50) NOT NULL,
    trigger_type       NVARCHAR(50) NOT NULL,
    trigger_config     NVARCHAR(MAX),
    is_active          BIT NOT NULL DEFAULT 0,
    version            INT NOT NULL DEFAULT 1,
    created_by_id      UNIQUEIDENTIFIER,
    created_by_user_id UNIQUEIDENTIFIER,
    created_at         DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at         DATETIME2,
    CONSTRAINT pk_workflows PRIMARY KEY (id),
    CONSTRAINT fk_workflows_created_by FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE TABLE workflow_steps (
    id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id      UNIQUEIDENTIFIER NOT NULL,
    workflow_id    UNIQUEIDENTIFIER NOT NULL,
    name           NVARCHAR(200) NOT NULL,
    step_type      NVARCHAR(50) NOT NULL,
    action_config  NVARCHAR(MAX),
    step_order     INT NOT NULL DEFAULT 0,
    position_x     INT DEFAULT 0,
    position_y     INT DEFAULT 0,
    is_entry_point BIT DEFAULT 0,
    CONSTRAINT pk_workflow_steps PRIMARY KEY (id),
    CONSTRAINT fk_workflow_steps_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE
);

CREATE TABLE workflow_transitions (
    id                   UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id            UNIQUEIDENTIFIER NOT NULL,
    workflow_id          UNIQUEIDENTIFIER NOT NULL,
    from_step_id         UNIQUEIDENTIFIER NOT NULL,
    to_step_id           UNIQUEIDENTIFIER NOT NULL,
    label                NVARCHAR(100),
    condition_expression NVARCHAR(MAX),
    eval_order           INT DEFAULT 0,
    CONSTRAINT pk_workflow_transitions PRIMARY KEY (id),
    CONSTRAINT fk_workflow_transitions_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_transitions_from FOREIGN KEY (from_step_id) REFERENCES workflow_steps(id),
    CONSTRAINT fk_workflow_transitions_to FOREIGN KEY (to_step_id) REFERENCES workflow_steps(id)
);

CREATE TABLE workflow_executions (
    id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    workflow_id     UNIQUEIDENTIFIER NOT NULL,
    entity_type     NVARCHAR(50) NOT NULL,
    entity_id       UNIQUEIDENTIFIER,
    status          NVARCHAR(30) NOT NULL DEFAULT 'RUNNING',
    current_step_id UNIQUEIDENTIFIER,
    resume_at       DATETIME2,
    error_message   NVARCHAR(MAX),
    triggered_by_id UNIQUEIDENTIFIER,
    started_at      DATETIME2 NOT NULL DEFAULT GETDATE(),
    completed_at    DATETIME2,
    CONSTRAINT pk_workflow_executions PRIMARY KEY (id),
    CONSTRAINT fk_workflow_executions_workflow FOREIGN KEY (workflow_id) REFERENCES workflows(id),
    CONSTRAINT fk_workflow_executions_step FOREIGN KEY (current_step_id) REFERENCES workflow_steps(id)
);

CREATE TABLE workflow_execution_logs (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    execution_id  UNIQUEIDENTIFIER NOT NULL,
    step_id       UNIQUEIDENTIFIER NOT NULL,
    status        NVARCHAR(30) NOT NULL,
    input_data    NVARCHAR(MAX),
    output_data   NVARCHAR(MAX),
    error_message NVARCHAR(MAX),
    duration_ms   BIGINT,
    executed_at   DATETIME2 NOT NULL DEFAULT GETDATE(),
    CONSTRAINT pk_workflow_execution_logs PRIMARY KEY (id),
    CONSTRAINT fk_workflow_logs_execution FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE,
    CONSTRAINT fk_workflow_logs_step FOREIGN KEY (step_id) REFERENCES workflow_steps(id)
);

-- =====================================================
-- SECTION 14: Delivery Module (19 tables + payment_instrument)
-- =====================================================

CREATE TABLE delivery_tour (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    tour_date         DATE NOT NULL,
    representative_id UNIQUEIDENTIFIER,
    vehicle_id        UNIQUEIDENTIFIER,
    zone              NVARCHAR(255),
    status            NVARCHAR(50) NOT NULL,
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_delivery_tour PRIMARY KEY (id)
);

CREATE TABLE delivery_line (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id  UNIQUEIDENTIFIER NOT NULL,
    customer_id       UNIQUEIDENTIFIER,
    item_id           UNIQUEIDENTIFIER,
    quantity          INT NOT NULL,
    unit_price        DECIMAL(10,2),
    amount            DECIMAL(12,2),
    payment_mode      NVARCHAR(50),
    paid_amount       DECIMAL(12,2),
    visit_result      NVARCHAR(50) NOT NULL,
    visit_notes       NVARCHAR(500),
    cheque_number     NVARCHAR(50),
    traite_due_date   DATE,
    batch_id          UNIQUEIDENTIFIER,
    lot_number        NVARCHAR(100),
    expiry_date       DATE,
    quantity_delivered INT,
    discount_percent  DECIMAL(5,2) DEFAULT 0,
    discount_reason   NVARCHAR(255),
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_delivery_line PRIMARY KEY (id),
    CONSTRAINT fk_dl_tour FOREIGN KEY (delivery_tour_id) REFERENCES delivery_tour(id)
);

CREATE TABLE delivery_promotion (
    id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id      UNIQUEIDENTIFIER NOT NULL,
    name           NVARCHAR(200) NOT NULL,
    description    NVARCHAR(500),
    item_id        UNIQUEIDENTIFIER NOT NULL,
    min_quantity   INT NOT NULL,
    bonus_item_id  UNIQUEIDENTIFIER NOT NULL,
    bonus_quantity INT NOT NULL,
    zone           NVARCHAR(100),
    valid_from     DATE,
    valid_to       DATE,
    is_active      BIT NOT NULL DEFAULT 1,
    created_at     DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at     DATETIME2,
    created_by_id  UNIQUEIDENTIFIER,
    updated_by_id  UNIQUEIDENTIFIER,
    version        BIGINT DEFAULT 0,
    CONSTRAINT pk_delivery_promotion PRIMARY KEY (id)
);

CREATE TABLE delivery_line_bonus (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    delivery_line_id UNIQUEIDENTIFIER NOT NULL,
    promotion_id     UNIQUEIDENTIFIER NOT NULL,
    bonus_item_id    UNIQUEIDENTIFIER NOT NULL,
    bonus_quantity   INT NOT NULL,
    created_at       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2,
    created_by_id    UNIQUEIDENTIFIER,
    updated_by_id    UNIQUEIDENTIFIER,
    version          BIGINT DEFAULT 0,
    CONSTRAINT pk_delivery_line_bonus PRIMARY KEY (id),
    CONSTRAINT fk_dlb_line FOREIGN KEY (delivery_line_id) REFERENCES delivery_line(id),
    CONSTRAINT fk_dlb_promotion FOREIGN KEY (promotion_id) REFERENCES delivery_promotion(id)
);

CREATE TABLE delivery_price_override (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id           UNIQUEIDENTIFIER NOT NULL,
    item_id             UNIQUEIDENTIFIER NOT NULL,
    customer_id         UNIQUEIDENTIFIER,
    pricing_category_id UNIQUEIDENTIFIER,
    unit_price          DECIMAL(18,2) NOT NULL,
    valid_from          DATE,
    valid_to            DATE,
    is_active           BIT NOT NULL DEFAULT 1,
    notes               NVARCHAR(500),
    created_at          DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at          DATETIME2,
    created_by_id       UNIQUEIDENTIFIER,
    updated_by_id       UNIQUEIDENTIFIER,
    version             BIGINT DEFAULT 0,
    CONSTRAINT pk_delivery_price_override PRIMARY KEY (id)
);

CREATE TABLE vehicle_load (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id  UNIQUEIDENTIFIER NOT NULL,
    item_id           UNIQUEIDENTIFIER NOT NULL,
    quantity          INT NOT NULL,
    load_date         DATETIME2 NOT NULL,
    warehouse_from_id UNIQUEIDENTIFIER,
    batch_id          UNIQUEIDENTIFIER,
    lot_number        NVARCHAR(100),
    expiry_date       DATE,
    status            NVARCHAR(50),
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_vehicle_load PRIMARY KEY (id),
    CONSTRAINT fk_vl_tour FOREIGN KEY (delivery_tour_id) REFERENCES delivery_tour(id)
);

CREATE TABLE vehicle_unload (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id UNIQUEIDENTIFIER NOT NULL,
    unload_date      DATETIME2,
    status           NVARCHAR(50) NOT NULL,
    notes            NVARCHAR(500),
    confirmed_by     UNIQUEIDENTIFIER,
    confirmed_at     DATETIME2,
    created_at       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2,
    created_by_id    UNIQUEIDENTIFIER,
    updated_by_id    UNIQUEIDENTIFIER,
    version          BIGINT DEFAULT 0,
    CONSTRAINT pk_vehicle_unload PRIMARY KEY (id)
);

CREATE TABLE vehicle_unload_item (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    unload_id         UNIQUEIDENTIFIER NOT NULL,
    item_id           UNIQUEIDENTIFIER NOT NULL,
    quantity_loaded   INT NOT NULL,
    quantity_sold     INT NOT NULL,
    quantity_returned INT NOT NULL,
    quantity_unloaded INT NOT NULL,
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_vehicle_unload_item PRIMARY KEY (id),
    CONSTRAINT fk_vui_unload FOREIGN KEY (unload_id) REFERENCES vehicle_unload(id)
);

CREATE TABLE return_entry (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id UNIQUEIDENTIFIER NOT NULL,
    item_id          UNIQUEIDENTIFIER NOT NULL,
    quantity         INT NOT NULL,
    reason           NVARCHAR(255),
    received_date    DATETIME2,
    warehouse_to_id  UNIQUEIDENTIFIER NOT NULL,
    status           NVARCHAR(50),
    return_type      NVARCHAR(50) DEFAULT 'VEHICLE_RETURN',
    delivery_line_id UNIQUEIDENTIFIER,
    created_at       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2,
    created_by_id    UNIQUEIDENTIFIER,
    updated_by_id    UNIQUEIDENTIFIER,
    version          BIGINT DEFAULT 0,
    CONSTRAINT pk_return_entry PRIMARY KEY (id),
    CONSTRAINT fk_re_tour FOREIGN KEY (delivery_tour_id) REFERENCES delivery_tour(id),
    CONSTRAINT fk_re_delivery_line FOREIGN KEY (delivery_line_id) REFERENCES delivery_line(id)
);

CREATE TABLE settlement_report (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id  UNIQUEIDENTIFIER NOT NULL,
    total_amount      DECIMAL(12,2),
    collected_amount  DECIMAL(12,2),
    cash_amount       DECIMAL(12,2),
    cheque_amount     DECIMAL(12,2),
    traite_amount     DECIMAL(12,2),
    virement_amount   DECIMAL(12,2),
    credit_amount     DECIMAL(12,2),
    credit_balance    DECIMAL(12,2),
    unloaded_value    DECIMAL(12,2),
    discrepancy       DECIMAL(12,2),
    stock_theoretical INT,
    stock_physical    INT,
    stock_discrepancy INT,
    notes             NVARCHAR(1000),
    generated_at      DATETIME2,
    finalized_at      DATETIME2,
    finalized_by      UNIQUEIDENTIFIER,
    status            NVARCHAR(50),
    approved_by       UNIQUEIDENTIFIER,
    approved_at       DATETIME2,
    approval_notes    NVARCHAR(500),
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_settlement_report PRIMARY KEY (id)
);

CREATE TABLE pre_order (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id UNIQUEIDENTIFIER,
    scheduled_date   DATE,
    customer_id      UNIQUEIDENTIFIER NOT NULL,
    status           NVARCHAR(50) NOT NULL,
    notes            NVARCHAR(500),
    visit_order      INT,
    created_at       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2,
    created_by_id    UNIQUEIDENTIFIER,
    updated_by_id    UNIQUEIDENTIFIER,
    version          BIGINT DEFAULT 0,
    CONSTRAINT pk_pre_order PRIMARY KEY (id)
);

CREATE TABLE pre_order_item (
    id                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id          UNIQUEIDENTIFIER NOT NULL,
    pre_order_id       UNIQUEIDENTIFIER NOT NULL,
    item_id            UNIQUEIDENTIFIER NOT NULL,
    quantity_ordered   INT NOT NULL,
    quantity_confirmed INT NOT NULL,
    unit_price         DECIMAL(10,2),
    created_at         DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at         DATETIME2,
    created_by_id      UNIQUEIDENTIFIER,
    updated_by_id      UNIQUEIDENTIFIER,
    version            BIGINT DEFAULT 0,
    CONSTRAINT pk_pre_order_item PRIMARY KEY (id),
    CONSTRAINT fk_poi_order FOREIGN KEY (pre_order_id) REFERENCES pre_order(id)
);

CREATE TABLE product_batch (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    item_id       UNIQUEIDENTIFIER NOT NULL,
    batch_number  NVARCHAR(100) NOT NULL,
    expiry_date   DATE,
    quantity      INT NOT NULL,
    warehouse_id  UNIQUEIDENTIFIER,
    status        NVARCHAR(50) NOT NULL,
    notes         NVARCHAR(500),
    created_at    DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at    DATETIME2,
    created_by_id UNIQUEIDENTIFIER,
    updated_by_id UNIQUEIDENTIFIER,
    version       BIGINT DEFAULT 0,
    CONSTRAINT pk_product_batch PRIMARY KEY (id)
);

CREATE TABLE rep_objective (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    representative_id UNIQUEIDENTIFIER NOT NULL,
    year              INT NOT NULL,
    month             INT NOT NULL,
    revenue_target    DECIMAL(12,2) NOT NULL,
    visit_target      INT NOT NULL,
    delivery_target   INT NOT NULL,
    notes             NVARCHAR(500),
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_rep_objective PRIMARY KEY (id)
);

CREATE TABLE rep_location (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    representative_id UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id  UNIQUEIDENTIFIER,
    latitude          FLOAT NOT NULL,
    longitude         FLOAT NOT NULL,
    accuracy          FLOAT,
    recorded_at       DATETIME2 NOT NULL,
    event_type        NVARCHAR(50) NOT NULL,
    customer_id       UNIQUEIDENTIFIER,
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_rep_location PRIMARY KEY (id)
);

CREATE TABLE stock_replenishment (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id     UNIQUEIDENTIFIER NOT NULL,
    source_type   NVARCHAR(50) NOT NULL,
    source_id     UNIQUEIDENTIFIER NOT NULL,
    target_type   NVARCHAR(50) NOT NULL,
    target_id     UNIQUEIDENTIFIER NOT NULL,
    motive        NVARCHAR(100) NOT NULL,
    request_date  DATETIME2,
    status        NVARCHAR(50),
    approved_by   UNIQUEIDENTIFIER,
    approval_date DATETIME2,
    created_at    DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at    DATETIME2,
    created_by_id UNIQUEIDENTIFIER,
    updated_by_id UNIQUEIDENTIFIER,
    version       BIGINT DEFAULT 0,
    CONSTRAINT pk_stock_replenishment PRIMARY KEY (id)
);

CREATE TABLE stock_replenishment_item (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id        UNIQUEIDENTIFIER NOT NULL,
    replenishment_id UNIQUEIDENTIFIER NOT NULL,
    item_id          UNIQUEIDENTIFIER NOT NULL,
    quantity         INT NOT NULL,
    notes            NVARCHAR(255),
    created_at       DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2,
    created_by_id    UNIQUEIDENTIFIER,
    updated_by_id    UNIQUEIDENTIFIER,
    version          BIGINT DEFAULT 0,
    CONSTRAINT pk_stock_replenishment_item PRIMARY KEY (id),
    CONSTRAINT fk_sri_replenishment FOREIGN KEY (replenishment_id) REFERENCES stock_replenishment(id)
);

CREATE TABLE offline_sync_log (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    device_id         NVARCHAR(100),
    representative_id UNIQUEIDENTIFIER,
    action_type       NVARCHAR(100) NOT NULL,
    payload           NVARCHAR(MAX),
    sync_status       NVARCHAR(50) NOT NULL,
    synced_at         DATETIME2,
    error_message     NVARCHAR(500),
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_offline_sync_log PRIMARY KEY (id)
);

CREATE TABLE audit_trail (
    id             BIGINT IDENTITY(1,1) NOT NULL,
    tenant_id      UNIQUEIDENTIFIER NOT NULL,
    action         NVARCHAR(255) NOT NULL,
    entity_type    NVARCHAR(255) NOT NULL,
    entity_id      UNIQUEIDENTIFIER,
    who_user_id    UNIQUEIDENTIFIER,
    what_changed   NVARCHAR(500),
    when_date      DATETIME2 NOT NULL,
    where_location NVARCHAR(255),
    why_reason     NVARCHAR(255),
    CONSTRAINT pk_audit_trail PRIMARY KEY (id)
);

CREATE TABLE payment_instrument (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tenant_id         UNIQUEIDENTIFIER NOT NULL,
    delivery_line_id  UNIQUEIDENTIFIER NOT NULL,
    instrument_type   NVARCHAR(50) NOT NULL,
    instrument_number NVARCHAR(100) NOT NULL,
    bank_name         NVARCHAR(200),
    amount            DECIMAL(12,2) NOT NULL,
    due_date          DATE,
    encash_date       DATE,
    status            NVARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason  NVARCHAR(255),
    notes             NVARCHAR(500),
    created_at        DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2,
    created_by_id     UNIQUEIDENTIFIER,
    updated_by_id     UNIQUEIDENTIFIER,
    version           BIGINT DEFAULT 0,
    CONSTRAINT pk_payment_instrument PRIMARY KEY (id),
    CONSTRAINT fk_pi_delivery_line FOREIGN KEY (delivery_line_id) REFERENCES delivery_line(id)
);

-- =====================================================
-- SECTION 15: Indexes
-- =====================================================

-- Territories
CREATE INDEX idx_territories_parent ON territories(parent_territory_id);
CREATE INDEX idx_territories_country ON territories(country);

-- Teams
CREATE INDEX idx_teams_parent ON teams(parent_team_id);

-- Industries
CREATE INDEX idx_industries_code ON industries(code);
CREATE INDEX idx_industries_parent ON industries(parent_industry_id);

-- Opportunity stages
CREATE INDEX idx_opportunity_stages_order ON opportunity_stages(sort_order);

-- Warehouses
CREATE INDEX idx_warehouses_code ON warehouses(code);

-- Users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_territory ON users(territory_id);
CREATE INDEX idx_users_active ON users(is_active);

-- Refresh tokens
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Password reset tokens
CREATE INDEX idx_prt_token ON password_reset_tokens(token);
CREATE INDEX idx_prt_user_id ON password_reset_tokens(user_id);

-- User activities
CREATE INDEX idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX idx_user_activities_created_at ON user_activities(created_at DESC);

-- Push subscriptions
CREATE INDEX idx_push_subscriptions_user_id ON push_subscriptions(user_id);

-- Supervisor assignments
CREATE INDEX idx_sa_supervisor ON supervisor_assignments(supervisor_id) WHERE is_active = 1;
CREATE INDEX idx_sa_collaborator ON supervisor_assignments(collaborator_id) WHERE is_active = 1;

-- Accounts
CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_assigned ON accounts(assigned_to_id);
CREATE INDEX idx_accounts_territory ON accounts(territory_id);
CREATE INDEX idx_accounts_industry ON accounts(industry_id);
CREATE INDEX idx_accounts_siret ON accounts(siret);
CREATE INDEX idx_accounts_famille ON accounts(famille);
CREATE INDEX idx_accounts_type_compte_odyssee ON accounts(type_compte_odyssee);
CREATE INDEX idx_accounts_statut_compte ON accounts(statut_compte);
CREATE INDEX idx_accounts_potentiel ON accounts(potentiel);
CREATE INDEX idx_accounts_prefecture ON accounts(prefecture);
CREATE UNIQUE INDEX idx_accounts_sage_code ON accounts(sage_code) WHERE sage_code IS NOT NULL;
CREATE UNIQUE INDEX uq_accounts_code_client_crm ON accounts(code_client_crm) WHERE code_client_crm IS NOT NULL;

-- Account photos
CREATE INDEX idx_account_photos_account_id ON account_photos(account_id);

-- Custom field values
CREATE INDEX ix_cfv_account ON custom_field_values(account_id);
CREATE INDEX ix_cfv_field ON custom_field_values(field_id);

-- Contacts
CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_assigned ON contacts(assigned_to_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_name ON contacts(last_name, first_name);

-- Campaigns
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- Leads
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to_id);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_converted ON leads(is_converted);
CREATE INDEX idx_leads_meeting ON leads(meeting_scheduled_at) WHERE meeting_scheduled_at IS NOT NULL AND is_converted = 0;

-- Opportunities
CREATE INDEX idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX idx_opportunities_account ON opportunities(account_id);
CREATE INDEX idx_opportunities_assigned ON opportunities(assigned_to_id);
CREATE INDEX idx_opportunities_close_date ON opportunities(close_date);
CREATE INDEX idx_opportunities_closed ON opportunities(is_closed);
CREATE INDEX idx_opp_next_followup ON opportunities(next_followup_date) WHERE next_followup_date IS NOT NULL AND is_closed = 0;

-- Opportunity contacts
CREATE INDEX idx_opportunity_contacts_opp ON opportunity_contacts(opportunity_id);
CREATE INDEX idx_opportunity_contacts_contact ON opportunity_contacts(contact_id);

-- Product categories
CREATE INDEX idx_product_categories_parent ON product_categories(parent_category_id);
CREATE INDEX idx_product_categories_code ON product_categories(code);

-- Products
CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE UNIQUE INDEX idx_products_sage_code ON products(sage_code) WHERE sage_code IS NOT NULL;

-- Chantiers
CREATE INDEX idx_chantiers_assigned_to ON chantiers(assigned_to_id);
CREATE INDEX idx_chantiers_stade ON chantiers(stade_chantier);
CREATE INDEX idx_chantiers_statut ON chantiers(statut_chantier);
CREATE INDEX idx_chantiers_type_projet ON chantiers(type_projet);
CREATE INDEX idx_chantiers_prefecture ON chantiers(prefecture);
CREATE INDEX idx_chantiers_ville ON chantiers(ville);
CREATE INDEX idx_chantiers_account_id ON chantiers(account_id);
CREATE INDEX idx_chantiers_temoin ON chantiers(temoin) WHERE temoin = 1;
CREATE INDEX idx_chantier_acteurs_chantier ON chantier_acteurs(chantier_id);
CREATE INDEX idx_echantillon_chantier ON chantier_echantillons(chantier_id);

-- Quotes
CREATE INDEX idx_quotes_number ON quotes(quote_number);
CREATE INDEX idx_quotes_opportunity ON quotes(opportunity_id);
CREATE INDEX idx_quotes_account ON quotes(account_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_chantier_id ON quotes(chantier_id);

-- Quote lines
CREATE INDEX idx_quote_lines_quote ON quote_lines(quote_id);
CREATE INDEX idx_quote_lines_product ON quote_lines(product_id);

-- Sales orders
CREATE INDEX idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_account ON sales_orders(account_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);
CREATE INDEX idx_sales_orders_chantier ON sales_orders(chantier_id);

-- Sales order lines
CREATE INDEX idx_sol_order ON sales_order_lines(sales_order_id);

-- Invoices
CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_account ON invoices(account_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

-- Invoice lines
CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- Payments
CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_account ON payments(account_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Payment allocations
CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);

-- Stock
CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_warehouse ON stock_levels(warehouse_id);
CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

-- Activities
CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_related ON activities(related_to_type, related_to_id);
CREATE INDEX idx_activities_assigned ON activities(assigned_to_id);
CREATE INDEX idx_activities_dates ON activities(start_date, due_date);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activity_participants_activity ON activity_participants(activity_id);

-- Visits
CREATE INDEX idx_visits_assigned ON visits(assigned_to_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);
CREATE INDEX idx_visits_contact ON visits(contact_id);
CREATE INDEX idx_visits_account ON visits(account_id);
CREATE INDEX idx_visits_chantier ON visits(chantier_id);

-- Tours
CREATE INDEX idx_tours_assigned ON tours(assigned_to_id);
CREATE INDEX idx_tours_date ON tours(tour_date);
CREATE INDEX idx_tours_status ON tours(status);
CREATE INDEX idx_tour_visits_tour ON tour_visits(tour_id);

-- Expense reports
CREATE INDEX idx_expense_reports_tour ON expense_reports(tour_id);
CREATE INDEX idx_expense_reports_submitted_by ON expense_reports(submitted_by_id);
CREATE INDEX idx_expense_reports_status ON expense_reports(status);
CREATE INDEX idx_expense_reports_number ON expense_reports(report_number);
CREATE INDEX idx_expense_report_lines_report ON expense_report_lines(expense_report_id);

-- Commercial objectives
CREATE INDEX idx_obj_user ON commercial_objectives(user_id);
CREATE INDEX idx_obj_product ON commercial_objectives(product_id);
CREATE INDEX idx_obj_period ON commercial_objectives(period_year, period_month);

-- Sale entries
CREATE INDEX idx_sale_user ON sale_entries(user_id);
CREATE INDEX idx_sale_product ON sale_entries(product_id);
CREATE INDEX idx_sale_date ON sale_entries(sale_date);
CREATE INDEX idx_sale_user_date ON sale_entries(user_id, sale_date);

-- Ventes saisies
CREATE INDEX idx_vs_account ON ventes_saisies(account_id);
CREATE INDEX idx_vs_date ON ventes_saisies(date_vente);
CREATE INDEX idx_vs_statut ON ventes_saisies(statut);

-- Sales objections
CREATE INDEX idx_sales_objections_code ON sales_objections(code);
CREATE INDEX idx_sales_objections_status ON sales_objections(status);
CREATE INDEX idx_sales_objections_contact ON sales_objections(contact_id);
CREATE INDEX idx_sales_objections_account ON sales_objections(account_id);
CREATE INDEX idx_sales_objections_opportunity ON sales_objections(opportunity_id);
CREATE INDEX idx_sales_objections_assigned ON sales_objections(assigned_to_id);
CREATE INDEX idx_sales_objections_category ON sales_objections(category);

-- Objections
CREATE INDEX idx_objections_category ON objections(category_id);
CREATE INDEX idx_objection_responses_objection ON objection_responses(objection_id);
CREATE INDEX idx_opportunity_objections_opp ON opportunity_objections(opportunity_id);
CREATE INDEX idx_opportunity_objections_status ON opportunity_objections(status);

-- Email
CREATE INDEX idx_email_templates_category ON email_templates(category);
CREATE INDEX idx_email_logs_related ON email_logs(related_to_type, related_to_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at);

-- Audit logs
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- App settings
CREATE INDEX idx_app_settings_category ON app_settings(category);

-- Sage
CREATE INDEX idx_sage_sync_req_type ON sage_sync_requests(entity_type);
CREATE INDEX idx_sage_sync_req_status ON sage_sync_requests(status);
CREATE INDEX idx_sage_sync_req_date ON sage_sync_requests(created_at);
CREATE INDEX idx_sage_sync_items_req ON sage_sync_items(request_id);
CREATE INDEX idx_sage_sync_items_status ON sage_sync_items(status);
CREATE INDEX idx_sage_sync_items_ref ON sage_sync_items(sage_ref);
CREATE INDEX idx_bsa_account ON balance_agee_snapshots(account_id);
CREATE INDEX idx_bsa_request ON balance_agee_snapshots(sync_request_id);
CREATE INDEX idx_bsa_sage ON balance_agee_snapshots(sage_code);

-- Tickets
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_account ON tickets(account_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_ticket_comments_ticket ON ticket_comments(ticket_id);

-- Projects
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_account ON projects(account_id);
CREATE INDEX idx_projects_manager ON projects(manager_id);
CREATE INDEX idx_project_members_project ON project_members(project_id);
CREATE INDEX idx_project_members_user ON project_members(user_id);
CREATE INDEX idx_milestones_project ON milestones(project_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_milestone ON tasks(milestone_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);
CREATE INDEX idx_task_comments_task ON task_comments(task_id);

-- Workflows
CREATE INDEX idx_workflows_entity_type ON workflows(entity_type);
CREATE INDEX idx_workflows_trigger_type ON workflows(trigger_type);
CREATE INDEX idx_workflows_active ON workflows(is_active);
CREATE INDEX idx_workflow_steps_workflow ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_transitions_workflow ON workflow_transitions(workflow_id);
CREATE INDEX idx_workflow_transitions_from ON workflow_transitions(from_step_id);
CREATE INDEX idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX idx_workflow_executions_entity ON workflow_executions(entity_type, entity_id);
CREATE INDEX idx_workflow_executions_resume ON workflow_executions(status, resume_at);
CREATE INDEX idx_workflow_logs_execution ON workflow_execution_logs(execution_id);
CREATE INDEX idx_wf_templates_category ON workflow_templates(category);
CREATE INDEX idx_wf_templates_entity_type ON workflow_templates(entity_type);
CREATE INDEX idx_wf_templates_is_system ON workflow_templates(is_system);

-- Delivery module
CREATE INDEX idx_delivery_tour_date ON delivery_tour(tour_date);
CREATE INDEX idx_delivery_tour_status ON delivery_tour(status);
CREATE INDEX idx_delivery_tour_rep ON delivery_tour(representative_id);
CREATE INDEX idx_delivery_line_tour ON delivery_line(delivery_tour_id);
CREATE INDEX idx_delivery_line_customer ON delivery_line(customer_id);
CREATE INDEX idx_delivery_line_item ON delivery_line(item_id);
CREATE INDEX idx_vehicle_load_tour ON vehicle_load(delivery_tour_id);
CREATE INDEX idx_return_entry_tour ON return_entry(delivery_tour_id);
CREATE INDEX idx_settlement_report_tour ON settlement_report(delivery_tour_id);
CREATE INDEX idx_pre_order_customer ON pre_order(customer_id);
CREATE INDEX idx_pre_order_tour ON pre_order(delivery_tour_id);
CREATE INDEX idx_pre_order_item_order ON pre_order_item(pre_order_id);
CREATE INDEX idx_product_batch_item ON product_batch(item_id);
CREATE INDEX idx_rep_objective_rep ON rep_objective(representative_id);
CREATE INDEX idx_rep_location_rep ON rep_location(representative_id);
CREATE INDEX idx_rep_location_tour ON rep_location(delivery_tour_id);
CREATE INDEX idx_offline_sync_log_status ON offline_sync_log(sync_status);
CREATE INDEX idx_payment_instrument_line ON payment_instrument(delivery_line_id);
CREATE INDEX idx_payment_instrument_due ON payment_instrument(due_date);
CREATE INDEX idx_payment_instrument_status ON payment_instrument(status);
