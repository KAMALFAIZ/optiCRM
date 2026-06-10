SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V43 : Vider les données produits
-- • Supprime les prix produits (product_prices)
-- • Supprime les produits (products)
-- • Supprime les catégories produits (product_categories)
-- =====================================================

DELETE FROM product_prices;
DELETE FROM products;
DELETE FROM product_categories;