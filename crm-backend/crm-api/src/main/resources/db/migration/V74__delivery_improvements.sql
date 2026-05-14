SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================
-- V74 : Améliorations module Livraison
-- 1. delivery_line  : quantity_delivered, discount_percent, discount_reason
-- 2. return_entry   : return_type, delivery_line_id
-- 3. settlement_report : approved_by, approval_notes
-- 4. pre_order      : visit_order
-- 5. payment_instrument (nouvelle table)
-- ============================================================

-- 1a. delivery_line : quantité réellement livrée (≤ quantity, utile pour PARTIAL)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('delivery_line') AND name = 'quantity_delivered')
    ALTER TABLE delivery_line ADD quantity_delivered INT NULL;
GO

-- 1b. delivery_line : remise commerciale ponctuelle
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('delivery_line') AND name = 'discount_percent')
    ALTER TABLE delivery_line ADD discount_percent DECIMAL(5,2) NULL DEFAULT 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('delivery_line') AND name = 'discount_reason')
    ALTER TABLE delivery_line ADD discount_reason NVARCHAR(255) NULL;
GO

-- 2a. return_entry : type de retour (retour véhicule invendu vs avoir client)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('return_entry') AND name = 'return_type')
    ALTER TABLE return_entry ADD return_type NVARCHAR(50) NULL DEFAULT 'VEHICLE_RETURN';
    -- VEHICLE_RETURN | CUSTOMER_RETURN
GO

-- 2b. return_entry : lien vers la ligne de livraison d'origine (pour avoirs client)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('return_entry') AND name = 'delivery_line_id')
    ALTER TABLE return_entry ADD delivery_line_id UNIQUEIDENTIFIER NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'fk_re_delivery_line')
    ALTER TABLE return_entry
        ADD CONSTRAINT fk_re_delivery_line
        FOREIGN KEY (delivery_line_id) REFERENCES delivery_line (id);
GO

-- 3. settlement_report : champs workflow approbation des écarts
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('settlement_report') AND name = 'approved_by')
    ALTER TABLE settlement_report ADD approved_by UNIQUEIDENTIFIER NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('settlement_report') AND name = 'approved_at')
    ALTER TABLE settlement_report ADD approved_at DATETIME2 NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('settlement_report') AND name = 'approval_notes')
    ALTER TABLE settlement_report ADD approval_notes NVARCHAR(500) NULL;
GO

-- 4. pre_order : ordre de visite pour optimisation itinéraire
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('pre_order') AND name = 'visit_order')
    ALTER TABLE pre_order ADD visit_order INT NULL;
GO

-- 5. payment_instrument : traçabilité individuelle chèques et traites
IF OBJECT_ID('payment_instrument', 'U') IS NULL
BEGIN
CREATE TABLE payment_instrument (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_line_id UNIQUEIDENTIFIER NOT NULL,
    instrument_type  NVARCHAR(50)     NOT NULL,   -- CHEQUE | TRAITE
    instrument_number NVARCHAR(100)   NOT NULL,
    bank_name        NVARCHAR(200)    NULL,
    amount           DECIMAL(12,2)    NOT NULL,
    due_date         DATE             NULL,
    encash_date      DATE             NULL,
    status           NVARCHAR(50)     NOT NULL DEFAULT 'PENDING',  -- PENDING | ENCAISSE | REJETE
    rejection_reason NVARCHAR(255)    NULL,
    notes            NVARCHAR(500)    NULL,
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_payment_instrument PRIMARY KEY (id),
    CONSTRAINT fk_pi_delivery_line   FOREIGN KEY (delivery_line_id) REFERENCES delivery_line (id)
);
END;
GO

-- Index payment_instrument
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_payment_instrument_line' AND object_id = OBJECT_ID('payment_instrument'))
    CREATE INDEX idx_payment_instrument_line   ON payment_instrument (delivery_line_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_payment_instrument_due' AND object_id = OBJECT_ID('payment_instrument'))
    CREATE INDEX idx_payment_instrument_due    ON payment_instrument (due_date);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_payment_instrument_status' AND object_id = OBJECT_ID('payment_instrument'))
    CREATE INDEX idx_payment_instrument_status ON payment_instrument (status);
GO
