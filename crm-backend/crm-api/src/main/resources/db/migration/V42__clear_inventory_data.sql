SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V42 : Vider les données d'inventaire
-- • Supprime tous les mouvements de stock
-- • Supprime tous les niveaux de stock
-- =====================================================

TRUNCATE TABLE stock_movements;
TRUNCATE TABLE stock_levels;

-- Supprimer l'entrepôt Marrakech créé en V17 (facultatif)
-- et réinitialiser les prix/seuils si nécessaire n'est pas fait ici
-- (les produits et l'entrepôt principal restent intacts)
DELETE FROM warehouses WHERE code = 'MRAK';