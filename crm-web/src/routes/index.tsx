import { RouteObject, Navigate } from 'react-router-dom';
import SetupWizardPage from '@/pages/setup/SetupWizardPage';
import SavLoginPage from '@/features/sav/portal/SavLoginPage';
import SavVerifyPage from '@/features/sav/portal/SavVerifyPage';
import SavNewTicketPage from '@/features/sav/portal/SavNewTicketPage';
import SavTicketDetailPage from '@/features/sav/portal/SavTicketDetailPage';
import SavHistoriquePage from '@/features/sav/portal/SavHistoriquePage';
import SavDashboardPage from '@/features/sav/dashboard/SavDashboardPage';
import SavKbPage from '@/features/sav/kb/SavKbPage';
import { useAppSelector } from '@/store';

import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/features/auth/LoginPage';
import ForgotPasswordPage from '@/features/auth/ForgotPasswordPage';
import ResetPasswordPage from '@/features/auth/ResetPasswordPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import SettingsPage from '@/features/settings/SettingsPage';
import { ContactsListPage, ContactDetailPage } from '@/features/contacts';
import { AccountsListPage, AccountDetailPage } from '@/features/accounts';
import { LeadsListPage, LeadDetailPage } from '@/features/leads';
import { OpportunitiesListPage } from '@/features/opportunities';
import { QuotesListPage } from '@/features/quotes';
import { ProductsListPage, InventoryListPage } from '@/features/stock';
import { PaymentsListPage, InvoicesListPage, SalesOrdersListPage, AgedBalancePage } from '@/features/finance';
import { CompetitorsListPage } from '@/features/competitors';
import { UsersListPage } from '@/features/users';
import { RolesListPage } from '@/features/roles';
import { ActivitiesListPage } from '@/features/activities';
import { VisitsListPage } from '@/features/visits';
import { ToursListPage, TourDetailPage } from '@/features/tours';
import { ExpenseReportsPage } from '@/features/tours/expenseReports';
import { PlanningPage } from '@/features/planning';
import { FieldDashboardPage } from '@/features/field-dashboard';
import { CampaignsListPage } from '@/features/campaigns';
import { EmailTemplatesListPage } from '@/features/email-templates';
import { ChantiersListPage, ChantierDetailPage } from '@/features/chantiers';
import TicketsListPage from '@/features/tickets/TicketsListPage';
import TicketDetailPage from '@/features/tickets/TicketDetailPage';
import ProjectsListPage from '@/features/projects/ProjectsListPage';
import ProjectDetailPage from '@/features/projects/ProjectDetailPage';
import MapPage from '@/features/map/MapPage';
import { ForecastPage } from '@/features/forecast';
import { CommercialKpisPage, SupervisionCommerciauxPage } from '@/features/kpis';
import SupervisorTeamPage from '@/features/supervisor/SupervisorTeamPage';
import TeamsPage from '@/features/teams/TeamsPage';
import { ReportsPage } from '@/features/reports';
import { ObjectivesPage, SalesTrackingPage } from '@/features/objectives';
import PricingCategoriesPage from '@/features/admin/PricingCategoriesPage';
import TenantsAdminPage from '@/features/admin/TenantsAdminPage';
import IntegrationSagePage from '@/features/integration/IntegrationSagePage';
import IntegrationPage from '@/features/integration/IntegrationPage';
import VentesSaisiesPage from '@/features/ventes-saisies/VentesSaisiesPage';
import { WorkflowsListPage } from '@/features/workflows';
import DeliveryToursListPage from '@/features/delivery/DeliveryToursListPage';
import DeliveryLinesListPage from '@/features/delivery/DeliveryLinesListPage';
import VehicleLoadsListPage from '@/features/delivery/VehicleLoadsListPage';
import ReturnsListPage from '@/features/delivery/ReturnsListPage';
import StockReplenishmentListPage from '@/features/delivery/StockReplenishmentListPage';
import SettlementListPage from '@/features/delivery/SettlementListPage';
import AuditTrailListPage from '@/features/delivery/AuditTrailListPage';
import DeliveryDashboardPage from '@/features/delivery/DeliveryDashboardPage';
import DeliveryReportsPage from '@/features/delivery/DeliveryReportsPage';
import CreditAgingPage from '@/features/delivery/CreditAgingPage';
import PreOrdersPage from '@/features/delivery/PreOrdersPage';
import ProductBatchPage from '@/features/delivery/ProductBatchPage';
import RepObjectivesPage from '@/features/delivery/RepObjectivesPage';
import GpsTrackingPage from '@/features/delivery/GpsTrackingPage';
import PromotionsListPage from '@/features/delivery/PromotionsListPage';
import ProtectedRoute from './ProtectedRoute';
import { PermissionPage } from '@/components/PermissionGuard';

// Redirect home based on role
function HomeRedirect() {
  const user = useAppSelector((state) => state.auth.user);
  const role = user?.role?.name;
  if (role === 'COMMERCIAL') {
    return <Navigate to="/field-dashboard" replace />;
  }
  return <DashboardPage />;
}

// Placeholder pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="p-6">
    <h1 className="text-2xl font-semibold mb-4">{title}</h1>
    <p className="text-gray-500">Cette page est en cours de développement.</p>
  </div>
);

/**
 * Helper to wrap a page element with permission protection.
 * If the user lacks 'view' permission for the given module,
 * they see a 403 "Access Denied" page instead.
 */
function withPermission(module: string, element: React.ReactNode) {
  return (
    <PermissionPage module={module} action="view">
      {element}
    </PermissionPage>
  );
}

export const routes: RouteObject[] = [
  // ── Portail SAV public (sans auth OptiCRM) ──────────────────────────────
  { path: '/sav', element: <SavLoginPage /> },
  { path: '/sav/verify', element: <SavVerifyPage /> },
  { path: '/sav/nouveau', element: <SavNewTicketPage /> },
  { path: '/sav/ticket/:numero', element: <SavTicketDetailPage /> },
  { path: '/sav/historique', element: <SavHistoriquePage /> },
  {
    path: '/setup',
    element: <SetupWizardPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <HomeRedirect />,
      },
      // ── CRM ──
      {
        path: 'contacts',
        element: withPermission('crm', <ContactsListPage />),
      },
      {
        path: 'contacts/:id',
        element: withPermission('crm', <ContactDetailPage />),
      },
      {
        path: 'accounts',
        element: withPermission('crm', <AccountsListPage />),
      },
      {
        path: 'accounts/:id',
        element: withPermission('crm', <AccountDetailPage />),
      },
      {
        path: 'leads',
        element: withPermission('crm', <LeadsListPage />),
      },
      {
        path: 'leads/:id',
        element: withPermission('crm', <LeadDetailPage />),
      },
      {
        path: 'opportunities',
        element: withPermission('opportunities', <OpportunitiesListPage />),
      },
      {
        path: 'quotes',
        element: withPermission('opportunities', <QuotesListPage />),
      },
      {
        path: 'competitors',
        element: withPermission('crm', <CompetitorsListPage />),
      },
      // ── Stock ──
      {
        path: 'stock/products',
        element: withPermission('stock', <ProductsListPage />),
      },
      {
        path: 'stock/inventory',
        element: withPermission('stock', <InventoryListPage />),
      },
      // ── Finance ──
      {
        path: 'invoices',
        element: withPermission('finance', <InvoicesListPage />),
      },
      {
        path: 'payments',
        element: withPermission('finance', <PaymentsListPage />),
      },
      {
        path: 'orders',
        element: withPermission('finance', <SalesOrdersListPage />),
      },
      {
        path: 'aged-balance',
        element: withPermission('finance', <AgedBalancePage />),
      },
      {
        path: 'ventes-saisies',
        element: withPermission('finance', <VentesSaisiesPage />),
      },
      // ── ODYSSEE ──
      {
        path: 'chantiers',
        element: withPermission('chantiers', <ChantiersListPage />),
      },
      {
        path: 'chantiers/:id',
        element: withPermission('chantiers', <ChantierDetailPage />),
      },
      {
        path: 'map',
        element: withPermission('chantiers', <MapPage />),
      },
      // ── Terrain ──
      {
        path: 'activities',
        element: withPermission('terrain', <ActivitiesListPage />),
      },
      {
        path: 'planning',
        element: withPermission('planning', <PlanningPage />),
      },
      {
        path: 'visits',
        element: withPermission('terrain', <VisitsListPage />),
      },
      {
        path: 'tours',
        element: withPermission('terrain', <ToursListPage />),
      },
      {
        path: 'tours/:id',
        element: withPermission('terrain', <TourDetailPage />),
      },
      {
        path: 'expense-reports',
        element: withPermission('terrain', <ExpenseReportsPage />),
      },
      {
        path: 'field-dashboard',
        element: withPermission('terrain', <FieldDashboardPage />),
      },
      // ── Delivery ──
      {
        path: 'delivery/dashboard',
        element: withPermission('delivery', <DeliveryDashboardPage />),
      },
      {
        path: 'delivery/reports',
        element: withPermission('delivery', <DeliveryReportsPage />),
      },
      {
        path: 'delivery/credit-aging',
        element: withPermission('delivery', <CreditAgingPage />),
      },
      {
        path: 'delivery/pre-orders',
        element: withPermission('delivery', <PreOrdersPage />),
      },
      {
        path: 'delivery/batches',
        element: withPermission('delivery', <ProductBatchPage />),
      },
      {
        path: 'delivery/objectives',
        element: withPermission('delivery', <RepObjectivesPage />),
      },
      {
        path: 'delivery/gps',
        element: withPermission('delivery', <GpsTrackingPage />),
      },
      {
        path: 'delivery/tours',
        element: withPermission('delivery', <DeliveryToursListPage />),
      },
      {
        path: 'delivery/lines',
        element: withPermission('delivery', <DeliveryLinesListPage />),
      },
      {
        path: 'delivery/vehicle-loads',
        element: withPermission('delivery', <VehicleLoadsListPage />),
      },
      {
        path: 'delivery/returns',
        element: withPermission('delivery', <ReturnsListPage />),
      },
      {
        path: 'delivery/replenishment',
        element: withPermission('delivery', <StockReplenishmentListPage />),
      },
      {
        path: 'delivery/settlement',
        element: withPermission('delivery', <SettlementListPage />),
      },
      {
        path: 'delivery/audit',
        element: withPermission('delivery', <AuditTrailListPage />),
      },
      {
        path: 'delivery/promotions',
        element: withPermission('delivery', <PromotionsListPage />),
      },
      // ── Projects & Support ──
      {
        path: 'tickets',
        element: withPermission('projects', <TicketsListPage />),
      },
      {
        path: 'tickets/:id',
        element: withPermission('projects', <TicketDetailPage />),
      },
      {
        path: 'projects',
        element: withPermission('projects', <ProjectsListPage />),
      },
      {
        path: 'projects/:id',
        element: withPermission('projects', <ProjectDetailPage />),
      },
      // ── Marketing ──
      {
        path: 'campaigns',
        element: withPermission('marketing', <CampaignsListPage />),
      },
      {
        path: 'email-templates',
        element: withPermission('marketing', <EmailTemplatesListPage />),
      },
      // ── Pilotage ──
      {
        path: 'forecast',
        element: withPermission('reporting', <ForecastPage />),
      },
      {
        path: 'kpis',
        element: withPermission('reporting', <CommercialKpisPage />),
      },
      {
        path: 'supervision-commerciaux',
        element: withPermission('reporting', <SupervisionCommerciauxPage />),
      },
      {
        path: 'supervisor-team',
        element: withPermission('reporting', <SupervisorTeamPage />),
      },
      {
        path: 'objectives',
        element: withPermission('reporting', <ObjectivesPage />),
      },
      {
        path: 'sales-tracking',
        element: withPermission('reporting', <SalesTrackingPage />),
      },
      {
        path: 'reports',
        element: withPermission('reporting', <ReportsPage />),
      },
      // ── Automation ──
      {
        path: 'workflows',
        element: withPermission('admin', <WorkflowsListPage />),
      },
      // ── Administration ──
      {
        path: 'users',
        element: withPermission('admin', <UsersListPage />),
      },
      {
        path: 'teams',
        element: withPermission('admin', <TeamsPage />),
      },
      {
        path: 'admin/roles',
        element: withPermission('admin', <RolesListPage />),
      },
      {
        path: 'admin/pricing-categories',
        element: withPermission('admin', <PricingCategoriesPage />),
      },
      {
        path: 'admin/tenants',
        element: withPermission('admin', <TenantsAdminPage />),
      },
      {
        path: 'integration',
        element: withPermission('admin', <IntegrationPage />),
      },
      {
        path: 'integration/sage',
        element: withPermission('admin', <IntegrationSagePage />),
      },
      {
        path: 'settings',
        element: withPermission('admin', <SettingsPage />),
      },
      // ── SAV Module (KASOFT team only) ────────────────────────────────────
      {
        path: 'sav',
        element: withPermission('admin', <SavDashboardPage />),
      },
      {
        path: 'sav/kb',
        element: withPermission('admin', <SavKbPage />),
      },
      // ── Profile (always accessible) ──
      {
        path: 'profile',
        element: <PlaceholderPage title="Mon Profil" />,
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
];
