import { useEffect, useState, useCallback } from 'react';
import { App, Card, Table, Button, Space, Input, Select, Tag, Dropdown, Modal, Segmented, Row, Col, Drawer, Descriptions, Typography, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  CalendarOutlined,
  UnorderedListOutlined,
  DeleteOutlined,
  EditOutlined,
  CheckCircleOutlined,
  PhoneOutlined,
  MailOutlined,
  TeamOutlined,
  FileTextOutlined,
  FormOutlined,
  MoreOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchActivities, deleteActivity, completeActivity, fetchActivityById, clearSelectedActivity, setFilters } from './activitiesSlice';
import { ActivityListItem, ACTIVITY_TYPES, ACTIVITY_STATUSES, ACTIVITY_PRIORITIES, ACTIVITY_TRANSPORT_MODES } from '@/types/activity';
import ActivityFormModal from './ActivityFormModal';
import ActivityCalendarView from './ActivityCalendarView';

const { Text } = Typography;
const { Search } = Input;

const typeIcons: Record<string, React.ReactNode> = {
  call:    <PhoneOutlined />,
  email:   <MailOutlined />,
  meeting: <TeamOutlined />,
  visite:  <EnvironmentOutlined />,
  task:    <FileTextOutlined />,
  note:    <FormOutlined />,
};

export default function ActivitiesListPage() {
  const { message } = App.useApp();
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters, selectedActivity } = useAppSelector((state) => state.activities);

  const [viewMode, setViewMode] = useState<string>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchActivities(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value, page: 1 }));
  };

  const handleStatusFilter = (value: string) => {
    dispatch(setFilters({ status: value || undefined, page: 1 }));
  };

  const handleTypeFilter = (value: string) => {
    dispatch(setFilters({ activityType: value || undefined, page: 1 }));
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer cette activité ?',
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteActivity(id));
        message.success('Activité supprimée');
        loadData();
      },
    });
  };

  const handleComplete = async (id: string) => {
    await dispatch(completeActivity(id));
    message.success('Activité terminée');
    loadData();
  };

  const handleViewDetail = (id: string) => {
    dispatch(fetchActivityById(id));
    setDrawerOpen(true);
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
    message.success(editingId ? 'Activité mise à jour' : 'Activité créée');
  };

  const stats = {
    total: pagination.totalElements,
    planned: items.filter((i) => i.status === 'planned').length,
    inProgress: items.filter((i) => i.status === 'in_progress').length,
    completed: items.filter((i) => i.status === 'completed').length,
  };

  const columns: ColumnsType<ActivityListItem> = [
    {
      title: 'Type',
      dataIndex: 'activityType',
      key: 'activityType',
      width: 100,
      render: (type: string) => {
        const config = ACTIVITY_TYPES.find((t) => t.value === type);
        return (
          <Tag icon={typeIcons[type]} color={config?.color || 'default'}>
            {config?.label || type}
          </Tag>
        );
      },
    },
    {
      title: 'Sujet',
      dataIndex: 'subject',
      key: 'subject',
      width: 200,
      ellipsis: { showTitle: false },
      render: (subject: string) => (
        <Tooltip title={subject} placement="topLeft">
          <span>{subject}</span>
        </Tooltip>
      ),
    },
    {
      title: 'Date début',
      dataIndex: 'startDate',
      key: 'startDate',
      width: 160,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY HH:mm') : '-',
      sorter: true,
    },
    {
      title: 'Échéance',
      dataIndex: 'dueDate',
      key: 'dueDate',
      width: 130,
      render: (date: string, record: ActivityListItem) => {
        if (!date) return '-';
        const d = dayjs(date);
        const isOverdue = d.isBefore(dayjs()) && record.status !== 'completed' && record.status !== 'cancelled';
        return (
          <span style={{ color: isOverdue ? '#ff4d4f' : undefined, fontWeight: isOverdue ? 600 : undefined }}>
            {d.format('DD/MM/YYYY')}
            {isOverdue && <Tag color="red" style={{ marginLeft: 4, fontSize: 10 }}>En retard</Tag>}
          </span>
        );
      },
    },
    {
      title: 'Lieu',
      dataIndex: 'location',
      key: 'location',
      width: 140,
      ellipsis: { showTitle: false },
      render: (loc: string) => loc ? (
        <Tooltip title={loc} placement="topLeft">
          <Space size={4}><EnvironmentOutlined style={{ color: '#1890ff' }} /><span>{loc}</span></Space>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => {
        const config = ACTIVITY_STATUSES.find((s) => s.value === status);
        return <Tag color={config?.color || 'default'}>{config?.label || status}</Tag>;
      },
    },
    {
      title: 'Priorité',
      dataIndex: 'priority',
      key: 'priority',
      width: 100,
      render: (priority: string) => {
        const config = ACTIVITY_PRIORITIES.find((p) => p.value === priority);
        return <Tag color={config?.color || 'default'}>{config?.label || priority}</Tag>;
      },
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
      title: 'Lié à',
      dataIndex: 'relatedToType',
      key: 'relatedToType',
      width: 110,
      render: (type: string) => {
        if (!type) return '-';
        const labels: Record<string, { label: string; color: string }> = {
          account: { label: 'Compte', color: 'blue' },
          contact: { label: 'Contact', color: 'cyan' },
          opportunity: { label: 'Opportunité', color: 'gold' },
          lead: { label: 'Piste', color: 'purple' },
        };
        const cfg = labels[type] || { label: type, color: 'default' };
        return <Tag color={cfg.color}>{cfg.label}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: ActivityListItem) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'Détail', onClick: () => handleViewDetail(record.id) },
              { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record.id) },
              ...(record.status !== 'completed' ? [{ key: 'complete', icon: <CheckCircleOutlined />, label: 'Terminer', onClick: () => handleComplete(record.id) }] : []),
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
          <Text strong style={{ fontSize: 20 }}>Activités</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><strong>{stats.total}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#1890ff' }}><strong>{stats.planned}</strong> <Text type="secondary">planifiées</Text></span>
            <span style={{ color: '#faad14' }}><strong>{stats.inProgress}</strong> <Text type="secondary">en cours</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{stats.completed}</strong> <Text type="secondary">terminées</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Nouvelle activité
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
                <Segmented
                  value={viewMode}
                  onChange={(v) => setViewMode(v as string)}
                  options={[
                    { value: 'list', icon: <UnorderedListOutlined /> },
                    { value: 'calendar', icon: <CalendarOutlined /> },
                  ]}
                />
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
                size="small"
                onChange={handleStatusFilter}
                options={ACTIVITY_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="Type"
                allowClear
                style={{ width: '100%' }}
                size="small"
                onChange={handleTypeFilter}
                options={ACTIVITY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </Col>
            <Col>
              <Button size="small" onClick={() => { handleStatusFilter(''); handleTypeFilter(''); }}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        {viewMode === 'list' ? (
          <Table
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={loading}
            scroll={{ x: 1290, y: 'calc(100vh - 330px)' }}
            pagination={{
              current: pagination.page || 1,
              pageSize: pagination.size,
              total: pagination.totalElements,
              showSizeChanger: true,
              showTotal: (total, range) => `${range[0]}-${range[1]} sur ${total}`,
              onChange: (page, pageSize) => dispatch(setFilters({ page, size: pageSize })),
            }}
          />
        ) : (
          <ActivityCalendarView onEventClick={handleEdit} onDateClick={() => setModalOpen(true)} />
        )}
      </Card>

      <ActivityFormModal
        open={modalOpen}
        editingId={editingId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <Drawer
        title="Détail de l'activité"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); dispatch(clearSelectedActivity()); }}
        width={500}
      >
        {selectedActivity && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Sujet">{selectedActivity.subject}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={ACTIVITY_TYPES.find((t) => t.value === selectedActivity.activityType)?.color}>
                  {ACTIVITY_TYPES.find((t) => t.value === selectedActivity.activityType)?.label || selectedActivity.activityType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={ACTIVITY_STATUSES.find((s) => s.value === selectedActivity.status)?.color}>
                  {ACTIVITY_STATUSES.find((s) => s.value === selectedActivity.status)?.label || selectedActivity.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Priorité">
                <Tag color={ACTIVITY_PRIORITIES.find((p) => p.value === selectedActivity.priority)?.color}>
                  {ACTIVITY_PRIORITIES.find((p) => p.value === selectedActivity.priority)?.label || selectedActivity.priority}
                </Tag>
              </Descriptions.Item>
              {selectedActivity.startDate && <Descriptions.Item label="Date début">{dayjs(selectedActivity.startDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>}
              {selectedActivity.endDate && <Descriptions.Item label="Date fin">{dayjs(selectedActivity.endDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>}
              {selectedActivity.dueDate && <Descriptions.Item label="Échéance">{dayjs(selectedActivity.dueDate).format('DD/MM/YYYY')}</Descriptions.Item>}
              {selectedActivity.duration && <Descriptions.Item label="Durée">{selectedActivity.duration} min</Descriptions.Item>}
              {selectedActivity.location && <Descriptions.Item label="Lieu">{selectedActivity.location}</Descriptions.Item>}
              {selectedActivity.assignedTo && <Descriptions.Item label="Assigné à">{selectedActivity.assignedTo.fullName || selectedActivity.assignedTo.email}</Descriptions.Item>}
              {selectedActivity.description && <Descriptions.Item label="Description">{selectedActivity.description}</Descriptions.Item>}
              {selectedActivity.callDirection && <Descriptions.Item label="Direction appel">{selectedActivity.callDirection}</Descriptions.Item>}
              {selectedActivity.callResult && <Descriptions.Item label="Résultat appel">{selectedActivity.callResult}</Descriptions.Item>}
              {selectedActivity.completedAt && <Descriptions.Item label="Terminée le">{dayjs(selectedActivity.completedAt).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>}
            </Descriptions>

            {(selectedActivity.objective || selectedActivity.result) && (
              <Descriptions title="Objectifs & Résultats" column={1} bordered size="small" style={{ marginTop: 16 }}>
                {selectedActivity.objective && <Descriptions.Item label="Objectif">{selectedActivity.objective}</Descriptions.Item>}
                {selectedActivity.result && <Descriptions.Item label="Résultat">{selectedActivity.result}</Descriptions.Item>}
              </Descriptions>
            )}

            {(selectedActivity.productsDiscussed || selectedActivity.estimatedRevenue != null) && (
              <Descriptions title="Produits & Commercial" column={1} bordered size="small" style={{ marginTop: 16 }}>
                {selectedActivity.productsDiscussed && <Descriptions.Item label="Produits discutés">{selectedActivity.productsDiscussed}</Descriptions.Item>}
                {selectedActivity.estimatedRevenue != null && (
                  <Descriptions.Item label="Revenu estimé">
                    {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(selectedActivity.estimatedRevenue)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {(selectedActivity.transportMode || selectedActivity.mileage != null || selectedActivity.expenses != null) && (
              <Descriptions title="Logistique & Dépenses" column={2} bordered size="small" style={{ marginTop: 16 }}>
                {selectedActivity.transportMode && (
                  <Descriptions.Item label="Transport" span={1}>
                    {ACTIVITY_TRANSPORT_MODES.find((t) => t.value === selectedActivity.transportMode)?.label || selectedActivity.transportMode}
                  </Descriptions.Item>
                )}
                {selectedActivity.mileage != null && <Descriptions.Item label="Kilométrage" span={1}>{selectedActivity.mileage} km</Descriptions.Item>}
                {selectedActivity.expenses != null && (
                  <Descriptions.Item label="Frais" span={2}>
                    {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(selectedActivity.expenses)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {selectedActivity.followUpDate && (
              <Descriptions title="Suivi & Relance" column={1} bordered size="small" style={{ marginTop: 16 }}>
                <Descriptions.Item label="Date de suivi">{dayjs(selectedActivity.followUpDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              </Descriptions>
            )}
          </>
        )}
      </Drawer>
    </div>
  );
}
