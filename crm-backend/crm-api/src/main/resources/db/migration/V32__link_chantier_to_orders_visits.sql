SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- Migration V32: Lier les commandes et visites aux chantiers
-- Un SalesOrder et une Visit peuvent être rattachés à un Account OU un Chantier

-- sales_orders : account_id devient nullable + ajout chantier_id
ALTER TABLE sales_orders
    ALTER COLUMN account_id UNIQUEIDENTIFIER NULL;
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('sales_orders') AND name = 'chantier_id')
    ALTER TABLE sales_orders ADD chantier_id UNIQUEIDENTIFIER REFERENCES chantiers(id) ON DELETE SET NULL;

-- Contrainte métier : account_id OU chantier_id doit être renseigné
IF NOT EXISTS (SELECT name FROM sys.check_constraints WHERE name = 'chk_sales_order_account_or_chantier')
    ALTER TABLE sales_orders
        ADD CONSTRAINT chk_sales_order_account_or_chantier
        CHECK (account_id IS NOT NULL OR chantier_id IS NOT NULL);

-- visits : ajout chantier_id (account_id reste nullable comme avant)
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('visits') AND name = 'chantier_id')
    ALTER TABLE visits ADD chantier_id UNIQUEIDENTIFIER REFERENCES chantiers(id) ON DELETE SET NULL;

-- Index
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_sales_orders_chantier' AND object_id = OBJECT_ID('sales_orders'))
    CREATE INDEX idx_sales_orders_chantier ON sales_orders(chantier_id);
IF NOT EXISTS (SELECT name FROM sys.indexes WHERE name = 'idx_visits_chantier' AND object_id = OBJECT_ID('visits'))
    CREATE INDEX idx_visits_chantier        ON visits(chantier_id);