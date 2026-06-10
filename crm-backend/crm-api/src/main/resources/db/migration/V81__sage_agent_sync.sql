SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V81 — Agent de synchronisation Sage (bidirectionnel)
-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLE agent_api_keys : clés d'authentification de l'agent local
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('agent_api_keys', 'U') IS NULL
BEGIN
CREATE TABLE agent_api_keys (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    key_hash        NVARCHAR(255)    NOT NULL,   -- SHA-256 de la clé brute
    key_prefix      NVARCHAR(16)     NOT NULL,   -- 8 premiers caractères (affichage UI)
    label           NVARCHAR(100),
    enabled         BIT              NOT NULL DEFAULT 1,
    last_used_at    DATETIME2,
    last_used_ip    NVARCHAR(45),
    last_heartbeat  DATETIME2,
    agent_version   NVARCHAR(30),
    created_by_id   UNIQUEIDENTIFIER,
    created_at      DATETIME2        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at      DATETIME2
)
END;
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_agent_keys_hash' AND object_id = OBJECT_ID('agent_api_keys'))
    CREATE UNIQUE INDEX idx_agent_keys_hash   ON agent_api_keys(key_hash);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_agent_keys_tenant' AND object_id = OBJECT_ID('agent_api_keys'))
    CREATE INDEX idx_agent_keys_tenant ON agent_api_keys(tenant_id);
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLE sage_export_queue : documents CRM à exporter vers Sage
-- ─────────────────────────────────────────────────────────────────────────────
IF OBJECT_ID('sage_export_queue', 'U') IS NULL
BEGIN
CREATE TABLE sage_export_queue (
    id              UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    tenant_id       UNIQUEIDENTIFIER NOT NULL,
    entity_type     NVARCHAR(30)     NOT NULL,   -- QUOTE | SALES_ORDER | DELIVERY | PAYMENT
    entity_id       UNIQUEIDENTIFIER NOT NULL,   -- FK logique vers quotes/sales_orders/...
    sage_doc_type   INTEGER,                     -- DO_Type Sage cible (0=Devis,1=BC,3=BL,6=Facture)
    action          NVARCHAR(20)     NOT NULL DEFAULT 'CREATE',  -- CREATE | UPDATE | CANCEL
    status          NVARCHAR(20)     NOT NULL DEFAULT 'PENDING',
                    -- PENDING | SENT | DONE | ERROR | RETRY | CANCELLED
    payload         NVARCHAR(MAX),               -- JSON du document + lignes (snapshot)
    sage_piece      NVARCHAR(20),                -- DO_Piece après écriture Sage
    error_message   NVARCHAR(MAX),
    retry_count     INTEGER          NOT NULL DEFAULT 0,
    max_retries     INTEGER          NOT NULL DEFAULT 3,
    created_by_id   UNIQUEIDENTIFIER,
    created_at      DATETIME2        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    sent_at         DATETIME2,
    completed_at    DATETIME2,
    CONSTRAINT chk_export_queue_status CHECK (status IN
        ('PENDING','SENT','DONE','ERROR','RETRY','CANCELLED'))
)
END;
GO

IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_export_queue_pending' AND object_id = OBJECT_ID('sage_export_queue'))
    CREATE INDEX idx_export_queue_pending
        ON sage_export_queue(tenant_id, status, created_at)
        WHERE status IN ('PENDING','RETRY');
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_export_queue_entity' AND object_id = OBJECT_ID('sage_export_queue'))
    CREATE INDEX idx_export_queue_entity
        ON sage_export_queue(entity_type, entity_id);
GO

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Colonnes de suivi export sur les entités sources
--    (status fonctionnel du push CRM → Sage, distinct du status métier)
-- ─────────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('quotes')       AND name = 'sage_export_status')
    ALTER TABLE quotes       ADD sage_export_status NVARCHAR(20), sage_piece NVARCHAR(20), sage_synced_at DATETIME2;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sales_orders') AND name = 'sage_export_status')
    ALTER TABLE sales_orders ADD sage_export_status NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('payments')     AND name = 'sage_export_status')
    ALTER TABLE payments     ADD sage_export_status NVARCHAR(20);
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('delivery_tour') AND name = 'sage_export_status')
    ALTER TABLE delivery_tour ADD sage_export_status NVARCHAR(20), sage_piece NVARCHAR(20), sage_synced_at DATETIME2;
GO
