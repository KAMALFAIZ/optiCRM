import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Dropdown,
  Modal,
  message,
  Card,
  Row,
  Col,
  Select,
  Typography,
  Statistic,
  Image,
  Tooltip,
  Segmented,
  Badge,
  Pagination,
  Spin,
  Empty,
} from 'antd';
import {
  PlusOutlined,
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
  ShoppingOutlined,
  InboxOutlined,
  DollarOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchProducts, deleteProduct, setFilters, clearFilters, fetchCategories, fetchProductStats } from './productsSlice';
import { ProductListItem, STOCK_STATUS_CONFIG, StockStatus } from '@/types/product';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import ProductFormModal from './ProductFormModal';

const { Text } = Typography;
const { Search } = Input;

type ViewMode = 'catalog' | 'table';

// ─── Product Card Component ────────────────────────────────────────────────────

function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  formatPrice,
  getStockStatusConfig,
}: {
  product: ProductListItem;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  formatPrice: (price: number, currency?: string) => string;
  getStockStatusConfig: (status: string) => { label: string; color: string };
}) {
  const stockConfig = getStockStatusConfig(product.stockStatus);

  const actionItems: MenuProps['items'] = [
    { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => onEdit(product.id) },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => onDelete(product.id) },
  ];

  return (
    <Badge.Ribbon
      text={product.isActive ? 'Actif' : 'Inactif'}
      color={product.isActive ? 'green' : 'default'}
      style={{ display: product.isActive ? 'none' : undefined }}
    >
      <Card
        hoverable
        onClick={() => onView(product.id)}
        style={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        styles={{ body: { padding: 0, flex: 1, display: 'flex', flexDirection: 'column' } }}
        cover={
          <div style={{ height: 180, background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
            {product.imageUrl ? (
              <Image
                src={product.imageUrl}
                alt={product.name}
                style={{ width: '100%', height: 180, objectFit: 'cover' }}
                preview={false}
                fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
              />
            ) : (
              <div style={{ textAlign: 'center', color: '#bfbfbf' }}>
                <InboxOutlined style={{ fontSize: 48 }} />
                <div style={{ fontSize: 12, marginTop: 4 }}>Pas d'image</div>
              </div>
            )}
            {product.isStockable && (
              <Tag color={stockConfig.color} style={{ position: 'absolute', top: 8, left: 8, margin: 0, fontSize: 11, fontWeight: 500 }}>
                {stockConfig.label}
              </Tag>
            )}
            {product.categoryName && (
              <Tag style={{ position: 'absolute', bottom: 8, left: 8, margin: 0, fontSize: 11, backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff', border: 'none' }}>
                {product.categoryName}
              </Tag>
            )}
          </div>
        }
        actions={[
          <Tooltip title="Voir les détails" key="view">
            <EyeOutlined onClick={(e) => { e.stopPropagation(); onView(product.id); }} />
          </Tooltip>,
          <Tooltip title="Modifier" key="edit">
            <EditOutlined onClick={(e) => { e.stopPropagation(); onEdit(product.id); }} />
          </Tooltip>,
          <Dropdown menu={{ items: actionItems }} trigger={['click']} key="more">
            <MoreOutlined onClick={(e) => e.stopPropagation()} />
          </Dropdown>,
        ]}
      >
        <div style={{ padding: '12px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text type="secondary" style={{ fontSize: 12, fontFamily: 'monospace' }}>{product.code}</Text>
            {product.brand && <Text type="secondary" style={{ fontSize: 11 }}>{product.brand}</Text>}
          </div>
          <Text strong style={{ fontSize: 14, lineHeight: '20px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 8, minHeight: 40 }}>
            {product.name}
          </Text>
          <div style={{ flex: 1 }} />
          <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1890ff', lineHeight: 1 }}>
                  {formatPrice(product.unitPrice)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {product.isStockable ? (
                  <div style={{ fontSize: 12, color: '#595959' }}>
                    <span style={{ fontWeight: 600 }}>{product.totalStock}</span>{' '}
                    <span style={{ color: '#8c8c8c' }}>{product.unitOfMeasure}</span>
                  </div>
                ) : (
                  <Tag style={{ fontSize: 10, margin: 0 }}>Service</Tag>
                )}
                {product.isSellable === false && (
                  <Tag color="orange" style={{ fontSize: 10, margin: '2px 0 0 0' }}>Non vendable</Tag>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </Badge.Ribbon>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────────

const ProductsListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters, categories, stats } = useAppSelector((state) => state.products);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');

  const loadProducts = useCallback(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadProducts();
    dispatch(fetchCategories());
    dispatch(fetchProductStats());
  }, [loadProducts, dispatch]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value, page: 0 }));
  };

  const handleTableChange = (paginationConfig: any, _filters: any, sorter: any) => {
    dispatch(setFilters({
      page: paginationConfig.current - 1,
      size: paginationConfig.pageSize,
      sortBy: sorter.field || 'name',
      sortDirection: sorter.order === 'ascend' ? 'asc' : 'desc',
    }));
  };

  const handlePageChange = (page: number, pageSize: number) => {
    dispatch(setFilters({ page: page - 1, size: pageSize }));
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Supprimer le produit',
      content: 'Êtes-vous sûr de vouloir supprimer ce produit ? Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        try {
          await dispatch(deleteProduct(id)).unwrap();
          message.success('Produit supprimé avec succès');
          loadProducts();
        } catch (error: any) {
          message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de la suppression du produit'));
        }
      },
    });
  };

  const handleEdit = (id: string) => { setEditingProduct(id); setModalOpen(true); };
  const handleView = (id: string) => { setEditingProduct(id); setModalOpen(true); };
  const handleCreate = () => { setEditingProduct(null); setModalOpen(true); };
  const handleModalClose = (refresh?: boolean) => {
    setModalOpen(false);
    setEditingProduct(null);
    if (refresh) { loadProducts(); dispatch(fetchProductStats()); }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(price);

  const getStockStatusConfig = (status: string) =>
    STOCK_STATUS_CONFIG[status as StockStatus] || { label: status, color: 'default' };

  const getActionItems = (record: ProductListItem): MenuProps['items'] => [
    { key: 'view', icon: <EyeOutlined />, label: 'Voir les détails', onClick: () => handleView(record.id) },
    { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record.id) },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record.id) },
  ];

  const columns: ColumnsType<ProductListItem> = [
    {
      title: 'Image',
      dataIndex: 'imageUrl',
      key: 'image',
      width: 60,
      render: (imageUrl) => (
        imageUrl ? (
          <Image src={imageUrl} width={40} height={40} style={{ objectFit: 'cover', borderRadius: 4 }}
            fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" />
        ) : (
          <div style={{ width: 40, height: 40, background: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <InboxOutlined style={{ color: '#999' }} />
          </div>
        )
      ),
    },
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 100,
      sorter: true,
      render: (code, record) => <a onClick={() => handleView(record.id)}>{code}</a>,
    },
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
      ellipsis: { showTitle: false },
      render: (name, record) => (
        <Tooltip title={name} placement="topLeft">
          <a onClick={() => handleView(record.id)}>{name}</a>
        </Tooltip>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'categoryName',
      key: 'categoryName',
      width: 150,
      render: (categoryName) => categoryName || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Marque',
      dataIndex: 'brand',
      key: 'brand',
      width: 120,
      render: (brand) => brand || <span style={{ color: '#999' }}>-</span>,
    },
    {
      title: 'Prix unitaire',
      dataIndex: 'unitPrice',
      key: 'unitPrice',
      width: 130,
      align: 'right',
      sorter: true,
      render: (price) => <span style={{ fontWeight: 500 }}>{formatPrice(price)}</span>,
    },
    {
      title: 'Prix revient',
      dataIndex: 'costPrice',
      key: 'costPrice',
      width: 140,
      align: 'right' as const,
      render: (cost: number) => {
        if (!cost) return '-';
        return <span>{new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(cost)}</span>;
      },
    },
    {
      title: 'Stock',
      key: 'stock',
      width: 100,
      align: 'right',
      render: (_, record) => {
        if (!record.isStockable) return <span style={{ color: '#999' }}>N/A</span>;
        const statusConfig = getStockStatusConfig(record.stockStatus);
        return (
          <Tooltip title={statusConfig.label}>
            <span>{record.totalStock} {record.unitOfMeasure}</span>
          </Tooltip>
        );
      },
    },
    {
      title: 'Statut stock',
      dataIndex: 'stockStatus',
      key: 'stockStatus',
      width: 110,
      render: (status: StockStatus) => {
        const config = getStockStatusConfig(status);
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'État',
      key: 'status',
      width: 100,
      render: (_: unknown, record: any) => (
        <Space direction="vertical" size={2}>
          <Tag color={record.isActive ? 'green' : 'default'}>{record.isActive ? 'Actif' : 'Inactif'}</Tag>
          {record.isSellable === false && <Tag color="orange" style={{ fontSize: 10 }}>Non vendable</Tag>}
        </Space>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      align: 'center',
      fixed: 'right',
      render: (_, record) => (
        <Dropdown menu={{ items: getActionItems(record) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Produits</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><ShoppingOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#3f8600' }}><strong>{stats.active}</strong> <Text type="secondary">actifs</Text></span>
          </Space>
        </Space>
        <Space>
          <Segmented
            value={viewMode}
            onChange={(val) => setViewMode(val as ViewMode)}
            options={[
              { value: 'catalog', icon: <AppstoreOutlined />, label: 'Catalogue' },
              { value: 'table', icon: <UnorderedListOutlined />, label: 'Liste' },
            ]}
          />
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouveau produit
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Total produits" value={pagination.totalElements} prefix={<ShoppingOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Produits actifs" value={stats.active} prefix={<InboxOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#3f8600' }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Produits en stock" value={stats.stockable} prefix={<DollarOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }} />
          </Card>
        </Col>
      </Row>

      {/* ── Search & Filter Card (wraps both catalog and table content) ── */}
      <Card
        styles={{ body: { padding: '8px 16px 16px' } }}
        title={
          <Row gutter={12} align="middle" style={{ padding: '8px 0' }}>
            <Col flex="auto">
              <Search
                placeholder="Rechercher par code, nom ou marque..."
                allowClear
                enterButton
                size="small"
                onSearch={handleSearch}
                style={{ maxWidth: 360 }}
                defaultValue={filters.search}
              />
            </Col>
            <Col>
              <Space>
                <Button size="small" icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)} type={showFilters ? 'primary' : 'default'}>
                  Filtres
                </Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadProducts}>Actualiser</Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 12 }}>
            <Col xs={24} sm={6}>
              <Select
                placeholder="Catégorie"
                allowClear
                style={{ width: '100%' }}
                size="small"
                options={categoryOptions}
                onChange={(value) => dispatch(setFilters({ categoryId: value, page: 0 }))}
                value={filters.categoryId}
              />
            </Col>
            <Col xs={24} sm={5}>
              <Select
                placeholder="État"
                allowClear
                style={{ width: '100%' }}
                size="small"
                options={[{ value: 'true', label: 'Actif' }, { value: 'false', label: 'Inactif' }]}
                onChange={(value) => dispatch(setFilters({ isActive: value === 'true' ? true : value === 'false' ? false : undefined, page: 0 }))}
              />
            </Col>
            <Col xs={24} sm={5}>
              <Select
                placeholder="Stock"
                allowClear
                style={{ width: '100%' }}
                size="small"
                options={[{ value: 'true', label: 'Produits stockés' }, { value: 'false', label: 'Services' }]}
                onChange={(value) => dispatch(setFilters({ isStockable: value === 'true' ? true : value === 'false' ? false : undefined, page: 0 }))}
              />
            </Col>
            <Col>
              <Button size="small" onClick={() => dispatch(clearFilters())}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        {/* Catalog View */}
        {viewMode === 'catalog' && (
          <Spin spinning={loading}>
            {items.length > 0 ? (
              <>
                <Row gutter={[16, 16]}>
                  {items.map((product) => (
                    <Col key={product.id} xs={24} sm={12} md={8} lg={6} xl={6}>
                      <ProductCard
                        product={product}
                        onView={handleView}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        formatPrice={formatPrice}
                        getStockStatusConfig={getStockStatusConfig}
                      />
                    </Col>
                  ))}
                </Row>
                <div style={{ textAlign: 'center', marginTop: 24 }}>
                  <Pagination
                    current={pagination.page + 1}
                    pageSize={pagination.size}
                    total={pagination.totalElements}
                    showSizeChanger
                    showTotal={(total, range) => `${range[0]}-${range[1]} sur ${total} produits`}
                    onChange={handlePageChange}
                    pageSizeOptions={['12', '24', '48', '96']}
                  />
                </div>
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aucun produit trouvé">
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  Créer un produit
                </Button>
              </Empty>
            )}
          </Spin>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            loading={loading}
            onChange={handleTableChange}
            pagination={{
              current: pagination.page + 1,
              pageSize: pagination.size,
              total: pagination.totalElements,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total} produits`,
            }}
            scroll={{ x: 1350, y: 'calc(100vh - 330px)' }}
          />
        )}
      </Card>

      <ProductFormModal open={modalOpen} productId={editingProduct} onClose={handleModalClose} />
    </div>
  );
};

export default ProductsListPage;
