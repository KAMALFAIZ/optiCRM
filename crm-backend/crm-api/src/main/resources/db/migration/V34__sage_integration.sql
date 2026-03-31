SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V34 : Intégration Sage 100 — requêtes de synchronisation bidirectionnelle

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. COLONNE sage_code sur les entités principales
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'sage_code')
    ALTER TABLE accounts     ADD sage_code       NVARCHAR(17);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('accounts') AND name = 'sage_synced_at')
    ALTER TABLE accounts     ADD sage_synced_at  DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('contacts') AND name = 'sage_contact_no')
    ALTER TABLE contacts     ADD sage_contact_no INTEGER;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('contacts') AND name = 'sage_synced_at')
    ALTER TABLE contacts     ADD sage_synced_at  DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'sage_synced_at')
    ALTER TABLE products     ADD sage_synced_at  DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('invoices') AND name = 'sage_piece')
    ALTER TABLE invoices     ADD sage_piece       NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('invoices') AND name = 'sage_synced_at')
    ALTER TABLE invoices     ADD sage_synced_at  DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sales_orders') AND name = 'sage_piece')
    ALTER TABLE sales_orders ADD sage_piece       NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sales_orders') AND name = 'sage_synced_at')
    ALTER TABLE sales_orders ADD sage_synced_at  DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('payments') AND name = 'sage_reg_no')
    ALTER TABLE payments     ADD sage_reg_no      INTEGER;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('payments') AND name = 'sage_synced_at')
    ALTER TABLE payments     ADD sage_synced_at  DATETIME2;
GO

-- Index unicité sage_code (partial: only where sage_code IS NOT NULL)
-- Use dynamic SQL to avoid compile-time error if column was just added
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_accounts_sage_code' AND object_id = OBJECT_ID('accounts'))
    EXEC('CREATE UNIQUE INDEX idx_accounts_sage_code ON accounts(sage_code) WHERE sage_code IS NOT NULL');
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLE DES REQUÊTES DE SYNCHRONISATION
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('sage_sync_requests', 'U') IS NULL
BEGIN
CREATE TABLE sage_sync_requests (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    entity_type      NVARCHAR(30)  NOT NULL,   -- ACCOUNTS | CONTACTS | CA | OBJECTIVES
    label            NVARCHAR(255),             -- Description libre de la requête
    source_format    NVARCHAR(20)  DEFAULT 'CSV',  -- CSV | MANUAL
    status           NVARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                                               -- PENDING | PROCESSING | DONE | ERROR | CANCELLED
    total_items      INTEGER      DEFAULT 0,
    processed_items  INTEGER      DEFAULT 0,
    success_items    INTEGER      DEFAULT 0,
    error_items      INTEGER      DEFAULT 0,
    skip_items       INTEGER      DEFAULT 0,
    period_year      INTEGER,                  -- Pour CA et OBJECTIVES : année
    period_month     INTEGER,                  -- Pour CA et OBJECTIVES : mois
    created_by_id    UNIQUEIDENTIFIER         REFERENCES users(id),
    processed_at     DATETIME2,
    created_at       DATETIME2    DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME2    DEFAULT CURRENT_TIMESTAMP
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sage_sync_req_type' AND object_id = OBJECT_ID('sage_sync_requests'))
    CREATE INDEX idx_sage_sync_req_type   ON sage_sync_requests(entity_type);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sage_sync_req_status' AND object_id = OBJECT_ID('sage_sync_requests'))
    CREATE INDEX idx_sage_sync_req_status ON sage_sync_requests(status);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sage_sync_req_date' AND object_id = OBJECT_ID('sage_sync_requests'))
    CREATE INDEX idx_sage_sync_req_date   ON sage_sync_requests(created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. TABLE DES LIGNES DE SYNCHRONISATION
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('sage_sync_items', 'U') IS NULL
BEGIN
CREATE TABLE sage_sync_items (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    request_id    UNIQUEIDENTIFIER        NOT NULL REFERENCES sage_sync_requests(id) ON DELETE CASCADE,
    row_index     INTEGER,                     -- Position dans le fichier/paste
    sage_ref      NVARCHAR(100),               -- Référence côté Sage (CT_Num, AR_Ref…)
    crm_id        UNIQUEIDENTIFIER,            -- ID CRM si match trouvé
    action        NVARCHAR(20),                -- CREATE | UPDATE | SKIP | ERROR
    status        NVARCHAR(20)  DEFAULT 'PENDING',
    raw_data      NVARCHAR(MAX) NOT NULL,      -- Données brutes telles que saisies
    mapped_data   NVARCHAR(MAX),               -- Données après mapping CRM
    diff_data     NVARCHAR(MAX),               -- Champs différents CRM vs Sage
    error_message NVARCHAR(MAX),
    processed_at  DATETIME2,
    created_at    DATETIME2    DEFAULT CURRENT_TIMESTAMP
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sage_sync_items_req' AND object_id = OBJECT_ID('sage_sync_items'))
    CREATE INDEX idx_sage_sync_items_req    ON sage_sync_items(request_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sage_sync_items_status' AND object_id = OBJECT_ID('sage_sync_items'))
    CREATE INDEX idx_sage_sync_items_status ON sage_sync_items(status);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sage_sync_items_ref' AND object_id = OBJECT_ID('sage_sync_items'))
    CREATE INDEX idx_sage_sync_items_ref    ON sage_sync_items(sage_ref);
