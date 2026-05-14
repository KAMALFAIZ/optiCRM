-- =====================================================
-- OptiCRM — Nettoyage données métier
-- Conserve : users, roles, territories, teams,
--            payment_terms, tax_rates, industries,
--            opportunity_stages, competitors,
--            product_categories, products, pricing_categories,
--            warehouses, objections, email_templates, app_settings
-- =====================================================

BEGIN;

TRUNCATE TABLE
  -- Chantiers / Terrain
  chantier_acteurs,
  chantiers,
  tour_visits,
  tours,
  visits,

  -- Finance / Transactionnel
  payment_allocations,
  invoice_lines,
  invoices,
  payments,
  quote_lines,
  quotes,
  sale_entries,
  sales_orders,

  -- Pipeline commercial
  opportunity_objections,
  opportunity_contacts,
  opportunities,

  -- Stock (mouvements transactionnels uniquement)
  stock_movements,
  stock_levels,

  -- Activités / Terrain
  activity_participants,
  activities,
  user_activities,
  expense_report_lines,
  expense_reports,
  commercial_objectives,

  -- CRM Core
  leads,
  contacts,
  account_photos,
  accounts,
  campaigns,

  -- Logs / Sessions
  email_logs,
  audit_logs,
  refresh_tokens,
  password_reset_tokens

CASCADE;

COMMIT;

-- Vérification rapide
SELECT 'accounts'           AS table_name, COUNT(*) FROM accounts
UNION ALL SELECT 'contacts',               COUNT(*) FROM contacts
UNION ALL SELECT 'leads',                  COUNT(*) FROM leads
UNION ALL SELECT 'opportunities',          COUNT(*) FROM opportunities
UNION ALL SELECT 'chantiers',              COUNT(*) FROM chantiers
UNION ALL SELECT 'users',                  COUNT(*) FROM users
ORDER BY table_name;
