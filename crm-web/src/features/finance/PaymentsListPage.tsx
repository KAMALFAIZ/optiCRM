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
  Input,
  DatePicker,
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchPayments,
  fetchPaymentStats,
  deletePayment,
  setFilters,
} from './paymentsSlice';
import {
  PaymentListItem,
  PAYMENT_METHOD_CONFIG,
  PAYMENT_STATUS_CONFIG,
  PaymentMethod,
  PaymentStatus,
} from '@/types/payment';
import PaymentFormModal from './PaymentFormModal';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Search } = Input;
const { RangePicker } = DatePicker;

const PaymentsListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { payments, loading, pagination, filters, stats } = useAppSelector(
    (state) => state.payments
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadPayments = useCallback(() => {
    dispatch(fetchPayments(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadPayments();
    dispatch(fetchPaymentStats());
  }, [loadPayments, dispatch]);

  const handleTableChange = (paginationConfig: any) => {
    dispatch(
      setFilters({
        page: paginationConfig.current - 1,
        size: paginationConfig.pageSize,
      })
    );
  };

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value, page: 0 }));
  };

  const handleDateRangeChange = (dates: any) => {
    if (dates) {
      dispatch(
        setFilters({
          startDate: dates[0].format('YYYY-MM-DD'),
          endDate: dates[1].format('YYYY-MM-DD'),
          page: 0,
        })
      );
    } else {
      dispatch(setFilters({ startDate: undefined, endDate: undefined, page: 0 }));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deletePayment(id)).unwrap();
      message.success('Paiement supprimé avec succès');
      loadPayments();
      dispatch(fetchPaymentStats());
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de la suppression'));
    }
  };

  const handleEdit = (id: string) => {
    setSelectedPaymentId(id);
    setModalVisible(true);
  };

  const handleCreate = () => {
    setSelectedPaymentId(null);
    setModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalVisible(false);
    setSelectedPaymentId(null);
    if (refresh) {
      loadPayments();
      dispatch(fetchPaymentStats());
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-MA', {
      style: 'decimal',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const columns: ColumnsType<PaymentListItem> = [
    {
      title: 'N° Paiement',
      dataIndex: 'paymentNumber',
      key: 'paymentNumber',
      width: 130,
      render: (number) => <Text strong>{number}</Text>,
    },
    {
      title: 'Date',
      dataIndex: 'paymentDate',
      key: 'paymentDate',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Compte',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Méthode',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 140,
      render: (method: PaymentMethod) => {
        const config = PAYMENT_METHOD_CONFIG[method] || { label: method, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Montant',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      align: 'right',
      render: (amount, _record) => (
        <Text strong>{formatCurrency(amount)}</Text>
      ),
    },
    {
      title: 'Alloué',
      key: 'allocated',
      width: 130,
      align: 'right',
      render: (_, record) => {
        const allocated = record.allocatedAmount;
        const unallocated = record.unallocatedAmount || (record.amount - allocated);
        return (
          <Space direction="vertical" size={0} style={{ alignItems: 'flex-end' }}>
            <span style={{ color: '#52c41a', fontWeight: 500 }}>
              {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(allocated || 0)}
            </span>
            {unallocated > 0 && (
              <span style={{ fontSize: 11, color: '#faad14' }}>
                Non alloué: {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(unallocated)}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: PaymentStatus) => {
        const config = PAYMENT_STATUS_CONFIG[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Référence',
      dataIndex: 'reference',
      key: 'reference',
      width: 150,
      ellipsis: { showTitle: true },
      render: (ref) => ref || <Text type="secondary">-</Text>,
    },
    {
      title: 'Créé par',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 120,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
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
            title="Supprimer ce paiement ?"
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

  const methodOptions = Object.entries(PAYMENT_METHOD_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const statusOptions = Object.entries(PAYMENT_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Paiements</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><DollarOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            {(stats?.pendingPayments ?? 0) > 0 && (
              <span style={{ color: '#faad14' }}><strong>{stats!.pendingPayments}</strong> <Text type="secondary">en attente</Text></span>
            )}
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouveau paiement
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={16} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic title="Total paiements (année)" value={stats?.totalAmount || 0} prefix={<DollarOutlined />} precision={2} suffix="" />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic title="Ce mois" value={stats?.monthlyAmount || 0} prefix={<CalendarOutlined />} precision={2} suffix="" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic title="Paiements du mois" value={stats?.monthlyPayments || 0} />
          </Card>
        </Col>
        <Col xs={24} sm={6}>
          <Card size="small">
            <Statistic title="En attente" value={stats?.pendingPayments || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: stats?.pendingPayments ? '#faad14' : '#3f8600' }} />
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
                <Button size="small" icon={<ReloadOutlined />} onClick={loadPayments}>Actualiser</Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 10 }} align="middle">
            <Col>
              <RangePicker
                placeholder={['Date début', 'Date fin']}
                onChange={handleDateRangeChange}
                format="DD/MM/YYYY"
                size="small"
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Méthode"
                allowClear
                style={{ width: '100%' }}
                options={methodOptions}
                size="small"
                onChange={(value) => dispatch(setFilters({ paymentMethod: value, page: 0 }))}
                value={filters.paymentMethod}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                options={statusOptions}
                size="small"
                onChange={(value) => dispatch(setFilters({ status: value, page: 0 }))}
                value={filters.status}
              />
            </Col>
            <Col>
              <Button size="small" onClick={() => dispatch(setFilters({ paymentMethod: undefined, status: undefined, startDate: undefined, endDate: undefined, page: 0 }))}>
                Réinitialiser
              </Button>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={payments}
          rowKey="id"
          loading={loading}
          onChange={handleTableChange}
          pagination={{
            current: pagination.page + 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}`,
          }}
          scroll={{ x: 1300, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <PaymentFormModal
        open={modalVisible}
        paymentId={selectedPaymentId}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default PaymentsListPage;
