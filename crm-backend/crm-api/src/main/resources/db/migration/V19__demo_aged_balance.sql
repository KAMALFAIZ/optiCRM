SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- V19 — Données démo Balance Âgée
-- Assigne des comptes aux commerciaux et crée des factures réparties
-- dans toutes les tranches d'ancienneté (Non échu, 1-30j, 31-60j, 61-90j, 91j+)
-- =============================================================================

-- ─── 1. Assignation des comptes aux commerciaux ──────────────────────────────

-- El Boukhari Noureddine
UPDATE accounts SET assigned_to_id = 'ee042eb3-66ab-48d0-a118-bd9610c0cff9'
WHERE id IN (
    '2980c4bd-9fd5-45d9-bce2-e4b1a67a8d0c',  -- 1 ABDELHAMID VCT 2026
    '201ba5fc-c346-4af6-ab37-165776b55ebb',  -- 2 YOUNES VCT 2026
    '6fbea6c6-a5d0-4b2a-8821-243d6aee4e61'   -- 212 TRAVAUX & SERVICES
);

-- Ahmed Mkhaiter
UPDATE accounts SET assigned_to_id = 'fb23391e-a908-4b92-a495-1b5510d7251a'
WHERE id IN (
    '423387d7-0960-4eb1-a0db-28d1a7418d58',  -- 2Z PROMOTION SARL
    'ae83efc3-7393-428e-8625-00af1690951e'   -- 3 MBAREK VCT 2026
);

-- El Kacimi
UPDATE accounts SET assigned_to_id = 'ae9c5363-5237-4837-9e06-e52af1eee083'
WHERE id IN (
    'dc7c92f8-5656-4407-b28f-be04b7c0de2f',  -- 4 MOHAMED VCT 2026
    '79acf6ae-58dc-43a2-8451-7662d5b62a26'   -- A H CHRONO
);

-- Souhail Rachid
UPDATE accounts SET assigned_to_id = 'b19734f6-4165-4d26-acdf-8f5893344c46'
WHERE id IN (
    '8105b9ec-0e44-467d-9c72-bf0c29d2b47d',  -- AAKAKIR ESSALAM HAJ SAID
    '3ab1221d-9ed4-4aeb-858d-e6d43b864874',  -- ABA YASSINE YOUSSEF
    'fb381f28-69b7-4475-8243-7657dbc4cafe'   -- ABAD MOUHAMED
);

-- ─── 2. Factures démo ────────────────────────────────────────────────────────
-- Statuts valides pour la balance âgée : SENT, OVERDUE, PARTIALLY_PAID
-- (exclu de la requête : PAID, CANCELLED, DRAFT)

INSERT INTO invoices (
    id, invoice_number, status, account_id,
    invoice_date, due_date,
    subtotal, tax_amount, total, amount_paid,
    currency, billing_name, created_by_id
) VALUES

-- ── El Boukhari Noureddine ───────────────────────────────────────────────────

-- FAC-0001 | Non échu (+15 j) | 1 ABDELHAMID VCT 2026
(
    'ba1a0001-de00-0000-0000-000000000001', 'FAC-0001', 'SENT',
    '2980c4bd-9fd5-45d9-bce2-e4b1a67a8d0c',
    DATEADD(day, -15, CAST(GETDATE() AS DATE)), DATEADD(day, 15, CAST(GETDATE() AS DATE)),
    12500.00, 2500.00, 15000.00, 0.00,
    'MAD', '1 ABDELHAMID VCT 2026', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0002 | 1–30 j de retard | 2 YOUNES VCT 2026
(
    'ba1a0001-de00-0000-0000-000000000002', 'FAC-0002', 'OVERDUE',
    '201ba5fc-c346-4af6-ab37-165776b55ebb',
    DATEADD(day, -48, CAST(GETDATE() AS DATE)), DATEADD(day, -18, CAST(GETDATE() AS DATE)),
    7291.67, 1458.33, 8750.00, 0.00,
    'MAD', '2 YOUNES VCT 2026', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0003 | 31–60 j de retard | 212 TRAVAUX & SERVICES (partiellement payé)
(
    'ba1a0001-de00-0000-0000-000000000003', 'FAC-0003', 'PARTIALLY_PAID',
    '6fbea6c6-a5d0-4b2a-8821-243d6aee4e61',
    DATEADD(day, -72, CAST(GETDATE() AS DATE)), DATEADD(day, -42, CAST(GETDATE() AS DATE)),
    20416.67, 4083.33, 24500.00, 7000.00,
    'MAD', '212 TRAVAUX & SERVICES', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- ── Ahmed Mkhaiter ───────────────────────────────────────────────────────────

-- FAC-0004 | 61–90 j de retard | 2Z PROMOTION SARL
(
    'ba1a0001-de00-0000-0000-000000000004', 'FAC-0004', 'OVERDUE',
    '423387d7-0960-4eb1-a0db-28d1a7418d58',
    DATEADD(day, -102, CAST(GETDATE() AS DATE)), DATEADD(day, -72, CAST(GETDATE() AS DATE)),
    26000.00, 5200.00, 31200.00, 0.00,
    'MAD', '2Z PROMOTION SARL', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0005 | 91 j+ de retard | 3 MBAREK VCT 2026 (partiellement payé)
(
    'ba1a0001-de00-0000-0000-000000000005', 'FAC-0005', 'OVERDUE',
    'ae83efc3-7393-428e-8625-00af1690951e',
    DATEADD(day, -145, CAST(GETDATE() AS DATE)), DATEADD(day, -115, CAST(GETDATE() AS DATE)),
    40000.00, 8000.00, 48000.00, 12000.00,
    'MAD', '3 MBAREK VCT 2026', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- ── El Kacimi ────────────────────────────────────────────────────────────────

-- FAC-0006 | Non échu (+7 j) | 4 MOHAMED VCT 2026
(
    'ba1a0001-de00-0000-0000-000000000006', 'FAC-0006', 'SENT',
    'dc7c92f8-5656-4407-b28f-be04b7c0de2f',
    DATEADD(day, -23, CAST(GETDATE() AS DATE)), DATEADD(day, 7, CAST(GETDATE() AS DATE)),
    9583.33, 1916.67, 11500.00, 0.00,
    'MAD', '4 MOHAMED VCT 2026', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0007 | 1–30 j de retard | A H CHRONO
(
    'ba1a0001-de00-0000-0000-000000000007', 'FAC-0007', 'OVERDUE',
    '79acf6ae-58dc-43a2-8451-7662d5b62a26',
    DATEADD(day, -55, CAST(GETDATE() AS DATE)), DATEADD(day, -25, CAST(GETDATE() AS DATE)),
    7666.67, 1533.33, 9200.00, 0.00,
    'MAD', 'A H CHRONO', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0008 | 91 j+ de retard | A H CHRONO (deuxième facture)
(
    'ba1a0001-de00-0000-0000-000000000008', 'FAC-0008', 'OVERDUE',
    '79acf6ae-58dc-43a2-8451-7662d5b62a26',
    DATEADD(day, -125, CAST(GETDATE() AS DATE)), DATEADD(day, -95, CAST(GETDATE() AS DATE)),
    13333.33, 2666.67, 16000.00, 0.00,
    'MAD', 'A H CHRONO', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- ── Souhail Rachid ───────────────────────────────────────────────────────────

-- FAC-0009 | 31–60 j de retard | AAKAKIR ESSALAM HAJ SAID (partiellement payé)
(
    'ba1a0001-de00-0000-0000-000000000009', 'FAC-0009', 'PARTIALLY_PAID',
    '8105b9ec-0e44-467d-9c72-bf0c29d2b47d',
    DATEADD(day, -80, CAST(GETDATE() AS DATE)), DATEADD(day, -50, CAST(GETDATE() AS DATE)),
    16500.00, 3300.00, 19800.00, 4000.00,
    'MAD', 'AAKAKIR ESSALAM HAJ SAID', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0010 | 61–90 j de retard | ABA YASSINE YOUSSEF (partiellement payé)
(
    'ba1a0001-de00-0000-0000-000000000010', 'FAC-0010', 'PARTIALLY_PAID',
    '3ab1221d-9ed4-4aeb-858d-e6d43b864874',
    DATEADD(day, -110, CAST(GETDATE() AS DATE)), DATEADD(day, -80, CAST(GETDATE() AS DATE)),
    22916.67, 4583.33, 27500.00, 8000.00,
    'MAD', 'ABA YASSINE YOUSSEF', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0011 | 91 j+ de retard | ABAD MOUHAMED
(
    'ba1a0001-de00-0000-0000-000000000011', 'FAC-0011', 'OVERDUE',
    'fb381f28-69b7-4475-8243-7657dbc4cafe',
    DATEADD(day, -160, CAST(GETDATE() AS DATE)), DATEADD(day, -130, CAST(GETDATE() AS DATE)),
    45833.33, 9166.67, 55000.00, 0.00,
    'MAD', 'ABAD MOUHAMED', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
);

-- ─── 3. Lignes de facture ─────────────────────────────────────────────────────

INSERT INTO invoice_lines (
    invoice_id, description, quantity, unit_price,
    discount_amount, tax_rate, tax_amount, total, sort_order
) VALUES
    ('ba1a0001-de00-0000-0000-000000000001', 'Matériaux sanitaires — lot A',          10,    1250.00, 0.00, 20.00,  2500.00,  15000.00, 1),
    ('ba1a0001-de00-0000-0000-000000000002', 'Robinetterie professionnelle',            5,    1750.00, 0.00, 20.00,  1458.33,   8750.00, 1),
    ('ba1a0001-de00-0000-0000-000000000003', 'Carrelage mural 60×60 — 200 m²',        200,     102.08, 0.00, 20.00,  4083.33,  24500.00, 1),
    ('ba1a0001-de00-0000-0000-000000000004', 'Équipements plomberie professionnels',   12,    2166.67, 0.00, 20.00,  5200.00,  31200.00, 1),
    ('ba1a0001-de00-0000-0000-000000000005', 'Chauffe-eaux solaires × 8',              8,    6000.00, 0.00, 20.00,  8000.00,  48000.00, 1),
    ('ba1a0001-de00-0000-0000-000000000006', 'Accessoires salle de bain — gamme pro', 15,     766.67, 0.00, 20.00,  1916.67,  11500.00, 1),
    ('ba1a0001-de00-0000-0000-000000000007', 'Lavabos encastrés × 8',                  8,    1150.00, 0.00, 20.00,  1533.33,   9200.00, 1),
    ('ba1a0001-de00-0000-0000-000000000008', 'Baignoires acryliques × 4',               4,    4000.00, 0.00, 20.00,  2666.67,  16000.00, 1),
    ('ba1a0001-de00-0000-0000-000000000009', 'Système de chauffage central',             1,   19800.00, 0.00, 20.00,  3300.00,  19800.00, 1),
    ('ba1a0001-de00-0000-0000-000000000010', 'Douches à l''italienne × 6',              6,    4583.33, 0.00, 20.00,  4583.33,  27500.00, 1),
    ('ba1a0001-de00-0000-0000-000000000011', 'Équipement cuisine professionnelle',       1,   55000.00, 0.00, 20.00,  9166.67,  55000.00, 1);