SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- OptiCRM Initial Data
-- Version 2: Seed Data

-- =====================================================
-- Roles
-- =====================================================

INSERT INTO roles (id, name, description, permissions, is_system) VALUES
(NEWID(), 'SUPER_ADMIN', 'Super Administrator - Full access', '{
    "users": {"create": true, "read": true, "update": true, "delete": true},
    "roles": {"create": true, "read": true, "update": true, "delete": true},
    "teams": {"create": true, "read": true, "update": true, "delete": true},
    "territories": {"create": true, "read": true, "update": true, "delete": true},
    "contacts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
    "accounts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
    "leads": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true, "convert": true},
    "opportunities": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "quotes": {"create": true, "read": true, "update": true, "delete": true, "send": true, "export": true},
    "products": {"create": true, "read": true, "update": true, "delete": true},
    "stock": {"create": true, "read": true, "update": true, "delete": true},
    "invoices": {"create": true, "read": true, "update": true, "delete": true, "send": true},
    "payments": {"create": true, "read": true, "update": true, "delete": true},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "objections": {"create": true, "read": true, "update": true, "delete": true, "approve": true},
    "reports": {"create": true, "read": true, "export": true},
    "settings": {"read": true, "update": true}
}', 1),

(NEWID(), 'ADMIN', 'Administrator - User and configuration management', '{
    "users": {"create": true, "read": true, "update": true, "delete": false},
    "roles": {"read": true},
    "teams": {"create": true, "read": true, "update": true, "delete": true},
    "territories": {"create": true, "read": true, "update": true, "delete": true},
    "contacts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
    "accounts": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true},
    "leads": {"create": true, "read": true, "update": true, "delete": true, "export": true, "import": true, "convert": true},
    "opportunities": {"create": true, "read": true, "update": true, "delete": true, "export": true},
    "quotes": {"create": true, "read": true, "update": true, "delete": true, "send": true, "export": true},
    "products": {"create": true, "read": true, "update": true, "delete": true},
    "stock": {"create": true, "read": true, "update": true, "delete": true},
    "invoices": {"create": true, "read": true, "update": true, "delete": true, "send": true},
    "payments": {"create": true, "read": true, "update": true, "delete": true},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "objections": {"create": true, "read": true, "update": true, "delete": true, "approve": true},
    "reports": {"create": true, "read": true, "export": true},
    "settings": {"read": true, "update": true}
}', 1),

(NEWID(), 'MANAGER', 'Manager - Team oversight and reporting', '{
    "users": {"read": true},
    "teams": {"read": true},
    "territories": {"read": true},
    "contacts": {"create": true, "read": true, "update": true, "delete": false, "export": true},
    "accounts": {"create": true, "read": true, "update": true, "delete": false, "export": true},
    "leads": {"create": true, "read": true, "update": true, "delete": false, "export": true, "convert": true},
    "opportunities": {"create": true, "read": true, "update": true, "delete": false, "export": true},
    "quotes": {"create": true, "read": true, "update": true, "delete": false, "send": true, "export": true},
    "products": {"read": true},
    "stock": {"read": true},
    "invoices": {"create": true, "read": true, "update": true, "send": true},
    "payments": {"create": true, "read": true, "update": true},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "objections": {"create": true, "read": true, "update": true, "approve": true},
    "reports": {"read": true, "export": true}
}', 1),

(NEWID(), 'COMMERCIAL', 'Commercial - Standard CRM access', '{
    "contacts": {"create": true, "read": true, "update": true, "delete": false},
    "accounts": {"create": true, "read": true, "update": true, "delete": false},
    "leads": {"create": true, "read": true, "update": true, "delete": false, "convert": true},
    "opportunities": {"create": true, "read": true, "update": true, "delete": false},
    "quotes": {"create": true, "read": true, "update": true, "delete": false, "send": true},
    "products": {"read": true},
    "stock": {"read": true},
    "invoices": {"read": true},
    "payments": {"read": true},
    "activities": {"create": true, "read": true, "update": true, "delete": true},
    "objections": {"create": true, "read": true, "update": true},
    "reports": {"read": true}
}', 1),

(NEWID(), 'READ_ONLY', 'Read Only - View access only', '{
    "contacts": {"read": true},
    "accounts": {"read": true},
    "leads": {"read": true},
    "opportunities": {"read": true},
    "quotes": {"read": true},
    "products": {"read": true},
    "stock": {"read": true},
    "invoices": {"read": true},
    "payments": {"read": true},
    "activities": {"read": true},
    "objections": {"read": true},
    "reports": {"read": true}
}', 1);

-- =====================================================
-- Opportunity Stages
-- =====================================================

INSERT INTO opportunity_stages (id, name, code, probability, sort_order, is_closed, is_won, color) VALUES
(NEWID(), 'Prospection', 'prospecting', 10, 1, 0, 0, '#3498db'),
(NEWID(), 'Qualification', 'qualification', 20, 2, 0, 0, '#9b59b6'),
(NEWID(), 'Analyse des besoins', 'needs_analysis', 40, 3, 0, 0, '#1abc9c'),
(NEWID(), 'Proposition', 'proposal', 60, 4, 0, 0, '#f39c12'),
(NEWID(), 'Négociation', 'negotiation', 80, 5, 0, 0, '#e67e22'),
(NEWID(), 'Gagné', 'closed_won', 100, 6, 1, 1, '#27ae60'),
(NEWID(), 'Perdu', 'closed_lost', 0, 7, 1, 0, '#e74c3c');

-- =====================================================
-- Payment Terms
-- =====================================================

INSERT INTO payment_terms (id, code, name, days, is_default) VALUES
(NEWID(), 'IMMEDIATE', 'Paiement immédiat', 0, 0),
(NEWID(), 'NET15', 'Net 15 jours', 15, 0),
(NEWID(), 'NET30', 'Net 30 jours', 30, 1),
(NEWID(), 'NET45', 'Net 45 jours', 45, 0),
(NEWID(), 'NET60', 'Net 60 jours', 60, 0),
(NEWID(), 'END_MONTH', 'Fin de mois', 30, 0),
(NEWID(), 'END_MONTH_45', 'Fin de mois + 45 jours', 45, 0);

-- =====================================================
-- Tax Rates
-- =====================================================

INSERT INTO tax_rates (id, code, name, rate, is_default, is_active) VALUES
(NEWID(), 'TVA20', 'TVA 20%', 20.00, 1, 1),
(NEWID(), 'TVA10', 'TVA 10%', 10.00, 0, 1),
(NEWID(), 'TVA5.5', 'TVA 5.5%', 5.50, 0, 1),
(NEWID(), 'TVA2.1', 'TVA 2.1%', 2.10, 0, 1),
(NEWID(), 'EXONERE', 'Exonéré de TVA', 0.00, 0, 1);

-- =====================================================
-- Industries
-- =====================================================

INSERT INTO industries (id, code, name, parent_industry_id) VALUES
(NEWID(), 'TECH', 'Technologie', NULL),
(NEWID(), 'FINANCE', 'Finance & Banque', NULL),
(NEWID(), 'SANTE', 'Santé', NULL),
(NEWID(), 'RETAIL', 'Commerce de détail', NULL),
(NEWID(), 'INDUSTRIE', 'Industrie manufacturière', NULL),
(NEWID(), 'SERVICES', 'Services aux entreprises', NULL),
(NEWID(), 'IMMOBILIER', 'Immobilier', NULL),
(NEWID(), 'TRANSPORT', 'Transport & Logistique', NULL),
(NEWID(), 'ENERGIE', 'Énergie', NULL),
(NEWID(), 'TELECOM', 'Télécommunications', NULL),
(NEWID(), 'MEDIA', 'Média & Communication', NULL),
(NEWID(), 'EDUCATION', 'Éducation & Formation', NULL),
(NEWID(), 'AGRO', 'Agriculture & Agroalimentaire', NULL),
(NEWID(), 'CONSTRUCTION', 'Construction & BTP', NULL),
(NEWID(), 'TOURISME', 'Tourisme & Hôtellerie', NULL);

-- =====================================================
-- Objection Categories
-- =====================================================

INSERT INTO objection_categories (id, name, description, color, sort_order, is_active) VALUES
(NEWID(), 'Prix', 'Objections relatives au prix et au budget', '#e74c3c', 1, 1),
(NEWID(), 'Produit', 'Objections sur les caractéristiques du produit/service', '#3498db', 2, 1),
(NEWID(), 'Timing', 'Objections liées au calendrier et aux délais', '#f39c12', 3, 1),
(NEWID(), 'Concurrence', 'Comparaisons avec la concurrence', '#9b59b6', 4, 1),
(NEWID(), 'Confiance', 'Objections sur la crédibilité et la confiance', '#1abc9c', 5, 1),
(NEWID(), 'Besoin', 'Remise en question du besoin', '#34495e', 6, 1),
(NEWID(), 'Autorité', 'Processus de décision et autorité', '#e67e22', 7, 1);

-- =====================================================
-- Default Warehouse
-- =====================================================

INSERT INTO warehouses (id, code, name, is_default, is_active) VALUES
(NEWID(), 'MAIN', 'Entrepôt principal', 1, 1);

-- =====================================================
-- Default Admin User (password: Admin123!)
-- =====================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active)
SELECT
    NEWID(),
    'admin@opticrm.com',
    '$2a$10$eone.sEAqB7BnZ1erdDgouhdxMuYKztnnmUrbXtfr12xffsmNxd6e',
    'Admin',
    'OptiCRM',
    r.id,
    1
FROM roles r WHERE r.name = 'SUPER_ADMIN';