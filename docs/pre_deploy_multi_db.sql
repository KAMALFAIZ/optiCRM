-- ============================================================================
-- PRE-DEPLOYMENT SCRIPT — OptiCRM Multi-DB Migration
-- À exécuter MANUELLEMENT sur SQL Server AVANT le premier démarrage de l'app.
--
-- Connexion requise : serveur kasoft.selfip.net, login sa
-- ============================================================================

-- 1. Créer la base système
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'opticrm_system')
    CREATE DATABASE [opticrm_system];
GO

-- 2. Créer la base du tenant par défaut
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'opticrm_default')
    CREATE DATABASE [opticrm_default];
GO

PRINT 'Bases opticrm_system et opticrm_default créées.';
PRINT 'Vous pouvez maintenant démarrer l''application avec FLYWAY_ENABLED=true.';
GO
