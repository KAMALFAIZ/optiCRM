import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Input,
  Tag,
  Typography,
  message,
  Popconfirm,
  Select,
  Row,
  Col,
  Tooltip,
  Progress,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  DollarOutlined,
  ReloadOutlined,
  FilterOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import OpportunitiesKanbanPage from './OpportunitiesKanbanPage';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchOpportunities,
  fetchOpportunityStages,
  deleteOpportunity,
  setQueryParams,
} from './opportunitiesSlice';
import { OpportunityListItem } from '@/types/opportunity';
import OpportunityFormModal from './OpportunityFormModal';
import ExportButton from '@/components/ExportButton';
import type { RootState } from '@/store';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';
dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

type ViewMode = 'list' | 'kanban';

const OpportunitiesListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, stages, loading, queryParams } = useAppSelector(
    (state: RootState) => state.opportunities
  );

  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState<OpportunityListItem | null>(null);

  const loadData = useCallback(() => {
    dispatch(fetchOpportunities(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (stages.length === 0) {
      dispatch(fetchOpportunityStages());
    }
  }, [dispatch, stages.length]);

  const handleSearch = (value: string) => {
    dispatch(setQueryParams({ search: value, page: 1 }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<OpportunityListItem> | SorterResult<OpportunityListItem>[]
  ) => {
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    dispatch(
      setQueryParams({
        page: pagination.current || 1,
        size: pagination.pageSize || 20,
        sortBy: singleSorter.field as string,
        sortDirection: singleSorter.order === 'ascend' ? 'asc' : 'desc',
      })
    );
  };

  const handleStageFilter = (stageId: string | undefined) => {
    dispatch(setQueryParams({ stageId, page: 1 }));
  };

  const handleClosedFilter = (isClosed: boolean | undefined) => {
    dispatch(setQueryParams({ isClosed, page: 1 }));
  };

  const handleResetFilters = () => {
    dispatch(setQueryParams({ stageId: undefined, isClosed: undefined, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteOpportunity(id)).unwrap();
      message.success('Opportunité supprimée avec succès');
      loadData();
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de la suppression'));
    }
  };

  const handleCreate = () => {
    setEditingOpportunity(null);
    setModalVisible(true);
  };

  const handleEdit = (record: OpportunityListItem) => {
    setEditingOpportunity(record);
    setModalVisible(true);
  };

  const handleModalClose = (success?: boolean) => {
    setModalVisible(false);
    setEditingOpportunity(null);
    if (success) {
      loadData();
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const columns: ColumnsType<OpportunityListItem> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      sorter: true,
      ellipsis: { showTitle: false },
      render: (text: string, record) => (
        <Tooltip title={text} placement="topLeft">
          <Space direction="vertical" size={0}>
            <span style={{ fontWeight: 500 }}>{text}</span>
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>{record.accountName}</span>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      width: 160,
      sorter: true,
      align: 'right',
      render: (amount: number, record) => (
        <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
          <span style={{ fontWeight: 500 }}>{formatCurrency(amount)}</span>
          <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
            Pondéré: {formatCurrency(record.weightedAmount)}
          </span>
        </Space>
      ),
    },
    {
      title: 'Étape',
      dataIndex: 'stageName',
      key: 'stageName',
      width: 130,
      render: (stageName: string, record) => (
        <Tag color={record.stageColor || 'blue'}>{stageName}</Tag>
      ),
    },
    {
      title: 'Probabilité',
      dataIndex: 'probability',
      key: 'probability',
      sorter: true,
      width: 150,
      render: (probability: number) => (
        <Progress
          percent={probability || 0}
          size="small"
          strokeColor={
            probability >= 70 ? '#52c41a' : probability >= 40 ? '#faad14' : '#ff4d4f'
          }
        />
      ),
    },
    {
      title: 'Date de clôture',
      dataIndex: 'closeDate',
      key: 'closeDate',
      width: 120,
      sorter: true,
      render: (date: string) => {
        if (!date) return '-';
        const d = dayjs(date);
        const isOverdue = d.isBefore(dayjs()) && !d.isSame(dayjs(), 'day');
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined }}>
            {d.format('DD/MM/YYYY')}
          </span>
        );
      },
    },
    {
      title: 'Assigné à',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 140,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Contact principal',
      dataIndex: 'primaryContactName',
      key: 'primaryContactName',
      width: 150,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Ancienneté',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => {
        if (!date) return '-';
        return (
          <Tooltip title={dayjs(date).format('DD/MM/YYYY')}>
            <span>{dayjs(date).fromNow()}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Statut',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (!record.isClosed) {
          return <Tag color="processing">En cours</Tag>;
        }
        return record.isWon ? (
          <Tag color="success">Gagné</Tag>
        ) : (
          <Tag color="error">Perdu</Tag>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Voir">
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Tooltip>
          <Tooltip title="Modifier">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Supprimer cette opportunité ?"
            description="Cette action est irréversible."
            onConfirm={() => handleDelete(record.id)}
            okText="Oui"
            cancelText="Non"
          >
            <Tooltip title="Supprimer">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Calculate stats
  const totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  const openCount = items.filter((item) => !item.isClosed).length;

  // If kanban mode, render the Kanban page directly
  if (viewMode === 'kanban') {
    return (
      <div>
        {/* ── Header compact (kanban mode) ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Space size={20} align="center">
            <Text strong style={{ fontSize: 20 }}>Opportunités</Text>
            <Text type="secondary" style={{ fontSize: 13 }}>Vue Pipeline</Text>
          </Space>
          <Space>
            <Button.Group>
              <Button
                size="small"
                icon={<UnorderedListOutlined />}
                onClick={() => setViewMode('list')}
                title="Vue liste"
              >
                Liste
              </Button>
              <Button
                size="small"
                type="primary"
                icon={<AppstoreOutlined />}
                title="Vue pipeline"
              >
                Pipeline
              </Button>
            </Button.Group>
          </Space>
        </div>
        <OpportunitiesKanbanPage />
      </div>
    );
  }

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Opportunités</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><DollarOutlined style={{ marginRight: 4 }} /><strong>{meta?.totalElements || 0}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#1890ff' }}><strong>{openCount}</strong> <Text type="secondary">en cours</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{formatCurrency(totalAmount)}</strong> <Text type="secondary">montant</Text></span>
          </Space>
        </Space>
        <Space>
          <Button.Group>
            <Button
              size="small"
              type="primary"
              icon={<UnorderedListOutlined />}
              title="Vue liste"
            >
              Liste
            </Button>
            <Button
              size="small"
              icon={<AppstoreOutlined />}
              onClick={() => setViewMode('kanban')}
              title="Vue pipeline"
            >
              Pipeline
            </Button>
          </Button.Group>
          <ExportButton entity="opportunities" entityLabel="Opportunités" size="small" />
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouvelle opportunité
          </Button>
        </Space>
      </div>

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
            <Col span={6}>
              <Select
                placeholder="Filtrer par étape"
                allowClear
                style={{ width: '100%' }}
                value={queryParams.stageId}
                onChange={handleStageFilter}
              >
                {stages.map((stage) => (
                  <Option key={stage.id} value={stage.id}>
                    <Tag color={stage.color}>{stage.name}</Tag>
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={6}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                value={queryParams.isClosed}
                onChange={handleClosedFilter}
              >
                <Option value={false}>En cours</Option>
                <Option value={true}>Fermées</Option>
              </Select>
            </Col>
            <Col>
              <Button onClick={handleResetFilters}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={items}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: meta?.page || 1,
            pageSize: meta?.size || 20,
            total: meta?.totalElements || 0,
            showSizeChanger: true,
            showTotal: (total) => `${total} opportunité(s)`,
          }}
          scroll={{ x: 1390, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <OpportunityFormModal
        visible={modalVisible}
        opportunity={editingOpportunity}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default OpportunitiesListPage;
