SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================
-- V73 : Module Livraison (crm-delivery) — 19 tables
-- ============================================================

-- 1. delivery_tour
IF OBJECT_ID('delivery_tour', 'U') IS NULL
BEGIN
CREATE TABLE delivery_tour (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    tour_date         DATE             NOT NULL,
    representative_id UNIQUEIDENTIFIER NULL,
    vehicle_id        UNIQUEIDENTIFIER NULL,
    zone              NVARCHAR(255)    NULL,
    status            NVARCHAR(50)     NOT NULL,   -- DRAFT | VALIDE | CLOSED
    tenant_id         UNIQUEIDENTIFIER NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2        NULL,
    created_by_id     UNIQUEIDENTIFIER NULL,
    updated_by_id     UNIQUEIDENTIFIER NULL,
    version           BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_delivery_tour PRIMARY KEY (id)
);
END;
GO

-- 2. delivery_line
IF OBJECT_ID('delivery_line', 'U') IS NULL
BEGIN
CREATE TABLE delivery_line (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_tour_id UNIQUEIDENTIFIER NOT NULL,
    customer_id      UNIQUEIDENTIFIER NULL,
    item_id          UNIQUEIDENTIFIER NULL,
    quantity         INT              NOT NULL,
    unit_price       DECIMAL(10,2)    NULL,
    amount           DECIMAL(12,2)    NULL,
    payment_mode     NVARCHAR(50)     NULL,        -- CASH | CREDIT | CHEQUE | TRAITE | VIREMENT
    paid_amount      DECIMAL(12,2)    NULL,
    visit_result     NVARCHAR(50)     NOT NULL,    -- DELIVERED | ABSENT | REFUSED | CLOSED | PARTIAL
    visit_notes      NVARCHAR(500)    NULL,
    cheque_number    NVARCHAR(50)     NULL,
    traite_due_date  DATE             NULL,
    batch_id         UNIQUEIDENTIFIER NULL,
    lot_number       NVARCHAR(100)    NULL,
    expiry_date      DATE             NULL,
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_delivery_line    PRIMARY KEY (id),
    CONSTRAINT fk_dl_tour          FOREIGN KEY (delivery_tour_id) REFERENCES delivery_tour (id)
);
END;
GO

-- 3. delivery_promotion
IF OBJECT_ID('delivery_promotion', 'U') IS NULL
BEGIN
CREATE TABLE delivery_promotion (
    id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    name           NVARCHAR(200)    NOT NULL,
    description    NVARCHAR(500)    NULL,
    item_id        UNIQUEIDENTIFIER NOT NULL,
    min_quantity   INT              NOT NULL,
    bonus_item_id  UNIQUEIDENTIFIER NOT NULL,
    bonus_quantity INT              NOT NULL,
    zone           NVARCHAR(100)    NULL,
    valid_from     DATE             NULL,
    valid_to       DATE             NULL,
    is_active      BIT              NOT NULL DEFAULT 1,
    tenant_id      UNIQUEIDENTIFIER NULL,
    created_at     DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at     DATETIME2        NULL,
    created_by_id  UNIQUEIDENTIFIER NULL,
    updated_by_id  UNIQUEIDENTIFIER NULL,
    version        BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_delivery_promotion PRIMARY KEY (id)
);
END;
GO

-- 4. delivery_line_bonus
IF OBJECT_ID('delivery_line_bonus', 'U') IS NULL
BEGIN
CREATE TABLE delivery_line_bonus (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_line_id UNIQUEIDENTIFIER NOT NULL,
    promotion_id     UNIQUEIDENTIFIER NOT NULL,
    bonus_item_id    UNIQUEIDENTIFIER NOT NULL,
    bonus_quantity   INT              NOT NULL,
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_delivery_line_bonus PRIMARY KEY (id),
    CONSTRAINT fk_dlb_line            FOREIGN KEY (delivery_line_id) REFERENCES delivery_line      (id),
    CONSTRAINT fk_dlb_promotion       FOREIGN KEY (promotion_id)     REFERENCES delivery_promotion (id)
);
END;
GO

-- 5. delivery_price_override
IF OBJECT_ID('delivery_price_override', 'U') IS NULL
BEGIN
CREATE TABLE delivery_price_override (
    id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    item_id             UNIQUEIDENTIFIER NOT NULL,
    customer_id         UNIQUEIDENTIFIER NULL,
    pricing_category_id UNIQUEIDENTIFIER NULL,
    unit_price          DECIMAL(18,2)    NOT NULL,
    valid_from          DATE             NULL,
    valid_to            DATE             NULL,
    is_active           BIT              NOT NULL DEFAULT 1,
    notes               NVARCHAR(500)    NULL,
    tenant_id           UNIQUEIDENTIFIER NULL,
    created_at          DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at          DATETIME2        NULL,
    created_by_id       UNIQUEIDENTIFIER NULL,
    updated_by_id       UNIQUEIDENTIFIER NULL,
    version             BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_delivery_price_override PRIMARY KEY (id)
);
END;
GO

-- 6. vehicle_load
IF OBJECT_ID('vehicle_load', 'U') IS NULL
BEGIN
CREATE TABLE vehicle_load (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_tour_id  UNIQUEIDENTIFIER NOT NULL,
    item_id           UNIQUEIDENTIFIER NOT NULL,
    quantity          INT              NOT NULL,
    load_date         DATETIME2        NOT NULL,
    warehouse_from_id UNIQUEIDENTIFIER NULL,
    batch_id          UNIQUEIDENTIFIER NULL,
    lot_number        NVARCHAR(100)    NULL,
    expiry_date       DATE             NULL,
    status            NVARCHAR(50)     NULL,       -- DRAFT | LOADED
    tenant_id         UNIQUEIDENTIFIER NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2        NULL,
    created_by_id     UNIQUEIDENTIFIER NULL,
    updated_by_id     UNIQUEIDENTIFIER NULL,
    version           BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_vehicle_load PRIMARY KEY (id),
    CONSTRAINT fk_vl_tour      FOREIGN KEY (delivery_tour_id) REFERENCES delivery_tour (id)
);
END;
GO

-- 7. vehicle_unload
IF OBJECT_ID('vehicle_unload', 'U') IS NULL
BEGIN
CREATE TABLE vehicle_unload (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_tour_id UNIQUEIDENTIFIER NOT NULL,
    unload_date      DATETIME2        NULL,
    status           NVARCHAR(50)     NOT NULL,    -- DRAFT | CONFIRMED
    notes            NVARCHAR(500)    NULL,
    confirmed_by     UNIQUEIDENTIFIER NULL,
    confirmed_at     DATETIME2        NULL,
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_vehicle_unload PRIMARY KEY (id)
);
END;
GO

-- 8. vehicle_unload_item
IF OBJECT_ID('vehicle_unload_item', 'U') IS NULL
BEGIN
CREATE TABLE vehicle_unload_item (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    unload_id         UNIQUEIDENTIFIER NOT NULL,
    item_id           UNIQUEIDENTIFIER NOT NULL,
    quantity_loaded   INT              NOT NULL,
    quantity_sold     INT              NOT NULL,
    quantity_returned INT              NOT NULL,
    quantity_unloaded INT              NOT NULL,
    tenant_id         UNIQUEIDENTIFIER NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2        NULL,
    created_by_id     UNIQUEIDENTIFIER NULL,
    updated_by_id     UNIQUEIDENTIFIER NULL,
    version           BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_vehicle_unload_item PRIMARY KEY (id),
    CONSTRAINT fk_vui_unload          FOREIGN KEY (unload_id) REFERENCES vehicle_unload (id)
);
END;
GO

-- 9. return_entry
IF OBJECT_ID('return_entry', 'U') IS NULL
BEGIN
CREATE TABLE return_entry (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_tour_id UNIQUEIDENTIFIER NOT NULL,
    item_id          UNIQUEIDENTIFIER NOT NULL,
    quantity         INT              NOT NULL,
    reason           NVARCHAR(255)    NULL,
    received_date    DATETIME2        NULL,
    warehouse_to_id  UNIQUEIDENTIFIER NOT NULL,
    status           NVARCHAR(50)     NULL,        -- DRAFT | RECEIVED | VALIDATED
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_return_entry PRIMARY KEY (id),
    CONSTRAINT fk_re_tour      FOREIGN KEY (delivery_tour_id) REFERENCES delivery_tour (id)
);
END;
GO

-- 10. settlement_report
IF OBJECT_ID('settlement_report', 'U') IS NULL
BEGIN
CREATE TABLE settlement_report (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_tour_id UNIQUEIDENTIFIER NOT NULL,
    total_amount     DECIMAL(12,2)    NULL,
    collected_amount DECIMAL(12,2)    NULL,
    cash_amount      DECIMAL(12,2)    NULL,
    cheque_amount    DECIMAL(12,2)    NULL,
    traite_amount    DECIMAL(12,2)    NULL,
    virement_amount  DECIMAL(12,2)    NULL,
    credit_amount    DECIMAL(12,2)    NULL,
    credit_balance   DECIMAL(12,2)    NULL,
    unloaded_value   DECIMAL(12,2)    NULL,
    discrepancy      DECIMAL(12,2)    NULL,
    stock_theoretical INT             NULL,
    stock_physical    INT             NULL,
    stock_discrepancy INT             NULL,
    notes            NVARCHAR(1000)   NULL,
    generated_at     DATETIME2        NULL,
    finalized_at     DATETIME2        NULL,
    finalized_by     UNIQUEIDENTIFIER NULL,
    status           NVARCHAR(50)     NULL,        -- DRAFT | FINALIZED
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_settlement_report PRIMARY KEY (id)
);
END;
GO

-- 11. pre_order
IF OBJECT_ID('pre_order', 'U') IS NULL
BEGIN
CREATE TABLE pre_order (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    delivery_tour_id UNIQUEIDENTIFIER NULL,
    scheduled_date   DATE             NULL,
    customer_id      UNIQUEIDENTIFIER NOT NULL,
    status           NVARCHAR(50)     NOT NULL,    -- PENDING | CONFIRMED | DELIVERED | CANCELLED
    notes            NVARCHAR(500)    NULL,
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_pre_order PRIMARY KEY (id)
);
END;
GO

-- 12. pre_order_item
IF OBJECT_ID('pre_order_item', 'U') IS NULL
BEGIN
CREATE TABLE pre_order_item (
    id                 UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    pre_order_id       UNIQUEIDENTIFIER NOT NULL,
    item_id            UNIQUEIDENTIFIER NOT NULL,
    quantity_ordered   INT              NOT NULL,
    quantity_confirmed INT              NOT NULL,
    unit_price         DECIMAL(10,2)    NULL,
    tenant_id          UNIQUEIDENTIFIER NULL,
    created_at         DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at         DATETIME2        NULL,
    created_by_id      UNIQUEIDENTIFIER NULL,
    updated_by_id      UNIQUEIDENTIFIER NULL,
    version            BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_pre_order_item PRIMARY KEY (id),
    CONSTRAINT fk_poi_order      FOREIGN KEY (pre_order_id) REFERENCES pre_order (id)
);
END;
GO

-- 13. product_batch
IF OBJECT_ID('product_batch', 'U') IS NULL
BEGIN
CREATE TABLE product_batch (
    id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    item_id      UNIQUEIDENTIFIER NOT NULL,
    batch_number NVARCHAR(100)    NOT NULL,
    expiry_date  DATE             NULL,
    quantity     INT              NOT NULL,
    warehouse_id UNIQUEIDENTIFIER NULL,
    status       NVARCHAR(50)     NOT NULL,        -- ACTIVE | CONSUMED | EXPIRED | RECALLED
    notes        NVARCHAR(500)    NULL,
    tenant_id    UNIQUEIDENTIFIER NULL,
    created_at   DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at   DATETIME2        NULL,
    created_by_id UNIQUEIDENTIFIER NULL,
    updated_by_id UNIQUEIDENTIFIER NULL,
    version      BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_product_batch PRIMARY KEY (id)
);
END;
GO

-- 14. rep_objective
IF OBJECT_ID('rep_objective', 'U') IS NULL
BEGIN
CREATE TABLE rep_objective (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    representative_id UNIQUEIDENTIFIER NOT NULL,
    year              INT              NOT NULL,
    month             INT              NOT NULL,
    revenue_target    DECIMAL(12,2)    NOT NULL,
    visit_target      INT              NOT NULL,
    delivery_target   INT              NOT NULL,
    notes             NVARCHAR(500)    NULL,
    tenant_id         UNIQUEIDENTIFIER NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2        NULL,
    created_by_id     UNIQUEIDENTIFIER NULL,
    updated_by_id     UNIQUEIDENTIFIER NULL,
    version           BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_rep_objective PRIMARY KEY (id)
);
END;
GO

-- 15. rep_location
IF OBJECT_ID('rep_location', 'U') IS NULL
BEGIN
CREATE TABLE rep_location (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    representative_id UNIQUEIDENTIFIER NOT NULL,
    delivery_tour_id  UNIQUEIDENTIFIER NULL,
    latitude          FLOAT            NOT NULL,
    longitude         FLOAT            NOT NULL,
    accuracy          FLOAT            NULL,
    recorded_at       DATETIME2        NOT NULL,
    event_type        NVARCHAR(50)     NOT NULL,   -- TRACK | TOUR_START | TOUR_END | VISIT_START | VISIT_END
    customer_id       UNIQUEIDENTIFIER NULL,
    tenant_id         UNIQUEIDENTIFIER NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2        NULL,
    created_by_id     UNIQUEIDENTIFIER NULL,
    updated_by_id     UNIQUEIDENTIFIER NULL,
    version           BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_rep_location PRIMARY KEY (id)
);
END;
GO

-- 16. stock_replenishment
IF OBJECT_ID('stock_replenishment', 'U') IS NULL
BEGIN
CREATE TABLE stock_replenishment (
    id            UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    source_type   NVARCHAR(50)     NOT NULL,       -- WAREHOUSE | DELIVERY | CUSTOMER
    source_id     UNIQUEIDENTIFIER NOT NULL,
    target_type   NVARCHAR(50)     NOT NULL,       -- WAREHOUSE | DELIVERY
    target_id     UNIQUEIDENTIFIER NOT NULL,
    motive        NVARCHAR(100)    NOT NULL,
    request_date  DATETIME2        NULL,
    status        NVARCHAR(50)     NULL,           -- DRAFT | PENDING | APPROVED | APPLIED
    approved_by   UNIQUEIDENTIFIER NULL,
    approval_date DATETIME2        NULL,
    tenant_id     UNIQUEIDENTIFIER NULL,
    created_at    DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at    DATETIME2        NULL,
    created_by_id UNIQUEIDENTIFIER NULL,
    updated_by_id UNIQUEIDENTIFIER NULL,
    version       BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_stock_replenishment PRIMARY KEY (id)
);
END;
GO

-- 17. stock_replenishment_item
IF OBJECT_ID('stock_replenishment_item', 'U') IS NULL
BEGIN
CREATE TABLE stock_replenishment_item (
    id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    replenishment_id UNIQUEIDENTIFIER NOT NULL,
    item_id          UNIQUEIDENTIFIER NOT NULL,
    quantity         INT              NOT NULL,
    notes            NVARCHAR(255)    NULL,
    tenant_id        UNIQUEIDENTIFIER NULL,
    created_at       DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at       DATETIME2        NULL,
    created_by_id    UNIQUEIDENTIFIER NULL,
    updated_by_id    UNIQUEIDENTIFIER NULL,
    version          BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_stock_replenishment_item PRIMARY KEY (id),
    CONSTRAINT fk_sri_replenishment        FOREIGN KEY (replenishment_id) REFERENCES stock_replenishment (id)
);
END;
GO

-- 18. offline_sync_log
IF OBJECT_ID('offline_sync_log', 'U') IS NULL
BEGIN
CREATE TABLE offline_sync_log (
    id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWID(),
    device_id         NVARCHAR(100)    NULL,
    representative_id UNIQUEIDENTIFIER NULL,
    action_type       NVARCHAR(100)    NOT NULL,
    payload           NVARCHAR(MAX)    NULL,
    sync_status       NVARCHAR(50)     NOT NULL,   -- SYNCED | FAILED | PARTIAL
    synced_at         DATETIME2        NULL,
    error_message     NVARCHAR(500)    NULL,
    tenant_id         UNIQUEIDENTIFIER NULL,
    created_at        DATETIME2        NOT NULL DEFAULT GETUTCDATE(),
    updated_at        DATETIME2        NULL,
    created_by_id     UNIQUEIDENTIFIER NULL,
    updated_by_id     UNIQUEIDENTIFIER NULL,
    version           BIGINT           NULL DEFAULT 0,
    CONSTRAINT pk_offline_sync_log PRIMARY KEY (id)
);
END;
GO

-- 19. audit_trail  (PK BIGINT IDENTITY — différent des autres entités)
IF OBJECT_ID('audit_trail', 'U') IS NULL
BEGIN
CREATE TABLE audit_trail (
    id             BIGINT           IDENTITY(1,1) NOT NULL,
    action         NVARCHAR(255)    NOT NULL,
    entity_type    NVARCHAR(255)    NOT NULL,
    entity_id      UNIQUEIDENTIFIER NULL,
    who_user_id    UNIQUEIDENTIFIER NULL,
    what_changed   NVARCHAR(500)    NULL,
    when_date      DATETIME2        NOT NULL,
    where_location NVARCHAR(255)    NULL,
    why_reason     NVARCHAR(255)    NULL,
    CONSTRAINT pk_audit_trail PRIMARY KEY (id)
);
END;
GO

-- ============================================================
-- Index
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_delivery_tour_date'      AND object_id = OBJECT_ID('delivery_tour'))
    CREATE INDEX idx_delivery_tour_date      ON delivery_tour   (tour_date);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_delivery_tour_rep'       AND object_id = OBJECT_ID('delivery_tour'))
    CREATE INDEX idx_delivery_tour_rep       ON delivery_tour   (representative_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_delivery_line_tour'      AND object_id = OBJECT_ID('delivery_line'))
    CREATE INDEX idx_delivery_line_tour      ON delivery_line   (delivery_tour_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_delivery_line_customer'  AND object_id = OBJECT_ID('delivery_line'))
    CREATE INDEX idx_delivery_line_customer  ON delivery_line   (customer_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_delivery_line_item'      AND object_id = OBJECT_ID('delivery_line'))
    CREATE INDEX idx_delivery_line_item      ON delivery_line   (item_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_vehicle_load_tour'       AND object_id = OBJECT_ID('vehicle_load'))
    CREATE INDEX idx_vehicle_load_tour       ON vehicle_load    (delivery_tour_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_return_entry_tour'       AND object_id = OBJECT_ID('return_entry'))
    CREATE INDEX idx_return_entry_tour       ON return_entry    (delivery_tour_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_rep_location_rep'        AND object_id = OBJECT_ID('rep_location'))
    CREATE INDEX idx_rep_location_rep        ON rep_location    (representative_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_rep_location_recorded'   AND object_id = OBJECT_ID('rep_location'))
    CREATE INDEX idx_rep_location_recorded   ON rep_location    (recorded_at);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_rep_objective_rep_month' AND object_id = OBJECT_ID('rep_objective'))
    CREATE INDEX idx_rep_objective_rep_month ON rep_objective   (representative_id, year, month);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_audit_trail_entity'      AND object_id = OBJECT_ID('audit_trail'))
    CREATE INDEX idx_audit_trail_entity      ON audit_trail     (entity_type, entity_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_audit_trail_when'        AND object_id = OBJECT_ID('audit_trail'))
    CREATE INDEX idx_audit_trail_when        ON audit_trail     (when_date);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_offline_sync_log_rep'    AND object_id = OBJECT_ID('offline_sync_log'))
    CREATE INDEX idx_offline_sync_log_rep    ON offline_sync_log (representative_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_product_batch_item'      AND object_id = OBJECT_ID('product_batch'))
    CREATE INDEX idx_product_batch_item      ON product_batch   (item_id);

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'idx_settlement_tour'         AND object_id = OBJECT_ID('settlement_report'))
    CREATE INDEX idx_settlement_tour         ON settlement_report (delivery_tour_id);
GO
