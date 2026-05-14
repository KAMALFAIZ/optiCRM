SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================
-- V75 : Données de démonstration — Module Livraison (complet)
-- Couvre le cycle métier intégral :
--   Prix produits  → Lots FEFO  → Promotions  → Prix overrides
--   Objectifs reps → Pré-commandes → Chargement → Livraisons
--   Instruments de paiement → Retours → Déchargement → Settlement
--   GPS tracking → Sync offline logs → Dashboard KPIs
--
-- Scénarios :
--   [A] Tournée CLOSED  (hier)  — cycle complet, settlement finalisé
--   [B] Tournée EN_COURS (auj.) — en cours de livraison
--   [C] Tournée VALIDE  (demain)— planifiée, prête au départ
--   [D] Tournée CLOSED  (J-7)  — écart caisse → PENDING_APPROVAL
-- ============================================================

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001'; -- tenant par défaut

-- ─── Récupération des références existantes ──────────────────────────────────

DECLARE
    -- Représentants (utilisateurs COMMERCIAL)
    @rep1  UNIQUEIDENTIFIER,
    @rep2  UNIQUEIDENTIFIER,
    @rep3  UNIQUEIDENTIFIER,

    -- Clients (accounts)
    @clt1  UNIQUEIDENTIFIER,
    @clt2  UNIQUEIDENTIFIER,
    @clt3  UNIQUEIDENTIFIER,
    @clt4  UNIQUEIDENTIFIER,
    @clt5  UNIQUEIDENTIFIER,
    @clt6  UNIQUEIDENTIFIER,

    -- Produits
    @prod1 UNIQUEIDENTIFIER,   -- WC (ex. WC-ARENA-BLOC)
    @prod2 UNIQUEIDENTIFIER,   -- Lavabo (ex. LM-45X34)
    @prod3 UNIQUEIDENTIFIER,   -- Bidet
    @prod4 UNIQUEIDENTIFIER,   -- Vasque
    @prod5 UNIQUEIDENTIFIER,   -- WC 2

    -- Entrepôt principal
    @wh1   UNIQUEIDENTIFIER,

    -- Superviseur (ADMIN ou MANAGER)
    @sup1  UNIQUEIDENTIFIER;

-- Représentants (les 3 premiers commerciaux actifs)
SELECT TOP 1 @rep1 = id FROM users WHERE tenant_id = @TID AND is_active = 1
    AND id NOT IN (SELECT TOP 0 id FROM users ORDER BY created_at) ORDER BY created_at ASC;
SELECT TOP 1 @rep2 = id FROM users WHERE tenant_id = @TID AND is_active = 1
    AND id <> ISNULL(@rep1, '00000000-0000-0000-0000-000000000000') ORDER BY created_at ASC;
SELECT TOP 1 @rep3 = id FROM users WHERE tenant_id = @TID AND is_active = 1
    AND id NOT IN (ISNULL(@rep1,'00000000-0000-0000-0000-000000000000'),
                   ISNULL(@rep2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at ASC;

-- Superviseur (différent des reps)
SELECT TOP 1 @sup1 = id FROM users WHERE tenant_id = @TID AND is_active = 1
    AND id NOT IN (ISNULL(@rep1,'00000000-0000-0000-0000-000000000000'),
                   ISNULL(@rep2,'00000000-0000-0000-0000-000000000000'),
                   ISNULL(@rep3,'00000000-0000-0000-0000-000000000000'))
    ORDER BY created_at ASC;

-- Clients (6 comptes actifs avec latitude non nulle si possible)
SELECT TOP 1 @clt1 = id FROM accounts WHERE tenant_id = @TID ORDER BY NEWID();
SELECT TOP 1 @clt2 = id FROM accounts WHERE tenant_id = @TID AND id <> ISNULL(@clt1,'00000000-0000-0000-0000-000000000000') ORDER BY NEWID();
SELECT TOP 1 @clt3 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt4 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt5 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt4,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt6 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt4,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt5,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();

-- Produits (par code)
SELECT @prod1 = id FROM products WHERE code = 'WC-ARENA-BLOC' AND tenant_id = @TID;
SELECT @prod2 = id FROM products WHERE code = 'LM-45X34'      AND tenant_id = @TID;
SELECT @prod3 = id FROM products WHERE code = 'WC-ARENA-PACK' AND tenant_id = @TID;
SELECT @prod4 = id FROM products WHERE code = 'LM-35'         AND tenant_id = @TID;
SELECT @prod5 = id FROM products WHERE code = 'LM-ARENA-BL'   AND tenant_id = @TID;

-- Fallback : prendre les 5 premiers produits actifs si les codes n'existent pas
IF @prod1 IS NULL SELECT TOP 1 @prod1 = id FROM products WHERE is_active = 1 AND is_sellable = 1 AND tenant_id = @TID ORDER BY created_at;
IF @prod2 IS NULL SELECT TOP 1 @prod2 = id FROM products WHERE is_active = 1 AND is_sellable = 1 AND tenant_id = @TID AND id <> ISNULL(@prod1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
IF @prod3 IS NULL SELECT TOP 1 @prod3 = id FROM products WHERE is_active = 1 AND is_sellable = 1 AND tenant_id = @TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;
IF @prod4 IS NULL SELECT TOP 1 @prod4 = id FROM products WHERE is_active = 1 AND is_sellable = 1 AND tenant_id = @TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod3,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;
IF @prod5 IS NULL SELECT TOP 1 @prod5 = id FROM products WHERE is_active = 1 AND is_sellable = 1 AND tenant_id = @TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod3,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod4,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;

-- Entrepôt
SELECT TOP 1 @wh1 = id FROM warehouses WHERE is_active = 1 ORDER BY is_default DESC, created_at;

-- ─── Mise à jour des prix produits (réalistes Maroc) ─────────────────────────
UPDATE products SET unit_price = 1850.00 WHERE id = @prod1 AND unit_price = 0;
UPDATE products SET unit_price =  420.00 WHERE id = @prod2 AND unit_price = 0;
UPDATE products SET unit_price = 2200.00 WHERE id = @prod3 AND unit_price = 0;
UPDATE products SET unit_price =  380.00 WHERE id = @prod4 AND unit_price = 0;
UPDATE products SET unit_price =  460.00 WHERE id = @prod5 AND unit_price = 0;

-- Mise à jour crédit client pour les tests
UPDATE accounts SET credit_limit = 50000.00 WHERE id = @clt1;
UPDATE accounts SET credit_limit = 30000.00 WHERE id = @clt2;
UPDATE accounts SET credit_limit = 80000.00 WHERE id = @clt3;
UPDATE accounts SET credit_limit = 15000.00 WHERE id = @clt4;
UPDATE accounts SET credit_limit = 25000.00 WHERE id = @clt5;
UPDATE accounts SET credit_limit =  5000.00 WHERE id = @clt6;

GO

-- ════════════════════════════════════════════════════════════════
-- SECTION 1 — DONNÉES DE RÉFÉRENCE LIVRAISON
-- ════════════════════════════════════════════════════════════════

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
DECLARE @prod1 UNIQUEIDENTIFIER, @prod2 UNIQUEIDENTIFIER, @prod3 UNIQUEIDENTIFIER,
        @prod4 UNIQUEIDENTIFIER, @prod5 UNIQUEIDENTIFIER;
SELECT @prod1 = id FROM products WHERE code = 'WC-ARENA-BLOC' AND tenant_id = @TID;
IF @prod1 IS NULL SELECT TOP 1 @prod1 = id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID ORDER BY created_at;
SELECT @prod2 = id FROM products WHERE code = 'LM-45X34'      AND tenant_id = @TID;
IF @prod2 IS NULL SELECT TOP 1 @prod2 = id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id<>ISNULL(@prod1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
SELECT @prod3 = id FROM products WHERE code = 'WC-ARENA-PACK' AND tenant_id = @TID;
IF @prod3 IS NULL SELECT TOP 1 @prod3 = id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;
SELECT @prod4 = id FROM products WHERE code = 'LM-35'         AND tenant_id = @TID;
IF @prod4 IS NULL SELECT TOP 1 @prod4 = id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod3,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;
SELECT @prod5 = id FROM products WHERE code = 'LM-ARENA-BL'   AND tenant_id = @TID;
IF @prod5 IS NULL SELECT TOP 1 @prod5 = id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod3,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod4,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;

DECLARE @wh1 UNIQUEIDENTIFIER;
SELECT TOP 1 @wh1 = id FROM warehouses WHERE is_active = 1 ORDER BY is_default DESC, created_at;

-- ── 1.1 Lots (FEFO) ──────────────────────────────────────────────────────────

DECLARE
    @lot1 UNIQUEIDENTIFIER = NEWID(),   -- expire dans 180 j (sain)
    @lot2 UNIQUEIDENTIFIER = NEWID(),   -- expire dans 20 j (WARNING)
    @lot3 UNIQUEIDENTIFIER = NEWID(),   -- expire dans 5 j (CRITICAL)
    @lot4 UNIQUEIDENTIFIER = NEWID(),   -- prod2 — sain
    @lot5 UNIQUEIDENTIFIER = NEWID();   -- prod3 — sain

INSERT INTO product_batch (id, item_id, batch_number, expiry_date, quantity, warehouse_id, status, notes, tenant_id, created_at)
VALUES
(@lot1, @prod1, 'LOT-WC-2025-001', DATEADD(day,180,GETDATE()), 120, @wh1, 'ACTIVE', 'Lot principal WC ARENA BLOC',    @TID, GETUTCDATE()),
(@lot2, @prod1, 'LOT-WC-2025-002', DATEADD(day, 20,GETDATE()),  40, @wh1, 'ACTIVE', 'Lot approchant DLC',              @TID, GETUTCDATE()),
(@lot3, @prod1, 'LOT-WC-2024-099', DATEADD(day,  5,GETDATE()),  10, @wh1, 'ACTIVE', 'Lot critique — priorité FEFO',    @TID, GETUTCDATE()),
(@lot4, @prod2, 'LOT-LM-2025-010', DATEADD(day,365,GETDATE()),  80, @wh1, 'ACTIVE', 'Lot lave-mains standard',         @TID, GETUTCDATE()),
(@lot5, @prod3, 'LOT-WCP-2025-005',DATEADD(day,240,GETDATE()),  60, @wh1, 'ACTIVE', 'Lot WC PACK',                     @TID, GETUTCDATE());

-- ── 1.2 Promotions (gratuités) ───────────────────────────────────────────────

DECLARE
    @promo1 UNIQUEIDENTIFIER = NEWID(),
    @promo2 UNIQUEIDENTIFIER = NEWID(),
    @promo3 UNIQUEIDENTIFIER = NEWID();

INSERT INTO delivery_promotion (id, name, description, item_id, min_quantity, bonus_item_id, bonus_quantity,
    zone, valid_from, valid_to, is_active, tenant_id, created_at)
VALUES
(@promo1, 'Promo WC 10+1', 'Acheter 10 WC ARENA BLOC, recevoir 1 lave-main offert',
    @prod1, 10, @prod2, 1, NULL, DATEADD(month,-1,GETDATE()), DATEADD(month,3,GETDATE()), 1, @TID, GETUTCDATE()),

(@promo2, 'Promo LM Zone Casa 5+1', 'Acheter 5 LM 45X34 (zone Casa), 1 offert',
    @prod2, 5, @prod4, 1, 'Casablanca', DATEADD(month,-2,GETDATE()), DATEADD(month,2,GETDATE()), 1, @TID, GETUTCDATE()),

(@promo3, 'Promo WC PACK 20+2', 'Acheter 20 WC PACK, recevoir 2 LM ARENA offerts',
    @prod3, 20, @prod5, 2, NULL, DATEADD(month,-1,GETDATE()), DATEADD(month,6,GETDATE()), 1, @TID, GETUTCDATE());

-- ── 1.3 Tarification client (delivery_price_override) ────────────────────────

DECLARE @clt1 UNIQUEIDENTIFIER, @clt2 UNIQUEIDENTIFIER, @clt3 UNIQUEIDENTIFIER,
        @clt4 UNIQUEIDENTIFIER, @clt5 UNIQUEIDENTIFIER, @clt6 UNIQUEIDENTIFIER;
SELECT TOP 1 @clt1 = id FROM accounts WHERE tenant_id = @TID ORDER BY NEWID();
SELECT TOP 1 @clt2 = id FROM accounts WHERE tenant_id = @TID AND id<>ISNULL(@clt1,'00000000-0000-0000-0000-000000000000') ORDER BY NEWID();
SELECT TOP 1 @clt3 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt4 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt5 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt4,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt6 = id FROM accounts WHERE tenant_id = @TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt4,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt5,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();

-- Prix spécial client 1 (grossiste) — 10% sous le tarif standard
INSERT INTO delivery_price_override (id, item_id, customer_id, pricing_category_id, unit_price,
    valid_from, valid_to, is_active, notes, tenant_id, created_at)
VALUES
(NEWID(), @prod1, @clt1, NULL, 1665.00, DATEADD(month,-6,GETDATE()), DATEADD(month,6,GETDATE()), 1,
    'Tarif préférentiel grossiste — remise 10%', @TID, GETUTCDATE()),
(NEWID(), @prod2, @clt1, NULL,  378.00, DATEADD(month,-6,GETDATE()), DATEADD(month,6,GETDATE()), 1,
    'Tarif préférentiel grossiste — remise 10%', @TID, GETUTCDATE()),

-- Prix spécial client 3 (distributeur) — 5% sous le tarif standard
(NEWID(), @prod1, @clt3, NULL, 1757.50, DATEADD(month,-3,GETDATE()), DATEADD(month,9,GETDATE()), 1,
    'Tarif distributeur — remise 5%', @TID, GETUTCDATE());

-- ── 1.4 Objectifs représentants ──────────────────────────────────────────────

DECLARE @rep1 UNIQUEIDENTIFIER, @rep2 UNIQUEIDENTIFIER, @rep3 UNIQUEIDENTIFIER, @sup1 UNIQUEIDENTIFIER;
SELECT TOP 1 @rep1 = id FROM users WHERE tenant_id = @TID AND is_active = 1 ORDER BY created_at;
SELECT TOP 1 @rep2 = id FROM users WHERE tenant_id = @TID AND is_active = 1 AND id<>ISNULL(@rep1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
SELECT TOP 1 @rep3 = id FROM users WHERE tenant_id = @TID AND is_active = 1 AND id NOT IN (ISNULL(@rep1,'00000000-0000-0000-0000-000000000000'),ISNULL(@rep2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;
SELECT TOP 1 @sup1 = id FROM users WHERE tenant_id = @TID AND is_active = 1 AND id NOT IN (ISNULL(@rep1,'00000000-0000-0000-0000-000000000000'),ISNULL(@rep2,'00000000-0000-0000-0000-000000000000'),ISNULL(@rep3,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;

DECLARE @yr INT = YEAR(GETDATE()), @mo INT = MONTH(GETDATE());

INSERT INTO rep_objective (id, representative_id, year, month, revenue_target, visit_target, delivery_target, notes, tenant_id, created_at)
VALUES
(NEWID(), @rep1, @yr, @mo, 250000.00, 25, 20, 'Objectif mai — zone Casablanca',  @TID, GETUTCDATE()),
(NEWID(), @rep2, @yr, @mo, 180000.00, 20, 15, 'Objectif mai — zone Rabat',       @TID, GETUTCDATE()),
(NEWID(), @rep3, @yr, @mo, 120000.00, 15, 12, 'Objectif mai — zone Marrakech',   @TID, GETUTCDATE()),
-- Mois précédent (pour les comparatifs dashboard)
(NEWID(), @rep1, @yr, CASE WHEN @mo=1 THEN 12 ELSE @mo-1 END, 230000.00, 22, 18, 'Objectif avril', @TID, GETUTCDATE()),
(NEWID(), @rep2, @yr, CASE WHEN @mo=1 THEN 12 ELSE @mo-1 END, 170000.00, 18, 14, 'Objectif avril', @TID, GETUTCDATE());

GO

-- ════════════════════════════════════════════════════════════════
-- SECTION 2 — SCÉNARIO A : Tournée CLOSED (hier) cycle complet
-- ════════════════════════════════════════════════════════════════

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
DECLARE @rep1 UNIQUEIDENTIFIER, @rep2 UNIQUEIDENTIFIER, @rep3 UNIQUEIDENTIFIER, @sup1 UNIQUEIDENTIFIER;
SELECT TOP 1 @rep1 = id FROM users WHERE tenant_id = @TID AND is_active = 1 ORDER BY created_at;
SELECT TOP 1 @rep2 = id FROM users WHERE tenant_id = @TID AND is_active = 1 AND id<>ISNULL(@rep1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
SELECT TOP 1 @rep3 = id FROM users WHERE tenant_id = @TID AND is_active = 1 AND id NOT IN (ISNULL(@rep1,'00000000-0000-0000-0000-000000000000'),ISNULL(@rep2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;
SELECT TOP 1 @sup1 = id FROM users WHERE tenant_id = @TID AND is_active = 1 AND id NOT IN (ISNULL(@rep1,'00000000-0000-0000-0000-000000000000'),ISNULL(@rep2,'00000000-0000-0000-0000-000000000000'),ISNULL(@rep3,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;

DECLARE @prod1 UNIQUEIDENTIFIER, @prod2 UNIQUEIDENTIFIER, @prod3 UNIQUEIDENTIFIER, @prod4 UNIQUEIDENTIFIER, @prod5 UNIQUEIDENTIFIER;
SELECT @prod1 = id FROM products WHERE code='WC-ARENA-BLOC' AND tenant_id=@TID; IF @prod1 IS NULL SELECT TOP 1 @prod1=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID ORDER BY created_at;
SELECT @prod2 = id FROM products WHERE code='LM-45X34'      AND tenant_id=@TID; IF @prod2 IS NULL SELECT TOP 1 @prod2=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id<>ISNULL(@prod1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
SELECT @prod3 = id FROM products WHERE code='WC-ARENA-PACK' AND tenant_id=@TID; IF @prod3 IS NULL SELECT TOP 1 @prod3=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;
SELECT @prod4 = id FROM products WHERE code='LM-35'         AND tenant_id=@TID; IF @prod4 IS NULL SELECT TOP 1 @prod4=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod3,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;

DECLARE @wh1 UNIQUEIDENTIFIER;
SELECT TOP 1 @wh1 = id FROM warehouses WHERE is_active=1 ORDER BY is_default DESC, created_at;

DECLARE @clt1 UNIQUEIDENTIFIER, @clt2 UNIQUEIDENTIFIER, @clt3 UNIQUEIDENTIFIER, @clt4 UNIQUEIDENTIFIER;
SELECT TOP 1 @clt1=id FROM accounts WHERE tenant_id=@TID ORDER BY NEWID();
SELECT TOP 1 @clt2=id FROM accounts WHERE tenant_id=@TID AND id<>ISNULL(@clt1,'00000000-0000-0000-0000-000000000000') ORDER BY NEWID();
SELECT TOP 1 @clt3=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt4=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();

DECLARE @lot1 UNIQUEIDENTIFIER, @lot2 UNIQUEIDENTIFIER, @lot4 UNIQUEIDENTIFIER;
SELECT TOP 1 @lot1 = id FROM product_batch WHERE item_id=@prod1 AND status='ACTIVE' AND tenant_id=@TID ORDER BY expiry_date;
SELECT TOP 1 @lot2 = id FROM product_batch WHERE item_id=@prod1 AND status='ACTIVE' AND tenant_id=@TID AND id<>ISNULL(@lot1,'00000000-0000-0000-0000-000000000000') ORDER BY expiry_date;
SELECT TOP 1 @lot4 = id FROM product_batch WHERE item_id=@prod2 AND status='ACTIVE' AND tenant_id=@TID ORDER BY expiry_date;

-- ── A1. Tournée CLOSED ──────────────────────────────────────────────────────
DECLARE @tourA UNIQUEIDENTIFIER = NEWID();
INSERT INTO delivery_tour (id, tour_date, representative_id, vehicle_id, zone, status, tenant_id, created_at, updated_at)
VALUES (@tourA, DATEADD(day,-1,CAST(GETDATE() AS DATE)), @rep1, NULL, 'Casablanca', 'CLOSED', @TID, GETUTCDATE(), GETUTCDATE());

-- ── A2. Chargement véhicule LOADED ──────────────────────────────────────────
DECLARE @loadA  UNIQUEIDENTIFIER = NEWID();
DECLARE @loadA2 UNIQUEIDENTIFIER = NEWID();
INSERT INTO vehicle_load (id, delivery_tour_id, item_id, quantity, load_date, warehouse_from_id,
    batch_id, lot_number, expiry_date, status, tenant_id, created_at)
VALUES
(@loadA,  @tourA, @prod1, 30, DATEADD(hour,-10,GETDATE()), @wh1,
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), 'LOADED', @TID, GETUTCDATE()),
(@loadA2, @tourA, @prod2, 20, DATEADD(hour,-10,GETDATE()), @wh1,
    @lot4, 'LOT-LM-2025-010', (SELECT expiry_date FROM product_batch WHERE id=@lot4), 'LOADED', @TID, GETUTCDATE());

-- ── A3. Pré-commandes (DELIVERED après livraison) ───────────────────────────
DECLARE @poA1 UNIQUEIDENTIFIER = NEWID();
DECLARE @poA2 UNIQUEIDENTIFIER = NEWID();

INSERT INTO pre_order (id, delivery_tour_id, scheduled_date, customer_id, status, notes, visit_order, tenant_id, created_at)
VALUES
(@poA1, @tourA, DATEADD(day,-1,CAST(GETDATE() AS DATE)), @clt1, 'DELIVERED', 'Livraison régulière mensuelle', 1, @TID, GETUTCDATE()),
(@poA2, @tourA, DATEADD(day,-1,CAST(GETDATE() AS DATE)), @clt2, 'DELIVERED', 'Commande urgente chantier', 2, @TID, GETUTCDATE());

INSERT INTO pre_order_item (id, pre_order_id, item_id, quantity_ordered, quantity_confirmed, unit_price, tenant_id, created_at)
VALUES
(NEWID(), @poA1, @prod1, 10, 10, 1665.00, @TID, GETUTCDATE()),
(NEWID(), @poA1, @prod2,  5,  5,  378.00, @TID, GETUTCDATE()),
(NEWID(), @poA2, @prod1,  8,  8, 1850.00, @TID, GETUTCDATE());

-- ── A4. Lignes de livraison ──────────────────────────────────────────────────
DECLARE
    @dlA1 UNIQUEIDENTIFIER = NEWID(),   -- Client 1 : DELIVERED 10 WC (cash)
    @dlA2 UNIQUEIDENTIFIER = NEWID(),   -- Client 1 : DELIVERED 5 LM (chèque)
    @dlA3 UNIQUEIDENTIFIER = NEWID(),   -- Client 2 : DELIVERED 8 WC (crédit)
    @dlA4 UNIQUEIDENTIFIER = NEWID(),   -- Client 3 : PARTIAL   6/10 WC (traite)
    @dlA5 UNIQUEIDENTIFIER = NEWID(),   -- Client 4 : ABSENT
    @dlA6 UNIQUEIDENTIFIER = NEWID();   -- Client 1 : DELIVERED 12 WC avec remise 5%

-- Client 1 — 10 WC DELIVERED cash
INSERT INTO delivery_line (id, delivery_tour_id, customer_id, item_id, quantity, quantity_delivered,
    unit_price, discount_percent, discount_reason, amount, payment_mode, paid_amount,
    visit_result, visit_notes, cheque_number, traite_due_date,
    batch_id, lot_number, expiry_date, tenant_id, created_at)
VALUES
(@dlA1, @tourA, @clt1, @prod1, 10, 10,
    1665.00, 0.00, NULL, 16650.00, 'CASH', 16650.00,
    'DELIVERED', 'Livraison effectuée, client satisfait.', NULL, NULL,
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE()),

-- Client 1 — 5 LM DELIVERED chèque
(@dlA2, @tourA, @clt1, @prod2, 5, 5,
    378.00, 0.00, NULL, 1890.00, 'CHEQUE', 1890.00,
    'DELIVERED', 'Réglé par chèque BCP.', NULL, NULL,
    @lot4, 'LOT-LM-2025-010', (SELECT expiry_date FROM product_batch WHERE id=@lot4), @TID, GETUTCDATE()),

-- Client 2 — 8 WC DELIVERED crédit
(@dlA3, @tourA, @clt2, @prod1, 8, 8,
    1850.00, 0.00, NULL, 14800.00, 'CREDIT', 5000.00,
    'DELIVERED', 'Livraison OK. Solde en crédit 30j.', NULL, NULL,
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE()),

-- Client 3 — PARTIAL 6/10 WC traite
(@dlA4, @tourA, @clt3, @prod1, 10, 6,
    1757.50, 0.00, NULL, 10545.00, 'TRAITE', 0.00,
    'PARTIAL', 'Client a accepté 6 sur 10. Manque espace stockage.', NULL, DATEADD(day,60,GETDATE()),
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE()),

-- Client 4 — ABSENT
(@dlA5, @tourA, @clt4, @prod2, 5, 0,
    420.00, 0.00, NULL, 0.00, 'CASH', 0.00,
    'ABSENT', 'Magasin fermé — porte verrouillée à 10h15.', NULL, NULL,
    NULL, NULL, NULL, @TID, GETUTCDATE()),

-- Client 1 — 12 WC DELIVERED avec remise 5%
(@dlA6, @tourA, @clt1, @prod1, 12, 12,
    1665.00, 5.00, 'Remise fidélité client grand compte', 18981.00, 'CASH', 18981.00,
    'DELIVERED', 'Commande additionnelle. Remise 5% accordée.', NULL, NULL,
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE());

-- ── A5. Gratuités/Bonus promotions ──────────────────────────────────────────
DECLARE @promo1 UNIQUEIDENTIFIER;
SELECT TOP 1 @promo1 = id FROM delivery_promotion WHERE is_active=1 AND item_id=@prod1 AND tenant_id=@TID ORDER BY created_at;

IF @promo1 IS NOT NULL
BEGIN
    -- Client 1 : 10 WC → 1 bonus LM (promo WC 10+1)
    INSERT INTO delivery_line_bonus (id, delivery_line_id, promotion_id, bonus_item_id, bonus_quantity, tenant_id, created_at)
    VALUES (NEWID(), @dlA1, @promo1, @prod2, 1, @TID, GETUTCDATE());

    -- Client 1 : 12 WC → 1 bonus LM (promo WC 10+1, palier atteint 1 fois)
    INSERT INTO delivery_line_bonus (id, delivery_line_id, promotion_id, bonus_item_id, bonus_quantity, tenant_id, created_at)
    VALUES (NEWID(), @dlA6, @promo1, @prod2, 1, @TID, GETUTCDATE());
END;

-- ── A6. Instruments de paiement ──────────────────────────────────────────────
-- Chèque ligne dlA2 (1890 MAD — ENCAISSE)
INSERT INTO payment_instrument (id, delivery_line_id, instrument_type, instrument_number, bank_name,
    amount, due_date, encash_date, status, notes, tenant_id, created_at)
VALUES (NEWID(), @dlA2, 'CHEQUE', 'CHQ-2025-04-001', 'Banque Centrale Populaire',
    1890.00, DATEADD(day,5,GETDATE()), GETDATE(), 'ENCAISSE',
    'Chèque présenté et encaissé sans problème.', @TID, GETUTCDATE());

-- Traite ligne dlA4 (10545 MAD — PENDING, échéance 60j)
INSERT INTO payment_instrument (id, delivery_line_id, instrument_type, instrument_number, bank_name,
    amount, due_date, encash_date, status, notes, tenant_id, created_at)
VALUES (NEWID(), @dlA4, 'TRAITE', 'TRT-2025-05-042', 'Attijariwafa Bank',
    10545.00, DATEADD(day,60,GETDATE()), NULL, 'PENDING',
    'Traite remise en banque, échéance 60 jours.', @TID, GETUTCDATE());

-- ── A7. Retour véhicule ──────────────────────────────────────────────────────
-- Stock non vendu : 30 chargés - 10 - 8 - 6 - 12 = -6 (client 3 partial = 6)
-- Calculé : 30 - (10+8+6+12) = -6 → incohérence intentionnelle testée par stock_discrepancy
-- Retour réel : 4 WC (manque de 2 — écart de stock)
INSERT INTO return_entry (id, delivery_tour_id, item_id, quantity, reason, received_date,
    warehouse_to_id, return_type, delivery_line_id, status, tenant_id, created_at)
VALUES
-- Retour véhicule (invendus)
(NEWID(), @tourA, @prod1, 4, 'Invendus fin de tournée', DATEADD(hour,-1,GETDATE()),
    @wh1, 'VEHICLE_RETURN', NULL, 'VALIDATED', @TID, GETUTCDATE()),
(NEWID(), @tourA, @prod2, 8, 'Lave-mains invendus (client 4 absent)', DATEADD(hour,-1,GETDATE()),
    @wh1, 'VEHICLE_RETURN', NULL, 'VALIDATED', @TID, GETUTCDATE()),
-- Retour client (avoir)
(NEWID(), @tourA, @prod1, 1, 'Produit livré défectueux — dalle fissurée à la réception', DATEADD(hour,-1,GETDATE()),
    @wh1, 'CUSTOMER_RETURN', @dlA1, 'RECEIVED', @TID, GETUTCDATE());

-- ── A8. Déchargement véhicule CONFIRMED ─────────────────────────────────────
DECLARE @unloadA UNIQUEIDENTIFIER = NEWID();
INSERT INTO vehicle_unload (id, delivery_tour_id, unload_date, status, notes, confirmed_by, confirmed_at, tenant_id, created_at)
VALUES (@unloadA, @tourA, DATEADD(hour,-1,GETDATE()), 'CONFIRMED',
    'Déchargement vérifié. Écart de 2 unités WC constaté.', @sup1, DATEADD(hour,-1,GETDATE()), @TID, GETUTCDATE());

-- prod1 : chargé 30, vendu 36 (10+8+6+12) → INCOHÉRENCE -> réel : vendu 36 mais chargé 30+retour client
-- Simulation réaliste : chargé=30, vendu=28, retourné=4, manquant=2 (discrepancy stock)
INSERT INTO vehicle_unload_item (id, unload_id, item_id, quantity_loaded, quantity_sold,
    quantity_returned, quantity_unloaded, tenant_id, created_at)
VALUES
(NEWID(), @unloadA, @prod1, 30, 28, 4, 4, @TID, GETUTCDATE()),   -- manquant 2 unités
(NEWID(), @unloadA, @prod2, 20,  5, 8, 7, @TID, GETUTCDATE());   -- 7 retournés (8-1 retour client)

-- ── A9. Rapport de règlement FINALIZED ──────────────────────────────────────
-- Total livré : 16650 + 1890 + 14800 + 10545 + 18981 = 62866
-- Collecté : 16650 (cash) + 1890 (chèque) + 5000 (credit partiel) + 0 (traite) + 18981 (cash) = 42521
INSERT INTO settlement_report (id, delivery_tour_id, total_amount, collected_amount,
    cash_amount, cheque_amount, traite_amount, virement_amount, credit_amount, credit_balance,
    unloaded_value, discrepancy, stock_theoretical, stock_physical, stock_discrepancy,
    notes, generated_at, finalized_at, finalized_by, status, tenant_id, created_at)
VALUES (NEWID(), @tourA,
    62866.00, 42521.00,
    35631.00,   -- cash (16650 + 18981)
     1890.00,   -- chèque
        0.00,   -- traite (non encore encaissée)
        0.00,   -- virement
    14800.00,   -- crédit
     9800.00,   -- crédit non réglé (14800 - 5000)
     7420.00,   -- valeur stock retourné (4*1850 + ?)
      150.00,   -- écart caisse (< 500 → pas d'escalade)
    2,          -- stock théorique (30 - 28 = 2)
    2,          -- stock physique
    0,          -- pas d'écart stock
    'Tournée clôturée normalement. Léger écart caisse de 150 MAD justifié (rendu monnaie).',
    DATEADD(hour,-2,GETDATE()), DATEADD(hour,-1,GETDATE()), @sup1, 'FINALIZED', @TID, GETUTCDATE());

-- ── A10. GPS tracking historique ────────────────────────────────────────────
INSERT INTO rep_location (id, representative_id, delivery_tour_id, latitude, longitude, accuracy,
    recorded_at, event_type, customer_id, tenant_id, created_at)
VALUES
(NEWID(), @rep1, @tourA, 33.5731,-7.5898, 5.0, DATEADD(hour,-10,GETDATE()), 'TOUR_START', NULL, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5742,-7.5901, 4.2, DATEADD(hour, -9,GETDATE()), 'VISIT_START', @clt1, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5742,-7.5901, 4.2, DATEADD(hour,-8,40,GETDATE()), 'VISIT_END', @clt1, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5860,-7.6012, 6.0, DATEADD(hour, -8,GETDATE()), 'VISIT_START', @clt2, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5860,-7.6012, 6.0, DATEADD(hour,-7,30,GETDATE()), 'VISIT_END', @clt2, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5931,-7.6145, 3.8, DATEADD(hour, -7,GETDATE()), 'VISIT_START', @clt3, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5931,-7.6145, 3.8, DATEADD(hour,-6,45,GETDATE()), 'VISIT_END', @clt3, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5800,-7.5950, 5.5, DATEADD(hour,-5,GETDATE()), 'VISIT_START', @clt4, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5800,-7.5950, 5.5, DATEADD(hour,-4,30,GETDATE()), 'VISIT_END', @clt4, @TID, GETUTCDATE()),
(NEWID(), @rep1, @tourA, 33.5731,-7.5898, 4.0, DATEADD(hour,-2,GETDATE()), 'TOUR_END', NULL, @TID, GETUTCDATE());

-- ── A11. Sync log ────────────────────────────────────────────────────────────
INSERT INTO offline_sync_log (id, device_id, representative_id, action_type, payload,
    sync_status, synced_at, error_message, tenant_id, created_at)
VALUES (NEWID(), 'DEVICE-REP1-IPHONE15', @rep1, 'OFFLINE_PUSH',
    'lines=6 gps=10', 'SYNCED', GETUTCDATE(), NULL, @TID, GETUTCDATE());

GO

-- ════════════════════════════════════════════════════════════════
-- SECTION 3 — SCÉNARIO B : Tournée EN_COURS (aujourd'hui)
-- ════════════════════════════════════════════════════════════════

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
DECLARE @rep1 UNIQUEIDENTIFIER, @rep2 UNIQUEIDENTIFIER;
SELECT TOP 1 @rep1 = id FROM users WHERE tenant_id=@TID AND is_active=1 ORDER BY created_at;
SELECT TOP 1 @rep2 = id FROM users WHERE tenant_id=@TID AND is_active=1 AND id<>ISNULL(@rep1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;

DECLARE @prod1 UNIQUEIDENTIFIER, @prod2 UNIQUEIDENTIFIER, @prod3 UNIQUEIDENTIFIER;
SELECT @prod1=id FROM products WHERE code='WC-ARENA-BLOC' AND tenant_id=@TID; IF @prod1 IS NULL SELECT TOP 1 @prod1=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID ORDER BY created_at;
SELECT @prod2=id FROM products WHERE code='LM-45X34'      AND tenant_id=@TID; IF @prod2 IS NULL SELECT TOP 1 @prod2=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id<>ISNULL(@prod1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
SELECT @prod3=id FROM products WHERE code='WC-ARENA-PACK' AND tenant_id=@TID; IF @prod3 IS NULL SELECT TOP 1 @prod3=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;

DECLARE @wh1 UNIQUEIDENTIFIER;
SELECT TOP 1 @wh1=id FROM warehouses WHERE is_active=1 ORDER BY is_default DESC, created_at;

DECLARE @clt1 UNIQUEIDENTIFIER, @clt2 UNIQUEIDENTIFIER, @clt3 UNIQUEIDENTIFIER,
        @clt4 UNIQUEIDENTIFIER, @clt5 UNIQUEIDENTIFIER, @clt6 UNIQUEIDENTIFIER;
SELECT TOP 1 @clt1=id FROM accounts WHERE tenant_id=@TID ORDER BY NEWID();
SELECT TOP 1 @clt2=id FROM accounts WHERE tenant_id=@TID AND id<>ISNULL(@clt1,'00000000-0000-0000-0000-000000000000') ORDER BY NEWID();
SELECT TOP 1 @clt3=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt4=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt5=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt4,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt6=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt4,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt5,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();

DECLARE @lot1 UNIQUEIDENTIFIER;
SELECT TOP 1 @lot1=id FROM product_batch WHERE item_id=@prod1 AND status='ACTIVE' AND tenant_id=@TID ORDER BY expiry_date;

-- ── B1. Tournée EN_COURS ─────────────────────────────────────────────────────
DECLARE @tourB UNIQUEIDENTIFIER = NEWID();
INSERT INTO delivery_tour (id, tour_date, representative_id, vehicle_id, zone, status, tenant_id, created_at, updated_at)
VALUES (@tourB, CAST(GETDATE() AS DATE), @rep2, NULL, 'Rabat', 'EN_COURS', @TID, GETUTCDATE(), GETUTCDATE());

-- ── B2. Chargement LOADED ────────────────────────────────────────────────────
DECLARE @loadB UNIQUEIDENTIFIER = NEWID();
INSERT INTO vehicle_load (id, delivery_tour_id, item_id, quantity, load_date, warehouse_from_id,
    batch_id, lot_number, expiry_date, status, tenant_id, created_at)
VALUES
(@loadB, @tourB, @prod1, 25, DATEADD(hour,-3,GETDATE()), @wh1,
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), 'LOADED', @TID, GETUTCDATE());

-- ── B3. Pré-commandes avec visit_order ──────────────────────────────────────
DECLARE @poB1 UNIQUEIDENTIFIER = NEWID();
DECLARE @poB2 UNIQUEIDENTIFIER = NEWID();
DECLARE @poB3 UNIQUEIDENTIFIER = NEWID();
DECLARE @poB4 UNIQUEIDENTIFIER = NEWID();

INSERT INTO pre_order (id, delivery_tour_id, scheduled_date, customer_id, status, notes, visit_order, tenant_id, created_at)
VALUES
(@poB1, @tourB, CAST(GETDATE() AS DATE), @clt1, 'DELIVERED', 'Livré ce matin',          1, @TID, GETUTCDATE()),
(@poB2, @tourB, CAST(GETDATE() AS DATE), @clt2, 'DELIVERED', 'Livré',                   2, @TID, GETUTCDATE()),
(@poB3, @tourB, CAST(GETDATE() AS DATE), @clt3, 'CONFIRMED', 'À livrer cet après-midi', 3, @TID, GETUTCDATE()),
(@poB4, @tourB, CAST(GETDATE() AS DATE), @clt4, 'CONFIRMED', 'Dernier arrêt prévu 16h', 4, @TID, GETUTCDATE());

INSERT INTO pre_order_item (id, pre_order_id, item_id, quantity_ordered, quantity_confirmed, unit_price, tenant_id, created_at)
VALUES
(NEWID(), @poB1, @prod1, 5,  5, 1850.00, @TID, GETUTCDATE()),
(NEWID(), @poB2, @prod1, 8,  8, 1850.00, @TID, GETUTCDATE()),
(NEWID(), @poB3, @prod1, 6,  6, 1850.00, @TID, GETUTCDATE()),
(NEWID(), @poB4, @prod2, 10, 10, 420.00, @TID, GETUTCDATE());

-- ── B4. Lignes de livraison déjà effectuées ──────────────────────────────────
DECLARE
    @dlB1 UNIQUEIDENTIFIER = NEWID(),
    @dlB2 UNIQUEIDENTIFIER = NEWID(),
    @dlB3 UNIQUEIDENTIFIER = NEWID();

INSERT INTO delivery_line (id, delivery_tour_id, customer_id, item_id, quantity, quantity_delivered,
    unit_price, discount_percent, discount_reason, amount, payment_mode, paid_amount,
    visit_result, visit_notes, batch_id, lot_number, expiry_date, tenant_id, created_at)
VALUES
-- Client 1 — 5 WC DELIVERED cash
(@dlB1, @tourB, @clt1, @prod1, 5, 5, 1850.00, 0, NULL, 9250.00, 'CASH', 9250.00,
    'DELIVERED', 'Livraison matinale OK. Client présent.', @lot1, 'LOT-WC-2025-001',
    (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE()),

-- Client 2 — 8 WC DELIVERED crédit
(@dlB2, @tourB, @clt2, @prod1, 8, 8, 1850.00, 0, NULL, 14800.00, 'CREDIT', 0.00,
    'DELIVERED', 'Client demande crédit 30j — accord donné.', @lot1, 'LOT-WC-2025-001',
    (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE()),

-- Client 5 — REFUSED (hors pré-commande)
(@dlB3, @tourB, @clt5, @prod1, 4, 0, 1850.00, 0, NULL, 0.00, 'CASH', 0.00,
    'REFUSED', 'Client a refusé : prix jugé trop élevé par rapport à concurrent.', NULL, NULL, NULL, @TID, GETUTCDATE());

-- ── B5. GPS temps réel ───────────────────────────────────────────────────────
INSERT INTO rep_location (id, representative_id, delivery_tour_id, latitude, longitude, accuracy,
    recorded_at, event_type, customer_id, tenant_id, created_at)
VALUES
(NEWID(), @rep2, @tourB, 34.0209,-6.8416, 4.0, DATEADD(hour,-3,GETDATE()), 'TOUR_START',  NULL,  @TID, GETUTCDATE()),
(NEWID(), @rep2, @tourB, 34.0245,-6.8430, 3.5, DATEADD(hour,-2,GETDATE()), 'VISIT_START', @clt1, @TID, GETUTCDATE()),
(NEWID(), @rep2, @tourB, 34.0245,-6.8430, 3.5, DATEADD(hour,-1,30,GETDATE()), 'VISIT_END',@clt1, @TID, GETUTCDATE()),
(NEWID(), @rep2, @tourB, 34.0310,-6.8500, 5.0, DATEADD(hour,-1,GETDATE()), 'VISIT_START', @clt2, @TID, GETUTCDATE()),
(NEWID(), @rep2, @tourB, 34.0310,-6.8500, 5.0, DATEADD(minute,-30,GETDATE()), 'VISIT_END',@clt2, @TID, GETUTCDATE()),
(NEWID(), @rep2, @tourB, 34.0350,-6.8550, 4.5, GETDATE(),                    'TRACK',     NULL,  @TID, GETUTCDATE());

GO

-- ════════════════════════════════════════════════════════════════
-- SECTION 4 — SCÉNARIO C : Tournée VALIDE (demain) planifiée
-- ════════════════════════════════════════════════════════════════

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
DECLARE @rep3 UNIQUEIDENTIFIER;
SELECT TOP 1 @rep3 = id FROM users WHERE tenant_id=@TID AND is_active=1 ORDER BY NEWID();

DECLARE @prod1 UNIQUEIDENTIFIER, @prod2 UNIQUEIDENTIFIER, @prod5 UNIQUEIDENTIFIER;
SELECT @prod1=id FROM products WHERE code='WC-ARENA-BLOC' AND tenant_id=@TID; IF @prod1 IS NULL SELECT TOP 1 @prod1=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID ORDER BY created_at;
SELECT @prod2=id FROM products WHERE code='LM-45X34'      AND tenant_id=@TID; IF @prod2 IS NULL SELECT TOP 1 @prod2=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id<>ISNULL(@prod1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
SELECT @prod5=id FROM products WHERE code='LM-ARENA-BL'   AND tenant_id=@TID; IF @prod5 IS NULL SELECT TOP 1 @prod5=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id NOT IN (ISNULL(@prod1,'00000000-0000-0000-0000-000000000000'),ISNULL(@prod2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at;

DECLARE @wh1 UNIQUEIDENTIFIER;
SELECT TOP 1 @wh1=id FROM warehouses WHERE is_active=1 ORDER BY is_default DESC, created_at;

DECLARE @clt1 UNIQUEIDENTIFIER, @clt2 UNIQUEIDENTIFIER, @clt3 UNIQUEIDENTIFIER,
        @clt4 UNIQUEIDENTIFIER, @clt5 UNIQUEIDENTIFIER;
SELECT TOP 1 @clt1=id FROM accounts WHERE tenant_id=@TID ORDER BY NEWID();
SELECT TOP 1 @clt2=id FROM accounts WHERE tenant_id=@TID AND id<>ISNULL(@clt1,'00000000-0000-0000-0000-000000000000') ORDER BY NEWID();
SELECT TOP 1 @clt3=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt4=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();
SELECT TOP 1 @clt5=id FROM accounts WHERE tenant_id=@TID AND id NOT IN (ISNULL(@clt1,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt2,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt3,'00000000-0000-0000-0000-000000000000'),ISNULL(@clt4,'00000000-0000-0000-0000-000000000000')) ORDER BY NEWID();

DECLARE @lot1 UNIQUEIDENTIFIER, @lot4 UNIQUEIDENTIFIER;
SELECT TOP 1 @lot1=id FROM product_batch WHERE item_id=@prod1 AND status='ACTIVE' AND tenant_id=@TID ORDER BY expiry_date;
SELECT TOP 1 @lot4=id FROM product_batch WHERE item_id=@prod2 AND status='ACTIVE' AND tenant_id=@TID ORDER BY expiry_date;

-- ── C1. Tournée VALIDE ───────────────────────────────────────────────────────
DECLARE @tourC UNIQUEIDENTIFIER = NEWID();
INSERT INTO delivery_tour (id, tour_date, representative_id, vehicle_id, zone, status, tenant_id, created_at, updated_at)
VALUES (@tourC, DATEADD(day,1,CAST(GETDATE() AS DATE)), @rep3, NULL, 'Marrakech', 'VALIDE', @TID, GETUTCDATE(), GETUTCDATE());

-- ── C2. Chargement DRAFT ─────────────────────────────────────────────────────
DECLARE @loadC UNIQUEIDENTIFIER = NEWID();
INSERT INTO vehicle_load (id, delivery_tour_id, item_id, quantity, load_date, warehouse_from_id,
    batch_id, lot_number, expiry_date, status, tenant_id, created_at)
VALUES
(@loadC, @tourC, @prod1, 35, GETUTCDATE(), @wh1,
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), 'DRAFT', @TID, GETUTCDATE());

-- ── C3. Pré-commandes PENDING et CONFIRMED ───────────────────────────────────
DECLARE @poC1 UNIQUEIDENTIFIER=NEWID(), @poC2 UNIQUEIDENTIFIER=NEWID(),
        @poC3 UNIQUEIDENTIFIER=NEWID(), @poC4 UNIQUEIDENTIFIER=NEWID(),
        @poC5 UNIQUEIDENTIFIER=NEWID();

INSERT INTO pre_order (id, delivery_tour_id, scheduled_date, customer_id, status, notes, visit_order, tenant_id, created_at)
VALUES
(@poC1, @tourC, DATEADD(day,1,CAST(GETDATE() AS DATE)), @clt1, 'CONFIRMED', 'Grossiste — 20 WC prévus', 1, @TID, GETUTCDATE()),
(@poC2, @tourC, DATEADD(day,1,CAST(GETDATE() AS DATE)), @clt2, 'CONFIRMED', 'Revendeur — 10 WC + LM', 2, @TID, GETUTCDATE()),
(@poC3, @tourC, DATEADD(day,1,CAST(GETDATE() AS DATE)), @clt3, 'PENDING',   'Commande à confirmer', 3, @TID, GETUTCDATE()),
(@poC4, @tourC, DATEADD(day,1,CAST(GETDATE() AS DATE)), @clt4, 'CONFIRMED', 'Chantier Gueliz', 4, @TID, GETUTCDATE()),
(@poC5, @tourC, DATEADD(day,1,CAST(GETDATE() AS DATE)), @clt5, 'PENDING',   'Nouveau client à prospecter', 5, @TID, GETUTCDATE());

INSERT INTO pre_order_item (id, pre_order_id, item_id, quantity_ordered, quantity_confirmed, unit_price, tenant_id, created_at)
VALUES
(NEWID(), @poC1, @prod1, 20, 20, 1850.00, @TID, GETUTCDATE()),
(NEWID(), @poC2, @prod1, 10, 10, 1850.00, @TID, GETUTCDATE()),
(NEWID(), @poC2, @prod2,  8,  8,  420.00, @TID, GETUTCDATE()),
(NEWID(), @poC3, @prod1,  5,  0, 1850.00, @TID, GETUTCDATE()),
(NEWID(), @poC4, @prod1, 15, 15, 1850.00, @TID, GETUTCDATE()),
(NEWID(), @poC5, @prod2,  3,  0,  420.00, @TID, GETUTCDATE());

GO

-- ════════════════════════════════════════════════════════════════
-- SECTION 5 — SCÉNARIO D : Tournée CLOSED avec PENDING_APPROVAL
--             Écart caisse > 500 MAD → approbation superviseur
-- ════════════════════════════════════════════════════════════════

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
DECLARE @rep1 UNIQUEIDENTIFIER, @sup1 UNIQUEIDENTIFIER;
SELECT TOP 1 @rep1=id FROM users WHERE tenant_id=@TID AND is_active=1 ORDER BY created_at;
SELECT TOP 1 @sup1=id FROM users WHERE tenant_id=@TID AND is_active=1 AND id<>ISNULL(@rep1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at DESC;

DECLARE @prod1 UNIQUEIDENTIFIER, @prod2 UNIQUEIDENTIFIER;
SELECT @prod1=id FROM products WHERE code='WC-ARENA-BLOC' AND tenant_id=@TID; IF @prod1 IS NULL SELECT TOP 1 @prod1=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID ORDER BY created_at;
SELECT @prod2=id FROM products WHERE code='LM-45X34'      AND tenant_id=@TID; IF @prod2 IS NULL SELECT TOP 1 @prod2=id FROM products WHERE is_active=1 AND is_sellable=1 AND tenant_id=@TID AND id<>ISNULL(@prod1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;

DECLARE @wh1 UNIQUEIDENTIFIER;
SELECT TOP 1 @wh1=id FROM warehouses WHERE is_active=1 ORDER BY is_default DESC, created_at;

DECLARE @clt1 UNIQUEIDENTIFIER, @clt2 UNIQUEIDENTIFIER;
SELECT TOP 1 @clt1=id FROM accounts WHERE tenant_id=@TID ORDER BY NEWID();
SELECT TOP 1 @clt2=id FROM accounts WHERE tenant_id=@TID AND id<>ISNULL(@clt1,'00000000-0000-0000-0000-000000000000') ORDER BY NEWID();

DECLARE @lot1 UNIQUEIDENTIFIER;
SELECT TOP 1 @lot1=id FROM product_batch WHERE item_id=@prod1 AND status='ACTIVE' AND tenant_id=@TID ORDER BY expiry_date;

-- ── D1. Tournée CLOSED (J-7) ────────────────────────────────────────────────
DECLARE @tourD UNIQUEIDENTIFIER = NEWID();
INSERT INTO delivery_tour (id, tour_date, representative_id, vehicle_id, zone, status, tenant_id, created_at, updated_at)
VALUES (@tourD, DATEADD(day,-7,CAST(GETDATE() AS DATE)), @rep1, NULL, 'Casablanca-Est', 'CLOSED', @TID, GETUTCDATE(), GETUTCDATE());

-- ── D2. Chargement LOADED ────────────────────────────────────────────────────
DECLARE @loadD UNIQUEIDENTIFIER = NEWID();
INSERT INTO vehicle_load (id, delivery_tour_id, item_id, quantity, load_date, warehouse_from_id,
    batch_id, lot_number, expiry_date, status, tenant_id, created_at)
VALUES (@loadD, @tourD, @prod1, 20, DATEADD(day,-7,GETDATE()), @wh1,
    @lot1, 'LOT-WC-2025-001', (SELECT expiry_date FROM product_batch WHERE id=@lot1), 'LOADED', @TID, GETUTCDATE());

-- ── D3. Lignes livraison ─────────────────────────────────────────────────────
DECLARE @dlD1 UNIQUEIDENTIFIER=NEWID(), @dlD2 UNIQUEIDENTIFIER=NEWID();

INSERT INTO delivery_line (id, delivery_tour_id, customer_id, item_id, quantity, quantity_delivered,
    unit_price, discount_percent, discount_reason, amount, payment_mode, paid_amount,
    visit_result, visit_notes, batch_id, lot_number, expiry_date, tenant_id, created_at)
VALUES
(@dlD1, @tourD, @clt1, @prod1, 15, 15, 1850.00, 0, NULL, 27750.00, 'CASH', 26850.00,
    'DELIVERED', 'Livrés. Rendu de monnaie imprécis.', @lot1, 'LOT-WC-2025-001',
    (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE()),

(@dlD2, @tourD, @clt2, @prod1, 5, 5, 1850.00, 0, NULL, 9250.00, 'CASH', 9250.00,
    'DELIVERED', 'Livraison OK. Cash exact.', @lot1, 'LOT-WC-2025-001',
    (SELECT expiry_date FROM product_batch WHERE id=@lot1), @TID, GETUTCDATE());

-- ── D4. Déchargement CONFIRMED ───────────────────────────────────────────────
DECLARE @unloadD UNIQUEIDENTIFIER = NEWID();
INSERT INTO vehicle_unload (id, delivery_tour_id, unload_date, status, notes, confirmed_by, confirmed_at, tenant_id, created_at)
VALUES (@unloadD, @tourD, DATEADD(day,-7,GETDATE()), 'CONFIRMED',
    'Stock retourné = 0 (tout vendu). Écart caisse constaté.', @sup1, DATEADD(day,-7,GETDATE()), @TID, GETUTCDATE());

INSERT INTO vehicle_unload_item (id, unload_id, item_id, quantity_loaded, quantity_sold,
    quantity_returned, quantity_unloaded, tenant_id, created_at)
VALUES (NEWID(), @unloadD, @prod1, 20, 20, 0, 0, @TID, GETUTCDATE());

-- ── D5. Settlement PENDING_APPROVAL (écart caisse 900 MAD > seuil 500) ───────
INSERT INTO settlement_report (id, delivery_tour_id, total_amount, collected_amount,
    cash_amount, cheque_amount, traite_amount, virement_amount, credit_amount, credit_balance,
    unloaded_value, discrepancy, stock_theoretical, stock_physical, stock_discrepancy,
    notes, generated_at, finalized_at, finalized_by, status, approved_by, approved_at, approval_notes,
    tenant_id, created_at)
VALUES (NEWID(), @tourD,
    37000.00,     -- total facturé
    36100.00,     -- encaissé déclaré
    36100.00, 0.00, 0.00, 0.00, 0.00, 0.00,
    0.00,
     900.00,      -- écart caisse 900 MAD → PENDING_APPROVAL (> seuil 500)
    0, 0, 0,
    'Écart caisse de 900 MAD non justifié. En attente validation superviseur.',
    DATEADD(day,-7,GETDATE()), DATEADD(day,-7,GETDATE()), @rep1,
    'PENDING_APPROVAL',
    NULL, NULL, NULL,   -- pas encore approuvé
    @TID, GETUTCDATE());

GO

-- ════════════════════════════════════════════════════════════════
-- SECTION 6 — STOCK REPLENISHMENT (demande approvisionnement)
-- ════════════════════════════════════════════════════════════════

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
DECLARE @prod1 UNIQUEIDENTIFIER, @prod2 UNIQUEIDENTIFIER;
SELECT @prod1=id FROM products WHERE code='WC-ARENA-BLOC' AND tenant_id=@TID; IF @prod1 IS NULL SELECT TOP 1 @prod1=id FROM products WHERE is_active=1 AND tenant_id=@TID ORDER BY created_at;
SELECT @prod2=id FROM products WHERE code='LM-45X34'      AND tenant_id=@TID; IF @prod2 IS NULL SELECT TOP 1 @prod2=id FROM products WHERE is_active=1 AND tenant_id=@TID AND id<>ISNULL(@prod1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;

DECLARE @wh1 UNIQUEIDENTIFIER;
SELECT TOP 1 @wh1=id FROM warehouses WHERE is_active=1 ORDER BY is_default DESC, created_at;

DECLARE @rep1 UNIQUEIDENTIFIER, @sup1 UNIQUEIDENTIFIER;
SELECT TOP 1 @rep1=id FROM users WHERE tenant_id=@TID AND is_active=1 ORDER BY created_at;
SELECT TOP 1 @sup1=id FROM users WHERE tenant_id=@TID AND is_active=1 AND id<>ISNULL(@rep1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at DESC;

DECLARE @repl1 UNIQUEIDENTIFIER = NEWID();
INSERT INTO stock_replenishment (id, source_type, source_id, target_type, target_id, motive,
    request_date, status, approved_by, approval_date, tenant_id, created_at)
VALUES (@repl1, 'WAREHOUSE', @wh1, 'DELIVERY', @wh1,
    'Réapprovisionnement avant tournées semaine — stock critique LOT-WC-2025-002',
    GETUTCDATE(), 'APPROVED', @sup1, GETUTCDATE(), @TID, GETUTCDATE());

INSERT INTO stock_replenishment_item (id, replenishment_id, item_id, quantity, notes, tenant_id, created_at)
VALUES
(NEWID(), @repl1, @prod1, 100, 'WC ARENA BLOC — rotation forte',      @TID, GETUTCDATE()),
(NEWID(), @repl1, @prod2,  50, 'LM 45X34 — stock faible entrepôt',    @TID, GETUTCDATE());

GO

-- ════════════════════════════════════════════════════════════════
-- SECTION 7 — AUDIT TRAIL (traçabilité événements clés)
-- ════════════════════════════════════════════════════════════════

DECLARE @TID UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000001';
DECLARE @rep1 UNIQUEIDENTIFIER, @rep2 UNIQUEIDENTIFIER, @sup1 UNIQUEIDENTIFIER;
SELECT TOP 1 @rep1=id FROM users WHERE tenant_id=@TID AND is_active=1 ORDER BY created_at;
SELECT TOP 1 @rep2=id FROM users WHERE tenant_id=@TID AND is_active=1 AND id<>ISNULL(@rep1,'00000000-0000-0000-0000-000000000000') ORDER BY created_at;
SELECT TOP 1 @sup1=id FROM users WHERE tenant_id=@TID AND is_active=1 AND id NOT IN (ISNULL(@rep1,'00000000-0000-0000-0000-000000000000'),ISNULL(@rep2,'00000000-0000-0000-0000-000000000000')) ORDER BY created_at DESC;

DECLARE @tourA UNIQUEIDENTIFIER, @tourB UNIQUEIDENTIFIER, @tourC UNIQUEIDENTIFIER, @tourD UNIQUEIDENTIFIER;
SELECT TOP 1 @tourA=id FROM delivery_tour WHERE zone='Casablanca'     AND status='CLOSED'   AND tenant_id=@TID ORDER BY created_at DESC;
SELECT TOP 1 @tourB=id FROM delivery_tour WHERE zone='Rabat'          AND status='EN_COURS' AND tenant_id=@TID ORDER BY created_at DESC;
SELECT TOP 1 @tourC=id FROM delivery_tour WHERE zone='Marrakech'      AND status='VALIDE'   AND tenant_id=@TID ORDER BY created_at DESC;
SELECT TOP 1 @tourD=id FROM delivery_tour WHERE zone='Casablanca-Est' AND status='CLOSED'   AND tenant_id=@TID ORDER BY created_at DESC;

INSERT INTO audit_trail (action, entity_type, entity_id, who_user_id, what_changed, when_date, where_location, why_reason)
VALUES
-- Scénario A
('Create',   'DeliveryTour',    @tourA, @rep1, 'Création tournée Casablanca J-1',         DATEADD(hour,-11,GETDATE()), 'Casablanca',     'Planification quotidienne'),
('Validate', 'DeliveryTour',    @tourA, @sup1, 'DRAFT → VALIDE',                          DATEADD(hour,-11,GETDATE()), 'Casablanca',     'Validation superviseur'),
('Start',    'DeliveryTour',    @tourA, @rep1, 'VALIDE → EN_COURS (TOUR_START GPS)',       DATEADD(hour,-10,GETDATE()), 'Casablanca GPS', 'Départ terrain'),
('Close',    'DeliveryTour',    @tourA, @sup1, 'EN_COURS → CLOSED',                       DATEADD(hour,-1, GETDATE()), 'Casablanca',     'Fin journée'),

-- Scénario B
('Create',   'DeliveryTour',    @tourB, @rep2, 'Création tournée Rabat auj.',              DATEADD(hour,-4,GETDATE()), 'Rabat',          'Planification journée'),
('Validate', 'DeliveryTour',    @tourB, @sup1, 'DRAFT → VALIDE',                          DATEADD(hour,-4,GETDATE()), 'Rabat',          'Validation OK'),
('Start',    'DeliveryTour',    @tourB, @rep2, 'VALIDE → EN_COURS (TOUR_START GPS)',       DATEADD(hour,-3,GETDATE()), 'Rabat GPS',      'Départ automatique GPS'),

-- Scénario C
('Create',   'DeliveryTour',    @tourC, @sup1, 'Création tournée Marrakech J+1',           GETDATE(),                   'Marrakech',      'Planification avancée'),
('Validate', 'DeliveryTour',    @tourC, @sup1, 'DRAFT → VALIDE',                          GETDATE(),                   'Marrakech',      'Chargement prévu ce soir'),

-- Scénario D (pending_approval)
('GENERATE_SETTLEMENT', 'SettlementReport', @tourD, @rep1, 'Rapport généré automatiquement', DATEADD(day,-7,GETDATE()), 'Casablanca-Est', 'Fin de tournée'),
('SETTLEMENT_PENDING_APPROVAL', 'SettlementReport', @tourD, @rep1, 'Écart 900 MAD > seuil 500 — escalade', DATEADD(day,-7,GETDATE()), 'Casablanca-Est', 'Discrepancy trop élevée');
