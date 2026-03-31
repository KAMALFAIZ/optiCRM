SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- V14: Catalogue de produits sanitaires

DECLARE
  @cat_san_id  UNIQUEIDENTIFIER,
  @cat_lm_id   UNIQUEIDENTIFIER,
  @cat_wc_id   UNIQUEIDENTIFIER,
  @cat_bid_id  UNIQUEIDENTIFIER,
  @cat_lav_id  UNIQUEIDENTIFIER;

-- ─── 1. Catégorie principale ──────────────────────────────────────────────
SET @cat_san_id = NEWID();
INSERT INTO product_categories (id, code, name, description, sort_order)
VALUES (@cat_san_id, 'SANITAIRES', 'Sanitaires', 'Produits sanitaires et équipements de salle de bain', 1);

-- ─── 2. Sous-catégories ──────────────────────────────────────────────────
SET @cat_lm_id = NEWID();
INSERT INTO product_categories (id, code, name, parent_category_id, sort_order)
VALUES (@cat_lm_id, 'LAVE-MAINS', 'Lave-mains', @cat_san_id, 1);

SET @cat_wc_id = NEWID();
INSERT INTO product_categories (id, code, name, parent_category_id, sort_order)
VALUES (@cat_wc_id, 'WC-TOILETTES', 'WC & Toilettes', @cat_san_id, 2);

SET @cat_bid_id = NEWID();
INSERT INTO product_categories (id, code, name, parent_category_id, sort_order)
VALUES (@cat_bid_id, 'BIDETS', 'Bidets', @cat_san_id, 3);

SET @cat_lav_id = NEWID();
INSERT INTO product_categories (id, code, name, parent_category_id, sort_order)
VALUES (@cat_lav_id, 'LAVABOS-VASQUES', 'Lavabos & Vasques', @cat_san_id, 4);

-- ─── 3. Lave-mains (4 produits) ──────────────────────────────────────────
INSERT INTO products (id, code, name, category_id, unit_price, currency, unit_of_measure,
                      is_stockable, is_active, is_sellable, is_purchasable)
VALUES
  (NEWID(), 'LM-35',         'LAVE MAIN 35',           @cat_lm_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'LM-45X34',      'LAVE MAIN 45X34',        @cat_lm_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'LM-ARENA-BL',   'ARENA BLANC',            @cat_lm_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'LM-LUKA-SALT',  'LAVE MAIN LUKA YV SALT', @cat_lm_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1);

-- ─── 4. WC & Toilettes (8 produits) ──────────────────────────────────────
INSERT INTO products (id, code, name, category_id, unit_price, currency, unit_of_measure,
                      is_stockable, is_active, is_sellable, is_purchasable)
VALUES
  (NEWID(), 'WC-ARENA-BLOC', 'WC ARENA BLOC',        @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'WC-ARENA-PACK', 'WC ARENA PACK',        @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'WC-YV-SH',      'WC YVELINE SH',        @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'WC-YV-SV',      'WC YVELINE SV',        @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'WC-EVA',        'WC EVA',               @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'WC-SERENA-S',   'WC SERENA SUSPENDU',   @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'WC-PERLA-S',    'WC PERLA SUSPENDU',    @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'WC-EMMA-S',     'WC EMMA SUSPENDU',     @cat_wc_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1);

-- ─── 5. Bidets (3 produits) ───────────────────────────────────────────────
INSERT INTO products (id, code, name, category_id, unit_price, currency, unit_of_measure,
                      is_stockable, is_active, is_sellable, is_purchasable)
VALUES
  (NEWID(), 'BID-YV',     'BIDET YVELINE',       @cat_bid_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'BID-SERENA', 'BIDET SERENA',        @cat_bid_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'BID-EMMA',   'BIDET EMMA (PERLA)',  @cat_bid_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1);

-- ─── 6. Lavabos & Vasques (4 produits) ───────────────────────────────────
INSERT INTO products (id, code, name, category_id, unit_price, currency, unit_of_measure,
                      is_stockable, is_active, is_sellable, is_purchasable)
VALUES
  (NEWID(), 'LAV-YV',        'LAVABO YVELINE',          @cat_lav_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'LAV-COL-ARENA', 'LAVABO + COLONNE ARENA',  @cat_lav_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'VAS-RIO-50',    'RIO 50 VASQUE',           @cat_lav_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1),
  (NEWID(), 'CON-OPERA-70',  'OPERA/IRIS 70 CONSOLES',  @cat_lav_id, 0.00, 'MAD', 'unité', 1, 1, 1, 1);

PRINT '19 produits sanitaires insérés (4 lave-mains, 8 WC, 3 bidets, 4 lavabos/vasques)';