SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ═══════════════════════════════════════════════════════════════════════════
-- V44 : Sage Products, Inventory, Ventes saisies, Balance Âgée
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── 1. sage_code sur les produits ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'sage_code')
    ALTER TABLE products ADD sage_code NVARCHAR(50);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'sage_synced_at')
    ALTER TABLE products ADD sage_synced_at DATETIMEOFFSET;
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_products_sage_code' AND object_id = OBJECT_ID('products'))
    EXEC('CREATE UNIQUE INDEX idx_products_sage_code ON products(sage_code) WHERE sage_code IS NOT NULL');
GO

-- ─── 2. Snapshots Balance Âgée (par compte, par sync_request) ─────────────
IF OBJECT_ID('balance_agee_snapshots', 'U') IS NULL
BEGIN
CREATE TABLE balance_agee_snapshots (
    id               UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    sync_request_id  UNIQUEIDENTIFIER REFERENCES sage_sync_requests(id) ON DELETE CASCADE,
    account_id       UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE SET NULL,
    sage_code        NVARCHAR(50)   NOT NULL,
    non_echu         DECIMAL(15,2)  DEFAULT 0,
    echu_1_30        DECIMAL(15,2)  DEFAULT 0,
    echu_31_60       DECIMAL(15,2)  DEFAULT 0,
    echu_61_90       DECIMAL(15,2)  DEFAULT 0,
    echu_91_plus     DECIMAL(15,2)  DEFAULT 0,
    total_du         DECIMAL(15,2)  DEFAULT 0,
    synced_at        DATETIMEOFFSET DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_bsa_account' AND object_id = OBJECT_ID('balance_agee_snapshots'))
    CREATE INDEX idx_bsa_account ON balance_agee_snapshots(account_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_bsa_request' AND object_id = OBJECT_ID('balance_agee_snapshots'))
    CREATE INDEX idx_bsa_request ON balance_agee_snapshots(sync_request_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_bsa_sage' AND object_id = OBJECT_ID('balance_agee_snapshots'))
    CREATE INDEX idx_bsa_sage ON balance_agee_snapshots(sage_code);

-- ─── 3. Ventes saisies manuelles ──────────────────────────────────────────
IF OBJECT_ID('ventes_saisies', 'U') IS NULL
BEGIN
CREATE TABLE ventes_saisies (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    account_id      UNIQUEIDENTIFIER REFERENCES accounts(id) ON DELETE SET NULL,
    created_by_id   UNIQUEIDENTIFIER REFERENCES users(id)    ON DELETE SET NULL,
    reference       NVARCHAR(100),
    date_vente      DATE           NOT NULL,
    montant_ht      DECIMAL(15,2)  NOT NULL DEFAULT 0,
    montant_ttc     DECIMAL(15,2)  NOT NULL DEFAULT 0,
    description     NVARCHAR(MAX),
    statut          NVARCHAR(30)   DEFAULT 'CONFIRME',
    created_at      DATETIMEOFFSET DEFAULT GETUTCDATE(),
    updated_at      DATETIMEOFFSET DEFAULT GETUTCDATE()
)
END;

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_vs_account' AND object_id = OBJECT_ID('ventes_saisies'))
    CREATE INDEX idx_vs_account ON ventes_saisies(account_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_vs_date' AND object_id = OBJECT_ID('ventes_saisies'))
    CREATE INDEX idx_vs_date ON ventes_saisies(date_vente);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_vs_statut' AND object_id = OBJECT_ID('ventes_saisies'))
    CREATE INDEX idx_vs_statut ON ventes_saisies(statut);