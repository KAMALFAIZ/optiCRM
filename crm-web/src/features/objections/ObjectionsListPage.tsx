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
  message,
  Popconfirm,
  Tooltip,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchObjections,
  fetchObjectionStats,
  deleteObjection,
  setFilters,
} from './objectionsSlice';
import {
  ObjectionListItem,
  OBJECTION_CATEGORY_CONFIG,
  OBJECTION_STATUS_CONFIG,
  OBJECTION_PRIORITY_CONFIG,
  ObjectionCategory,
  ObjectionStatus,
  ObjectionPriority,
} from '@/types/objection';
import ObjectionFormModal from './ObjectionFormModal';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';

const { Text } = Typography;
const { Search } = Input;

const ObjectionsListPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { objections, loading, pagination, filters, stats } = useAppSelector(
    (state) => state.objections
  );

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedObjectionId, setSelectedObjectionId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadObjections = useCallback(() => {
    dispatch(fetchObjections(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadObjections();
    dispatch(fetchObjectionStats());
  }, [loadObjections, dispatch]);

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

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteObjection(id)).unwrap();
      message.success('Objection supprimée avec succès');
      loadObjections();
      dispatch(fetchObjectionStats());
    } catch (error: any) {
      message.error(typeof error === 'string' ? error : (error?.message || 'Erreur lors de la suppression'));
    }
  };

  const handleEdit = (id: string) => {
    setSelectedObjectionId(id);
    setModalVisible(true);
  };

  const handleCreate = () => {
    setSelectedObjectionId(null);
    setModalVisible(true);
  };

  const handleModalClose = (refresh?: boolean) => {
    setModalVisible(false);
    setSelectedObjectionId(null);
    if (refresh) {
      loadObjections();
      dispatch(fetchObjectionStats());
    }
  };

  const columns: ColumnsType<ObjectionListItem> = [
    {
      title: 'Code',
      dataIndex: 'code',
      key: 'code',
      width: 110,
      render: (code) => <Text strong>{code}</Text>,
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: { showTitle: false },
      render: (title: string) => (
        <Tooltip title={title} placement="topLeft">
          <span>{title}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      width: 130,
      render: (category: ObjectionCategory) => {
        if (!category) return <Text type="secondary">-</Text>;
        const config = OBJECTION_CATEGORY_CONFIG[category] || { label: category, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ObjectionStatus) => {
        const config = OBJECTION_STATUS_CONFIG[status] || { label: status, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Priorité',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: ObjectionPriority) => {
        const config = OBJECTION_PRIORITY_CONFIG[priority] || { label: priority, color: 'default' };
        return <Tag color={config.color}>{config.label}</Tag>;
      },
    },
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      width: 110,
      render: (source: string) => {
        if (!source) return '-';
        const sourceConfig: Record<string, { label: string; color: string }> = {
          PHONE: { label: 'Téléphone', color: 'blue' },
          EMAIL: { label: 'Email', color: 'cyan' },
          MEETING: { label: 'Réunion', color: 'green' },
          DEMO: { label: 'Démo', color: 'purple' },
          WEBSITE: { label: 'Site web', color: 'orange' },
          OTHER: { label: 'Autre', color: 'default' },
        };
        const cfg = sourceConfig[source] || { label: source, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Compte',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 150,
      ellipsis: { showTitle: true },
      render: (name) => name || <Text type="secondary">-</Text>,
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
      title: 'Assigné à',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 140,
      ellipsis: { showTitle: true },
      render: (name) => name || <Text type="secondary">Non assigné</Text>,
    },
    {
      title: 'Date création',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Résolue le',
      dataIndex: 'resolvedAt',
      key: 'resolvedAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
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
            title="Supprimer cette objection ?"
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

  const categoryOptions = Object.entries(OBJECTION_CATEGORY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const statusOptions = Object.entries(OBJECTION_STATUS_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  const priorityOptions = Object.entries(OBJECTION_PRIORITY_CONFIG).map(([value, config]) => ({
    value,
    label: config.label,
  }));

  return (
    <div>
      {/* ── Header compact ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <Space size={20} align="center">
          <Text strong style={{ fontSize: 20 }}>Objections</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><ExclamationCircleOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            {(stats?.openObjections ?? 0) > 0 && (
              <span style={{ color: '#1890ff' }}><strong>{stats!.openObjections}</strong> <Text type="secondary">ouvertes</Text></span>
            )}
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            Nouvelle objection
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Total objections" value={stats?.totalObjections || 0} prefix={<ExclamationCircleOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Ouvertes" value={stats?.openObjections || 0} prefix={<ClockCircleOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="En cours" value={stats?.inProgressObjections || 0} prefix={<WarningOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#faad14' }} />
          </Card>
        </Col>
        <Col xs={6}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Résolues" value={stats?.resolvedObjections || 0} prefix={<CheckCircleOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }} />
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
                <Button size="small" icon={<ReloadOutlined />} onClick={loadObjections}>Actualiser</Button>
              </Space>
            </Col>
          </Row>
        }
      >
        {showFilters && (
          <Row gutter={12} style={{ marginBottom: 10 }} align="middle">
            <Col span={4}>
              <Select
                placeholder="Catégorie"
                allowClear
                style={{ width: '100%' }}
                size="small"
                options={categoryOptions}
                onChange={(value) => dispatch(setFilters({ category: value, page: 0 }))}
                value={filters.category}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                size="small"
                options={statusOptions}
                onChange={(value) => dispatch(setFilters({ status: value, page: 0 }))}
                value={filters.status}
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Priorité"
                allowClear
                style={{ width: '100%' }}
                size="small"
                options={priorityOptions}
                onChange={(value) => dispatch(setFilters({ priority: value, page: 0 }))}
                value={filters.priority}
              />
            </Col>
            <Col>
              <Button size="small" onClick={() => dispatch(setFilters({ category: undefined, status: undefined, priority: undefined, page: 0 }))}>
                Réinitialiser
              </Button>
            </Col>
          </Row>
        )}

        <Table
          columns={columns}
          dataSource={objections}
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
          scroll={{ x: 1540, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <ObjectionFormModal
        open={modalVisible}
        objectionId={selectedObjectionId}
        onClose={handleModalClose}
      />
    </div>
  );
};

export default ObjectionsListPage;
