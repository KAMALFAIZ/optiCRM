-- ============================================================
-- Aligne opticrm_ets_essaidi : DEFAULT + NOT NULL sur tenant_id
-- Architecture database-per-tenant : tous les rows = ce tenant
-- tenant_id = E8D4EB35-EB35-484F-A697-FD268493BE19
-- ============================================================
USE opticrm_ets_essaidi;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @tid NVARCHAR(36) = 'E8D4EB35-EB35-484F-A697-FD268493BE19';
DECLARE @sql NVARCHAR(MAX) = N'';

-- 1) Pour chaque table ayant une colonne tenant_id SANS contrainte DEFAULT :
--    - remplir les valeurs NULL existantes
--    - ajouter une contrainte DEFAULT = tenant id
SELECT @sql = @sql +
    'UPDATE [dbo].[' + t.name + '] SET [tenant_id] = ''' + @tid + ''' WHERE [tenant_id] IS NULL;' + CHAR(10) +
    'ALTER TABLE [dbo].[' + t.name + '] ADD CONSTRAINT [DF_' + t.name + '_tenant_id] DEFAULT ''' + @tid + ''' FOR [tenant_id];' + CHAR(10)
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'tenant_id'
WHERE NOT EXISTS (
    SELECT 1 FROM sys.default_constraints dc WHERE dc.parent_object_id = t.object_id AND dc.parent_column_id = c.column_id
)
AND t.name NOT IN ('tenants', 'subscription_plans', 'flyway_schema_history');

EXEC sp_executesql @sql;

PRINT '=== Colonnes tenant_id avec DEFAULT ===';
SELECT t.name AS table_name,
       CASE WHEN dc.name IS NULL THEN 'NO DEFAULT' ELSE 'OK' END AS default_status
FROM sys.tables t
JOIN sys.columns c ON c.object_id = t.object_id AND c.name = 'tenant_id'
LEFT JOIN sys.default_constraints dc ON dc.parent_object_id = t.object_id AND dc.parent_column_id = c.column_id
ORDER BY t.name;
