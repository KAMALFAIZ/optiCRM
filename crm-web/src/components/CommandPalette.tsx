import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Input, Typography, Tag, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SearchOutlined,
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
  TeamOutlined,
  EnvironmentOutlined,
  ProjectOutlined,
  CustomerServiceOutlined,
  CarOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  ApiOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import searchApi, { SearchItem } from '@/api/search';

const { Text } = Typography;

type CommandKind = 'action' | 'nav' | 'entity';

interface Command {
  id: string;
  kind: CommandKind;
  label: string;
  hint?: string;
  icon: React.ReactNode;
  keywords?: string;
  run: () => void;
}

interface Props {
  open: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const KIND_LABEL: Record<CommandKind, string> = {
  action: 'Actions rapides',
  nav: 'Navigation',
  entity: 'Résultats',
};

const KIND_COLOR: Record<CommandKind, string> = {
  action: '#10B981',
  nav: '#4F46E5',
  entity: '#f7b84b',
};

const ENTITY_ROUTE: Record<string, { label: string; icon: React.ReactNode; route: string }> = {
  ACCOUNT: { label: 'Compte', icon: <BankOutlined />, route: '/accounts' },
  CONTACT: { label: 'Contact', icon: <UserOutlined />, route: '/contacts' },
  LEAD: { label: 'Piste', icon: <FunnelPlotOutlined />, route: '/leads' },
  OPPORTUNITY: { label: 'Opportunité', icon: <TrophyOutlined />, route: '/opportunities' },
  PRODUCT: { label: 'Produit', icon: <ShoppingOutlined />, route: '/stock/products' },
};

export default function CommandPalette({ open, onClose, isDark }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [entities, setEntities] = useState<SearchItem[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const listRef = useRef<HTMLDivElement>(null);

  const go = (path: string) => {
    onClose();
    navigate(path);
  };

  const staticCommands: Command[] = useMemo(() => [
    // Actions
    { id: 'new-account', kind: 'action', label: 'Créer un compte', icon: <PlusOutlined />, keywords: 'nouveau compte client société', run: () => go('/accounts?new=1') },
    { id: 'new-contact', kind: 'action', label: 'Créer un contact', icon: <PlusOutlined />, keywords: 'nouveau contact personne', run: () => go('/contacts?new=1') },
    { id: 'new-lead', kind: 'action', label: 'Créer une piste', icon: <PlusOutlined />, keywords: 'nouvelle piste lead prospect', run: () => go('/leads?new=1') },
    { id: 'new-opportunity', kind: 'action', label: 'Créer une opportunité', icon: <PlusOutlined />, keywords: 'nouvelle opportunité affaire', run: () => go('/opportunities?new=1') },
    { id: 'new-quote', kind: 'action', label: 'Créer un devis', icon: <PlusOutlined />, keywords: 'nouveau devis proposition', run: () => go('/quotes?new=1') },
    { id: 'new-ticket', kind: 'action', label: 'Créer un ticket SAV', icon: <PlusOutlined />, keywords: 'nouveau ticket support sav', run: () => go('/tickets?new=1') },

    // Navigation
    { id: 'nav-dashboard', kind: 'nav', label: 'Tableau de bord', icon: <DashboardOutlined />, keywords: 'home accueil dashboard kpi', run: () => go('/') },
    { id: 'nav-contacts', kind: 'nav', label: 'Contacts', icon: <UserOutlined />, run: () => go('/contacts') },
    { id: 'nav-accounts', kind: 'nav', label: 'Comptes', icon: <BankOutlined />, run: () => go('/accounts') },
    { id: 'nav-leads', kind: 'nav', label: 'Pistes', icon: <FunnelPlotOutlined />, run: () => go('/leads') },
    { id: 'nav-opps', kind: 'nav', label: 'Opportunités', icon: <TrophyOutlined />, keywords: 'pipeline kanban', run: () => go('/opportunities') },
    { id: 'nav-quotes', kind: 'nav', label: 'Devis', icon: <FileTextOutlined />, run: () => go('/quotes') },
    { id: 'nav-orders', kind: 'nav', label: 'Commandes', icon: <FileTextOutlined />, run: () => go('/orders') },
    { id: 'nav-invoices', kind: 'nav', label: 'Factures', icon: <FileTextOutlined />, run: () => go('/invoices') },
    { id: 'nav-payments', kind: 'nav', label: 'Paiements', icon: <DollarOutlined />, run: () => go('/payments') },
    { id: 'nav-aged', kind: 'nav', label: 'Balance âgée', icon: <DollarOutlined />, keywords: 'aged balance créances', run: () => go('/aged-balance') },
    { id: 'nav-products', kind: 'nav', label: 'Produits', icon: <ShoppingOutlined />, run: () => go('/stock/products') },
    { id: 'nav-inventory', kind: 'nav', label: 'Inventaire', icon: <ShoppingOutlined />, keywords: 'stock entrepôt', run: () => go('/stock/inventory') },
    { id: 'nav-activities', kind: 'nav', label: 'Activités', icon: <CalendarOutlined />, run: () => go('/activities') },
    { id: 'nav-planning', kind: 'nav', label: 'Planning', icon: <CalendarOutlined />, keywords: 'agenda calendrier', run: () => go('/planning') },
    { id: 'nav-tours', kind: 'nav', label: 'Tournées', icon: <EnvironmentOutlined />, keywords: 'visites terrain', run: () => go('/tours') },
    { id: 'nav-visits', kind: 'nav', label: 'Visites', icon: <EnvironmentOutlined />, run: () => go('/visits') },
    { id: 'nav-map', kind: 'nav', label: 'Carte', icon: <EnvironmentOutlined />, keywords: 'map géolocalisation', run: () => go('/map') },
    { id: 'nav-chantiers', kind: 'nav', label: 'Chantiers', icon: <ProjectOutlined />, run: () => go('/chantiers') },
    { id: 'nav-projects', kind: 'nav', label: 'Projets', icon: <ProjectOutlined />, run: () => go('/projects') },
    { id: 'nav-tickets', kind: 'nav', label: 'Tickets SAV', icon: <CustomerServiceOutlined />, keywords: 'support sav', run: () => go('/tickets') },
    { id: 'nav-campaigns', kind: 'nav', label: 'Campagnes', icon: <ThunderboltOutlined />, keywords: 'marketing emailing', run: () => go('/campaigns') },
    { id: 'nav-templates', kind: 'nav', label: 'Modèles d\'email', icon: <FileTextOutlined />, run: () => go('/email-templates') },
    { id: 'nav-delivery', kind: 'nav', label: 'Tableau livraison', icon: <CarOutlined />, keywords: 'delivery livraison', run: () => go('/delivery/dashboard') },
    { id: 'nav-delivery-tours', kind: 'nav', label: 'Tournées de livraison', icon: <CarOutlined />, run: () => go('/delivery/tours') },
    { id: 'nav-forecast', kind: 'nav', label: 'Prévisions', icon: <LineChartOutlined />, keywords: 'forecast prévisionnel', run: () => go('/forecast') },
    { id: 'nav-kpis', kind: 'nav', label: 'KPI commerciaux', icon: <BarChartOutlined />, run: () => go('/kpis') },
    { id: 'nav-reports', kind: 'nav', label: 'Rapports', icon: <BarChartOutlined />, run: () => go('/reports') },
    { id: 'nav-objectives', kind: 'nav', label: 'Objectifs', icon: <TrophyOutlined />, run: () => go('/objectives') },
    { id: 'nav-workflows', kind: 'nav', label: 'Workflows', icon: <ThunderboltOutlined />, keywords: 'automation règles', run: () => go('/workflows') },
    { id: 'nav-users', kind: 'nav', label: 'Utilisateurs', icon: <TeamOutlined />, run: () => go('/users') },
    { id: 'nav-teams', kind: 'nav', label: 'Équipes', icon: <TeamOutlined />, run: () => go('/teams') },
    { id: 'nav-tenants', kind: 'nav', label: 'Tenants', icon: <BankOutlined />, keywords: 'clients espaces admin', run: () => go('/admin/tenants') },
    { id: 'nav-integration', kind: 'nav', label: 'Intégrations', icon: <ApiOutlined />, keywords: 'sage api connecteurs', run: () => go('/integration') },
    { id: 'nav-settings', kind: 'nav', label: 'Paramètres', icon: <SettingOutlined />, run: () => go('/settings') },
  ], []);

  // Debounced entity search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) { setEntities([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await searchApi.globalSearch(q, 8);
        setEntities(res.items);
      } catch {
        setEntities([]);
      }
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setEntities([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Filtered static commands
  const filteredStatic = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return staticCommands.slice(0, 12);
    return staticCommands.filter((c) => {
      const hay = `${c.label} ${c.keywords ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, staticCommands]);

  const entityCommands: Command[] = useMemo(() => entities.map((e) => {
    const cfg = ENTITY_ROUTE[e.type] ?? { label: e.type, icon: <SearchOutlined />, route: '/' };
    return {
      id: `${e.type}:${e.id}`,
      kind: 'entity' as const,
      label: e.title,
      hint: e.subtitle || cfg.label,
      icon: cfg.icon,
      run: () => go(`${cfg.route}/${e.id}`),
    };
  }), [entities]);

  const all: Command[] = useMemo(() => [...filteredStatic, ...entityCommands], [filteredStatic, entityCommands]);

  useEffect(() => { setActiveIndex(0); }, [all.length]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, all.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = all[activeIndex];
        if (cmd) cmd.run();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, all, activeIndex]);

  // Scroll active into view
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLDivElement>(`[data-cmd-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  // Group for display
  const grouped = useMemo(() => {
    const g: Record<CommandKind, { cmd: Command; index: number }[]> = { action: [], nav: [], entity: [] };
    all.forEach((cmd, index) => { g[cmd.kind].push({ cmd, index }); });
    return g;
  }, [all]);

  const order: CommandKind[] = ['action', 'nav', 'entity'];
  const bg = isDark ? '#1d2228' : '#ffffff';
  const border = isDark ? '#2a2f34' : '#e9ebec';
  const hoverBg = isDark ? 'rgba(64, 81, 137, 0.18)' : '#f0f3ff';

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closable={false}
      width={640}
      destroyOnClose
      styles={{
        body: { padding: 0, background: bg, borderRadius: 8 },
        content: { padding: 0, overflow: 'hidden', borderRadius: 8 },
      }}
      style={{ top: 80 }}
    >
      <div style={{ borderBottom: `1px solid ${border}`, padding: '8px 14px' }}>
        <Input
          autoFocus
          variant="borderless"
          size="large"
          prefix={<SearchOutlined style={{ color: '#878a99', fontSize: 18 }} />}
          placeholder="Tapez une commande ou recherchez un compte, contact, devis..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div ref={listRef} style={{ maxHeight: 420, overflowY: 'auto', padding: '8px 0' }}>
        {all.length === 0 && (
          <div style={{ padding: 24 }}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun résultat" />
          </div>
        )}
        {order.map((kind) => {
          const items = grouped[kind];
          if (items.length === 0) return null;
          return (
            <div key={kind} style={{ marginBottom: 6 }}>
              <div style={{ padding: '6px 16px 4px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, color: '#878a99' }}>
                {KIND_LABEL[kind]}
              </div>
              {items.map(({ cmd, index }) => {
                const active = index === activeIndex;
                return (
                  <div
                    key={cmd.id}
                    data-cmd-index={index}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => cmd.run()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '8px 16px',
                      cursor: 'pointer',
                      background: active ? hoverBg : 'transparent',
                      borderLeft: `3px solid ${active ? KIND_COLOR[kind] : 'transparent'}`,
                      transition: 'background 0.1s',
                    }}
                  >
                    <span style={{ color: KIND_COLOR[kind], fontSize: 16, display: 'flex' }}>{cmd.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ display: 'block', fontSize: 14, fontWeight: 500 }} ellipsis>
                        {cmd.label}
                      </Text>
                      {cmd.hint && (
                        <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                          {cmd.hint}
                        </Text>
                      )}
                    </div>
                    {active && <Tag color="default" style={{ margin: 0, fontSize: 10 }}>↵</Tag>}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div style={{ borderTop: `1px solid ${border}`, padding: '8px 16px', display: 'flex', gap: 16, fontSize: 11, color: '#878a99' }}>
        <span><Tag style={{ margin: 0, fontSize: 10 }}>↑</Tag> <Tag style={{ margin: 0, fontSize: 10 }}>↓</Tag> Naviguer</span>
        <span><Tag style={{ margin: 0, fontSize: 10 }}>↵</Tag> Ouvrir</span>
        <span><Tag style={{ margin: 0, fontSize: 10 }}>Esc</Tag> Fermer</span>
        <span style={{ marginLeft: 'auto' }}><Tag style={{ margin: 0, fontSize: 10 }}>Ctrl+K</Tag> Ouvrir partout</span>
      </div>
    </Modal>
  );
}
