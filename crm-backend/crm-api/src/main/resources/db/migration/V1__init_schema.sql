SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- OptiCRM Database Schema
-- Version 1: Initial Schema


-- =====================================================
-- MODULE: Authentication & Administration
-- =====================================================

-- Roles table
CREATE TABLE roles (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(50) UNIQUE NOT NULL,
    description NVARCHAR(MAX),
    permissions NVARCHAR(MAX) NOT NULL DEFAULT '{}',
    is_system BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Territories table
CREATE TABLE territories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    region NVARCHAR(100),
    country NVARCHAR(100),
    postal_codes NVARCHAR(MAX),
    parent_territory_id UNIQUEIDENTIFIER REFERENCES territories(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_territories_parent ON territories(parent_territory_id);
CREATE INDEX idx_territories_country ON territories(country);

-- Teams table (forward declaration for users)
CREATE TABLE teams (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    manager_id UNIQUEIDENTIFIER, -- Will add FK after users table
    parent_team_id UNIQUEIDENTIFIER REFERENCES teams(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_teams_parent ON teams(parent_team_id);

-- Users table
CREATE TABLE users (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    email NVARCHAR(255) UNIQUE NOT NULL,
    password_hash NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    phone NVARCHAR(20),
    avatar_url NVARCHAR(500),
    role_id UNIQUEIDENTIFIER REFERENCES roles(id),
    team_id UNIQUEIDENTIFIER REFERENCES teams(id),
    territory_id UNIQUEIDENTIFIER REFERENCES territories(id),
    is_active BIT DEFAULT 1,
    last_login_at DATETIME2,
    password_changed_at DATETIME2,
    failed_login_attempts INT DEFAULT 0,
    locked_until DATETIME2,
    preferred_language NVARCHAR(10) DEFAULT 'fr',
    timezone NVARCHAR(50) DEFAULT 'Europe/Paris',
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    version BIGINT DEFAULT 0
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_team ON users(team_id);
CREATE INDEX idx_users_territory ON users(territory_id);
CREATE INDEX idx_users_active ON users(is_active);

-- Add FK from teams to users for manager
ALTER TABLE teams ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_id) REFERENCES users(id);

-- Refresh tokens table
CREATE TABLE refresh_tokens (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    token NVARCHAR(255) UNIQUE NOT NULL,
    user_id UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at DATETIME2 NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    revoked_at DATETIME2,
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(MAX)
);

CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- =====================================================
-- MODULE: Industries
-- =====================================================

CREATE TABLE industries (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(20) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    parent_industry_id UNIQUEIDENTIFIER REFERENCES industries(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_industries_code ON industries(code);
CREATE INDEX idx_industries_parent ON industries(parent_industry_id);

-- =====================================================
-- MODULE: Payment Terms & Tax Rates
-- =====================================================

CREATE TABLE payment_terms (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(20) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    days INT NOT NULL,
    description NVARCHAR(MAX),
    is_default BIT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE tax_rates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(20) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    rate DECIMAL(5, 2) NOT NULL,
    is_default BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =====================================================
-- MODULE: Accounts (Companies)
-- =====================================================

CREATE TABLE accounts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    legal_name NVARCHAR(255),
    siret NVARCHAR(14),
    siren NVARCHAR(9),
    vat_number NVARCHAR(20),
    account_type NVARCHAR(50) NOT NULL,
    industry_id UNIQUEIDENTIFIER REFERENCES industries(id),
    employee_count INT,
    annual_revenue DECIMAL(15, 2),
    revenue_currency NVARCHAR(3) DEFAULT 'EUR',
    billing_street NVARCHAR(255),
    billing_city NVARCHAR(100),
    billing_state NVARCHAR(100),
    billing_postal_code NVARCHAR(20),
    billing_country NVARCHAR(100),
    shipping_street NVARCHAR(255),
    shipping_city NVARCHAR(100),
    shipping_state NVARCHAR(100),
    shipping_postal_code NVARCHAR(20),
    shipping_country NVARCHAR(100),
    website NVARCHAR(255),
    phone NVARCHAR(20),
    fax NVARCHAR(20),
    account_score INT DEFAULT 0,
    segment NVARCHAR(50),
    tags NVARCHAR(MAX),
    credit_limit DECIMAL(15, 2) DEFAULT 0,
    payment_terms_id UNIQUEIDENTIFIER REFERENCES payment_terms(id),
    parent_account_id UNIQUEIDENTIFIER REFERENCES accounts(id),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    territory_id UNIQUEIDENTIFIER REFERENCES territories(id),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    search_vector NVARCHAR(MAX)
);

CREATE INDEX idx_accounts_name ON accounts(name);
CREATE INDEX idx_accounts_type ON accounts(account_type);
CREATE INDEX idx_accounts_assigned ON accounts(assigned_to_id);
CREATE INDEX idx_accounts_territory ON accounts(territory_id);
CREATE INDEX idx_accounts_industry ON accounts(industry_id);
CREATE INDEX idx_accounts_siret ON accounts(siret);

-- =====================================================
-- MODULE: Contacts
-- =====================================================

CREATE TABLE contacts (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    salutation NVARCHAR(20),
    first_name NVARCHAR(100) NOT NULL,
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255),
    phone_mobile NVARCHAR(20),
    phone_office NVARCHAR(20),
    job_title NVARCHAR(100),
    department NVARCHAR(100),
    address_street NVARCHAR(255),
    address_city NVARCHAR(100),
    address_state NVARCHAR(100),
    address_postal_code NVARCHAR(20),
    address_country NVARCHAR(100),
    linkedin_url NVARCHAR(255),
    twitter_handle NVARCHAR(100),
    date_of_birth DATE,
    preferred_language NVARCHAR(10) DEFAULT 'fr',
    do_not_call BIT DEFAULT 0,
    do_not_email BIT DEFAULT 0,
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id),
    contact_role NVARCHAR(50),
    reports_to_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    search_vector NVARCHAR(MAX)
);

CREATE INDEX idx_contacts_account ON contacts(account_id);
CREATE INDEX idx_contacts_assigned ON contacts(assigned_to_id);
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_name ON contacts(last_name, first_name);

-- =====================================================
-- MODULE: Campaigns
-- =====================================================

CREATE TABLE campaigns (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    type NVARCHAR(50),
    status NVARCHAR(50) DEFAULT 'draft',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2),
    actual_cost DECIMAL(15, 2),
    expected_revenue DECIMAL(15, 2),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_dates ON campaigns(start_date, end_date);

-- =====================================================
-- MODULE: Leads
-- =====================================================

CREATE TABLE leads (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    salutation NVARCHAR(20),
    first_name NVARCHAR(100),
    last_name NVARCHAR(100) NOT NULL,
    email NVARCHAR(255),
    phone NVARCHAR(20),
    mobile NVARCHAR(20),
    company_name NVARCHAR(255),
    job_title NVARCHAR(100),
    website NVARCHAR(255),
    street NVARCHAR(255),
    city NVARCHAR(100),
    state NVARCHAR(100),
    postal_code NVARCHAR(20),
    country NVARCHAR(100),
    status NVARCHAR(50) NOT NULL DEFAULT 'new',
    source NVARCHAR(50),
    source_details NVARCHAR(255),
    rating NVARCHAR(20),
    lead_score INT DEFAULT 0,
    interested_products NVARCHAR(MAX),
    budget_range NVARCHAR(50),
    decision_timeframe NVARCHAR(50),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    territory_id UNIQUEIDENTIFIER REFERENCES territories(id),
    campaign_id UNIQUEIDENTIFIER REFERENCES campaigns(id),
    is_converted BIT DEFAULT 0,
    converted_at DATETIME2,
    converted_contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    converted_account_id UNIQUEIDENTIFIER REFERENCES accounts(id),
    converted_opportunity_id UNIQUEIDENTIFIER,
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    last_activity_at DATETIME2,
    search_vector NVARCHAR(MAX)
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_assigned ON leads(assigned_to_id);
CREATE INDEX idx_leads_campaign ON leads(campaign_id);
CREATE INDEX idx_leads_converted ON leads(is_converted);

-- =====================================================
-- MODULE: Opportunity Stages
-- =====================================================

CREATE TABLE opportunity_stages (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    code NVARCHAR(50) UNIQUE NOT NULL,
    probability INT DEFAULT 0,
    sort_order INT NOT NULL,
    is_closed BIT DEFAULT 0,
    is_won BIT DEFAULT 0,
    color NVARCHAR(7),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_opportunity_stages_order ON opportunity_stages(sort_order);

-- =====================================================
-- MODULE: Competitors
-- =====================================================

CREATE TABLE competitors (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    website NVARCHAR(255),
    description NVARCHAR(MAX),
    strengths NVARCHAR(MAX),
    weaknesses NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

-- =====================================================
-- MODULE: Opportunities
-- =====================================================

CREATE TABLE opportunities (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2),
    currency NVARCHAR(3) DEFAULT 'EUR',
    probability INT DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    weighted_amount AS (amount * probability / 100) PERSISTED,
    stage_id UNIQUEIDENTIFIER REFERENCES opportunity_stages(id) NOT NULL,
    stage_changed_at DATETIME2,
    close_date DATE,
    actual_close_date DATE,
    type NVARCHAR(50),
    lead_source NVARCHAR(50),
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    primary_contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    lead_id UNIQUEIDENTIFIER REFERENCES leads(id),
    campaign_id UNIQUEIDENTIFIER REFERENCES campaigns(id),
    is_won BIT,
    is_closed BIT DEFAULT 0,
    close_reason NVARCHAR(100),
    competitor_id UNIQUEIDENTIFIER REFERENCES competitors(id),
    description NVARCHAR(MAX),
    next_step NVARCHAR(MAX),
    tags NVARCHAR(MAX),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    search_vector NVARCHAR(MAX)
);

CREATE INDEX idx_opportunities_stage ON opportunities(stage_id);
CREATE INDEX idx_opportunities_account ON opportunities(account_id);
CREATE INDEX idx_opportunities_assigned ON opportunities(assigned_to_id);
CREATE INDEX idx_opportunities_close_date ON opportunities(close_date);
CREATE INDEX idx_opportunities_closed ON opportunities(is_closed);

-- Add FK from leads to opportunities
ALTER TABLE leads ADD CONSTRAINT fk_leads_converted_opportunity
    FOREIGN KEY (converted_opportunity_id) REFERENCES opportunities(id);

-- Opportunity contacts (many-to-many with roles)
CREATE TABLE opportunity_contacts (
    opportunity_id UNIQUEIDENTIFIER REFERENCES opportunities(id) ON DELETE CASCADE,
    contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    role NVARCHAR(50),
    is_primary BIT DEFAULT 0,
    PRIMARY KEY (opportunity_id, contact_id)
);

CREATE INDEX idx_opportunity_contacts_opp ON opportunity_contacts(opportunity_id);
CREATE INDEX idx_opportunity_contacts_contact ON opportunity_contacts(contact_id);

-- =====================================================
-- MODULE: Products & Categories
-- =====================================================

CREATE TABLE product_categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    parent_category_id UNIQUEIDENTIFIER REFERENCES product_categories(id),
    sort_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_product_categories_parent ON product_categories(parent_category_id);
CREATE INDEX idx_product_categories_code ON product_categories(code);

CREATE TABLE products (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    category_id UNIQUEIDENTIFIER REFERENCES product_categories(id),
    brand NVARCHAR(100),
    unit_price DECIMAL(15, 2) NOT NULL,
    cost_price DECIMAL(15, 2),
    currency NVARCHAR(3) DEFAULT 'EUR',
    unit_of_measure NVARCHAR(20) DEFAULT 'unité',
    is_stockable BIT DEFAULT 1,
    min_stock_level DECIMAL(15, 3) DEFAULT 0,
    reorder_level DECIMAL(15, 3) DEFAULT 0,
    default_tax_rate_id UNIQUEIDENTIFIER REFERENCES tax_rates(id),
    is_active BIT DEFAULT 1,
    is_sellable BIT DEFAULT 1,
    is_purchasable BIT DEFAULT 1,
    image_url NVARCHAR(500),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    search_vector NVARCHAR(MAX)
);

CREATE INDEX idx_products_code ON products(code);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);

-- =====================================================
-- MODULE: Quotes
-- =====================================================

CREATE TABLE quotes (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    quote_number NVARCHAR(50) UNIQUE NOT NULL,
    opportunity_id UNIQUEIDENTIFIER REFERENCES opportunities(id),
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    version INT DEFAULT 1,
    parent_quote_id UNIQUEIDENTIFIER REFERENCES quotes(id),
    quote_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    valid_until DATE,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_type NVARCHAR(20),
    discount_value DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,
    currency NVARCHAR(3) DEFAULT 'EUR',
    billing_street NVARCHAR(255),
    billing_city NVARCHAR(100),
    billing_state NVARCHAR(100),
    billing_postal_code NVARCHAR(20),
    billing_country NVARCHAR(100),
    shipping_street NVARCHAR(255),
    shipping_city NVARCHAR(100),
    shipping_state NVARCHAR(100),
    shipping_postal_code NVARCHAR(20),
    shipping_country NVARCHAR(100),
    payment_terms_id UNIQUEIDENTIFIER REFERENCES payment_terms(id),
    delivery_terms NVARCHAR(MAX),
    notes NVARCHAR(MAX),
    terms_and_conditions NVARCHAR(MAX),
    signed_at DATETIME2,
    signed_by NVARCHAR(255),
    signature_ip NVARCHAR(45),
    pdf_url NVARCHAR(500),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_quotes_number ON quotes(quote_number);
CREATE INDEX idx_quotes_opportunity ON quotes(opportunity_id);
CREATE INDEX idx_quotes_account ON quotes(account_id);
CREATE INDEX idx_quotes_status ON quotes(status);

CREATE TABLE quote_lines (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    quote_id UNIQUEIDENTIFIER REFERENCES quotes(id) ON DELETE CASCADE,
    product_id UNIQUEIDENTIFIER REFERENCES products(id),
    product_code NVARCHAR(50),
    product_name NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    quantity DECIMAL(15, 3) NOT NULL DEFAULT 1,
    unit_price DECIMAL(15, 2) NOT NULL,
    unit_of_measure NVARCHAR(20),
    discount_type NVARCHAR(20),
    discount_value DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    subtotal AS (quantity * unit_price) PERSISTED,
    total DECIMAL(15, 2),
    tax_rate_id UNIQUEIDENTIFIER REFERENCES tax_rates(id),
    tax_rate DECIMAL(5, 2),
    tax_amount DECIMAL(15, 2),
    stock_available DECIMAL(15, 3),
    stock_status NVARCHAR(20),
    sort_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_quote_lines_quote ON quote_lines(quote_id);
CREATE INDEX idx_quote_lines_product ON quote_lines(product_id);

-- =====================================================
-- MODULE: Stock Management
-- =====================================================

CREATE TABLE warehouses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(20) UNIQUE NOT NULL,
    name NVARCHAR(100) NOT NULL,
    address_street NVARCHAR(255),
    address_city NVARCHAR(100),
    address_postal_code NVARCHAR(20),
    address_country NVARCHAR(100),
    is_default BIT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_warehouses_code ON warehouses(code);

CREATE TABLE stock_levels (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER REFERENCES products(id) NOT NULL,
    warehouse_id UNIQUEIDENTIFIER REFERENCES warehouses(id) NOT NULL,
    quantity_on_hand DECIMAL(15, 3) DEFAULT 0,
    quantity_reserved DECIMAL(15, 3) DEFAULT 0,
    quantity_available AS (quantity_on_hand - quantity_reserved) PERSISTED,
    quantity_on_order DECIMAL(15, 3) DEFAULT 0,
    average_cost DECIMAL(15, 2) DEFAULT 0,
    total_value AS (quantity_on_hand * average_cost) PERSISTED,
    last_count_date DATE,
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(product_id, warehouse_id)
);

CREATE INDEX idx_stock_levels_product ON stock_levels(product_id);
CREATE INDEX idx_stock_levels_warehouse ON stock_levels(warehouse_id);

CREATE TABLE stock_movements (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    product_id UNIQUEIDENTIFIER REFERENCES products(id) NOT NULL,
    warehouse_id UNIQUEIDENTIFIER REFERENCES warehouses(id) NOT NULL,
    movement_type NVARCHAR(50) NOT NULL,
    quantity DECIMAL(15, 3) NOT NULL,
    unit_cost DECIMAL(15, 2),
    reference_type NVARCHAR(50),
    reference_id UNIQUEIDENTIFIER,
    quantity_after DECIMAL(15, 3),
    notes NVARCHAR(MAX),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_type ON stock_movements(movement_type);

-- =====================================================
-- MODULE: Sales Orders
-- =====================================================

CREATE TABLE sales_orders (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    order_number NVARCHAR(50) UNIQUE NOT NULL,
    quote_id UNIQUEIDENTIFIER REFERENCES quotes(id),
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    order_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    expected_delivery_date DATE,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,
    currency NVARCHAR(3) DEFAULT 'EUR',
    shipping_street NVARCHAR(255),
    shipping_city NVARCHAR(100),
    shipping_state NVARCHAR(100),
    shipping_postal_code NVARCHAR(20),
    shipping_country NVARCHAR(100),
    notes NVARCHAR(MAX),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_sales_orders_number ON sales_orders(order_number);
CREATE INDEX idx_sales_orders_account ON sales_orders(account_id);
CREATE INDEX idx_sales_orders_status ON sales_orders(status);

-- =====================================================
-- MODULE: Invoices & Payments
-- =====================================================

CREATE TABLE invoices (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_number NVARCHAR(50) UNIQUE NOT NULL,
    invoice_type NVARCHAR(20) NOT NULL DEFAULT 'invoice',
    status NVARCHAR(50) NOT NULL DEFAULT 'draft',
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    quote_id UNIQUEIDENTIFIER REFERENCES quotes(id),
    order_id UNIQUEIDENTIFIER REFERENCES sales_orders(id),
    invoice_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    due_date DATE NOT NULL,
    subtotal DECIMAL(15, 2) DEFAULT 0,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    total DECIMAL(15, 2) DEFAULT 0,
    amount_paid DECIMAL(15, 2) DEFAULT 0,
    amount_due AS (total - amount_paid) PERSISTED,
    currency NVARCHAR(3) DEFAULT 'EUR',
    billing_name NVARCHAR(255),
    billing_street NVARCHAR(255),
    billing_city NVARCHAR(100),
    billing_state NVARCHAR(100),
    billing_postal_code NVARCHAR(20),
    billing_country NVARCHAR(100),
    payment_terms_id UNIQUEIDENTIFIER REFERENCES payment_terms(id),
    notes NVARCHAR(MAX),
    pdf_url NVARCHAR(500),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    sent_at DATETIME2,
    paid_at DATETIME2
);

CREATE INDEX idx_invoices_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_account ON invoices(account_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);

CREATE TABLE invoice_lines (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    invoice_id UNIQUEIDENTIFIER REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UNIQUEIDENTIFIER REFERENCES products(id),
    product_code NVARCHAR(50),
    description NVARCHAR(255) NOT NULL,
    quantity DECIMAL(15, 3) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    discount_amount DECIMAL(15, 2) DEFAULT 0,
    tax_rate DECIMAL(5, 2),
    tax_amount DECIMAL(15, 2),
    total DECIMAL(15, 2),
    sort_order INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_invoice_lines_invoice ON invoice_lines(invoice_id);

CREATE TABLE payments (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_number NVARCHAR(50) UNIQUE NOT NULL,
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    amount DECIMAL(15, 2) NOT NULL,
    currency NVARCHAR(3) DEFAULT 'EUR',
    payment_method NVARCHAR(50),
    reference NVARCHAR(100),
    bank_account NVARCHAR(100),
    status NVARCHAR(50) DEFAULT 'received',
    notes NVARCHAR(MAX),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_account ON payments(account_id);
CREATE INDEX idx_payments_date ON payments(payment_date);

CREATE TABLE payment_allocations (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    payment_id UNIQUEIDENTIFIER REFERENCES payments(id) ON DELETE CASCADE,
    invoice_id UNIQUEIDENTIFIER REFERENCES invoices(id),
    amount DECIMAL(15, 2) NOT NULL,
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE(payment_id, invoice_id)
);

CREATE INDEX idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice ON payment_allocations(invoice_id);

-- =====================================================
-- MODULE: Activities
-- =====================================================

CREATE TABLE activities (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    activity_type NVARCHAR(50) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    description NVARCHAR(MAX),
    start_date DATETIME2,
    end_date DATETIME2,
    due_date DATETIME2,
    completed_at DATETIME2,
    duration INT,
    location NVARCHAR(255),
    location_type NVARCHAR(50),
    status NVARCHAR(50) DEFAULT 'planned',
    priority NVARCHAR(20) DEFAULT 'normal',
    related_to_type NVARCHAR(50),
    related_to_id UNIQUEIDENTIFIER,
    call_direction NVARCHAR(20),
    call_result NVARCHAR(50),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    is_recurring BIT DEFAULT 0,
    recurrence_rule NVARCHAR(MAX),
    parent_activity_id UNIQUEIDENTIFIER REFERENCES activities(id),
    reminder_at DATETIME2,
    reminder_sent BIT DEFAULT 0,
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_activities_type ON activities(activity_type);
CREATE INDEX idx_activities_related ON activities(related_to_type, related_to_id);
CREATE INDEX idx_activities_assigned ON activities(assigned_to_id);
CREATE INDEX idx_activities_dates ON activities(start_date, due_date);
CREATE INDEX idx_activities_status ON activities(status);

CREATE TABLE activity_participants (
    activity_id UNIQUEIDENTIFIER REFERENCES activities(id) ON DELETE CASCADE,
    participant_type NVARCHAR(50),
    participant_id UNIQUEIDENTIFIER,
    status NVARCHAR(50) DEFAULT 'invited',
    PRIMARY KEY (activity_id, participant_type, participant_id)
);

CREATE INDEX idx_activity_participants_activity ON activity_participants(activity_id);

-- =====================================================
-- MODULE: Objections
-- =====================================================

CREATE TABLE objection_categories (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(MAX),
    color NVARCHAR(7),
    sort_order INT DEFAULT 0,
    is_active BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE TABLE objections (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    category_id UNIQUEIDENTIFIER REFERENCES objection_categories(id),
    objection_text NVARCHAR(MAX) NOT NULL,
    variants NVARCHAR(MAX),
    severity NVARCHAR(20) DEFAULT 'important',
    frequency_score INT DEFAULT 0,
    related_products NVARCHAR(MAX),
    related_industries NVARCHAR(MAX),
    is_active BIT DEFAULT 1,
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    search_vector NVARCHAR(MAX)
);

CREATE INDEX idx_objections_category ON objections(category_id);

CREATE TABLE objection_responses (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    objection_id UNIQUEIDENTIFIER REFERENCES objections(id) ON DELETE CASCADE,
    response_type NVARCHAR(50) NOT NULL,
    response_text NVARCHAR(MAX) NOT NULL,
    success_rate DECIMAL(5, 2),
    usage_count INT DEFAULT 0,
    success_count INT DEFAULT 0,
    attachments NVARCHAR(MAX),
    is_approved BIT DEFAULT 0,
    approved_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    approved_at DATETIME2,
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_objection_responses_objection ON objection_responses(objection_id);

CREATE TABLE opportunity_objections (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    opportunity_id UNIQUEIDENTIFIER REFERENCES opportunities(id) ON DELETE CASCADE,
    objection_id UNIQUEIDENTIFIER REFERENCES objections(id),
    custom_objection_text NVARCHAR(MAX),
    response_id UNIQUEIDENTIFIER REFERENCES objection_responses(id),
    custom_response_text NVARCHAR(MAX),
    objection_date DATE NOT NULL DEFAULT CAST(GETDATE() AS DATE),
    context NVARCHAR(MAX),
    status NVARCHAR(50) NOT NULL DEFAULT 'open',
    resolved_at DATETIME2,
    notes NVARCHAR(MAX),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_opportunity_objections_opp ON opportunity_objections(opportunity_id);
CREATE INDEX idx_opportunity_objections_status ON opportunity_objections(status);

-- =====================================================
-- MODULE: Email Templates & Logs
-- =====================================================

CREATE TABLE email_templates (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    name NVARCHAR(100) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    body_html NVARCHAR(MAX) NOT NULL,
    body_text NVARCHAR(MAX),
    category NVARCHAR(50),
    available_variables NVARCHAR(MAX),
    usage_count INT DEFAULT 0,
    open_rate DECIMAL(5, 2),
    click_rate DECIMAL(5, 2),
    is_active BIT DEFAULT 1,
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_email_templates_category ON email_templates(category);

CREATE TABLE email_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    to_email NVARCHAR(255) NOT NULL,
    to_name NVARCHAR(255),
    cc_emails NVARCHAR(MAX),
    bcc_emails NVARCHAR(MAX),
    subject NVARCHAR(255) NOT NULL,
    body_html NVARCHAR(MAX),
    template_id UNIQUEIDENTIFIER REFERENCES email_templates(id),
    related_to_type NVARCHAR(50),
    related_to_id UNIQUEIDENTIFIER,
    status NVARCHAR(50) DEFAULT 'pending',
    sent_at DATETIME2,
    delivered_at DATETIME2,
    opened_at DATETIME2,
    opened_count INT DEFAULT 0,
    clicked_at DATETIME2,
    clicked_links NVARCHAR(MAX),
    error_message NVARCHAR(MAX),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_email_logs_related ON email_logs(related_to_type, related_to_id);
CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_sent ON email_logs(sent_at);

-- =====================================================
-- MODULE: Audit Logs
-- =====================================================

CREATE TABLE audit_logs (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    entity_type NVARCHAR(50) NOT NULL,
    entity_id UNIQUEIDENTIFIER NOT NULL,
    action NVARCHAR(50) NOT NULL,
    old_values NVARCHAR(MAX),
    new_values NVARCHAR(MAX),
    changed_fields NVARCHAR(MAX),
    ip_address NVARCHAR(45),
    user_agent NVARCHAR(MAX),
    user_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);