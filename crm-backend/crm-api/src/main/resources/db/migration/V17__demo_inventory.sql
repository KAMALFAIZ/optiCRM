SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V17 : Données de démonstration — Inventaire
-- • Prix et seuils d'alerte sur les 19 produits sanitaires
-- • Entrepôt régional Marrakech
-- • Mouvements de stock : réceptions jan., sorties fév.–mars 2026
-- • Niveaux de stock courants (cohérents avec les mouvements)
--
-- Technique : INSERT INTO … SELECT … JOIN products ON code
-- → les produits absents sont ignorés silencieusement (pas d'erreur)
-- → ON CONFLICT DO UPDATE rend la migration idempotente
-- =====================================================

DECLARE @v_admin_id  UNIQUEIDENTIFIER;
DECLARE @v_wh_main   UNIQUEIDENTIFIER;
DECLARE @v_wh_mrak   UNIQUEIDENTIFIER;

SELECT @v_admin_id = id FROM users      WHERE email = 'admin@opticrm.com';
SELECT @v_wh_main  = id FROM warehouses WHERE code  = 'MAIN';

-- ─────────────────────────────────────────────────────────────────────────
-- 1. DEUXIÈME ENTREPÔT : MARRAKECH
-- ─────────────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM warehouses WHERE code = 'MRAK')
BEGIN
    INSERT INTO warehouses (code, name, address_street, address_city,
                            address_postal_code, address_country,
                            is_default, is_active, created_at)
    VALUES ('MRAK', 'Entrepôt Marrakech',
            'Zone Industrielle Sidi Ghanem, Lot 42', 'Marrakech',
            '40000', 'Maroc', 0, 1, '2026-01-01 08:00:00');
END;

SELECT @v_wh_mrak = id FROM warehouses WHERE code = 'MRAK';

-- ─────────────────────────────────────────────────────────────────────────
-- 2. PRIX DE VENTE, PRIX DE REVIENT, SEUILS D'ALERTE
--    (UPDATE — idempotent par nature)
-- ─────────────────────────────────────────────────────────────────────────
UPDATE products SET currency = 'MAD', unit_price = 120.00, cost_price =  80.00, min_stock_level = 20, reorder_level = 50  WHERE code = 'LM-35';
UPDATE products SET currency = 'MAD', unit_price = 140.00, cost_price =  90.00, min_stock_level = 15, reorder_level = 40  WHERE code = 'LM-45X34';
UPDATE products SET currency = 'MAD', unit_price = 160.00, cost_price = 105.00, min_stock_level = 10, reorder_level = 30  WHERE code = 'LM-ARENA-BL';
UPDATE products SET currency = 'MAD', unit_price = 180.00, cost_price = 115.00, min_stock_level = 10, reorder_level = 25  WHERE code = 'LM-LUKA-SALT';
UPDATE products SET currency = 'MAD', unit_price = 450.00, cost_price = 290.00, min_stock_level = 20, reorder_level = 50  WHERE code = 'WC-ARENA-BLOC';
UPDATE products SET currency = 'MAD', unit_price = 600.00, cost_price = 390.00, min_stock_level = 15, reorder_level = 40  WHERE code = 'WC-ARENA-PACK';
UPDATE products SET currency = 'MAD', unit_price = 500.00, cost_price = 320.00, min_stock_level = 15, reorder_level = 40  WHERE code = 'WC-YV-SH';
UPDATE products SET currency = 'MAD', unit_price = 480.00, cost_price = 305.00, min_stock_level = 10, reorder_level = 30  WHERE code = 'WC-YV-SV';
UPDATE products SET currency = 'MAD', unit_price = 450.00, cost_price = 285.00, min_stock_level = 15, reorder_level = 40  WHERE code = 'WC-EVA';
UPDATE products SET currency = 'MAD', unit_price = 850.00, cost_price = 540.00, min_stock_level =  5, reorder_level = 15  WHERE code = 'WC-SERENA-S';
UPDATE products SET currency = 'MAD', unit_price = 950.00, cost_price = 605.00, min_stock_level =  5, reorder_level = 15  WHERE code = 'WC-PERLA-S';
UPDATE products SET currency = 'MAD', unit_price = 750.00, cost_price = 475.00, min_stock_level =  5, reorder_level = 15  WHERE code = 'WC-EMMA-S';
UPDATE products SET currency = 'MAD', unit_price = 250.00, cost_price = 160.00, min_stock_level = 10, reorder_level = 25  WHERE code = 'BID-YV';
UPDATE products SET currency = 'MAD', unit_price = 320.00, cost_price = 205.00, min_stock_level =  8, reorder_level = 20  WHERE code = 'BID-SERENA';
UPDATE products SET currency = 'MAD', unit_price = 280.00, cost_price = 175.00, min_stock_level =  8, reorder_level = 20  WHERE code = 'BID-EMMA';
UPDATE products SET currency = 'MAD', unit_price = 380.00, cost_price = 240.00, min_stock_level = 10, reorder_level = 25  WHERE code = 'LAV-YV';
UPDATE products SET currency = 'MAD', unit_price = 680.00, cost_price = 430.00, min_stock_level =  8, reorder_level = 20  WHERE code = 'LAV-COL-ARENA';
UPDATE products SET currency = 'MAD', unit_price = 320.00, cost_price = 200.00, min_stock_level =  8, reorder_level = 20  WHERE code = 'VAS-RIO-50';
UPDATE products SET currency = 'MAD', unit_price = 450.00, cost_price = 285.00, min_stock_level =  8, reorder_level = 20  WHERE code = 'CON-OPERA-70';

-- ─────────────────────────────────────────────────────────────────────────
-- 3. RÉCEPTIONS INITIALES — ENTREPÔT PRINCIPAL (5 jan. 2026)
--    Pattern : JOIN products ON code → produits absents ignorés
-- ─────────────────────────────────────────────────────────────────────────
IF @v_wh_main IS NOT NULL AND @v_admin_id IS NOT NULL
BEGIN
    INSERT INTO stock_movements
        (product_id, warehouse_id, movement_type, quantity, unit_cost,
         quantity_after, notes, created_by_id, created_at)
    SELECT p.id, @v_wh_main, q.mvt_type, q.qty, q.cost,
           q.qty_after, q.notes, @v_admin_id, q.ts
    FROM (VALUES
        ('LM-35',        'PURCHASE', CAST(200 AS DECIMAL),  CAST(80.00 AS DECIMAL), CAST(200 AS DECIMAL), 'Réception BL-2026-001 — Céramica',    CAST('2026-01-05 09:00:00' AS DATETIME2)),
        ('LM-45X34',     'PURCHASE',  80,  90.00,   80, 'Réception BL-2026-001 — Céramica',    '2026-01-05 09:15:00'),
        ('LM-ARENA-BL',  'PURCHASE', 150, 105.00,  150, 'Réception BL-2026-001 — Céramica',    '2026-01-05 09:30:00'),
        ('LM-LUKA-SALT', 'PURCHASE',  40, 115.00,   40, 'Réception BL-2026-001 — Céramica',    '2026-01-05 09:45:00'),
        ('WC-ARENA-BLOC','PURCHASE', 150, 290.00,  150, 'Réception BL-2026-002 — SaniPro MA',   '2026-01-05 10:00:00'),
        ('WC-ARENA-PACK','PURCHASE',  80, 390.00,   80, 'Réception BL-2026-002 — SaniPro MA',   '2026-01-05 10:15:00'),
        ('WC-YV-SH',     'PURCHASE', 100, 320.00,  100, 'Réception BL-2026-002 — SaniPro MA',   '2026-01-05 10:30:00'),
        ('WC-YV-SV',     'PURCHASE',  50, 305.00,   50, 'Réception BL-2026-002 — SaniPro MA',   '2026-01-05 10:45:00'),
        ('WC-EVA',       'PURCHASE',  90, 285.00,   90, 'Réception BL-2026-002 — SaniPro MA',   '2026-01-05 11:00:00'),
        ('WC-SERENA-S',  'PURCHASE',  30, 540.00,   30, 'Réception BL-2026-003 — Gamme Premium','2026-01-05 11:15:00'),
        ('WC-PERLA-S',   'PURCHASE',  20, 605.00,   20, 'Réception BL-2026-003 — Gamme Premium','2026-01-05 11:30:00'),
        ('WC-EMMA-S',    'PURCHASE',  25, 475.00,   25, 'Réception BL-2026-003 — Gamme Premium','2026-01-05 11:45:00'),
        ('BID-YV',       'PURCHASE',  60, 160.00,   60, 'Réception BL-2026-001 — Céramica',    '2026-01-05 12:00:00'),
        ('BID-SERENA',   'PURCHASE',  35, 205.00,   35, 'Réception BL-2026-001 — Céramica',    '2026-01-05 12:15:00'),
        ('BID-EMMA',     'PURCHASE',  25, 175.00,   25, 'Réception BL-2026-001 — Céramica',    '2026-01-05 12:30:00'),
        ('LAV-YV',       'PURCHASE',  45, 240.00,   45, 'Réception BL-2026-004 — Lavabos',     '2026-01-05 13:00:00'),
        ('LAV-COL-ARENA','PURCHASE',  50, 430.00,   50, 'Réception BL-2026-004 — Lavabos',     '2026-01-05 13:15:00'),
        ('VAS-RIO-50',   'PURCHASE',  30, 200.00,   30, 'Réception BL-2026-004 — Lavabos',     '2026-01-05 13:30:00'),
        ('CON-OPERA-70', 'PURCHASE',  40, 285.00,   40, 'Réception BL-2026-004 — Lavabos',     '2026-01-05 13:45:00')
    ) AS q(code, mvt_type, qty, cost, qty_after, notes, ts)
    JOIN products p ON p.code = q.code;

    -- ─────────────────────────────────────────────────────────────────────
    -- 4. SORTIES — ENTREPÔT PRINCIPAL (fév.–mars 2026)
    --    Quantités négatives pour SALE
    --    qty_after = stock initial − cumul sorties
    -- ─────────────────────────────────────────────────────────────────────
    INSERT INTO stock_movements
        (product_id, warehouse_id, movement_type, quantity, unit_cost,
         quantity_after, notes, created_by_id, created_at)
    SELECT p.id, @v_wh_main, q.mvt_type, q.qty, q.cost,
           q.qty_after, q.notes, @v_admin_id, q.ts
    FROM (VALUES
        -- LM-35 : 200 − 40 − 20 = 140
        ('LM-35',        'SALE',  CAST(-40 AS DECIMAL),  CAST(80.00 AS DECIMAL), CAST(160 AS DECIMAL), 'Livraison CMD-2026-011 — Achaib BTP',          CAST('2026-02-03 10:00:00' AS DATETIME2)),
        ('LM-35',        'SALE',  -20,  80.00,  140, 'Livraison CMD-2026-019 — Bâtiment Nord',         '2026-03-05 10:00:00'),
        -- LM-45X34 : 80 − 38 − 15 − 2 = 25 (LOW)
        ('LM-45X34',     'SALE',  -38,  90.00,   42, 'Livraison CMD-2026-012 — Chantier Palmeraie',    '2026-02-04 10:00:00'),
        ('LM-45X34',     'SALE',  -15,  90.00,   27, 'Livraison CMD-2026-021 — Magasin El Harti',      '2026-03-07 10:00:00'),
        ('LM-45X34',     'SALE',   -2,  90.00,   25, 'Livraison CMD-2026-025 — Client Guéliz',         '2026-03-10 10:00:00'),
        -- LM-ARENA-BL : 150 − 30 = 120 (ajustement +2 compris)
        ('LM-ARENA-BL',  'SALE',  -30, 105.00,  118, 'Livraison CMD-2026-013 — Résidence Al Wifaq',    '2026-02-10 10:00:00'),
        -- LM-LUKA-SALT : 40 − 28 = 12 (CRITICAL)
        ('LM-LUKA-SALT', 'SALE',  -28, 115.00,   12, 'Livraison CMD-2026-014 — Résidence Agdal',       '2026-02-12 10:00:00'),
        -- WC-ARENA-BLOC : 150 − 32 − 53 = 65
        ('WC-ARENA-BLOC','SALE',  -32, 290.00,  118, 'Livraison CMD-2026-015 — Promoteur Casablanca',  '2026-02-07 10:00:00'),
        ('WC-ARENA-BLOC','SALE',  -53, 290.00,   65, 'Livraison CMD-2026-023 — Chantier Bouznika',     '2026-03-05 10:00:00'),
        -- WC-ARENA-PACK : 80 − 40 = 40
        ('WC-ARENA-PACK','SALE',  -40, 390.00,   40, 'Livraison CMD-2026-016 — Revendeur Maarif',      '2026-02-14 10:00:00'),
        -- WC-YV-SH : 100 − 40 = 60
        ('WC-YV-SH',     'SALE',  -40, 320.00,   60, 'Livraison CMD-2026-017 — Lotissement Atlas',     '2026-02-18 10:00:00'),
        -- WC-YV-SV : 50 − 20 = 30
        ('WC-YV-SV',     'SALE',  -20, 305.00,   30, 'Livraison CMD-2026-018 — Résidence Yasmine',     '2026-02-20 10:00:00'),
        -- WC-EVA : 90 − 32 = 58
        ('WC-EVA',       'SALE',  -32, 285.00,   58, 'Livraison CMD-2026-019 — Promoteur Mounir',      '2026-03-04 10:00:00'),
        -- WC-SERENA-S : 30 − 5 = 25
        ('WC-SERENA-S',  'SALE',   -5, 540.00,   25, 'Livraison CMD-2026-020 — Showroom Anfa',         '2026-02-25 10:00:00'),
        -- WC-PERLA-S : 20 − 15 = 5 (CRITICAL)
        ('WC-PERLA-S',   'SALE',  -15, 605.00,    5, 'Livraison CMD-2026-021 — Villa haut standing',   '2026-02-28 10:00:00'),
        -- WC-EMMA-S : 25 − 8 = 17
        ('WC-EMMA-S',    'SALE',   -8, 475.00,   17, 'Livraison CMD-2026-022 — Résidence Almohad',     '2026-03-01 10:00:00'),
        -- BID-YV : 60 − 28 = 32
        ('BID-YV',       'SALE',  -28, 160.00,   32, 'Livraison CMD-2026-015 — Résidence Agdal',       '2026-02-07 10:15:00'),
        -- BID-SERENA : 35 − 10 = 25
        ('BID-SERENA',   'SALE',  -10, 205.00,   25, 'Livraison CMD-2026-016',                         '2026-02-14 10:15:00'),
        -- BID-EMMA : 25 − 8 = 17
        ('BID-EMMA',     'SALE',   -8, 175.00,   17, 'Livraison CMD-2026-016',                         '2026-02-14 10:30:00'),
        -- LAV-YV : 45 − 15 = 30
        ('LAV-YV',       'SALE',  -15, 240.00,   30, 'Livraison CMD-2026-018',                         '2026-02-20 10:15:00'),
        -- LAV-COL-ARENA : 50 − 20 = 30
        ('LAV-COL-ARENA','SALE',  -20, 430.00,   30, 'Livraison CMD-2026-019',                         '2026-03-03 10:00:00'),
        -- VAS-RIO-50 : 30 − 25 = 5 (LOW)
        ('VAS-RIO-50',   'SALE',  -25, 200.00,    5, 'Livraison CMD-2026-017 — Chantier Moulay Ismaïl','2026-02-18 10:15:00'),
        -- CON-OPERA-70 : 40 − 10 = 30
        ('CON-OPERA-70', 'SALE',  -10, 285.00,   30, 'Livraison CMD-2026-020',                         '2026-02-25 10:15:00')
    ) AS q(code, mvt_type, qty, cost, qty_after, notes, ts)
    JOIN products p ON p.code = q.code;

    -- ─────────────────────────────────────────────────────────────────────
    -- 5. AJUSTEMENT — inventaire physique 28/02 (+2 LM-ARENA-BL)
    -- ─────────────────────────────────────────────────────────────────────
    INSERT INTO stock_movements
        (product_id, warehouse_id, movement_type, quantity, unit_cost,
         quantity_after, notes, created_by_id, created_at)
    SELECT p.id, @v_wh_main, 'ADJUSTMENT', 2, 105.00, 120,
           'Inventaire physique 28/02/2026 — écart +2 constaté',
           @v_admin_id, '2026-02-28 16:00:00'
    FROM products p WHERE p.code = 'LM-ARENA-BL';

    -- ─────────────────────────────────────────────────────────────────────
    -- 6. NIVEAUX DE STOCK COURANTS — ENTREPÔT PRINCIPAL
    --    Statuts cibles :
    --      CRITICAL : LM-LUKA-SALT (12, min=10), WC-PERLA-S (5, min=5)
    --      LOW      : LM-45X34 (25, min=15), VAS-RIO-50 (5, min=8)
    -- ─────────────────────────────────────────────────────────────────────
    MERGE stock_levels AS target
    USING (
        SELECT p.id AS product_id, @v_wh_main AS warehouse_id,
               q.qoh, q.qres, q.qoo, q.avg_cost, CAST(q.lcd AS DATE) AS lcd, CAST(q.upd AS DATETIME2) AS upd
        FROM (VALUES
            ('LM-35',        CAST(140 AS DECIMAL),  CAST(5 AS DECIMAL), CAST(0 AS DECIMAL),  CAST(80.00 AS DECIMAL), '2026-02-28', '2026-03-05 10:00:00'),
            ('LM-45X34',      25,  0, 0,  90.00, '2026-02-28', '2026-03-10 10:00:00'),
            ('LM-ARENA-BL',  120, 10, 0, 105.00, '2026-02-28', '2026-02-28 16:00:00'),
            ('LM-LUKA-SALT',  12,  2, 0, 115.00, '2026-02-28', '2026-02-12 10:00:00'),
            ('WC-ARENA-BLOC', 65, 15, 0, 290.00, '2026-02-28', '2026-03-05 10:00:00'),
            ('WC-ARENA-PACK', 40, 10, 0, 390.00, '2026-02-28', '2026-02-14 10:00:00'),
            ('WC-YV-SH',      60,  8, 0, 320.00, '2026-02-28', '2026-02-18 10:00:00'),
            ('WC-YV-SV',      30,  5, 0, 305.00, '2026-02-28', '2026-02-20 10:00:00'),
            ('WC-EVA',        58,  0, 0, 285.00, '2026-02-28', '2026-03-04 10:00:00'),
            ('WC-SERENA-S',   25,  0, 0, 540.00, '2026-02-28', '2026-02-25 10:00:00'),
            ('WC-PERLA-S',     5,  0, 0, 605.00, '2026-02-28', '2026-02-28 10:00:00'),
            ('WC-EMMA-S',     17,  0, 0, 475.00, '2026-02-28', '2026-03-01 10:00:00'),
            ('BID-YV',        32,  5, 0, 160.00, '2026-02-28', '2026-02-07 10:15:00'),
            ('BID-SERENA',    25,  0, 0, 205.00, '2026-02-28', '2026-02-14 10:15:00'),
            ('BID-EMMA',      17,  0, 0, 175.00, '2026-02-28', '2026-02-14 10:30:00'),
            ('LAV-YV',        30,  3, 0, 240.00, '2026-02-28', '2026-02-20 10:15:00'),
            ('LAV-COL-ARENA', 30,  5, 0, 430.00, '2026-02-28', '2026-03-03 10:00:00'),
            ('VAS-RIO-50',     5,  0, 0, 200.00, '2026-02-28', '2026-02-18 10:15:00'),
            ('CON-OPERA-70',  30,  0, 0, 285.00, '2026-02-28', '2026-02-25 10:15:00')
        ) AS q(code, qoh, qres, qoo, avg_cost, lcd, upd)
        JOIN products p ON p.code = q.code
    ) AS src ON target.product_id = src.product_id AND target.warehouse_id = src.warehouse_id
    WHEN MATCHED THEN UPDATE SET
        quantity_on_hand  = src.qoh,
        quantity_reserved = src.qres,
        quantity_on_order = src.qoo,
        average_cost      = src.avg_cost,
        last_count_date   = src.lcd,
        updated_at        = src.upd
    WHEN NOT MATCHED THEN INSERT
        (product_id, warehouse_id, quantity_on_hand, quantity_reserved,
         quantity_on_order, average_cost, last_count_date, updated_at)
    VALUES (src.product_id, src.warehouse_id, src.qoh, src.qres, src.qoo, src.avg_cost, src.lcd, src.upd);
END;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. RÉCEPTIONS — ENTREPÔT MARRAKECH (10 jan. 2026)
-- ─────────────────────────────────────────────────────────────────────────
IF @v_wh_mrak IS NOT NULL AND @v_admin_id IS NOT NULL
BEGIN
    INSERT INTO stock_movements
        (product_id, warehouse_id, movement_type, quantity, unit_cost,
         quantity_after, notes, created_by_id, created_at)
    SELECT p.id, @v_wh_mrak, q.mvt_type, q.qty, q.cost,
           q.qty_after, q.notes, @v_admin_id, q.ts
    FROM (VALUES
        ('LM-35',        'PURCHASE',  CAST(80 AS DECIMAL),  CAST(80.00 AS DECIMAL),  CAST(80 AS DECIMAL), 'Réception BL-MRAK-2026-001', CAST('2026-01-10 09:00:00' AS DATETIME2)),
        ('LM-45X34',     'PURCHASE',  50,  90.00,  50, 'Réception BL-MRAK-2026-001', '2026-01-10 09:15:00'),
        ('WC-ARENA-BLOC','PURCHASE',  60, 290.00,  60, 'Réception BL-MRAK-2026-002', '2026-01-10 10:00:00'),
        ('WC-YV-SH',     'PURCHASE',  40, 320.00,  40, 'Réception BL-MRAK-2026-002', '2026-01-10 10:30:00'),
        ('BID-YV',       'PURCHASE',  30, 160.00,  30, 'Réception BL-MRAK-2026-001', '2026-01-10 11:00:00'),
        ('LAV-COL-ARENA','PURCHASE',  25, 430.00,  25, 'Réception BL-MRAK-2026-003', '2026-01-10 11:30:00')
    ) AS q(code, mvt_type, qty, cost, qty_after, notes, ts)
    JOIN products p ON p.code = q.code;

    -- ─────────────────────────────────────────────────────────────────────
    -- 8. SORTIES — ENTREPÔT MARRAKECH (fév. 2026)
    --    LM-45X34 → 50 − 38 = 12 (LOW, min=15)
    -- ─────────────────────────────────────────────────────────────────────
    INSERT INTO stock_movements
        (product_id, warehouse_id, movement_type, quantity, unit_cost,
         quantity_after, notes, created_by_id, created_at)
    SELECT p.id, @v_wh_mrak, q.mvt_type, q.qty, q.cost,
           q.qty_after, q.notes, @v_admin_id, q.ts
    FROM (VALUES
        ('LM-35',        'SALE', CAST(-20 AS DECIMAL),  CAST(80.00 AS DECIMAL), CAST(60 AS DECIMAL), 'Livraison CMD-MRAK-2026-001 — Zone Guéliz',       CAST('2026-02-06 10:00:00' AS DATETIME2)),
        ('LM-45X34',     'SALE', -38,  90.00,  12, 'Livraison CMD-MRAK-2026-002 — Chantier Palmeraie',  '2026-02-08 10:00:00'),
        ('WC-ARENA-BLOC','SALE', -20, 290.00,  40, 'Livraison CMD-MRAK-2026-003 — Promoteur Atlas',     '2026-02-12 10:00:00'),
        ('WC-YV-SH',     'SALE', -10, 320.00,  30, 'Livraison CMD-MRAK-2026-004 — Résidence Menara',    '2026-02-15 10:00:00'),
        ('BID-YV',       'SALE',  -5, 160.00,  25, 'Livraison CMD-MRAK-2026-002',                       '2026-02-08 10:15:00'),
        ('LAV-COL-ARENA','SALE',  -8, 430.00,  17, 'Livraison CMD-MRAK-2026-005 — Résidence Jnane',     '2026-02-20 10:00:00')
    ) AS q(code, mvt_type, qty, cost, qty_after, notes, ts)
    JOIN products p ON p.code = q.code;

    -- ─────────────────────────────────────────────────────────────────────
    -- 9. NIVEAUX DE STOCK COURANTS — ENTREPÔT MARRAKECH
    --    LOW : LM-45X34 (12, min=15)
    -- ─────────────────────────────────────────────────────────────────────
    MERGE stock_levels AS target
    USING (
        SELECT p.id AS product_id, @v_wh_mrak AS warehouse_id,
               q.qoh, q.qres, q.qoo, q.avg_cost, CAST(q.lcd AS DATE) AS lcd, CAST(q.upd AS DATETIME2) AS upd
        FROM (VALUES
            ('LM-35',        CAST(60 AS DECIMAL), CAST(0 AS DECIMAL), CAST(0 AS DECIMAL),  CAST(80.00 AS DECIMAL), '2026-02-28', '2026-02-06 10:00:00'),
            ('LM-45X34',     12,          0,          0,            90.00,          '2026-02-28', '2026-02-08 10:00:00'),
            ('WC-ARENA-BLOC',40,          5,          0,           290.00,          '2026-02-28', '2026-02-12 10:00:00'),
            ('WC-YV-SH',     30,          0,          0,           320.00,          '2026-02-28', '2026-02-15 10:00:00'),
            ('BID-YV',       25,          0,          0,           160.00,          '2026-02-28', '2026-02-08 10:15:00'),
            ('LAV-COL-ARENA',17,          0,          0,           430.00,          '2026-02-28', '2026-02-20 10:00:00')
        ) AS q(code, qoh, qres, qoo, avg_cost, lcd, upd)
        JOIN products p ON p.code = q.code
    ) AS src ON target.product_id = src.product_id AND target.warehouse_id = src.warehouse_id
    WHEN MATCHED THEN UPDATE SET
        quantity_on_hand  = src.qoh,
        quantity_reserved = src.qres,
        quantity_on_order = src.qoo,
        average_cost      = src.avg_cost,
        last_count_date   = src.lcd,
        updated_at        = src.upd
    WHEN NOT MATCHED THEN INSERT
        (product_id, warehouse_id, quantity_on_hand, quantity_reserved,
         quantity_on_order, average_cost, last_count_date, updated_at)
    VALUES (src.product_id, src.warehouse_id, src.qoh, src.qres, src.qoo, src.avg_cost, src.lcd, src.upd);
END;