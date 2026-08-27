import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Select, Tag, Space, Card,
  Tooltip, Dropdown, Modal, message, Typography, Tabs, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined,
  EyeOutlined, EditOutlined, MoreOutlined, EnvironmentOutlined,
  StarOutlined, ReloadOutlined, GlobalOutlined, CameraOutlined,
  DownloadOutlined, FileExcelOutlined, FilePdfOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {
  chantiersApi, ChantierListItem, CreateChantierRequest, ChantiersExportFilters,
} from '@/api/chantiers';
import ChantierFormModal from './ChantierFormModal';
import ChantierGeoInsightsModal from './ChantierGeoInsightsModal';
import ChantierFromPhotoModal from './ChantierFromPhotoModal';

const { Text } = Typography;

const STADE_OPTIONS = [
  { value: 'ETUDE_CONCEPTION',  label: 'Étude / Conception',  color: 'blue' },
  { value: 'AUTORISATION',      label: 'Autorisation',         color: 'geekblue' },
  { value: 'GROS_OEUVRE',       label: 'Gros œuvre',           color: 'orange' },
  { value: 'SECOND_OEUVRE',     label: 'Second œuvre',         color: 'gold' },
  { value: 'PHASE_EQUIPEMENT',  label: 'Phase équipement',     color: 'lime' },
  { value: 'LIVRAISON',         label: 'Livraison',            color: 'green' },
  { value: 'CLOTURE',           label: 'Clôturé',              color: 'default' },
];

const STATUT_OPTIONS = [
  { value: 'ACTIF',       label: 'Actif',       color: 'green' },
  { value: 'PRIORITAIRE', label: 'Prioritaire', color: 'red' },
  { value: 'GAGNE',       label: 'Gagné',       color: 'blue' },
  { value: 'PERDU',       label: 'Perdu',       color: 'default' },
];

const NIVEAU_OPTIONS = [
  { value: 'FERME',               label: 'Fermé',              color: 'red' },
  { value: 'PARTIELLEMENT_OUVERT', label: 'Partiellement ouvert', color: 'orange' },
  { value: 'LIBRE',               label: 'Libre / influençable', color: 'green' },
];

const getStadeColor = (s?: string) => STADE_OPTIONS.find(o => o.value === s)?.color || 'default';
const getStadeLabel = (s?: string) => STADE_OPTIONS.find(o => o.value === s)?.label || s || '-';
const getStatutColor = (s?: string) => STATUT_OPTIONS.find(o => o.value === s)?.color || 'default';
const getStatutLabel = (s?: string) => STATUT_OPTIONS.find(o => o.value === s)?.label || s || '-';
const getNiveauColor = (s?: string) => NIVEAU_OPTIONS.find(o => o.value === s)?.color || 'default';
const getNiveauLabel = (s?: string) => NIVEAU_OPTIONS.find(o => o.value === s)?.label || s || '-';

export default function ChantiersListPage() {
  const navigate = useNavigate();
  const [chantiers, setChantiers] = useState<ChantierListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [stadeFilter, setStadeFilter] = useState<string | undefined>();
  const [temoinFilter, setTemoinFilter] = useState<boolean | undefined>();
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [geoInsightsOpen, setGeoInsightsOpen] = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [prefilledData, setPrefilledData] = useState<Partial<CreateChantierRequest> | null>(null);
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await chantiersApi.getAll({
        page, size: pageSize,
        search: search || undefined,
        stadeChantier: stadeFilter,
        statutChantier: activeTab === 'all' ? undefined : activeTab,
        temoin: temoinFilter,
      });
      setChantiers(res.content);
      setTotal(res.totalElements);
    } catch {
      message.error('Erreur lors du chargement des chantiers');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, stadeFilter, activeTab, temoinFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string, nom: string) => {
    Modal.confirm({
      title: `Supprimer "${nom}" ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await chantiersApi.delete(id);
        message.success('Chantier supprimé');
        load();
      },
    });
  };

  // L'export reprend les filtres affichés, pas seulement la page courante.
  const currentFilters = (): ChantiersExportFilters => ({
    search: search || undefined,
    stadeChantier: stadeFilter,
    statutChantier: activeTab === 'all' ? undefined : activeTab,
    temoin: temoinFilter,
  });

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      if (format === 'excel') await chantiersApi.exportExcel(currentFilters());
      else await chantiersApi.exportPdf(currentFilters());
      message.success('Export téléchargé');
    } catch {
      message.error("Erreur lors de l'export");
    } finally {
      setExporting(false);
    }
  };

  const handlePhotoCreate = (prefilled: Partial<CreateChantierRequest>) => {
    setPrefilledData(prefilled);
    setEditingId(null);
    setModalOpen(true);
  };

  const columns: ColumnsType<ChantierListItem> = [
    {
      title: 'Nom du chantier',
      dataIndex: 'nom',
      key: 'nom',
      render: (nom, record) => (
        <a onClick={() => navigate(`/chantiers/${record.id}`)} style={{ fontWeight: 500 }}>
          {nom}
        </a>
      ),
    },
    {
      title: 'Localisation',
      key: 'localisation',
      render: (_, r) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {r.prefecture ? `${r.ville || ''} — ${r.prefecture}` : (r.ville || '-')}
        </Text>
      ),
    },
    {
      title: 'Type',
      key: 'type',
      render: (_, r) => r.typeProjet ? (
        <Tooltip title={r.sousTypeProjet}>
          <Tag>{r.typeProjet.replace(/_/g, ' ')}</Tag>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Taille',
      key: 'taille',
      render: (_, r) => r.segmentTaille ? (
        <Tag color={r.segmentTaille === 'XL' ? 'red' : r.segmentTaille === 'L' ? 'orange' : r.segmentTaille === 'M' ? 'blue' : 'default'}>
          {r.segmentTaille} {r.nombreUnites ? `(${r.nombreUnites} u.)` : ''}
        </Tag>
      ) : '-',
    },
    {
      title: 'Stade',
      dataIndex: 'stadeChantier',
      key: 'stade',
      render: v => v ? <Tag color={getStadeColor(v)}>{getStadeLabel(v)}</Tag> : '-',
    },
    {
      title: 'Opportunité',
      dataIndex: 'niveauOpportunite',
      key: 'opportunite',
      render: v => v ? <Tag color={getNiveauColor(v)}>{getNiveauLabel(v)}</Tag> : '-',
    },
    {
      title: 'Statut',
      dataIndex: 'statutChantier',
      key: 'statut',
      render: v => v ? <Tag color={getStatutColor(v)}>{getStatutLabel(v)}</Tag> : '-',
    },
    {
      title: 'Santé IA',
      dataIndex: 'healthScore',
      key: 'healthScore',
      width: 90,
      render: (score?: number) => {
        if (!score) return <span style={{ color: '#bfbfbf', fontSize: 11 }}>—</span>;
        const color = score >= 85 ? 'cyan' : score >= 65 ? 'green' : score >= 45 ? 'gold' : score >= 25 ? 'orange' : 'red';
        return (
          <Tag color={color} style={{ fontSize: 11, padding: '1px 6px' }}>
            {score}/100
          </Tag>
        );
      },
    },
    {
      title: 'Témoin',
      dataIndex: 'temoin',
      key: 'temoin',
      width: 80,
      align: 'center' as const,
      render: (v: boolean) => v ? (
        <Tooltip title="Chantier de référence">
          <StarOutlined style={{ color: '#faad14', fontSize: 16 }} />
        </Tooltip>
      ) : null,
    },
    {
      title: 'Utilisateur',
      dataIndex: 'assignedToName',
      key: 'commercial',
      hidden: true,
      render: v => v || '-',
    },
    {
      title: 'Prochaine action',
      dataIndex: 'dateProchaineAction',
      key: 'prochaine',
      render: v => v ? new Date(v).toLocaleDateString('fr-FR') : '-',
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'Voir', onClick: () => navigate(`/chantiers/${record.id}`) },
              { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => { setEditingId(record.id); setModalOpen(true); } },
              { type: 'divider' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record.id, record.nom) },
            ],
          }}
          trigger={['click']}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'all',
      label: (
        <Space size={6}>
          <EnvironmentOutlined />
          <span>Tous</span>
          <Badge count={activeTab === 'all' ? total : chantiers.filter(c => !c.statutChantier || true).length}
            showZero style={{ backgroundColor: '#8c8c8c' }} overflowCount={9999} />
        </Space>
      ),
    },
    ...STATUT_OPTIONS.map(s => ({
      key: s.value,
      label: (
        <Space size={6}>
          <Tag color={s.color} style={{ margin: 0, fontSize: 11 }}>{s.label}</Tag>
          <Badge
            count={activeTab === s.value ? total : chantiers.filter(c => c.statutChantier === s.value).length}
            showZero
            style={{ backgroundColor: activeTab === s.value ? '#1890ff' : '#d9d9d9', color: activeTab === s.value ? '#fff' : '#595959' }}
            overflowCount={999}
          />
        </Space>
      ),
    })),
  ];

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space align="center" size={12}>
          <Typography.Text strong style={{ fontSize: 20 }}>
            <EnvironmentOutlined style={{ marginRight: 8, color: '#f5a623' }} />
            Chantiers
          </Typography.Text>
        </Space>
        <Space>
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'excel',
                  icon: <FileExcelOutlined style={{ color: '#217346' }} />,
                  label: 'Exporter en Excel (.xlsx)',
                  onClick: () => handleExport('excel'),
                },
                {
                  key: 'pdf',
                  icon: <FilePdfOutlined style={{ color: '#d32f2f' }} />,
                  label: 'Exporter en PDF',
                  onClick: () => handleExport('pdf'),
                },
              ],
            }}
          >
            <Button icon={<DownloadOutlined />} loading={exporting}>Exporter</Button>
          </Dropdown>
          <Button icon={<GlobalOutlined />} onClick={() => setGeoInsightsOpen(true)}>Insights Géo</Button>
          <Button
            icon={<CameraOutlined />}
            onClick={() => setPhotoModalOpen(true)}
            style={{ borderColor: '#722ed1', color: '#722ed1' }}
          >
            Depuis photo
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); setPrefilledData(null); setModalOpen(true); }}>
            Nouveau chantier
          </Button>
        </Space>
      </div>

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={(tab) => { setActiveTab(tab); setPage(1); }}
          items={tabItems}
          style={{ paddingLeft: 16, paddingRight: 16 }}
          tabBarExtraContent={
            <Space style={{ paddingBottom: 4 }}>
              <Input
                placeholder="Rechercher..."
                prefix={<SearchOutlined />}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                style={{ width: 200 }}
                allowClear
                size="small"
              />
              <Select
                placeholder="Stade"
                value={stadeFilter}
                onChange={v => { setStadeFilter(v); setPage(1); }}
                allowClear
                size="small"
                style={{ width: 160 }}
                options={STADE_OPTIONS}
              />
              <Select
                placeholder="Témoin"
                value={temoinFilter === undefined ? undefined : String(temoinFilter)}
                onChange={v => { setTemoinFilter(v === undefined ? undefined : v === 'true'); setPage(1); }}
                allowClear
                size="small"
                style={{ width: 130 }}
                options={[
                  { value: 'true', label: '⭐ Témoins' },
                  { value: 'false', label: 'Non-témoins' },
                ]}
              />
              <Button size="small" icon={<ReloadOutlined />} onClick={load} />
            </Space>
          }
        />

        <div style={{ padding: '0 16px 16px' }}>
          <Table
            columns={columns}
            dataSource={chantiers}
            rowKey="id"
            loading={loading}
            pagination={{
              current: page,
              pageSize,
              total,
              onChange: setPage,
              showSizeChanger: false,
              showTotal: (t) => `${t} chantier(s)`,
            }}
            size="middle"
            scroll={{ x: 1200, y: 'calc(100vh - 320px)' }}
          />
        </div>
      </Card>

      <ChantierFormModal
        open={modalOpen}
        chantierId={editingId}
        initialValues={prefilledData ?? undefined}
        onClose={(refresh) => {
          setModalOpen(false);
          setEditingId(null);
          setPrefilledData(null);
          if (refresh) load();
        }}
      />

      <ChantierGeoInsightsModal
        open={geoInsightsOpen}
        onClose={() => setGeoInsightsOpen(false)}
      />

      <ChantierFromPhotoModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onCreateChantier={handlePhotoCreate}
      />
    </div>
  );
}
