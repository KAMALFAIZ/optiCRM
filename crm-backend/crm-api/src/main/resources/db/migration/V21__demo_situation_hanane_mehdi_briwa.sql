SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =============================================================================
-- V21 — Démo Situation Client : HANANE EL ASSOULI, MEHDI BENDAOUD, MOHAMED BRIWA
-- Limite de crédit, assurance, contacts, paiements + allocations
-- =============================================================================

-- ─── 1. Limite de crédit + Assurance ─────────────────────────────────────────

-- HANANE EL ASSOULI — encours ~36 500 MAD, limite 50 000 (utilisation 73 %)
UPDATE accounts SET
    credit_limit      = 50000.00,
    insurance_amount  = 30000.00,
    insurance_company = 'Atradius Maroc'
WHERE id = 'd68a9418-d8a9-48f6-8b99-b716b144d20c';

-- MEHDI BENDAOUD — encours 57 000 MAD > limite 50 000 → DÉPASSEMENT (alerte rouge)
UPDATE accounts SET
    credit_limit      = 50000.00,
    insurance_amount  = 40000.00,
    insurance_company = 'Coface Maroc'
WHERE id = '7ea6c015-d5ac-4204-92e5-bd9c24b9d401';

-- MOHAMED BRIWA — encours ~85 000 MAD, limite 100 000 (utilisation 85 %)
UPDATE accounts SET
    credit_limit      = 100000.00,
    insurance_amount  = 60000.00,
    insurance_company = 'Euler Hermes Maroc'
WHERE id = 'd771d400-1519-4f1c-b1be-2da4cb1d973e';

-- ─── 2. Contacts ─────────────────────────────────────────────────────────────

INSERT INTO contacts (
    id, first_name, last_name, email, phone_mobile, job_title,
    account_id, assigned_to_id, created_by_id
) VALUES

-- HANANE EL ASSOULI → directeur commercial
(
    'c1a00001-0000-0000-0000-000000000001',
    'Karim', 'El Assouli',
    'k.elassouli@hanane-btp.ma', '+212661100001',
    'Directeur Commercial',
    'd68a9418-d8a9-48f6-8b99-b716b144d20c',
    'cc1977bc-3b35-4eef-add3-a65ecf2113ea',
    '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- MEHDI BENDAOUD → responsable achats
(
    'c1a00001-0000-0000-0000-000000000002',
    'Nadia', 'Bendaoud',
    'n.bendaoud@bendaoud-const.ma', '+212661100002',
    'Responsable Achats',
    '7ea6c015-d5ac-4204-92e5-bd9c24b9d401',
    'cc1977bc-3b35-4eef-add3-a65ecf2113ea',
    '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

-- MOHAMED BRIWA → gérant
(
    'c1a00001-0000-0000-0000-000000000003',
    'Mohamed', 'Briwa',
    'm.briwa@briwa-travaux.ma', '+212661100003',
    'Gérant',
    'd771d400-1519-4f1c-b1be-2da4cb1d973e',
    'cc1977bc-3b35-4eef-add3-a65ecf2113ea',
    '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
);

-- ─── 3. Paiements ────────────────────────────────────────────────────────────
-- HANANE : acompte 10 000 MAD sur FAC-0021 (PARTIALLY_PAID)
-- BRIWA  : acompte  3 000 MAD sur FAC-0025 (OVERDUE, partiellement payé)

INSERT INTO payments (
    id, payment_number, account_id,
    payment_date, amount, currency,
    payment_method, reference, status,
    notes, created_by_id
) VALUES

(
    'ab000001-0000-0000-0000-000000000001',
    'PAY-DEMO-001',
    'd68a9418-d8a9-48f6-8b99-b716b144d20c',
    DATEADD(day, -35, CAST(GETDATE() AS DATE)),
    10000.00, 'MAD',
    'CHECK', 'CHQ-2026-11234', 'ALLOCATED',
    'Acompte sur FAC-0021 — Revêtement sol & mur',
    '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
),

(
    'ab000001-0000-0000-0000-000000000002',
    'PAY-DEMO-002',
    'd771d400-1519-4f1c-b1be-2da4cb1d973e',
    DATEADD(day, -18, CAST(GETDATE() AS DATE)),
    3000.00, 'MAD',
    'BANK_TRANSFER', 'VIR-2026-00892', 'ALLOCATED',
    'Acompte sur FAC-0025 — Fourniture plomberie diverse',
    '1ead2f05-c2d3-46a9-9959-6dcb000bfe24'
);

-- ─── 4. Allocations paiements → factures ─────────────────────────────────────

INSERT INTO payment_allocations (payment_id, invoice_id, amount) VALUES
(
    'ab000001-0000-0000-0000-000000000001',
    'ba2a0001-de00-0000-0000-000000000021',   -- FAC-0021 HANANE
    10000.00
),
(
    'ab000001-0000-0000-0000-000000000002',
    'ba2a0001-de00-0000-0000-000000000025',   -- FAC-0025 BRIWA
    3000.00
);