import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Tag, Space, Card, Dropdown, Modal, message, Row, Col, Statistic, Select, Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined,
  ShoppingCartOutlined, CheckCircleOutlined, CarOutlined, SendOutlined,
  CloseCircleOutlined, FilterOutlined, ReloadOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchSalesOrders, deleteSalesOrder, confirmSalesOrder, shipSalesOrder,
  deliverSalesOrder, cancelSalesOrder,
} from './salesOrdersSlice';
import SalesOrderFormModal from './SalesOrderFormModal';
import { SalesOrderListItem, OrderStatus, ORDER_STATUS_CONFIG } from '@/types/salesOrder';

const { Text } = Typography;
const { Search } = Input;

const STATUS_OPTIONS = Object.entries(ORDER_STATUS_CONFIG).map(([value, cfg]) => ({
  value, label: cfg.label,
}));

export default function SalesOrdersListPage() {
  const dispatch = useAppDispatch();
  const { orders, loading, pagination } = useAppSelector((state) => state.salesOrders);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | undefined>(undefined);
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrderListItem | null>(null);

  const loadData = useCallback(() => {
    dispatch(fetchSalesOrders({
      page: pagination.page,
      size: pagination.size,
      search: search || undefined,
      status: statusFilter,
    }));
  }, [dispatch, pagination.page, pagination.size, search, statusFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (value: string) => setSearch(value);

  const handleEdit = (record: SalesOrderListItem) => {
    setEditingOrder(record);
    setModalOpen(true);
  };

  const handleDelete = (record: SalesOrderListItem) => {
    Modal.confirm({
      title: 'Supprimer la commande',
      content: `Êtes-vous sûr de vouloir supprimer "${record.orderNumber}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteSalesOrder(record.id));
        message.success('Commande supprimée');
        loadData();
      },
    });
  };

  const handleStatusAction = async (record: SalesOrderListItem, action: string) => {
    const actions: Record<string, { fn: any; msg: string; title: string }> = {
      confirm: { fn: confirmSalesOrder, msg: 'Commande confirmée', title: 'Confirmer la commande ?' },
      ship: { fn: shipSalesOrder, msg: 'Commande expédiée', title: 'Expédier la commande ?' },
      deliver: { fn: deliverSalesOrder, msg: 'Commande livrée', title: 'Marquer comme livrée ?' },
      cancel: { fn: cancelSalesOrder, msg: 'Commande annulée', title: 'Annuler la commande ?' },
    };

    const cfg = actions[action];
    Modal.confirm({
      title: cfg.title,
      content: `${record.orderNumber}`,
      okText: 'Confirmer',
      cancelText: 'Retour',
      okType: action === 'cancel' ? 'danger' : 'primary',
      onOk: async () => {
        await dispatch(cfg.fn(record.id));
        message.success(cfg.msg);
        loadData();
      },
    });
  };

  const getActions = (record: SalesOrderListItem): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record) },
    ];

    if (record.status === 'DRAFT') {
      items.push({ key: 'confirm', icon: <CheckCircleOutlined />, label: 'Confirmer', onClick: () => handleStatusAction(record, 'confirm') });
    }
    if (record.status === 'CONFIRMED') {
      items.push({ key: 'ship', icon: <SendOutlined />, label: 'Expédier', onClick: () => handleStatusAction(record, 'ship') });
    }
    if (record.status === 'SHIPPED') {
      items.push({ key: 'deliver', icon: <CarOutlined />, label: 'Livrer', onClick: () => handleStatusAction(record, 'deliver') });
    }

    if (record.status !== 'DELIVERED' && record.status !== 'CANCELLED') {
      items.push({ type: 'divider' });
      items.push({ key: 'cancel', icon: <CloseCircleOutlined />, label: 'Annuler', danger: true, onClick: () => handleStatusAction(record, 'cancel') });
    }

    if (record.status === 'DRAFT') {
      items.push({ key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record) });
    }

    return items;
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);

  const draftCount = orders.filter((o) => o.status === 'DRAFT').length;
  const confirmedCount = orders.filter((o) => o.status === 'CONFIRMED').length;
  const shippedCount = orders.filter((o) => o.status === 'SHIPPED').length;
  const deliveredCount = orders.filter((o) => o.status === 'DELIVERED').length;

  const columns = [
    {
      title: 'N° Commande',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      width: 160,
      render: (num: string) => (
        <Space>
          <ShoppingCartOutlined style={{ color: '#722ed1' }} />
          <span style={{ fontWeight: 500 }}>{num}</span>
        </Space>
      ),
    },
    {
      title: 'Client',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 160,
      ellipsis: { showTitle: true },
    },
    {
      title: 'Date',
      dataIndex: 'orderDate',
      key: 'orderDate',
      width: 110,
      render: (date: string) => date ? new Date(date).toLocaleDateString('fr-FR') : '-',
    },
    {
      title: 'Livraison prévue',
      dataIndex: 'expectedDeliveryDate',
      key: 'expectedDeliveryDate',
      width: 130,
      render: (date: string, record: any) => {
        if (!date) return '-';
        const d = dayjs(date);
        const isOverdue = d.isBefore(dayjs()) && record.status !== 'DELIVERED' && record.status !== 'CANCELLED';
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined, fontWeight: isOverdue ? 600 : undefined }}>
            {d.format('DD/MM/YYYY')}
            {isOverdue && <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>Retard</Tag>}
          </span>
        );
      },
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      width: 130,
      align: 'right' as const,
      render: (total: number, _record: SalesOrderListItem) => (
        <span style={{ fontWeight: 600 }}>{formatAmount(total)}</span>
      ),
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
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: OrderStatus) => {
        const cfg = ORDER_STATUS_CONFIG[status];
        return <Tag color={cfg?.color}>{cfg?.label || status}</Tag>;
      },
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
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: SalesOrderListItem) => (
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
          <Text strong style={{ fontSize: 20 }}>Commandes</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><ShoppingCartOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#1890ff' }}><strong>{confirmedCount}</strong> <Text type="secondary">confirmées</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{deliveredCount}</strong> <Text type="secondary">livrées</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingOrder(null); setModalOpen(true); }}>
            Nouvelle commande
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Brouillons" value={draftCount} prefix={<ShoppingCartOutlined />} valueStyle={{ fontSize: 20, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Confirmées" value={confirmedCount} valueStyle={{ fontSize: 20, fontWeight: 600, color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Expédiées" value={shippedCount} valueStyle={{ fontSize: 20, fontWeight: 600, color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Livrées" value={deliveredCount} valueStyle={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }} />
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
            <Col span={6}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                options={STATUS_OPTIONS}
                onChange={(val) => setStatusFilter(val as OrderStatus)}
                value={statusFilter}
              />
            </Col>
            <Col>
              <Button onClick={() => { setStatusFilter(undefined); setSearch(''); }}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          dataSource={orders}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: (pagination.page || 0) + 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total) => `${total} commande(s)`,
            onChange: (page, pageSize) => {
              dispatch(fetchSalesOrders({
                page: page - 1,
                size: pageSize,
                search: search || undefined,
                status: statusFilter,
              }));
            },
          }}
          scroll={{ x: 1130, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <SalesOrderFormModal
        open={modalOpen}
        orderId={editingOrder?.id || null}
        onClose={() => { setModalOpen(false); setEditingOrder(null); }}
        onSuccess={() => { setModalOpen(false); setEditingOrder(null); loadData(); }}
      />
    </div>
  );
}
