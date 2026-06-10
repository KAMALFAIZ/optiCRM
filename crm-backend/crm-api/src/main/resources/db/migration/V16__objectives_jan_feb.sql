SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V16: Objectifs janvier et février 2026

DECLARE @v_karim    UNIQUEIDENTIFIER;
DECLARE @v_fatima   UNIQUEIDENTIFIER;
DECLARE @v_youssef  UNIQUEIDENTIFIER;
DECLARE @v_amina    UNIQUEIDENTIFIER;

DECLARE @p_lm35          UNIQUEIDENTIFIER;
DECLARE @p_lm45          UNIQUEIDENTIFIER;
DECLARE @p_arena_bl      UNIQUEIDENTIFIER;
DECLARE @p_wc_arena_bloc UNIQUEIDENTIFIER;
DECLARE @p_wc_arena_pack UNIQUEIDENTIFIER;
DECLARE @p_wc_yv_sh      UNIQUEIDENTIFIER;
DECLARE @p_wc_eva        UNIQUEIDENTIFIER;
DECLARE @p_bid_yv        UNIQUEIDENTIFIER;
DECLARE @p_lav_arena     UNIQUEIDENTIFIER;
DECLARE @p_lav_milla     UNIQUEIDENTIFIER;

DECLARE @v_year INT = 2026;

-- ── Commerciaux ──────────────────────────────────────────────────────────
SELECT TOP 1 @v_karim   = id FROM users WHERE email LIKE '%karim%';
SELECT TOP 1 @v_fatima  = id FROM users WHERE email LIKE '%fatima%';
SELECT TOP 1 @v_youssef = id FROM users WHERE email LIKE '%youssef%';
SELECT TOP 1 @v_amina   = id FROM users WHERE email LIKE '%amina%';

IF @v_karim IS NULL
    SELECT @v_karim = u.id FROM users u JOIN roles r ON r.id = u.role_id
    WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN' ORDER BY u.created_at OFFSET 0 ROWS FETCH NEXT 1 ROWS ONLY;
IF @v_fatima IS NULL
    SELECT @v_fatima = u.id FROM users u JOIN roles r ON r.id = u.role_id
    WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN' ORDER BY u.created_at OFFSET 1 ROWS FETCH NEXT 1 ROWS ONLY;
IF @v_youssef IS NULL
    SELECT @v_youssef = u.id FROM users u JOIN roles r ON r.id = u.role_id
    WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN' ORDER BY u.created_at OFFSET 2 ROWS FETCH NEXT 1 ROWS ONLY;
IF @v_amina IS NULL
    SELECT @v_amina = u.id FROM users u JOIN roles r ON r.id = u.role_id
    WHERE u.is_active = 1 AND r.name != 'SUPER_ADMIN' ORDER BY u.created_at OFFSET 3 ROWS FETCH NEXT 1 ROWS ONLY;

-- ── Produits ──────────────────────────────────────────────────────────────
SELECT TOP 1 @p_lm35          = id FROM products WHERE code = 'LM-35';
SELECT TOP 1 @p_lm45          = id FROM products WHERE code = 'LM-45X34';
SELECT TOP 1 @p_arena_bl      = id FROM products WHERE code = 'LM-ARENA-BL';
SELECT TOP 1 @p_wc_arena_bloc = id FROM products WHERE code = 'WC-ARENA-BLOC';
SELECT TOP 1 @p_wc_arena_pack = id FROM products WHERE code = 'WC-ARENA-PACK';
SELECT TOP 1 @p_wc_yv_sh      = id FROM products WHERE code = 'WC-YV-SH';
SELECT TOP 1 @p_wc_eva        = id FROM products WHERE code = 'WC-EVA';
SELECT TOP 1 @p_bid_yv        = id FROM products WHERE code = 'BID-YV';
SELECT TOP 1 @p_lav_arena     = id FROM products WHERE code LIKE 'LAV-ARENA%';
SELECT TOP 1 @p_lav_milla     = id FROM products WHERE code LIKE 'LAV-MILLA%';

-- ══════════════════════════════════════════════════════════════════════════
-- JANVIER 2026
-- ══════════════════════════════════════════════════════════════════════════

-- Karim
IF @v_karim IS NOT NULL AND @p_lm35 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_karim AND product_id = @p_lm35 AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_karim, @p_lm35, @v_year, 1, 70, 8400.00, 'Zone Casablanca Nord');
END;
IF @v_karim IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_karim AND product_id = @p_wc_arena_bloc AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_karim, @p_wc_arena_bloc, @v_year, 1, 45, 20250.00, 'Zone Casablanca Nord');
END;
IF @v_karim IS NOT NULL AND @p_wc_arena_pack IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_karim AND product_id = @p_wc_arena_pack AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_karim, @p_wc_arena_pack, @v_year, 1, 35, 21000.00, 'Zone Casablanca Nord');
END;

-- Fatima
IF @v_fatima IS NOT NULL AND @p_lm45 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_fatima AND product_id = @p_lm45 AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_fatima, @p_lm45, @v_year, 1, 50, 7000.00, 'Zone Marrakech Sud');
END;
IF @v_fatima IS NOT NULL AND @p_bid_yv IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_fatima AND product_id = @p_bid_yv AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_fatima, @p_bid_yv, @v_year, 1, 30, 7500.00, 'Zone Marrakech Sud');
END;
IF @v_fatima IS NOT NULL AND @p_lav_milla IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_fatima AND product_id = @p_lav_milla AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_fatima, @p_lav_milla, @v_year, 1, 20, 12000.00, 'Zone Marrakech Sud');
END;

-- Youssef
IF @v_youssef IS NOT NULL AND @p_wc_yv_sh IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_youssef AND product_id = @p_wc_yv_sh AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_youssef, @p_wc_yv_sh, @v_year, 1, 50, 25000.00, 'Zone Fès-Meknès');
END;
IF @v_youssef IS NOT NULL AND @p_wc_eva IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_youssef AND product_id = @p_wc_eva AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_youssef, @p_wc_eva, @v_year, 1, 40, 18000.00, 'Zone Fès-Meknès');
END;

-- Amina
IF @v_amina IS NOT NULL AND @p_lav_arena IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_amina AND product_id = @p_lav_arena AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_amina, @p_lav_arena, @v_year, 1, 35, 21000.00, 'Zone Rabat-Salé');
END;
IF @v_amina IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_amina AND product_id = @p_wc_arena_bloc AND period_year = @v_year AND period_month = 1)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_amina, @p_wc_arena_bloc, @v_year, 1, 55, 24750.00, 'Zone Rabat-Salé');
END;

-- ══════════════════════════════════════════════════════════════════════════
-- FÉVRIER 2026
-- ══════════════════════════════════════════════════════════════════════════

-- Karim
IF @v_karim IS NOT NULL AND @p_lm35 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_karim AND product_id = @p_lm35 AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_karim, @p_lm35, @v_year, 2, 75, 9000.00, 'Zone Casablanca Nord');
END;
IF @v_karim IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_karim AND product_id = @p_wc_arena_bloc AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_karim, @p_wc_arena_bloc, @v_year, 2, 48, 21600.00, 'Zone Casablanca Nord');
END;
IF @v_karim IS NOT NULL AND @p_lav_arena IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_karim AND product_id = @p_lav_arena AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_karim, @p_lav_arena, @v_year, 2, 25, 15000.00, 'Zone Casablanca Nord');
END;

-- Fatima
IF @v_fatima IS NOT NULL AND @p_lm45 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_fatima AND product_id = @p_lm45 AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_fatima, @p_lm45, @v_year, 2, 55, 7700.00, 'Zone Marrakech Sud');
END;
IF @v_fatima IS NOT NULL AND @p_arena_bl IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_fatima AND product_id = @p_arena_bl AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_fatima, @p_arena_bl, @v_year, 2, 40, 6400.00, 'Zone Marrakech Sud');
END;
IF @v_fatima IS NOT NULL AND @p_bid_yv IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_fatima AND product_id = @p_bid_yv AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_fatima, @p_bid_yv, @v_year, 2, 32, 8000.00, 'Zone Marrakech Sud');
END;

-- Youssef
IF @v_youssef IS NOT NULL AND @p_wc_yv_sh IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_youssef AND product_id = @p_wc_yv_sh AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_youssef, @p_wc_yv_sh, @v_year, 2, 52, 26000.00, 'Zone Fès-Meknès');
END;
IF @v_youssef IS NOT NULL AND @p_lm35 IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_youssef AND product_id = @p_lm35 AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_youssef, @p_lm35, @v_year, 2, 65, 7800.00, 'Zone Fès-Meknès');
END;

-- Amina
IF @v_amina IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_amina AND product_id = @p_wc_arena_bloc AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_amina, @p_wc_arena_bloc, @v_year, 2, 58, 26100.00, 'Zone Rabat-Salé');
END;
IF @v_amina IS NOT NULL AND @p_bid_yv IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM commercial_objectives WHERE user_id = @v_amina AND product_id = @p_bid_yv AND period_year = @v_year AND period_month = 2)
        INSERT INTO commercial_objectives (user_id, product_id, period_year, period_month, target_qty, target_amount, notes)
        VALUES (@v_amina, @p_bid_yv, @v_year, 2, 28, 7000.00, 'Zone Rabat-Salé');
END;

-- ══════════════════════════════════════════════════════════════════════════
-- VENTES RÉELLES jan-fév 2026 (démo)
-- ══════════════════════════════════════════════════════════════════════════

-- Janvier — Karim
IF @v_karim IS NOT NULL AND @p_lm35 IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_lm35, '2026-01-05', 30, 120.00, 'Client Chaabi Immobilier');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_lm35, '2026-01-18', 25, 120.00, 'Revendeur Hay Mohammadi');
END;
IF @v_karim IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_wc_arena_bloc, '2026-01-10', 28, 450.00, 'Promoteur Anas');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_wc_arena_bloc, '2026-01-22', 15, 450.00, 'Client Sidi Moumen');
END;

-- Janvier — Fatima
IF @v_fatima IS NOT NULL AND @p_lm45 IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_lm45, '2026-01-08', 42, 140.00, 'Chantier Guéliz');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_lm45, '2026-01-20', 10, 140.00, 'Quincaillerie Hivernage');
END;
IF @v_fatima IS NOT NULL AND @p_bid_yv IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_bid_yv, '2026-01-14', 22, 250.00, 'Résidence Ménara');
END;

-- Janvier — Youssef
IF @v_youssef IS NOT NULL AND @p_wc_yv_sh IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_youssef, @p_wc_yv_sh, '2026-01-06', 38, 500.00, 'Lotissement Saïss');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_youssef, @p_wc_yv_sh, '2026-01-21', 14, 500.00, 'Client Meknès Centre');
END;

-- Janvier — Amina
IF @v_amina IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_amina, @p_wc_arena_bloc, '2026-01-09', 50, 450.00, 'Chantier Témara');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_amina, @p_wc_arena_bloc, '2026-01-25', 6, 450.00, 'Client Ain Attig');
END;

-- Février — Karim
IF @v_karim IS NOT NULL AND @p_lm35 IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_lm35, '2026-02-04', 40, 120.00, 'Promoteur Addoha');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_lm35, '2026-02-17', 28, 120.00, 'Client Bernoussi');
END;
IF @v_karim IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_karim, @p_wc_arena_bloc, '2026-02-11', 35, 450.00, 'Revendeur Ain Sebaa');
END;

-- Février — Fatima
IF @v_fatima IS NOT NULL AND @p_lm45 IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_lm45, '2026-02-03', 48, 140.00, 'Chantier Agdal Marrakech');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_lm45, '2026-02-19', 9, 140.00, 'Revendeur Massira');
END;
IF @v_fatima IS NOT NULL AND @p_bid_yv IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_fatima, @p_bid_yv, '2026-02-12', 30, 250.00, 'Résidence Al Mazar');
END;

-- Février — Youssef
IF @v_youssef IS NOT NULL AND @p_wc_yv_sh IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_youssef, @p_wc_yv_sh, '2026-02-07', 45, 500.00, 'Promoteur Fès Jdid');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_youssef, @p_wc_yv_sh, '2026-02-23', 10, 500.00, 'Client Route Imouzzer');
END;

-- Février — Amina
IF @v_amina IS NOT NULL AND @p_wc_arena_bloc IS NOT NULL
BEGIN
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_amina, @p_wc_arena_bloc, '2026-02-05', 52, 450.00, 'Chantier Harhoura');
    INSERT INTO sale_entries (user_id, product_id, sale_date, qty, unit_price, notes)
    VALUES (@v_amina, @p_wc_arena_bloc, '2026-02-20', 8, 450.00, 'Client Salé El Jadida');
END;