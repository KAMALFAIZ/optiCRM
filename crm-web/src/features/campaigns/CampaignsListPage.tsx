import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, Button, Input, Tag, Space, Card, Dropdown, Modal, message, Row, Col, Statistic, Select, Progress, Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined,
  DollarOutlined, FundOutlined, RiseOutlined, TeamOutlined, FilterOutlined, ReloadOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCampaigns, deleteCampaign } from './campaignsSlice';
import CampaignFormModal from './CampaignFormModal';
import {
  CampaignListItem,
  CampaignStatus,
  CampaignType,
  CAMPAIGN_STATUS_CONFIG,
  CAMPAIGN_TYPE_CONFIG,
} from '@/types/campaign';

const { Text } = Typography;
const { Search } = Input;

const STATUS_OPTIONS = Object.entries(CAMPAIGN_STATUS_CONFIG).map(([value, cfg]) => ({
  value, label: cfg.label,
}));

const TYPE_OPTIONS = Object.entries(CAMPAIGN_TYPE_CONFIG).map(([value, cfg]) => ({
  value, label: cfg.label,
}));

export default function CampaignsListPage() {
  const dispatch = useAppDispatch();
  const { campaigns, loading, pagination } = useAppSelector((state) => state.campaigns);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampaignStatus | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<CampaignType | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<CampaignListItem | null>(null);

  const loadData = useCallback(() => {
    dispatch(fetchCampaigns({
      page: pagination.page,
      size: pagination.size,
      search: search || undefined,
      status: statusFilter,
      type: typeFilter,
    }));
  }, [dispatch, pagination.page, pagination.size, search, statusFilter, typeFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleEdit = (record: CampaignListItem) => {
    setEditingCampaign(record);
    setModalOpen(true);
  };

  const handleDelete = (record: CampaignListItem) => {
    Modal.confirm({
      title: 'Supprimer la campagne',
      content: `Êtes-vous sûr de vouloir supprimer "${record.name}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteCampaign(record.id));
        message.success('Campagne supprimée');
        loadData();
      },
    });
  };

  const getActions = (record: CampaignListItem): MenuProps['items'] => {
    return [
      { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record) },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record) },
    ];
  };

  const formatAmount = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const kpis = useMemo(() => {
    const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
    const totalActualCost = campaigns.reduce((sum, c) => sum + (c.actualCost || 0), 0);
    const totalExpectedRevenue = campaigns.reduce((sum, c) => sum + (c.expectedRevenue || 0), 0);
    const campaignsWithRoi = campaigns.filter((c) => c.roi !== undefined && c.roi !== null);
    const avgRoi = campaignsWithRoi.length > 0
      ? campaignsWithRoi.reduce((sum, c) => sum + (c.roi || 0), 0) / campaignsWithRoi.length
      : 0;
    return { totalBudget, totalActualCost, totalExpectedRevenue, avgRoi };
  }, [campaigns]);

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: { showTitle: true },
      render: (name: string) => (
        <span style={{ fontWeight: 500 }}>{name}</span>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: 140,
      render: (type: CampaignType) => {
        if (!type) return '-';
        const cfg = CAMPAIGN_TYPE_CONFIG[type];
        return <Tag color={cfg?.color}>{cfg?.label || type}</Tag>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (status: CampaignStatus) => {
        const cfg = CAMPAIGN_STATUS_CONFIG[status];
        return <Tag color={cfg?.color}>{cfg?.label || status}</Tag>;
      },
    },
    {
      title: 'Dates',
      key: 'dates',
      width: 200,
      render: (_: unknown, record: CampaignListItem) => {
        const start = record.startDate ? new Date(record.startDate).toLocaleDateString('fr-FR') : '-';
        const end = record.endDate ? new Date(record.endDate).toLocaleDateString('fr-FR') : '-';
        return `${start} → ${end}`;
      },
    },
    {
      title: 'Budget',
      dataIndex: 'budget',
      key: 'budget',
      width: 130,
      align: 'right' as const,
      render: (budget: number, record: any) => {
        if (!budget) return '-';
        const utilization = record.actualCost ? Math.round((record.actualCost / budget) * 100) : 0;
        return (
          <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 500 }}>{new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 0 }).format(budget)}</span>
            <Progress percent={utilization} size="small" style={{ width: 70 }} showInfo={false}
              strokeColor={utilization > 100 ? '#ff4d4f' : utilization > 80 ? '#faad14' : '#52c41a'} />
          </Space>
        );
      },
    },
    {
      title: 'Coût réel',
      dataIndex: 'actualCost',
      key: 'actualCost',
      width: 130,
      align: 'right' as const,
      render: (cost: number) => (
        <span style={{ color: '#fa8c16', fontWeight: 500 }}>{formatAmount(cost)}</span>
      ),
    },
    {
      title: 'Revenue attendu',
      dataIndex: 'expectedRevenue',
      key: 'expectedRevenue',
      width: 140,
      align: 'right' as const,
      render: (revenue: number) => (
        <span style={{ color: '#52c41a', fontWeight: 500 }}>{formatAmount(revenue)}</span>
      ),
    },
    {
      title: 'ROI',
      dataIndex: 'roi',
      key: 'roi',
      width: 90,
      align: 'right' as const,
      render: (roi: number | undefined) => {
        if (roi === undefined || roi === null) return '-';
        const color = roi >= 0 ? '#52c41a' : '#ff4d4f';
        return <span style={{ color, fontWeight: 600 }}>{roi.toFixed(1)}%</span>;
      },
    },
    {
      title: 'Leads',
      dataIndex: 'leadsGenerated',
      key: 'leadsGenerated',
      width: 80,
      align: 'right' as const,
      render: (leads: number) => leads || 0,
    },
    {
      title: 'Opportunités',
      dataIndex: 'opportunitiesGenerated',
      key: 'opportunitiesGenerated',
      width: 110,
      align: 'right' as const,
      render: (count: number) => count || 0,
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: CampaignListItem) => (
        <Dropdown menu={{ items: getActions(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Campagnes</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{formatAmount(kpis.totalExpectedRevenue)}</strong> <Text type="secondary">revenue attendu</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCampaign(null); setModalOpen(true); }}>
            Nouvelle campagne
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Total Budget" value={kpis.totalBudget} prefix={<DollarOutlined />} suffix="" valueStyle={{ fontSize: 18, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Coût réel" value={kpis.totalActualCost} prefix={<FundOutlined />} suffix="" valueStyle={{ fontSize: 18, fontWeight: 600, color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Revenue attendu" value={kpis.totalExpectedRevenue} prefix={<RiseOutlined />} suffix="" valueStyle={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="ROI moyen" value={kpis.avgRoi} prefix={<TeamOutlined />} suffix="%" precision={1} valueStyle={{ fontSize: 18, fontWeight: 600, color: kpis.avgRoi >= 0 ? '#52c41a' : '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      {/* ── Table Card ── */}
      <Card
        styles={{ body: { padding: '8px 16px 16px' } }}
        title={
          <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
            <Col flex="auto">
              <Search
                placeholder="Rechercher..."
                allowClear
                enterButton
                size="small"
                onSearch={handleSearch}
                style={{ maxWidth: 260 }}
              />
            </Col>
            <Col>
              <Space>
                <Button size="small" icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>Filtres</Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadData}>Actualiser</Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 10 }}>
            <Col span={5}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                options={STATUS_OPTIONS}
                onChange={(val) => setStatusFilter(val as CampaignStatus)}
                value={statusFilter}
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="Type"
                allowClear
                style={{ width: '100%' }}
                options={TYPE_OPTIONS}
                onChange={(val) => setTypeFilter(val as CampaignType)}
                value={typeFilter}
              />
            </Col>
            <Col>
              <Button onClick={() => { setStatusFilter(undefined); setTypeFilter(undefined); }}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          dataSource={campaigns}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: (pagination.page || 0) + 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total) => `${total} campagne(s)`,
            onChange: (page, pageSize) => {
              dispatch(fetchCampaigns({
                page: page - 1,
                size: pageSize,
                search: search || undefined,
                status: statusFilter,
                type: typeFilter,
              }));
            },
          }}
          scroll={{ x: 1390, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <CampaignFormModal
        open={modalOpen}
        campaignId={editingCampaign?.id || null}
        onClose={() => { setModalOpen(false); setEditingCampaign(null); }}
        onSuccess={() => { setModalOpen(false); setEditingCampaign(null); loadData(); }}
      />
    </div>
  );
}
