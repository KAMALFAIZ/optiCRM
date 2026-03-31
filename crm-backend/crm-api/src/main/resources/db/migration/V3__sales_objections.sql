SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- MODULE: Sales Objections (Commercial Objection Tracking)
-- =====================================================

IF OBJECT_ID('sales_objections', 'U') IS NULL
BEGIN
CREATE TABLE sales_objections (
    id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    code NVARCHAR(20) UNIQUE NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    category NVARCHAR(50),
    response NVARCHAR(MAX),
    contact_id UNIQUEIDENTIFIER REFERENCES contacts(id),
    account_id UNIQUEIDENTIFIER REFERENCES accounts(id),
    opportunity_id UNIQUEIDENTIFIER REFERENCES opportunities(id),
    status NVARCHAR(50) DEFAULT 'OPEN',
    priority NVARCHAR(20) DEFAULT 'MEDIUM',
    source NVARCHAR(50),
    created_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    assigned_to_id UNIQUEIDENTIFIER REFERENCES users(id),
    resolved_at DATETIME2,
    resolved_by_id UNIQUEIDENTIFIER REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE()
)
END

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_objections_code' AND object_id = OBJECT_ID('sales_objections'))
    CREATE INDEX idx_sales_objections_code ON sales_objections(code);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_objections_status' AND object_id = OBJECT_ID('sales_objections'))
    CREATE INDEX idx_sales_objections_status ON sales_objections(status);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_objections_contact' AND object_id = OBJECT_ID('sales_objections'))
    CREATE INDEX idx_sales_objections_contact ON sales_objections(contact_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_objections_account' AND object_id = OBJECT_ID('sales_objections'))
    CREATE INDEX idx_sales_objections_account ON sales_objections(account_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_objections_opportunity' AND object_id = OBJECT_ID('sales_objections'))
    CREATE INDEX idx_sales_objections_opportunity ON sales_objections(opportunity_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_objections_assigned' AND object_id = OBJECT_ID('sales_objections'))
    CREATE INDEX idx_sales_objections_assigned ON sales_objections(assigned_to_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_objections_category' AND object_id = OBJECT_ID('sales_objections'))
    CREATE INDEX idx_sales_objections_category ON sales_objections(category);

-- Comments (informational only)
-- Table des objections commerciales (tracking)
-- code: Code unique de l'objection (ex: OBJ-00001)
-- title: Titre/résumé de l'objection
-- description: Description détaillée de l'objection
-- category: Catégorie: PRICE, QUALITY, DELIVERY, COMPETITION, TIMING, OTHER
-- response: Réponse ou solution proposée
-- status: Statut: OPEN, IN_PROGRESS, RESOLVED, CLOSED, ESCALATED
-- priority: Priorité: LOW, MEDIUM, HIGH, URGENT
-- source: Source: PHONE, EMAIL, MEETING, DEMO, OTHER