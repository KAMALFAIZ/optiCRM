SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- V20 — Démo Balance Âgée : HANANE EL ASSOULI, MEHDI BENDAOUD, MOHAMED BRIWA
-- Assignation à Zeroual + factures dans chaque tranche
-- =============================================================================

-- ─── 1. Assignation à Zeroual (cc1977bc-3b35-4eef-add3-a65ecf2113ea) ─────────
UPDATE accounts SET assigned_to_id = 'cc1977bc-3b35-4eef-add3-a65ecf2113ea'
WHERE id IN (
    'd68a9418-d8a9-48f6-8b99-b716b144d20c',  -- HANANE EL ASSOULI
    '7ea6c015-d5ac-4204-92e5-bd9c24b9d401',  -- MEHDI BENDAOUD
    'd771d400-1519-4f1c-b1be-2da4cb1d973e'   -- MOHAMED BRIWA
);

-- ─── 2. Factures ─────────────────────────────────────────────────────────────

INSERT INTO invoices (
    id, invoice_number, status, account_id,
    invoice_date, due_date,
    subtotal, tax_amount, total, amount_paid,
    currency, billing_name, created_by_id
) VALUES

-- ── HANANE EL ASSOULI ──────────────────────────────────────────────────────

-- FAC-0020 | Non échu (+20 j)
(
    'ba2a0001-de00-0000-0000-000000000020', 'FAC-0020', 'SENT',
    'd68a9418-d8a9-48f6-8b99-b716b144d20c',
    DATEADD(day, -10, CAST(GETDATE() AS DATE)), DATEADD(day, 20, CAST(GETDATE() AS DATE)),
    13750.00, 2750.00, 16500.00, 0.00,
    'MAD', 'HANANE EL ASSOULI', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0021 | 31–60 j de retard (partiellement payé)
(
    'ba2a0001-de00-0000-0000-000000000021', 'FAC-0021', 'PARTIALLY_PAID',
    'd68a9418-d8a9-48f6-8b99-b716b144d20c',
    DATEADD(day, -70, CAST(GETDATE() AS DATE)), DATEADD(day, -40, CAST(GETDATE() AS DATE)),
    25000.00, 5000.00, 30000.00, 10000.00,
    'MAD', 'HANANE EL ASSOULI', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- ── MEHDI BENDAOUD ─────────────────────────────────────────────────────────

-- FAC-0022 | 1–30 j de retard
(
    'ba2a0001-de00-0000-0000-000000000022', 'FAC-0022', 'OVERDUE',
    '7ea6c015-d5ac-4204-92e5-bd9c24b9d401',
    DATEADD(day, -40, CAST(GETDATE() AS DATE)), DATEADD(day, -10, CAST(GETDATE() AS DATE)),
    18333.33, 3666.67, 22000.00, 0.00,
    'MAD', 'MEHDI BENDAOUD', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0023 | 61–90 j de retard
(
    'ba2a0001-de00-0000-0000-000000000023', 'FAC-0023', 'OVERDUE',
    '7ea6c015-d5ac-4204-92e5-bd9c24b9d401',
    DATEADD(day, -110, CAST(GETDATE() AS DATE)), DATEADD(day, -75, CAST(GETDATE() AS DATE)),
    29166.67, 5833.33, 35000.00, 0.00,
    'MAD', 'MEHDI BENDAOUD', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- ── MOHAMED BRIWA ──────────────────────────────────────────────────────────

-- FAC-0024 | 91 j+ de retard (grosse créance)
(
    'ba2a0001-de00-0000-0000-000000000024', 'FAC-0024', 'OVERDUE',
    'd771d400-1519-4f1c-b1be-2da4cb1d973e',
    DATEADD(day, -180, CAST(GETDATE() AS DATE)), DATEADD(day, -150, CAST(GETDATE() AS DATE)),
    62500.00, 12500.00, 75000.00, 0.00,
    'MAD', 'MOHAMED BRIWA', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- FAC-0025 | 1–30 j de retard
(
    'ba2a0001-de00-0000-0000-000000000025', 'FAC-0025', 'OVERDUE',
    'd771d400-1519-4f1c-b1be-2da4cb1d973e',
    DATEADD(day, -50, CAST(GETDATE() AS DATE)), DATEADD(day, -20, CAST(GETDATE() AS DATE)),
    10833.33, 2166.67, 13000.00, 3000.00,
    'MAD', 'MOHAMED BRIWA', '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
);

-- ─── 3. Lignes de facture ─────────────────────────────────────────────────────

INSERT INTO invoice_lines (
    invoice_id, description, quantity, unit_price,
    discount_amount, tax_rate, tax_amount, total, sort_order
) VALUES
    ('ba2a0001-de00-0000-0000-000000000020', 'Accessoires sanitaires haut de gamme',  10,  1650.00, 0.00, 20.00,  2750.00, 16500.00, 1),
    ('ba2a0001-de00-0000-0000-000000000021', 'Revêtement sol & mur — 150 m²',        150,   200.00, 0.00, 20.00,  5000.00, 30000.00, 1),
    ('ba2a0001-de00-0000-0000-000000000022', 'Robinetterie encastrée × 12',           12,  1833.33, 0.00, 20.00,  3666.67, 22000.00, 1),
    ('ba2a0001-de00-0000-0000-000000000023', 'Équipements salle de bain complète × 5', 5, 7000.00, 0.00, 20.00,  5833.33, 35000.00, 1),
    ('ba2a0001-de00-0000-0000-000000000024', 'Chantier rénovation complète — Lot A',   1,75000.00, 0.00, 20.00, 12500.00, 75000.00, 1),
    ('ba2a0001-de00-0000-0000-000000000025', 'Fourniture plomberie diverse',            1,13000.00, 0.00, 20.00,  2166.67, 13000.00, 1);