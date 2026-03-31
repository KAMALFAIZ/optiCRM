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
  Select,
  Row,
  Col,
  Dropdown,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileTextOutlined,
  ReloadOutlined,
  CopyOutlined,
  MoreOutlined,
  SendOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchQuotes,
  deleteQuote,
  updateQuoteStatus,
  duplicateQuote,
  setQueryParams,
} from './quotesSlice';
import { QuoteListItem, QuoteStatus, QUOTE_STATUS_CONFIG } from '@/types/quote';
import QuoteFormModal from './QuoteFormModal';
import type { RootState } from '@/store';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { FilterValue, SorterResult } from 'antd/es/table/interface';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const QuotesListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, meta, loading, queryParams } = useAppSelector((state: RootState) => state.quotes);

  const [showFilters, setShowFilters] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingQuote, setEditingQuote] = useState<QuoteListItem | null>(null);

  const loadData = useCallback(() => {
    dispatch(fetchQuotes(queryParams));
  }, [dispatch, queryParams]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    dispatch(setQueryParams({ search: value, page: 1 }));
  };

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, FilterValue | null>,
    sorter: SorterResult<QuoteListItem> | SorterResult<QuoteListItem>[]
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

  const handleStatusFilter = (status: QuoteStatus | undefined) => {
    dispatch(setQueryParams({ status, page: 1 }));
  };

  const handleResetFilters = () => {
    dispatch(setQueryParams({ status: undefined, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteQuote(id)).unwrap();
      message.success('Devis supprimé avec succès');
      loadData();
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de la suppression'));
    }
  };

  const handleStatusChange = async (id: string, status: QuoteStatus) => {
    try {
      await dispatch(updateQuoteStatus({ id, status })).unwrap();
      message.success('Statut mis à jour avec succès');
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de la mise à jour'));
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await dispatch(duplicateQuote(id)).unwrap();
      message.success('Devis dupliqué avec succès');
      loadData();
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de la duplication'));
    }
  };

  const handleCreate = () => {
    setEditingQuote(null);
    setModalVisible(true);
  };

  const handleEdit = (record: QuoteListItem) => {
    setEditingQuote(record);
    setModalVisible(true);
  };

  const handleModalClose = (success?: boolean) => {
    setModalVisible(false);
    setEditingQuote(null);
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

  const getActionMenuItems = (record: QuoteListItem): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        icon: <EyeOutlined />,
        label: 'Voir',
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: 'Modifier',
        onClick: () => handleEdit(record),
      },
      {
        key: 'duplicate',
        icon: <CopyOutlined />,
        label: 'Dupliquer',
        onClick: () => handleDuplicate(record.id),
      },
      { type: 'divider' },
    ];

    if (record.status === 'DRAFT') {
      items.push({
        key: 'send',
        icon: <SendOutlined />,
        label: 'Marquer comme envoyé',
        onClick: () => handleStatusChange(record.id, 'SENT'),
      });
    }
    if (record.status === 'SENT' || record.status === 'VIEWED') {
      items.push(
        {
          key: 'accept',
          icon: <CheckCircleOutlined />,
          label: 'Marquer comme accepté',
          onClick: () => handleStatusChange(record.id, 'ACCEPTED'),
        },
        {
          key: 'reject',
          icon: <CloseCircleOutlined />,
          label: 'Marquer comme refusé',
          onClick: () => handleStatusChange(record.id, 'REJECTED'),
        }
      );
    }

    items.push({ type: 'divider' });
    items.push({
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Supprimer',
      danger: true,
      onClick: () => handleDelete(record.id),
    });

    return items;
  };

  const columns: ColumnsType<QuoteListItem> = [
    {
      title: 'N° Devis',
      dataIndex: 'quoteNumber',
      key: 'quoteNumber',
      sorter: true,
      width: 140,
      render: (text: string) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{text}</span>
      ),
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 180,
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
      title: 'Contact',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 140,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Opportunité',
      dataIndex: 'opportunityName',
      key: 'opportunityName',
      width: 140,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: QuoteStatus) => {
        const config = QUOTE_STATUS_CONFIG[status];
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Montant',
      dataIndex: 'total',
      key: 'total',
      sorter: true,
      align: 'right',
      width: 140,
      render: (total: number, record: any) => {
        const fmt = (v: number) => new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(v);
        return (
          <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
            <span style={{ fontWeight: 600 }}>{fmt(total)}</span>
            {record.subtotal && record.subtotal !== total && (
              <span style={{ fontSize: 11, color: '#8c8c8c' }}>HT: {fmt(record.subtotal)}</span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Date',
      dataIndex: 'quoteDate',
      key: 'quoteDate',
      sorter: true,
      width: 110,
      render: (date: string) => (date ? dayjs(date).format('DD/MM/YYYY') : '-'),
    },
    {
      title: 'Validité',
      dataIndex: 'validUntil',
      key: 'validUntil',
      sorter: true,
      width: 110,
      render: (date: string, record) => {
        if (!date) return '-';
        const d = dayjs(date);
        const isExpired = d.isBefore(dayjs()) && record.status !== 'ACCEPTED' && record.status !== 'REJECTED';
        return (
          <span style={{ color: isExpired ? '#ff4d4f' : undefined }}>
            {d.format('DD/MM/YYYY')}
            {isExpired && <Tag color="error" style={{ marginLeft: 4 }}>Expiré</Tag>}
          </span>
        );
      },
    },
    {
      title: 'Articles',
      dataIndex: 'itemCount',
      key: 'itemCount',
      width: 80,
      align: 'center',
      render: (count: number) => count || 0,
    },
    {
      title: 'Assigné à',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 130,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      render: (_, record) => (
        <Dropdown menu={{ items: getActionMenuItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  // Calculate stats
  const totalAmount = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const draftCount = items.filter((item) => item.status === 'DRAFT').length;
  const acceptedCount = items.filter((item) => item.status === 'ACCEPTED').length;

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Devis</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><FileTextOutlined style={{ marginRight: 4 }} /><strong>{meta?.totalElements || 0}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#faad14' }}><strong>{draftCount}</strong> <Text type="secondary">brouillons</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{acceptedCount}</strong> <Text type="secondary">acceptés</Text></span>
            <span style={{ color: '#1890ff' }}><strong>{formatCurrency(totalAmount)}</strong> <Text type="secondary">montant</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouveau devis
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
                placeholder="Filtrer par statut"
                allowClear
                style={{ width: '100%' }}
                value={queryParams.status}
                onChange={handleStatusFilter}
              >
                {Object.entries(QUOTE_STATUS_CONFIG).map(([key, config]) => (
                  <Option key={key} value={key}>
                    <Tag color={config.color}>{config.label}</Tag>
                  </Option>
                ))}
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
            showTotal: (total) => `${total} devis`,
          }}
          scroll={{ x: 1370, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <QuoteFormModal
        visible={modalVisible}
        quote={editingQuote}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default QuotesListPage;
