import { useState, useMemo, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Avatar, Dropdown, Space, Tooltip, Drawer, Grid } from 'antd';
import NotificationPanel from '@/features/notifications/NotificationPanel';
import type { MenuProps } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  BankOutlined,
  FunnelPlotOutlined,
  TrophyOutlined,
  FileTextOutlined,
  ShoppingOutlined,
  DollarOutlined,
  CalendarOutlined,
  BarChartOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  ProfileOutlined,
  TeamOutlined,
  SunOutlined,
  MoonOutlined,
  EnvironmentOutlined,
  ScheduleOutlined,
  FundProjectionScreenOutlined,
  ShoppingCartOutlined,
  AimOutlined,
  MailOutlined,
  NotificationOutlined,
  LineChartOutlined,
  RiseOutlined,
  ClockCircleOutlined,
  TagsOutlined,
  ApiOutlined,
  ProjectOutlined,
  CustomerServiceOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CarOutlined,
  GiftOutlined,
  SendOutlined,
  ReconciliationOutlined,
  RadarChartOutlined,
  BoxPlotOutlined,
  RetweetOutlined,
  CompassOutlined,
  FileProtectOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '@/store';
import { logoutAsync, selectUser } from '@/features/auth/authSlice';
import { toggleTheme, selectThemeMode } from '@/features/settings/themeSlice';
import { usePermissions } from '@/hooks/usePermissions';
import GlobalSearchBar from '@/components/GlobalSearchBar';
import AiAssistant from '@/components/ai/AiAssistant';
import OfflineBanner from '@/components/OfflineBanner';

const { Header, Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const menuItems: MenuProps['items'] = [
  {
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Tableau de bord',
  },
  {
    key: 'crm',
    icon: <UserOutlined />,
    label: 'CRM',
    children: [
      { key: '/contacts', icon: <UserOutlined />, label: 'Contacts' },
      { key: '/accounts', icon: <BankOutlined />, label: 'Comptes' },
      { key: '/leads', icon: <FunnelPlotOutlined />, label: 'Pistes' },
      { key: '/opportunities', icon: <TrophyOutlined />, label: 'Opportunités' },
      { key: '/quotes', icon: <FileTextOutlined />, label: 'Devis' },
      { key: '/competitors', icon: <AimOutlined />, label: 'Concurrents' },
    ],
  },
  {
    key: 'inventory',
    icon: <ShoppingOutlined />,
    label: 'Stock',
    children: [
      { key: '/stock/products', icon: <ShoppingOutlined />, label: 'Produits' },
      { key: '/stock/inventory', icon: <ShoppingOutlined />, label: 'Inventaire' },
    ],
  },
  {
    key: 'finance',
    icon: <DollarOutlined />,
    label: 'Finance',
    children: [
      { key: '/invoices', icon: <FileTextOutlined />, label: 'Factures' },
      { key: '/payments', icon: <DollarOutlined />, label: 'Paiements' },
      { key: '/orders', icon: <ShoppingCartOutlined />, label: 'Commandes' },
      { key: '/aged-balance', icon: <ClockCircleOutlined />, label: 'Balance Âgée' },
      { key: '/ventes-saisies', icon: <RiseOutlined />, label: 'Ventes saisies' },
    ],
  },
  {
    key: 'odyssee',
    icon: <EnvironmentOutlined />,
    label: 'Chantier',
    children: [
      { key: '/chantiers', icon: <EnvironmentOutlined />, label: 'Chantiers' },
      { key: '/map', icon: <EnvironmentOutlined />, label: 'Carte interactive' },
    ],
  },
  {
    key: 'terrain',
    icon: <EnvironmentOutlined />,
    label: 'Terrain',
    children: [
      { key: '/activities', icon: <CalendarOutlined />, label: 'Activités' },
      { key: '/planning', icon: <ScheduleOutlined />, label: 'Planning' },
      { key: '/visits', icon: <EnvironmentOutlined />, label: 'Visites' },
      { key: '/expense-reports', icon: <DollarOutlined />, label: 'Notes de frais' },
      { key: '/field-dashboard', icon: <FundProjectionScreenOutlined />, label: 'Tableau terrain' },
    ],
  },
  {
    key: 'projets',
    icon: <ProjectOutlined />,
    label: 'Projets & Support',
    children: [
      { key: '/tickets', icon: <CustomerServiceOutlined />, label: 'Tickets' },
      { key: '/projects', icon: <ProjectOutlined />, label: 'Projets' },
    ],
  },
  {
    key: 'marketing',
    icon: <NotificationOutlined />,
    label: 'Marketing',
    children: [
      { key: '/campaigns', icon: <NotificationOutlined />, label: 'Campagnes' },
      { key: '/email-templates', icon: <MailOutlined />, label: 'Templates Email' },
    ],
  },
  {
    key: 'pilotage',
    icon: <LineChartOutlined />,
    label: 'Pilotage',
    children: [
      { key: '/forecast', icon: <RiseOutlined />, label: 'Prévisions' },
      { key: '/kpis', icon: <BarChartOutlined />, label: 'KPIs Commerciaux' },
      { key: '/supervision-commerciaux', icon: <TeamOutlined />, label: 'Supervision Commerciaux' },
      { key: '/supervisor-team', icon: <UserOutlined />, label: 'Mon Équipe' },
      { key: '/objectives', icon: <AimOutlined />, label: 'Objectifs' },
      { key: '/sales-tracking', icon: <LineChartOutlined />, label: 'Suivi Ventes' },
      { key: '/reports', icon: <BarChartOutlined />, label: 'Rapports' },
    ],
  },
  {
    key: 'livraison',
    icon: <CarOutlined />,
    label: 'Livraison',
    children: [
      { key: '/delivery/dashboard',    icon: <DashboardOutlined />,         label: 'Tableau de bord' },
      { key: '/delivery/tours',        icon: <CarOutlined />,               label: 'Tournées' },
      { key: '/delivery/lines',        icon: <SendOutlined />,              label: 'Lignes de livraison' },
      { key: '/delivery/vehicle-loads',icon: <BoxPlotOutlined />,           label: 'Chargement véhicule' },
      { key: '/delivery/pre-orders',   icon: <ReconciliationOutlined />,    label: 'Pré-commandes' },
      { key: '/delivery/promotions',   icon: <GiftOutlined />,              label: 'Promotions / Gratuités' },
      { key: '/delivery/returns',      icon: <RetweetOutlined />,           label: 'Retours' },
      { key: '/delivery/replenishment',icon: <ShoppingOutlined />,          label: 'Réapprovisionnement' },
      { key: '/delivery/settlement',   icon: <FileProtectOutlined />,       label: 'Clôture / Solde' },
      { key: '/delivery/credit-aging', icon: <ClockCircleOutlined />,       label: 'Balance crédit' },
      { key: '/delivery/objectives',   icon: <AimOutlined />,               label: 'Objectifs rep.' },
      { key: '/delivery/reports',      icon: <RadarChartOutlined />,        label: 'Rapports livraison' },
      { key: '/delivery/batches',      icon: <ReconciliationOutlined />,    label: 'Lots / FEFO' },
      { key: '/delivery/gps',          icon: <CompassOutlined />,           label: 'Suivi GPS' },
    ],
  },
  {
    key: 'admin',
    icon: <SettingOutlined />,
    label: 'Administration',
    children: [
      { key: '/workflows', icon: <ThunderboltOutlined />, label: 'Workflows' },
      { key: '/users', icon: <UserOutlined />, label: 'Utilisateurs' },
      { key: '/teams', icon: <TeamOutlined />, label: 'Équipes' },
      { key: '/admin/roles', icon: <SafetyCertificateOutlined />, label: 'Rôles & Permissions' },
      { key: '/admin/pricing-categories', icon: <TagsOutlined />, label: 'Catégories tarifaires' },
      { key: '/admin/tenants', icon: <DatabaseOutlined />, label: 'Clients SaaS' },
      {
        key: 'integration-group',
        icon: <ApiOutlined />,
        label: 'Intégrations',
        children: [
          { key: '/integration',       icon: <ApiOutlined />,        label: 'Mappings CSV' },
          { key: '/integration/sage',  icon: <ThunderboltOutlined />, label: 'Sage 100 / Auto-Sync' },
        ],
      },
      { key: '/settings', icon: <SettingOutlined />, label: 'Paramètres' },
    ],
  },
];

/**
 * Filters menu items based on the user's role permissions.
 * - Leaf items (routes) are filtered by canAccessRoute
 * - Group items are filtered by canAccessGroup, then children are filtered individually
 * - Groups with no visible children are hidden
 */
function filterMenuItems(
  items: MenuProps['items'],
  canAccessRoute: (key: string) => boolean,
  canAccessGroup: (key: string) => boolean
): MenuProps['items'] {
  if (!items) return [];
  return items
    .map((item: any) => {
      if (!item) return null;
      // Group/submenu with children
      if (item.children) {
        if (!canAccessGroup(item.key)) return null;
        const filteredChildren = item.children.filter((child: any) => {
          if (!child?.key) return false;
          return canAccessRoute(child.key);
        });
        if (filteredChildren.length === 0) return null;
        return { ...item, children: filteredChildren };
      }
      // Leaf item (route)
      if (item.key?.startsWith('/') || item.key === '/') {
        return canAccessRoute(item.key) ? item : null;
      }
      return item;
    })
    .filter(Boolean);
}

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const themeMode = useAppSelector(selectThemeMode);
  const isDark = themeMode === 'dark';
  const { canAccessRoute, canAccessGroup } = usePermissions();
  const screens = useBreakpoint();

  // Sur tablette/mobile (< lg = < 992px) : utiliser le Drawer à la place du Sider fixe
  const isMobile = !screens.lg;

  // Fermer le drawer automatiquement au changement de route
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Filter sidebar menu items based on user permissions
  const filteredMenuItems = useMemo(
    () => filterMenuItems(menuItems, canAccessRoute, canAccessGroup),
    [canAccessRoute, canAccessGroup]
  );

  const sidebarBg = isDark ? '#1a1d21' : '#405189';
  const sidebarWidth = 250;
  const sidebarCollapsed = 70;
  const headerHeight = 70;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key);
      if (isMobile) setDrawerOpen(false);
    }
  };

  const handleLogout = () => {
    dispatch(logoutAsync());
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <ProfileOutlined />,
      label: 'Mon profil',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Paramètres',
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Déconnexion',
      danger: true,
      onClick: handleLogout,
    },
  ];

  // Contenu du menu sidebar (partagé entre Sider et Drawer)
  const sidebarContent = (
    <>
      {/* Logo */}
      <div
        style={{
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: (!isMobile && collapsed) ? 'center' : 'flex-start',
          padding: (!isMobile && collapsed) ? '0' : '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        {(!isMobile && collapsed) ? (
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#fff', fontFamily: 'Poppins, sans-serif' }}>
            O
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: '#fff', fontFamily: 'Poppins, sans-serif', flexShrink: 0 }}>
              O
            </div>
            <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'Poppins, sans-serif', letterSpacing: '-0.3px' }}>
              OptiCRM
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <Menu
        mode="inline"
        theme="dark"
        selectedKeys={[location.pathname]}
        defaultOpenKeys={[]}
        items={filteredMenuItems}
        onClick={handleMenuClick}
        style={{ borderRight: 0, background: 'transparent', marginTop: 8, paddingBottom: 24 }}
      />
    </>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ── SIDEBAR : Drawer sur tablette/mobile, Sider sur desktop ── */}
      {isMobile ? (
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          placement="left"
          width={sidebarWidth}
          styles={{
            body: { padding: 0, background: sidebarBg, overflow: 'auto' },
            header: { display: 'none' },
          }}
          style={{ padding: 0 }}
        >
          {sidebarContent}
        </Drawer>
      ) : (
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        width={sidebarWidth}
        collapsedWidth={sidebarCollapsed}
        className="velzon-sider"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          background: sidebarBg,
          transition: 'all 0.2s, background-color 0.3s',
          zIndex: 100,
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
        }}
      >
        {sidebarContent}
      </Sider>
      )}

      {/* ── MAIN LAYOUT ── */}
      <Layout
        style={{
          marginLeft: isMobile ? 0 : (collapsed ? sidebarCollapsed : sidebarWidth),
          transition: 'margin-left 0.2s',
          minHeight: '100vh',
          background: isDark ? '#111316' : '#f3f6f9',
        }}
      >
        {/* ── HEADER ── */}
        <Header
          className="velzon-header"
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 99,
            width: '100%',
            height: headerHeight,
            lineHeight: `${headerHeight}px`,
            backgroundColor: isDark ? '#262b30' : '#ffffff',
            borderBottom: `1px solid ${isDark ? '#2a2f34' : '#e9ebec'}`,
            boxShadow: isDark ? '0 1px 4px rgba(0,0,0,0.3)' : '0 1px 4px rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: isMobile ? '0 12px' : '0 24px',
            transition: 'background-color 0.3s',
          }}
        >
          {/* Left: collapse toggle + search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button
              onClick={() => isMobile ? setDrawerOpen(true) : setCollapsed(!collapsed)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: 6,
                color: isDark ? '#b9c0c7' : '#495057',
                display: 'flex',
                alignItems: 'center',
                fontSize: 18,
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f3f6f9';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              {isMobile ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            </button>
            <GlobalSearchBar />
          </div>

          {/* Right: actions */}
          <Space size={4}>
            {/* Theme toggle */}
            <Tooltip title={isDark ? 'Mode clair' : 'Mode sombre'}>
              <button
                onClick={() => dispatch(toggleTheme())}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: 6,
                  color: isDark ? '#f7b84b' : '#495057',
                  fontSize: 18,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {isDark ? <SunOutlined /> : <MoonOutlined />}
              </button>
            </Tooltip>

            {/* Notifications */}
            <NotificationPanel isDark={isDark} />

            {/* User dropdown */}
            <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: `1px solid ${isDark ? '#2a2f34' : '#e9ebec'}`,
                  background: isDark ? 'rgba(255,255,255,0.04)' : '#f8f9fa',
                  transition: 'all 0.2s',
                  marginLeft: 4,
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = isDark
                    ? 'rgba(255,255,255,0.08)'
                    : '#f0f3ff';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = isDark
                    ? 'rgba(255,255,255,0.04)'
                    : '#f8f9fa';
                }}
              >
                <Avatar
                  size={32}
                  src={user?.avatarUrl}
                  icon={!user?.avatarUrl ? <UserOutlined /> : undefined}
                  style={{
                    background: '#405189',
                    fontSize: 13,
                  }}
                >
                  {user?.firstName?.[0]}
                  {user?.lastName?.[0]}
                </Avatar>
                <div
                  className="hidden md:block"
                  style={{ lineHeight: 1.3 }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: isDark ? '#e9ecef' : '#212529',
                      fontFamily: 'Poppins, sans-serif',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {user ? `${user.firstName} ${user.lastName}` : 'Utilisateur'}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: isDark ? '#6d7080' : '#878a99',
                      fontFamily: 'Poppins, sans-serif',
                    }}
                  >
                    {user?.role?.name ?? 'Admin'}
                  </div>
                </div>
              </div>
            </Dropdown>
          </Space>
        </Header>

        {/* ── OFFLINE BANNER ── */}
        <OfflineBanner />

        {/* ── CONTENT ── */}
        <Content
          style={{
            margin: isMobile ? '8px' : '12px 16px',
            background: 'transparent',
          }}
        >
          <Outlet />
        </Content>
      </Layout>

      <AiAssistant />
    </Layout>
  );
}
