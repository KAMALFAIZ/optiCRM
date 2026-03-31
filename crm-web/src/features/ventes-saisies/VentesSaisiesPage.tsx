import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Select,
  Typography,
  Statistic,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
  Input,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  FilterOutlined,
  RiseOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import ventesSaisiesApi, { VenteSaisieDto } from '@/api/ventesSaisies';
import VenteSaisieFormModal from './VenteSaisieFormModal';

const { Text } = Typography;
const { RangePicker } = DatePicker;
const { Search } = Input;

// ─── Statut config ────────────────────────────────────────────────────────────

const STATUT_CONFIG: Record<string, { label: string; color: string }> = {
  CONFIRME:   { label: 'Confirmé',   color: 'green'  },
  EN_ATTENTE: { label: 'En attente', color: 'orange' },
  ANNULE:     { label: 'Annulé',     color: 'red'    },
};

const STATUT_OPTIONS = Object.entries(STATUT_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatMAD = (n: number) =>
  new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    minimumFractionDigits: 2,
  }).format(n ?? 0);

// ─── Page ─────────────────────────────────────────────────────────────────────

const VentesSaisiesPage: React.FC = () => {
  // ── Data ───────────────────────────────────────────────────────────────────
  const [data, setData] = useState<VenteSaisieDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [showFilters, setShowFilters] = useState(false);
  const [searchAccount, setSearchAccount] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string | undefined>();
  const [dateTo, setDateTo] = useState<string | undefined>();
  const [statut, setStatut] = useState<string | undefined>();

  // ── Modal ──────────────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const [totalHt, setTotalHt] = useState(0);
  const [totalTtc, setTotalTtc] = useState(0);
  const [countThisMonth, setCountThisMonth] = useState(0);

  // ── Load ───────────────────────────────────────────────────────────────────
  const loadData = useCallback(
    async (targetPage = 0, targetSize = pageSize) => {
      setLoading(true);
      try {
        const result = await ventesSaisiesApi.findAll({
          dateFrom,
          dateTo,
          statut,
          page: targetPage,
          size: targetSize,
        });

        setData(result.content);
        setPage(targetPage);
        setPageSize(targetSize);
        setTotal(result.totalElements);

        // Quick stats from current page
        const sumHt  = result.content.reduce((s, v) => s + (v.montantHt  ?? 0), 0);
        const sumTtc = result.content.reduce((s, v) => s + (v.montantTtc ?? 0), 0);
        setTotalHt(sumHt);
        setTotalTtc(sumTtc);

        const thisMonth = dayjs().format('YYYY-MM');
        setCountThisMonth(
          result.content.filter((v) => v.dateVente?.startsWith(thisMonth)).length
        );
      } catch {
        message.error('Erreur lors du chargement des ventes');
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dateFrom, dateTo, statut, pageSize]
  );

  useEffect(() => {
    loadData(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFrom, dateTo, statut]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleTableChange = (paginationConfig: any) => {
    loadData(paginationConfig.current - 1, paginationConfig.pageSize);
  };

  const handleDateRange = (dates: any) => {
    if (dates) {
      setDateFrom(dates[0].format('YYYY-MM-DD'));
      setDateTo(dates[1].format('YYYY-MM-DD'));
    } else {
      setDateFrom(undefined);
      setDateTo(undefined);
    }
  };

  const handleReset = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
    setStatut(undefined);
    setSearchAccount('');
  };

  const handleDelete = async (id: string) => {
    try {
      await ventesSaisiesApi.delete(id);
      message.success('Vente supprimée avec succès');
      loadData(0);
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const handleCreate = () => {
    setSelectedId(null);
    setModalOpen(true);
  };

  const handleEdit = (id: string) => {
    setSelectedId(id);
    setModalOpen(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setSelectedId(null);
    if (refresh) loadData(0);
  };

  // ── Local account filter (applied on current page data) ───────────────────
  const filteredData = searchAccount
    ? data.filter((v) =>
        v.accountName?.toLowerCase().includes(searchAccount.toLowerCase())
      )
    : data;

  // ── Columns ────────────────────────────────────────────────────────────────
  const columns: ColumnsType<VenteSaisieDto> = [
    {
      title: 'Compte',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 200,
      ellipsis: { showTitle: true },
      render: (name) => name ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      ellipsis: { showTitle: true },
      render: (ref) => ref ?? <Text type="secondary">—</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'dateVente',
      key: 'dateVente',
      width: 110,
      sorter: (a, b) => (a.dateVente ?? '').localeCompare(b.dateVente ?? ''),
      render: (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—'),
    },
    {
      title: 'Montant HT',
      dataIndex: 'montantHt',
      key: 'montantHt',
      width: 140,
      align: 'right' as const,
      sorter: (a, b) => (a.montantHt ?? 0) - (b.montantHt ?? 0),
      render: (v) => (
        <Text strong style={{ fontFamily: 'monospace' }}>
          {formatMAD(v)}
        </Text>
      ),
    },
    {
      title: 'Montant TTC',
      dataIndex: 'montantTtc',
      key: 'montantTtc',
      width: 140,
      align: 'right' as const,
      render: (v) => (
        <span style={{ fontFamily: 'monospace' }}>{formatMAD(v)}</span>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      width: 120,
      render: (s) => {
        const cfg = STATUT_CONFIG[s] ?? { label: s, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Créé par',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 140,
      ellipsis: { showTitle: true },
      render: (name) => name ?? '—',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      align: 'center' as const,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Modifier">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record.id)}
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer cette vente ?"
            description="Cette action est irréversible."
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button type="link" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 10,
        }}
      >
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>
            Ventes saisies
          </Text>
          <span style={{ fontSize: 13 }}>
            <DollarOutlined style={{ marginRight: 4 }} />
            <strong>{total}</strong>{' '}
            <Text type="secondary">enregistrements</Text>
          </span>
        </Space>
        <Button
          type="primary"
          size="small"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          Nouvelle vente
        </Button>
      </div>

      {/* Stat cards */}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total HT (page en cours)"
              value={totalHt}
              prefix={<DollarOutlined />}
              precision={2}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Total TTC (page en cours)"
              value={totalTtc}
              prefix={<RiseOutlined />}
              precision={2}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Ce mois (page en cours)"
              value={countThisMonth}
              prefix={<CalendarOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Table card */}
      <Card
        styles={{ body: { padding: '8px 16px 16px' } }}
        title={
          <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
            <Col flex="auto">
              <Search
                placeholder="Filtrer par nom de compte..."
                allowClear
                size="small"
                style={{ maxWidth: 280 }}
                value={searchAccount}
                onChange={(e) => setSearchAccount(e.target.value)}
              />
            </Col>
            <Col>
              <Space>
                <Button
                  size="small"
                  icon={<FilterOutlined />}
                  onClick={() => setShowFilters((f) => !f)}
                >
                  Filtres
                </Button>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => loadData(0)}
                >
                  Actualiser
                </Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {/* Filter row */}
        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 10 }} align="middle">
            <Col>
              <RangePicker
                placeholder={['Date début', 'Date fin']}
                onChange={handleDateRange}
                format="DD/MM/YYYY"
                size="small"
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                options={STATUT_OPTIONS}
                size="small"
                value={statut}
                onChange={setStatut}
              />
            </Col>
            <Col>
              <Button size="small" onClick={handleReset}>
                Réinitialiser
              </Button>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: page + 1,
            pageSize,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            showTotal: (t, range) => `${range[0]}-${range[1]} sur ${t}`,
          }}
          scroll={{ x: 1100, y: 'calc(100vh - 380px)' }}
        />
      </Card>

      {/* Form modal */}
      <VenteSaisieFormModal
        open={modalOpen}
        venteId={selectedId}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default VentesSaisiesPage;
