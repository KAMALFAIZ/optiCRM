SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V79: Seed demo data — Supervisor + 4 Commercials
-- with accounts, opportunities, visits, and assignments
-- =====================================================

DECLARE
    @role_commercial  UNIQUEIDENTIFIER,
    @role_superviseur UNIQUEIDENTIFIER,
    @admin_user       UNIQUEIDENTIFIER,

    -- Users
    @sup_id    UNIQUEIDENTIFIER = NEWID(),
    @com1_id   UNIQUEIDENTIFIER = NEWID(),
    @com2_id   UNIQUEIDENTIFIER = NEWID(),
    @com3_id   UNIQUEIDENTIFIER = NEWID(),
    @com4_id   UNIQUEIDENTIFIER = NEWID(),

    -- Demo accounts (one per commercial)
    @acc1_id   UNIQUEIDENTIFIER = NEWID(),
    @acc2_id   UNIQUEIDENTIFIER = NEWID(),
    @acc3_id   UNIQUEIDENTIFIER = NEWID(),
    @acc4_id   UNIQUEIDENTIFIER = NEWID(),

    -- Opportunity stages
    @stage_won  UNIQUEIDENTIFIER,
    @stage_lost UNIQUEIDENTIFIER,
    @stage_nego UNIQUEIDENTIFIER,
    @stage_qual UNIQUEIDENTIFIER,
    @stage_prop UNIQUEIDENTIFIER,

    -- Password hash (same as admin: Admin123!)
    @pw NVARCHAR(255) = '$2a$10$eone.sEAqB7BnZ1erdDgouhdxMuYKztnnmUrbXtfr12xffsmNxd6e',

    @i INT;

-- Resolve role IDs
SELECT @role_commercial  = id FROM roles WHERE name = 'COMMERCIAL';
SELECT @role_superviseur = id FROM roles WHERE name = 'SUPERVISEUR';
SELECT @admin_user       = id FROM users WHERE email = 'admin@odyssee.ma';

-- Resolve opportunity stages
SELECT @stage_won  = id FROM opportunity_stages WHERE name = N'Gagné';
SELECT @stage_lost = id FROM opportunity_stages WHERE name = N'Perdu';
SELECT @stage_nego = id FROM opportunity_stages WHERE name = N'Négociation';
SELECT @stage_qual = id FROM opportunity_stages WHERE name = 'Qualification';
SELECT @stage_prop = id FROM opportunity_stages WHERE name = 'Proposition';

IF @role_commercial IS NULL OR @role_superviseur IS NULL
BEGIN
    PRINT 'SKIP: roles COMMERCIAL or SUPERVISEUR not found';
    RETURN;
END

-- =====================================================
-- 1. Create users
-- =====================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active)
VALUES (@sup_id,  'nabil.tahiri@odyssee.ma',   @pw, 'Nabil',   'Tahiri',   @role_superviseur, 1),
       (@com1_id, 'karim.benali@odyssee.ma',   @pw, 'Karim',   'Benali',   @role_commercial, 1),
       (@com2_id, 'fatima.ezzahra@odyssee.ma',  @pw, 'Fatima',  'Ezzahra',  @role_commercial, 1),
       (@com3_id, 'youssef.amrani@odyssee.ma',  @pw, 'Youssef', 'Amrani',   @role_commercial, 1),
       (@com4_id, 'amina.chraibi@odyssee.ma',   @pw, 'Amina',   'Chraibi',  @role_commercial, 1);

PRINT 'Users: 1 superviseur + 4 commerciaux';

-- =====================================================
-- 2. Create demo accounts (required FK for opportunities)
-- =====================================================

INSERT INTO accounts (id, name, billing_city, billing_country, assigned_to_id, created_at, updated_at)
VALUES (@acc1_id, N'BTP Casablanca SARL',    N'Casablanca', N'Maroc', @com1_id, SYSUTCDATETIME(), SYSUTCDATETIME()),
       (@acc2_id, N'Immo Marrakech SA',      N'Marrakech',  N'Maroc', @com2_id, SYSUTCDATETIME(), SYSUTCDATETIME()),
       (@acc3_id, N'Ets Fès Matériaux',      N'Fès',        N'Maroc', @com3_id, SYSUTCDATETIME(), SYSUTCDATETIME()),
       (@acc4_id, N'Rabat Aménagement SARL', N'Rabat',      N'Maroc', @com4_id, SYSUTCDATETIME(), SYSUTCDATETIME());

PRINT 'Accounts created';

-- =====================================================
-- 3. Create opportunities
-- =====================================================

-- Karim: strong — 5 won, 1 lost, 2 open
SET @i = 1;
WHILE @i <= 5 BEGIN
    INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, close_date, account_id, assigned_to_id, created_at, updated_at)
    VALUES (NEWID(), N'Projet Karim-W' + CAST(@i AS NVARCHAR), @stage_won,
            45000 + (@i * 12000), 100, 1, 1,
            DATEADD(DAY, -(@i * 7), CAST(GETUTCDATE() AS DATE)),
            @acc1_id, @com1_id,
            DATEADD(DAY, -(@i * 14), SYSUTCDATETIME()), SYSUTCDATETIME());
    SET @i = @i + 1;
END;

INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, close_date, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Projet Karim-L1', @stage_lost, 30000, 0, 1, 0,
        DATEADD(DAY, -10, CAST(GETUTCDATE() AS DATE)), @acc1_id, @com1_id,
        DATEADD(DAY, -30, SYSUTCDATETIME()), SYSUTCDATETIME());

INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Chantier Karim-O1', @stage_nego, 85000, 60, 0, 0, @acc1_id, @com1_id, DATEADD(DAY, -5, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Chantier Karim-O2', @stage_prop, 42000, 40, 0, 0, @acc1_id, @com1_id, DATEADD(DAY, -3, SYSUTCDATETIME()), SYSUTCDATETIME());

-- Fatima: good — 3 won, 2 lost, 3 open
SET @i = 1;
WHILE @i <= 3 BEGIN
    INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, close_date, account_id, assigned_to_id, created_at, updated_at)
    VALUES (NEWID(), N'Affaire Fatima-W' + CAST(@i AS NVARCHAR), @stage_won,
            35000 + (@i * 8000), 100, 1, 1,
            DATEADD(DAY, -(@i * 10), CAST(GETUTCDATE() AS DATE)),
            @acc2_id, @com2_id,
            DATEADD(DAY, -(@i * 20), SYSUTCDATETIME()), SYSUTCDATETIME());
    SET @i = @i + 1;
END;

INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, close_date, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Affaire Fatima-L1', @stage_lost, 22000, 0, 1, 0, DATEADD(DAY, -15, CAST(GETUTCDATE() AS DATE)), @acc2_id, @com2_id, DATEADD(DAY, -40, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Affaire Fatima-L2', @stage_lost, 18000, 0, 1, 0, DATEADD(DAY, -8, CAST(GETUTCDATE() AS DATE)), @acc2_id, @com2_id, DATEADD(DAY, -35, SYSUTCDATETIME()), SYSUTCDATETIME());

INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Prospect Fatima-O1', @stage_qual, 55000, 30, 0, 0, @acc2_id, @com2_id, DATEADD(DAY, -7, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Prospect Fatima-O2', @stage_nego, 72000, 50, 0, 0, @acc2_id, @com2_id, DATEADD(DAY, -4, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Prospect Fatima-O3', @stage_prop, 38000, 40, 0, 0, @acc2_id, @com2_id, DATEADD(DAY, -2, SYSUTCDATETIME()), SYSUTCDATETIME());

-- Youssef: weak — 1 won, 3 lost, 1 open
INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, close_date, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Deal Youssef-W1', @stage_won, 28000, 100, 1, 1, DATEADD(DAY, -20, CAST(GETUTCDATE() AS DATE)), @acc3_id, @com3_id, DATEADD(DAY, -50, SYSUTCDATETIME()), SYSUTCDATETIME());

SET @i = 1;
WHILE @i <= 3 BEGIN
    INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, close_date, account_id, assigned_to_id, created_at, updated_at)
    VALUES (NEWID(), N'Deal Youssef-L' + CAST(@i AS NVARCHAR), @stage_lost,
            15000 + (@i * 5000), 0, 1, 0,
            DATEADD(DAY, -(@i * 12), CAST(GETUTCDATE() AS DATE)),
            @acc3_id, @com3_id,
            DATEADD(DAY, -(@i * 25), SYSUTCDATETIME()), SYSUTCDATETIME());
    SET @i = @i + 1;
END;

INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Prospect Youssef-O1', @stage_qual, 32000, 20, 0, 0, @acc3_id, @com3_id, DATEADD(DAY, -6, SYSUTCDATETIME()), SYSUTCDATETIME());

-- Amina: promising — 2 won, 0 lost, 4 open
INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, close_date, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Projet Amina-W1', @stage_won, 52000, 100, 1, 1, DATEADD(DAY, -5, CAST(GETUTCDATE() AS DATE)), @acc4_id, @com4_id, DATEADD(DAY, -25, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Projet Amina-W2', @stage_won, 38000, 100, 1, 1, DATEADD(DAY, -12, CAST(GETUTCDATE() AS DATE)), @acc4_id, @com4_id, DATEADD(DAY, -30, SYSUTCDATETIME()), SYSUTCDATETIME());

INSERT INTO opportunities (id, name, stage_id, amount, probability, is_closed, is_won, account_id, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), N'Chantier Amina-O1', @stage_nego, 95000, 55, 0, 0, @acc4_id, @com4_id, DATEADD(DAY, -8, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Chantier Amina-O2', @stage_prop, 62000, 45, 0, 0, @acc4_id, @com4_id, DATEADD(DAY, -6, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Chantier Amina-O3', @stage_qual, 44000, 30, 0, 0, @acc4_id, @com4_id, DATEADD(DAY, -3, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), N'Chantier Amina-O4', @stage_nego, 78000, 60, 0, 0, @acc4_id, @com4_id, DATEADD(DAY, -1, SYSUTCDATETIME()), SYSUTCDATETIME());

PRINT 'Opportunities created';

-- =====================================================
-- 4. Create visits (visit_type + subject are required)
-- =====================================================

-- Karim: 12 visits (10 completed, 2 planned), with mileage/expenses
SET @i = 1;
WHILE @i <= 10 BEGIN
    INSERT INTO visits (id, visit_type, subject, status, visit_date, mileage, expenses, assigned_to_id, created_at, updated_at)
    VALUES (NEWID(), 'prospection',
            N'Visite client Karim-' + CAST(@i AS NVARCHAR),
            'completed',
            DATEADD(DAY, -(@i * 3), SYSUTCDATETIME()),
            25 + (@i * 5), 80 + (@i * 15),
            @com1_id, DATEADD(DAY, -(@i * 3 + 1), SYSUTCDATETIME()), SYSUTCDATETIME());
    SET @i = @i + 1;
END;
INSERT INTO visits (id, visit_type, subject, status, visit_date, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), 'follow_up', N'Visite prospect Karim-P1', 'planned', DATEADD(DAY, 2, SYSUTCDATETIME()), @com1_id, SYSUTCDATETIME(), SYSUTCDATETIME()),
       (NEWID(), 'follow_up', N'Visite prospect Karim-P2', 'planned', DATEADD(DAY, 5, SYSUTCDATETIME()), @com1_id, SYSUTCDATETIME(), SYSUTCDATETIME());

-- Fatima: 8 visits (6 completed, 1 in_progress, 1 planned)
SET @i = 1;
WHILE @i <= 6 BEGIN
    INSERT INTO visits (id, visit_type, subject, status, visit_date, mileage, expenses, assigned_to_id, created_at, updated_at)
    VALUES (NEWID(), 'prospection',
            N'Visite terrain Fatima-' + CAST(@i AS NVARCHAR),
            'completed',
            DATEADD(DAY, -(@i * 4), SYSUTCDATETIME()),
            30 + (@i * 8), 60 + (@i * 20),
            @com2_id, DATEADD(DAY, -(@i * 4 + 1), SYSUTCDATETIME()), SYSUTCDATETIME());
    SET @i = @i + 1;
END;
INSERT INTO visits (id, visit_type, subject, status, visit_date, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), 'technical', N'Visite en cours Fatima', 'in_progress', SYSUTCDATETIME(), @com2_id, SYSUTCDATETIME(), SYSUTCDATETIME()),
       (NEWID(), 'follow_up', N'Visite prévue Fatima', 'planned', DATEADD(DAY, 3, SYSUTCDATETIME()), @com2_id, SYSUTCDATETIME(), SYSUTCDATETIME());

-- Youssef: 2 visits only (low activity triggers alerts)
INSERT INTO visits (id, visit_type, subject, status, visit_date, mileage, expenses, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), 'prospection', N'Visite Youssef-1', 'completed', DATEADD(DAY, -15, SYSUTCDATETIME()), 45, 120, @com3_id, DATEADD(DAY, -16, SYSUTCDATETIME()), SYSUTCDATETIME()),
       (NEWID(), 'follow_up',   N'Visite Youssef-2', 'planned', DATEADD(DAY, 7, SYSUTCDATETIME()), NULL, NULL, @com3_id, SYSUTCDATETIME(), SYSUTCDATETIME());

-- Amina: 7 visits (5 completed, 2 in_progress)
SET @i = 1;
WHILE @i <= 5 BEGIN
    INSERT INTO visits (id, visit_type, subject, status, visit_date, mileage, expenses, assigned_to_id, created_at, updated_at)
    VALUES (NEWID(), 'prospection',
            N'Visite chantier Amina-' + CAST(@i AS NVARCHAR),
            'completed',
            DATEADD(DAY, -(@i * 3), SYSUTCDATETIME()),
            20 + (@i * 6), 50 + (@i * 25),
            @com4_id, DATEADD(DAY, -(@i * 3 + 1), SYSUTCDATETIME()), SYSUTCDATETIME());
    SET @i = @i + 1;
END;
INSERT INTO visits (id, visit_type, subject, status, visit_date, assigned_to_id, created_at, updated_at)
VALUES (NEWID(), 'technical', N'Visite en cours Amina-1', 'in_progress', SYSUTCDATETIME(), @com4_id, SYSUTCDATETIME(), SYSUTCDATETIME()),
       (NEWID(), 'support',   N'Visite en cours Amina-2', 'in_progress', DATEADD(HOUR, -2, SYSUTCDATETIME()), @com4_id, SYSUTCDATETIME(), SYSUTCDATETIME());

PRINT 'Visits created';

-- =====================================================
-- 5. Supervisor assignments
-- =====================================================

INSERT INTO supervisor_assignments (id, supervisor_id, collaborator_id, assigned_at, assigned_by_id, notes, is_active)
VALUES
    (NEWID(), @sup_id, @com1_id, SYSUTCDATETIME(), @admin_user, N'Zone Casablanca Nord', 1),
    (NEWID(), @sup_id, @com2_id, SYSUTCDATETIME(), @admin_user, N'Zone Marrakech Sud', 1),
    (NEWID(), @sup_id, @com3_id, SYSUTCDATETIME(), @admin_user, N'Zone Fès-Meknès — suivi renforcé', 1),
    (NEWID(), @sup_id, @com4_id, SYSUTCDATETIME(), @admin_user, N'Nouvelle recrue — accompagnement', 1);

PRINT 'Supervisor assignments created';
GO
