import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Tag,
  Card,
  Row,
  Col,
  Select,
  Space,
  Typography,
  Statistic,
  Tabs,
  Alert,
  Modal,
  Form,
  InputNumber,
  Input,
  message,
  Tooltip,
  Badge,
} from 'antd';
import {
  WarningOutlined,
  ReloadOutlined,
  InboxOutlined,
  SwapOutlined,
  ExclamationCircleOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchStockLevels,
  fetchWarehouses,
  fetchLowStock,
  fetchMovements,
  createAdjustment,
  setFilters,
  setMovementsFilters,
} from './inventorySlice';
import StockEntryModal from './StockEntryModal';
import { StockLevel, StockMovement, STOCK_STATUS_LEVEL_CONFIG, MOVEMENT_TYPE_CONFIG, StockStatusLevel, MovementType } from '@/types/stock';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;

const InventoryListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    stockLevels,
    movements,
    warehouses,
    lowStockItems,
    loading,
    pagination,
    filters,
    movementsPagination,
    movementsFilters,
  } = useAppSelector((state) => state.inventory);

  const [activeTab, setActiveTab] = useState('stock');
  const [entryModalOpen, setEntryModalOpen] = useState(false);
  const [adjustmentModal, setAdjustmentModal] = useState<{ visible: boolean; record: StockLevel | null }>({
    visible: false,
    record: null,
  });
  const [form] = Form.useForm();

  const loadStockLevels = useCallback(() => {
    dispatch(fetchStockLevels(filters));
  }, [dispatch, filters]);

  const loadMovements = useCallback(() => {
    dispatch(fetchMovements(movementsFilters));
  }, [dispatch, movementsFilters]);

  useEffect(() => {
    dispatch(fetchWarehouses());
    dispatch(fetchLowStock());
  }, [dispatch]);

  useEffect(() => {
    if (activeTab === 'stock') {
      loadStockLevels();
    } else {
      loadMovements();
    }
  }, [activeTab, loadStockLevels, loadMovements]);

  const handleTableChange = (paginationConfig: any) => {
    if (activeTab === 'stock') {
      dispatch(setFilters({ page: paginationConfig.current - 1, size: paginationConfig.pageSize }));
    } else {
      dispatch(setMovementsFilters({ page: paginationConfig.current - 1, size: paginationConfig.pageSize }));
    }
  };

  const handleAdjustment = (record: StockLevel) => {
    setAdjustmentModal({ visible: true, record });
    form.setFieldsValue({ newQuantity: record.quantityOnHand, notes: '' });
  };

  const handleAdjustmentSubmit = async () => {
    try {
      const values = await form.validateFields();
      const { record } = adjustmentModal;
      if (!record) return;
      await dispatch(createAdjustment({
        productId: record.product.id,
        warehouseId: record.warehouse.id,
        newQuantity: values.newQuantity,
        notes: values.notes,
      })).unwrap();
      message.success('Ajustement effectué avec succès');
      setAdjustmentModal({ visible: false, record: null });
      loadStockLevels();
      dispatch(fetchLowStock());
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de l\'ajustement'));
    }
  };

  const getStatusConfig = (status: string) => STOCK_STATUS_LEVEL_CONFIG[status as StockStatusLevel] || { label: status, color: 'default' };
  const getMovementTypeConfig = (type: string) => MOVEMENT_TYPE_CONFIG[type as MovementType] || { label: type, color: 'default' };
  const formatQuantity = (qty: number, unit?: string) => `${qty.toLocaleString('fr-FR')} ${unit || ''}`.trim();
  const formatCurrency = (amount: number) => new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(amount);

  const stockColumns: ColumnsType<StockLevel> = [
    {
      title: 'Produit',
      key: 'product',
      render: (_, record) => (
        <div>
          <Text strong>{record.product.code}</Text>
          <br />
          <Text type="secondary">{record.product.name}</Text>
        </div>
      ),
    },
    {
      title: 'Entrepôt',
      key: 'warehouse',
      width: 150,
      render: (_, record) => <Tag color="blue">{record.warehouse.name}</Tag>,
    },
    {
      title: 'En stock',
      dataIndex: 'quantityOnHand',
      key: 'quantityOnHand',
      width: 120,
      align: 'right',
      render: (qty, record) => formatQuantity(qty, record.product.unitOfMeasure),
    },
    {
      title: 'Réservé',
      dataIndex: 'quantityReserved',
      key: 'quantityReserved',
      width: 100,
      align: 'right',
      render: (qty, record) => (
        <Text type={qty > 0 ? 'warning' : 'secondary'}>{formatQuantity(qty, record.product.unitOfMeasure)}</Text>
      ),
    },
    {
      title: 'Disponible',
      dataIndex: 'quantityAvailable',
      key: 'quantityAvailable',
      width: 120,
      align: 'right',
      render: (qty, record) => (
        <Text strong type={qty <= 0 ? 'danger' : undefined}>{formatQuantity(qty, record.product.unitOfMeasure)}</Text>
      ),
    },
    {
      title: 'Coût moyen',
      dataIndex: 'averageCost',
      key: 'averageCost',
      width: 120,
      align: 'right',
      render: (cost) => formatCurrency(cost),
    },
    {
      title: 'Valeur',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 130,
      align: 'right',
      render: (value) => <Text strong>{formatCurrency(value)}</Text>,
    },
    {
      title: 'Statut',
      dataIndex: 'stockStatus',
      key: 'stockStatus',
      width: 120,
      render: (status: StockStatusLevel) => {
        const config = getStatusConfig(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Tooltip title="Ajuster le stock">
          <Button type="link" icon={<SwapOutlined />} onClick={() => handleAdjustment(record)}>
            Ajuster
          </Button>
        </Tooltip>
      ),
    },
  ];

  const movementColumns: ColumnsType<StockMovement> = [
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Type',
      dataIndex: 'movementType',
      key: 'movementType',
      width: 120,
      render: (type: MovementType) => {
        const config = getMovementTypeConfig(type);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Produit',
      key: 'product',
      render: (_, record) => (
        <div>
          <Text strong>{record.product.code}</Text>
          <br />
          <Text type="secondary">{record.product.name}</Text>
        </div>
      ),
    },
    {
      title: 'Entrepôt',
      key: 'warehouse',
      width: 150,
      render: (_, record) => record.warehouse.name,
    },
    {
      title: 'Quantité',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 120,
      align: 'right',
      render: (qty) => (
        <Text type={qty > 0 ? 'success' : 'danger'} strong>
          {qty > 0 ? '+' : ''}{qty.toLocaleString('fr-FR')}
        </Text>
      ),
    },
    {
      title: 'Stock après',
      dataIndex: 'quantityAfter',
      key: 'quantityAfter',
      width: 120,
      align: 'right',
      render: (qty) => qty.toLocaleString('fr-FR'),
    },
    {
      title: 'Notes',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: { showTitle: true },
      render: (notes) => notes || <Text type="secondary">-</Text>,
    },
    {
      title: 'Par',
      key: 'createdBy',
      width: 150,
      render: (_, record) => record.createdBy?.fullName || <Text type="secondary">Système</Text>,
    },
  ];

  const warehouseOptions = warehouses.map(w => ({ value: w.id, label: w.name }));

  const tabItems = [
    {
      key: 'stock',
      label: <span><InboxOutlined /> Niveaux de stock</span>,
      children: (
        <Card
          styles={{ body: { padding: '8px 16px 16px' } }}
          title={
            <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
              <Col>
                <Select
                  placeholder="Filtrer par entrepôt"
                  allowClear
                  style={{ width: 220 }}
                  size="small"
                  options={warehouseOptions}
                  onChange={(value) => dispatch(setFilters({ warehouseId: value, page: 0 }))}
                  value={filters.warehouseId}
                />
              </Col>
              <Col flex="auto" />
              <Col>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadStockLevels}>Actualiser</Button>
              </Col>
            </Row>
          }
        >
          <Table
            columns={stockColumns}
            dataSource={stockLevels}
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
            scroll={{ x: 1200, y: 'calc(100vh - 330px)' }}
          />
        </Card>
      ),
    },
    {
      key: 'movements',
      label: <span><SwapOutlined /> Mouvements</span>,
      children: (
        <Card
          styles={{ body: { padding: '8px 16px 16px' } }}
          title={
            <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
              <Col>
                <Select
                  placeholder="Entrepôt"
                  allowClear
                  style={{ width: 180 }}
                  size="small"
                  options={warehouseOptions}
                  onChange={(value) => dispatch(setMovementsFilters({ warehouseId: value, page: 0 }))}
                  value={movementsFilters.warehouseId}
                />
              </Col>
              <Col>
                <Select
                  placeholder="Type de mouvement"
                  allowClear
                  style={{ width: 180 }}
                  size="small"
                  options={Object.entries(MOVEMENT_TYPE_CONFIG).map(([value, config]) => ({ value, label: config.label }))}
                  onChange={(value) => dispatch(setMovementsFilters({ movementType: value, page: 0 }))}
                  value={movementsFilters.movementType}
                />
              </Col>
              <Col flex="auto" />
              <Col>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadMovements}>Actualiser</Button>
              </Col>
            </Row>
          }
        >
          <Table
            columns={movementColumns}
            dataSource={movements}
            rowKey="id"
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              current: movementsPagination.page + 1,
              pageSize: movementsPagination.size,
              total: movementsPagination.totalElements,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}`,
            }}
            scroll={{ x: 1100, y: 'calc(100vh - 330px)' }}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space>
          <Text strong style={{ fontSize: 20 }}>Inventaire</Text>
          {lowStockItems.length > 0 && (
            <Badge count={lowStockItems.length} style={{ backgroundColor: '#faad14' }} />
          )}
        </Space>
        <Button
          size="small"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setEntryModalOpen(true)}
          style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
        >
          Entrée de stock
        </Button>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message={
            <span>
              <Badge count={lowStockItems.length} style={{ backgroundColor: '#faad14', marginRight: 8 }} />
              {lowStockItems.length} produit(s) en stock bas ou en rupture
            </span>
          }
          description={
            <div style={{ marginTop: 4 }}>
              {lowStockItems.slice(0, 5).map((item) => (
                <Tag key={item.id} color={item.stockStatus === 'OUT_OF_STOCK' ? 'red' : 'orange'} style={{ marginBottom: 4 }}>
                  {item.product.code}: {item.quantityAvailable} {item.product.unitOfMeasure}
                </Tag>
              ))}
              {lowStockItems.length > 5 && <Text type="secondary"> et {lowStockItems.length - 5} autres...</Text>}
            </div>
          }
          style={{ marginBottom: 12 }}
        />
      )}

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Total produits en stock" value={pagination.totalElements} prefix={<InboxOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Entrepôts actifs" value={warehouses.length} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Alertes stock bas" value={lowStockItems.length} prefix={<ExclamationCircleOutlined />}
              valueStyle={{ fontSize: 18, fontWeight: 600, color: lowStockItems.length > 0 ? '#faad14' : '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      <StockEntryModal
        open={entryModalOpen}
        onClose={(refresh) => {
          setEntryModalOpen(false);
          if (refresh) { loadStockLevels(); loadMovements(); }
        }}
      />

      <Modal
        title="Ajustement de stock"
        open={adjustmentModal.visible}
        onOk={handleAdjustmentSubmit}
        onCancel={() => setAdjustmentModal({ visible: false, record: null })}
        okText="Valider l'ajustement"
        cancelText="Annuler"
      >
        {adjustmentModal.record && (
          <Form form={form} layout="vertical">
            <Alert
              type="info"
              message={
                <span>
                  <strong>{adjustmentModal.record.product.code}</strong> - {adjustmentModal.record.product.name}
                  <br />
                  Entrepôt: <strong>{adjustmentModal.record.warehouse.name}</strong>
                </span>
              }
              style={{ marginBottom: 16 }}
            />
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="Stock actuel">
                  <InputNumber value={adjustmentModal.record.quantityOnHand} disabled style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="newQuantity" label="Nouveau stock" rules={[{ required: true, message: 'Quantité requise' }]}>
                  <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="Nouvelle quantité" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item name="notes" label="Motif de l'ajustement">
              <Input.TextArea rows={3} placeholder="Inventaire, correction d'erreur, casse..." />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
};

export default InventoryListPage;
