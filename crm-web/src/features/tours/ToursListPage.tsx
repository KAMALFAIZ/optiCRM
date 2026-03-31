import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, Space, Input, Select, Tag, Dropdown, Modal, message, Row, Col, Progress, Typography, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchTours, deleteTour, startTour, completeTour, setFilters } from './toursSlice';
import { TourListItem, TOUR_STATUSES } from '@/types/tour';
import TourFormModal from './TourFormModal';

const { Text } = Typography;
const { Search } = Input;

export default function ToursListPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, loading, pagination, filters } = useAppSelector((state) => state.tours);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchTours(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value, page: 1 }));
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer cette tournée ?',
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteTour(id));
        message.success('Tournée supprimée');
        loadData();
      },
    });
  };

  const handleStart = async (id: string) => {
    await dispatch(startTour(id));
    message.success('Tournée démarrée');
    loadData();
  };

  const handleComplete = async (id: string) => {
    await dispatch(completeTour(id));
    message.success('Tournée terminée');
    loadData();
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadData();
    message.success(editingId ? 'Tournée mise à jour' : 'Tournée créée');
  };

  const stats = {
    total: pagination.totalElements,
    draft: items.filter((i) => i.status === 'draft').length,
    inProgress: items.filter((i) => i.status === 'in_progress').length,
    completed: items.filter((i) => i.status === 'completed').length,
  };

  const columns: ColumnsType<TourListItem> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 200,
      ellipsis: { showTitle: false },
      render: (name: string) => (
        <Tooltip title={name} placement="topLeft">
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Date',
      dataIndex: 'tourDate',
      key: 'tourDate',
      width: 130,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
      sorter: true,
    },
    {
      title: 'Région',
      dataIndex: 'region',
      key: 'region',
      width: 130,
      render: (region: string) => region || '-',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = TOUR_STATUSES.find((s) => s.value === status);
        return <Tag color={config?.color || 'default'}>{config?.label || status}</Tag>;
      },
    },
    {
      title: 'Progression',
      key: 'progress',
      width: 180,
      render: (_: unknown, record: TourListItem) => {
        const percent = record.totalVisits > 0 ? Math.round((record.completedVisits / record.totalVisits) * 100) : 0;
        return (
          <Space>
            <Progress percent={percent} size="small" style={{ width: 100 }} />
            <span style={{ fontSize: 12 }}>{record.completedVisits}/{record.totalVisits}</span>
          </Space>
        );
      },
    },
    {
      title: 'Distance',
      dataIndex: 'totalDistance',
      key: 'totalDistance',
      width: 100,
      align: 'right' as const,
      render: (km: number) => km ? (
        <span style={{ fontWeight: 500 }}>{km.toFixed(1)} km</span>
      ) : '-',
    },
    {
      title: 'Assigné à',
      dataIndex: 'assignedToName',
      key: 'assignedToName',
      width: 150,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Créé le',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: TourListItem) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'Détail', onClick: () => navigate(`/tours/${record.id}`) },
              { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record.id) },
              ...(record.status === 'draft' || record.status === 'planned'
                ? [{ key: 'start', icon: <PlayCircleOutlined />, label: 'Démarrer', onClick: () => handleStart(record.id) }]
                : []),
              ...(record.status === 'in_progress'
                ? [{ key: 'complete', icon: <CheckCircleOutlined />, label: 'Terminer', onClick: () => handleComplete(record.id) }]
                : []),
              { type: 'divider' as const },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record.id) },
            ],
          }}
          trigger={['click']}
        >
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
          <Text strong style={{ fontSize: 20 }}>Tournées</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><strong>{stats.total}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#8c8c8c' }}><strong>{stats.draft}</strong> <Text type="secondary">brouillons</Text></span>
            <span style={{ color: '#faad14' }}><strong>{stats.inProgress}</strong> <Text type="secondary">en cours</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{stats.completed}</strong> <Text type="secondary">terminées</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Nouvelle tournée
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
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                size="small"
                onChange={(v) => dispatch(setFilters({ status: v || undefined, page: 1 }))}
                options={TOUR_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </Col>
            <Col>
              <Button size="small" onClick={() => dispatch(setFilters({ status: undefined, page: 1 }))}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 1210, y: 'calc(100vh - 330px)' }}
          pagination={{
            current: pagination.page || 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}`,
            onChange: (page, pageSize) => dispatch(setFilters({ page, size: pageSize })),
          }}
        />
      </Card>

      <TourFormModal
        open={modalOpen}
        editingId={editingId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
