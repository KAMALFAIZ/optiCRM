SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- =====================================================
-- V9: Nettoyage des données de démonstration
-- Supprime toutes les données métier et conserve
-- uniquement la configuration système :
--   roles, opportunity_stages, payment_terms,
--     tax_rates, industries, objection_categories,
--     warehouses, utilisateur admin
-- =====================================================

PRINT 'Début du nettoyage des données de démonstration...';

-- --------------------------------------------------
-- 1. Notes de frais
-- --------------------------------------------------
DELETE FROM expense_report_lines;
DELETE FROM expense_reports;
PRINT 'Notes de frais supprimées';

-- --------------------------------------------------
-- 2. Tournées & visites
-- --------------------------------------------------
DELETE FROM tour_visits;
DELETE FROM tours;
DELETE FROM visits;
PRINT 'Tournées et visites supprimées';

-- --------------------------------------------------
-- 3. Activités
-- --------------------------------------------------
DELETE FROM activity_participants;
DELETE FROM activities;
PRINT 'Activités supprimées';

-- --------------------------------------------------
-- 4. Objections commerciales (liées aux opportunités)
-- --------------------------------------------------
DELETE FROM sales_objections;
DELETE FROM opportunity_objections;
DELETE FROM objection_responses;
DELETE FROM objections;
PRINT 'Objections supprimées';

-- --------------------------------------------------
-- 5. Paiements & allocations
-- --------------------------------------------------
DELETE FROM payment_allocations;
DELETE FROM payments;
PRINT 'Paiements supprimés';

-- --------------------------------------------------
-- 6. Factures
-- --------------------------------------------------
DELETE FROM invoice_lines;
DELETE FROM invoices;
PRINT 'Factures supprimées';

-- --------------------------------------------------
-- 7. Commandes
-- --------------------------------------------------
DELETE FROM sales_orders;
PRINT 'Commandes supprimées';

-- --------------------------------------------------
-- 8. Devis
-- --------------------------------------------------
DELETE FROM quote_lines;
DELETE FROM quotes;
PRINT 'Devis supprimés';

-- --------------------------------------------------
-- 9. Opportunités
-- --------------------------------------------------
DELETE FROM opportunity_contacts;
DELETE FROM opportunities;
PRINT 'Opportunités supprimées';

-- --------------------------------------------------
-- 10. Leads
-- --------------------------------------------------
DELETE FROM leads;
PRINT 'Leads supprimés';

-- --------------------------------------------------
-- 11. Contacts & Comptes
-- --------------------------------------------------
DELETE FROM contacts;
DELETE FROM accounts;
PRINT 'Contacts et comptes supprimés';

-- --------------------------------------------------
-- 12. Campagnes & Concurrents
-- --------------------------------------------------
DELETE FROM campaigns;
DELETE FROM competitors;
PRINT 'Campagnes et concurrents supprimés';

-- --------------------------------------------------
-- 13. Stock
-- --------------------------------------------------
DELETE FROM stock_movements;
DELETE FROM stock_levels;
PRINT 'Mouvements de stock supprimés';

-- --------------------------------------------------
-- 14. Produits & catégories
-- --------------------------------------------------
DELETE FROM products;
DELETE FROM product_categories;
PRINT 'Produits supprimés';

-- --------------------------------------------------
-- 15. Logs & tokens
-- --------------------------------------------------
DELETE FROM email_logs;
DELETE FROM audit_logs;
DELETE FROM user_activities;
DELETE FROM refresh_tokens;
PRINT 'Logs et tokens supprimés';

-- --------------------------------------------------
-- 16. Utilisateurs (conserver uniquement l'admin)
-- --------------------------------------------------
-- Neutraliser les FK circulaires sur teams avant de supprimer les users
UPDATE teams SET manager_id = NULL;
-- Supprimer tous les users sauf l'admin système
DELETE FROM users WHERE email != 'admin@opticrm.com';
PRINT 'Utilisateurs démo supprimés (admin conservé)';

-- --------------------------------------------------
-- 17. Équipes & Territoires
-- --------------------------------------------------
DELETE FROM teams;
DELETE FROM territories;
PRINT 'Équipes et territoires supprimés';

PRINT 'Nettoyage terminé. Configuration système conservée.';