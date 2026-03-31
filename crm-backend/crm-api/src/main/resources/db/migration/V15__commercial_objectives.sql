SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V15: Objectifs commerciaux et saisie des ventes
-- Suivi des objectifs par commercial et par article (quantité + CA en MAD)

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. TABLE DES OBJECTIFS
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE commercial_objectives (
    id            UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id       UNIQUEIDENTIFIER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id    UNIQUEIDENTIFIER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    period_year   INT NOT NULL,
    period_month  INT CHECK (period_month BETWEEN 1 AND 12), -- NULL = objectif annuel
    target_qty    DECIMAL(15,3) NOT NULL DEFAULT 0,
    target_amount DECIMAL(15,2) NOT NULL DEFAULT 0,  -- CA objectif en MAD
    notes         NVARCHAR(MAX),
    created_at    DATETIME2 DEFAULT GETUTCDATE(),
    updated_at    DATETIME2 DEFAULT GETUTCDATE(),
    UNIQUE (user_id, product_id, period_year, period_month)
);

CREATE INDEX idx_obj_user    ON commercial_objectives(user_id);
CREATE INDEX idx_obj_product ON commercial_objectives(product_id);
CREATE INDEX idx_obj_period  ON commercial_objectives(period_year, period_month);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. TABLE DES VENTES RÉELLES (saisie manuelle par commercial)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sale_entries (
    id           UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    user_id      UNIQUEIDENTIFIER    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id   UNIQUEIDENTIFIER    NOT NULL REFERENCES products(id),
    account_id   UNIQUEIDENTIFIER    REFERENCES accounts(id),
    sale_date    DATE    NOT NULL,
    qty          DECIMAL(15,3) NOT NULL DEFAULT 0,
    unit_price   DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_amount AS (qty * unit_price) PERSISTED,
    notes        NVARCHAR(MAX),
    created_at   DATETIME2 DEFAULT GETUTCDATE(),
    updated_at   DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_sale_user    ON sale_entries(user_id);
CREATE INDEX idx_sale_product ON sale_entries(product_id);
CREATE INDEX idx_sale_date    ON sale_entries(sale_date);
CREATE INDEX idx_sale_user_date ON sale_entries(user_id, sale_date);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. DONNÉES DÉMO : objectifs mars 2026
-- ─────────────────────────────────────────────────────────────────────────────
DECLARE
    -- commerciaux
    @v_karim    UNIQUEIDENTIFIER,
    @v_fatima   UNIQUEIDENTIFIER,
    @v_youssef  UNIQUEIDENTIFIER,
    @v_amina    UNIQUEIDENTIFIER,

    -- produits sanitaires
    @p_lm35     UNIQUEIDENTIFIER,
    @p_lm45     UNIQUEIDENTIFIER,
    @p_arena_bl UNIQUEIDENTIFIER,
    @p_wc_arena_bloc UNIQUEIDENTIFIER,
    @p_wc_arena_pack UNIQUEIDENTIFIER,
    @p_wc_yv_sh UNIQUEIDENTIFIER,
    @p_wc_eva   UNIQUEIDENTIFIER,
    @p_bid_yv   UNIQUEIDENTIFIER,
    @p_lav_arena UNIQUEIDENTIFIER,
    @p_lav_milla UNIQUEIDENTIFIER,

    @v_year     INT = 2026,
    @v_month    INT = 3;

-- ── Récupérer les commerciaux (rôle COMMERCIAL ou MANAGER) ────────────────
SELECT TOP 1 @v_karim   = id FROM users WHERE email LIKE '%karim%';
SELECT TOP 1 @v_fatima  = id FROM users WHERE email LIKE '%fatima%';
SELECT TOP 1 @v_youssef = id FROM users WHERE email LIKE '%youssef%';
SELECT TOP 1 @v_amina   = id FROM users WHERE email LIKE '%amina%';

-- Fallback : prendre les 4 premiers utilisateurs actifs non-SUPER_ADMIN
IF @v_karim IS NULL
    SELECT @v_karim = id FROM (
        SELECT u.id, ROW_NUMBER() OVER (ORDER BY u.created_at) AS rn
        FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN'
    ) t WHERE rn = 1;
IF @v_fatima IS NULL
    SELECT @v_fatima = id FROM (
        SELECT u.id, ROW_NUMBER() OVER (ORDER BY u.created_at) AS rn
        FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN'
    ) t WHERE rn = 2;
IF @v_youssef IS NULL
    SELECT @v_youssef = id FROM (
        SELECT u.id, ROW_NUMBER() OVER (ORDER BY u.created_at) AS rn
        FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN'
    ) t WHERE rn = 3;
IF @v_amina IS NULL
    SELECT @v_amina = id FROM (
        SELECT u.id, ROW_NUMBER() OVER (ORDER BY u.created_at) AS rn
        FROM users u JOIN roles r ON r.id = u.role_id
        WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN'
    ) t WHERE rn = 4;

-- ── Récupérer les produits ────────────────────────────────────────────────
SELECT TOP 1 @p_lm35         = id FROM products WHERE code = 'LM-35';
SELECT TOP 1 @p_lm45         = id FROM products WHERE code = 'LM-45X34';
SELECT TOP 1 @p_arena_bl     = id FROM products WHERE code = 'LM-ARENA-BL';
SELECT TOP 1 @p_wc_arena_bloc = id FROM products WHERE code = 'WC-ARENA-BLOC';
SELECT TOP 1 @p_wc_arena_pack = id FROM products WHERE code = 'WC-ARENA-PACK';
SELECT TOP 1 @p_wc_yv_sh     = id FROM products WHERE code = 'WC-YV-SH';
SELECT TOP 1 @p_wc_eva       = id FROM products WHERE code = 'WC-EVA';
SELECT TOP 1 @p_bid_yv       = id FROM products WHERE code = 'BID-YV';
SELECT TOP 1 @p_lav_arena    = id FROM products WHERE code LIKE 'LAV-ARENA%';
SELECT TOP 1 @p_lav_milla    = id FROM products WHERE code LIKE 'LAV-MILLA%';

-- ── Objectifs par commercial × article ───────────────────────────────────
-- Karim : zone nord, fort sur WC
IF @v_karim IS NOT NULL AND @p_lm35 IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_karim, @p_lm35, @v_year, @v_month, 80,  9600.00,  'Zone Casablanca Nord');
IF @v_karim IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_karim, @p_wc_arena_bloc, @v_year, @v_month, 50, 22500.00, 'Zone Casablanca Nord');
IF @v_karim IS NOT NULL AND @p_wc_arena_pack IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_karim, @p_wc_arena_pack, @v_year, @v_month, 40, 24000.00, 'Zone Casablanca Nord');
IF @v_karim IS NOT NULL AND @p_lav_arena IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_karim, @p_lav_arena, @v_year, @v_month, 30, 18000.00, 'Zone Casablanca Nord');

-- Fatima : zone sud, forte sur lave-mains et lavabos
IF @v_fatima IS NOT NULL AND @p_lm45 IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_fatima, @p_lm45, @v_year, @v_month, 60, 8400.00, 'Zone Marrakech Sud');
IF @v_fatima IS NOT NULL AND @p_arena_bl IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_fatima, @p_arena_bl, @v_year, @v_month, 45, 7200.00, 'Zone Marrakech Sud');
IF @v_fatima IS NOT NULL AND @p_bid_yv IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_fatima, @p_bid_yv, @v_year, @v_month, 35, 8750.00, 'Zone Marrakech Sud');
IF @v_fatima IS NOT NULL AND @p_lav_milla IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_fatima, @p_lav_milla, @v_year, @v_month, 25, 15000.00, 'Zone Marrakech Sud');

-- Youssef : zone est, polyvalent
IF @v_youssef IS NOT NULL AND @p_wc_yv_sh IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_youssef, @p_wc_yv_sh, @v_year, @v_month, 55, 27500.00, 'Zone Fès-Meknès');
IF @v_youssef IS NOT NULL AND @p_wc_eva IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_youssef, @p_wc_eva, @v_year, @v_month, 45, 20250.00, 'Zone Fès-Meknès');
IF @v_youssef IS NOT NULL AND @p_lm35 IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_youssef, @p_lm35, @v_year, @v_month, 70, 8400.00, 'Zone Fès-Meknès');

-- Amina : zone ouest
IF @v_amina IS NOT NULL AND @p_lav_arena IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_amina, @p_lav_arena, @v_year, @v_month, 40, 24000.00, 'Zone Rabat-Salé');
IF @v_amina IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_amina, @p_wc_arena_bloc, @v_year, @v_month, 60, 27000.00, 'Zone Rabat-Salé');
IF @v_amina IS NOT NULL AND @p_bid_yv IS NOT NULL
    INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
    VALUES (@v_amina, @p_bid_yv, @v_year, @v_month, 30, 7500.00, 'Zone Rabat-Salé');

-- ── Ventes réelles démo (partiel mars 2026) ───────────────────────────────
IF @v_karim IS NOT NULL AND @p_lm35 IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_lm35, '2026-03-01', 22, 120.00, 'Client Achaib BTP');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_lm35, '2026-03-05', 18, 120.00, 'Client Bâtiment Nord');
END;
IF @v_karim IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_wc_arena_bloc, '2026-03-03', 20, 450.00, 'Commande promoteur');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_wc_arena_bloc, '2026-03-08', 12, 450.00, 'Revendeur Casablanca');
END;

IF @v_fatima IS NOT NULL AND @p_lm45 IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_lm45, '2026-03-02', 38, 140.00, 'Chantier Palmeraie');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_lm45, '2026-03-07', 15, 140.00, 'Magasin El Harti');
END;
IF @v_fatima IS NOT NULL AND @p_bid_yv IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_bid_yv, '2026-03-04', 28, 250.00, 'Résidence Agdal');
END;

IF @v_youssef IS NOT NULL AND @p_wc_yv_sh IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_youssef, @p_wc_yv_sh, '2026-03-01', 30, 500.00, 'Lotissement Atlas');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_youssef, @p_wc_yv_sh, '2026-03-06', 10, 500.00, 'Quincaillerie Seffou');
END;
IF @v_youssef IS NOT NULL AND @p_wc_eva IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_youssef, @p_wc_eva, '2026-03-03', 32, 450.00, 'Promoteur Mounir');
END;

IF @v_amina IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_amina, @p_wc_arena_bloc, '2026-03-02', 45, 450.00, 'Chantier Bouznika');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_amina, @p_wc_arena_bloc, '2026-03-07', 8, 450.00, 'Client Salé Tabriquet');
END;