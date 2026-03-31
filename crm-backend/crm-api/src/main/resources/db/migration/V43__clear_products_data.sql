SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V43 : Vider les données produits
-- • Supprime les prix produits (product_prices)
-- • Supprime les produits (products)
-- • Supprime les catégories produits (product_categories)
-- =====================================================

TRUNCATE TABLE product_prices;
TRUNCATE TABLE products;
TRUNCATE TABLE product_categories;