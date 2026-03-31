import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Button, Space, Input, Select, Tag, Dropdown, Modal, message, Row, Col, Drawer, Descriptions, Timeline, Rate, Typography, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  MoreOutlined,
  LoginOutlined,
  LogoutOutlined,
  EnvironmentOutlined,
  EyeOutlined,
  FilterOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchVisits, deleteVisit, checkInVisit, checkOutVisit, fetchVisitById, clearSelectedVisit, setFilters } from './visitsSlice';
import { VisitListItem, VISIT_TYPES, VISIT_STATUSES, VISIT_OUTCOMES } from '@/types/visit';
import VisitFormModal from './VisitFormModal';

const { Text } = Typography;
const { Search } = Input;

export default function VisitsListPage() {
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters, selectedVisit } = useAppSelector((state) => state.visits);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchVisits(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSearch = (value: string) => {
    dispatch(setFilters({ search: value, page: 1 }));
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: 'Supprimer cette visite ?',
      content: 'Cette action est irréversible.',
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteVisit(id));
        message.success('Visite supprimée');
        loadData();
      },
    });
  };

  const handleCheckIn = async (id: string) => {
    await dispatch(checkInVisit({ id }));
    message.success('Check-in effectué');
    loadData();
  };

  const handleCheckOut = async (id: string) => {
    await dispatch(checkOutVisit({ id }));
    message.success('Check-out effectué');
    loadData();
  };

  const handleViewDetail = (id: string) => {
    dispatch(fetchVisitById(id));
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
    message.success(editingId ? 'Visite mise à jour' : 'Visite créée');
  };

  const stats = {
    total: pagination.totalElements,
    planned: items.filter((i) => i.status === 'planned').length,
    inProgress: items.filter((i) => i.status === 'in_progress').length,
    completed: items.filter((i) => i.status === 'completed').length,
  };

  const columns: ColumnsType<VisitListItem> = [
    {
      title: 'Type',
      dataIndex: 'visitType',
      key: 'visitType',
      width: 120,
      render: (type: string) => {
        const config = VISIT_TYPES.find((t) => t.value === type);
        return <Tag color={config?.color || 'default'}>{config?.label || type}</Tag>;
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
      title: 'Date',
      dataIndex: 'visitDate',
      key: 'visitDate',
      width: 160,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      sorter: true,
    },
    {
      title: 'Durée',
      dataIndex: 'duration',
      key: 'duration',
      width: 80,
      align: 'center' as const,
      render: (min: number) => min ? (
        <Tag color="processing">{min} min</Tag>
      ) : '-',
    },
    {
      title: 'Contact',
      dataIndex: 'contactName',
      key: 'contactName',
      width: 150,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Compte',
      dataIndex: 'accountName',
      key: 'accountName',
      width: 150,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Ville',
      dataIndex: 'city',
      key: 'city',
      width: 120,
      ellipsis: { showTitle: false },
      render: (city: string) => city ? (
        <Tooltip title={city} placement="topLeft">
          <span><EnvironmentOutlined style={{ marginRight: 4 }} />{city}</span>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string, record: VisitListItem) => {
        const config = VISIT_STATUSES.find((s) => s.value === status);
        return (
          <Space direction="vertical" size={0}>
            <Tag color={config?.color || 'default'}>{config?.label || status}</Tag>
            {record.checkInAt && (
              <span style={{ fontSize: 11, color: '#52c41a' }}>
                <LoginOutlined /> {dayjs(record.checkInAt).format('HH:mm')}
              </span>
            )}
            {record.checkOutAt && (
              <span style={{ fontSize: 11, color: '#ff4d4f' }}>
                <LogoutOutlined /> {dayjs(record.checkOutAt).format('HH:mm')}
              </span>
            )}
          </Space>
        );
      },
    },
    {
      title: 'Résultat',
      dataIndex: 'outcome',
      key: 'outcome',
      width: 120,
      render: (outcome: string) => {
        if (!outcome) return '-';
        const config = VISIT_OUTCOMES.find((o) => o.value === outcome);
        return <Tag color={config?.color || 'default'}>{config?.label || outcome}</Tag>;
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
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_: unknown, record: VisitListItem) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view', icon: <EyeOutlined />, label: 'Détail', onClick: () => handleViewDetail(record.id) },
              { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record.id) },
              ...(record.status === 'planned' ? [{ key: 'checkin', icon: <LoginOutlined />, label: 'Check-in', onClick: () => handleCheckIn(record.id) }] : []),
              ...(record.status === 'in_progress' ? [{ key: 'checkout', icon: <LogoutOutlined />, label: 'Check-out', onClick: () => handleCheckOut(record.id) }] : []),
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
          <Text strong style={{ fontSize: 20 }}>Visites terrain</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><strong>{stats.total}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#1890ff' }}><strong>{stats.planned}</strong> <Text type="secondary">planifiées</Text></span>
            <span style={{ color: '#faad14' }}><strong>{stats.inProgress}</strong> <Text type="secondary">en cours</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{stats.completed}</strong> <Text type="secondary">terminées</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Nouvelle visite
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
            <Col span={5}>
              <Select
                placeholder="Statut"
                allowClear
                style={{ width: '100%' }}
                size="small"
                onChange={(v) => dispatch(setFilters({ status: v || undefined, page: 1 }))}
                options={VISIT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="Type"
                allowClear
                style={{ width: '100%' }}
                size="small"
                onChange={(v) => dispatch(setFilters({ visitType: v || undefined, page: 1 }))}
                options={VISIT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </Col>
            <Col>
              <Button size="small" onClick={() => {
                dispatch(setFilters({ status: undefined, visitType: undefined, page: 1 }));
              }}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={loading}
          scroll={{ x: 1460, y: 'calc(100vh - 330px)' }}
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

      <VisitFormModal
        open={modalOpen}
        editingId={editingId}
        onClose={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <Drawer
        title="Détail de la visite"
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); dispatch(clearSelectedVisit()); }}
        width={500}
      >
        {selectedVisit && (
          <>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Sujet">{selectedVisit.subject}</Descriptions.Item>
              <Descriptions.Item label="Type">
                <Tag color={VISIT_TYPES.find((t) => t.value === selectedVisit.visitType)?.color}>
                  {VISIT_TYPES.find((t) => t.value === selectedVisit.visitType)?.label || selectedVisit.visitType}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Statut">
                <Tag color={VISIT_STATUSES.find((s) => s.value === selectedVisit.status)?.color}>
                  {VISIT_STATUSES.find((s) => s.value === selectedVisit.status)?.label || selectedVisit.status}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Date">{dayjs(selectedVisit.visitDate).format('DD/MM/YYYY HH:mm')}</Descriptions.Item>
              {selectedVisit.contact && <Descriptions.Item label="Contact">{selectedVisit.contact.fullName}</Descriptions.Item>}
              {selectedVisit.account && <Descriptions.Item label="Compte">{selectedVisit.account.name}</Descriptions.Item>}
              {selectedVisit.address && <Descriptions.Item label="Adresse">{selectedVisit.address}</Descriptions.Item>}
              {selectedVisit.city && <Descriptions.Item label="Ville">{selectedVisit.city}</Descriptions.Item>}
              {selectedVisit.duration && <Descriptions.Item label="Durée">{selectedVisit.duration} min</Descriptions.Item>}
              {selectedVisit.assignedTo && <Descriptions.Item label="Assigné à">{selectedVisit.assignedTo.fullName || selectedVisit.assignedTo.email}</Descriptions.Item>}
              {selectedVisit.outcome && (
                <Descriptions.Item label="Résultat">
                  <Tag color={VISIT_OUTCOMES.find((o) => o.value === selectedVisit.outcome)?.color}>
                    {VISIT_OUTCOMES.find((o) => o.value === selectedVisit.outcome)?.label || selectedVisit.outcome}
                  </Tag>
                </Descriptions.Item>
              )}
              {selectedVisit.notes && <Descriptions.Item label="Notes">{selectedVisit.notes}</Descriptions.Item>}
              {selectedVisit.nextAction && <Descriptions.Item label="Prochaine action">{selectedVisit.nextAction}</Descriptions.Item>}
            </Descriptions>

            {(selectedVisit.objective || selectedVisit.interestLevel || selectedVisit.satisfaction || selectedVisit.competitorDetected) && (
              <Descriptions title="Objectifs & Résultats" column={2} bordered size="small" style={{ marginTop: 16 }}>
                {selectedVisit.objective && <Descriptions.Item label="Objectif" span={2}>{selectedVisit.objective}</Descriptions.Item>}
                {selectedVisit.interestLevel && <Descriptions.Item label="Niveau d'intérêt" span={1}>{selectedVisit.interestLevel}</Descriptions.Item>}
                {selectedVisit.satisfaction != null && (
                  <Descriptions.Item label="Satisfaction" span={1}>
                    <Rate disabled value={selectedVisit.satisfaction} />
                  </Descriptions.Item>
                )}
                {selectedVisit.competitorDetected && <Descriptions.Item label="Concurrent détecté" span={2}>{selectedVisit.competitorDetected}</Descriptions.Item>}
              </Descriptions>
            )}

            {(selectedVisit.productsPresented || selectedVisit.estimatedAmount != null || selectedVisit.samplesDelivered) && (
              <Descriptions title="Produits & Commercial" column={2} bordered size="small" style={{ marginTop: 16 }}>
                {selectedVisit.productsPresented && <Descriptions.Item label="Produits présentés" span={2}>{selectedVisit.productsPresented}</Descriptions.Item>}
                {selectedVisit.estimatedAmount != null && (
                  <Descriptions.Item label="Montant estimé" span={1}>
                    {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(selectedVisit.estimatedAmount)}
                  </Descriptions.Item>
                )}
                {selectedVisit.samplesDelivered && <Descriptions.Item label="Échantillons remis" span={1}>{selectedVisit.samplesDelivered}</Descriptions.Item>}
              </Descriptions>
            )}

            {(selectedVisit.transportMode || selectedVisit.mileage != null || selectedVisit.expenses != null) && (
              <Descriptions title="Déplacement & Frais" column={2} bordered size="small" style={{ marginTop: 16 }}>
                {selectedVisit.transportMode && <Descriptions.Item label="Mode de transport" span={1}>{selectedVisit.transportMode}</Descriptions.Item>}
                {selectedVisit.mileage != null && <Descriptions.Item label="Kilométrage" span={1}>{selectedVisit.mileage} km</Descriptions.Item>}
                {selectedVisit.expenses != null && (
                  <Descriptions.Item label="Frais / Dépenses" span={2}>
                    {new Intl.NumberFormat('fr-MA', { style: 'decimal', minimumFractionDigits: 2 }).format(selectedVisit.expenses)}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            {(selectedVisit.followUpDate || selectedVisit.followUpPriority || selectedVisit.nextVisitPlanned != null) && (
              <Descriptions title="Suivi & Relance" column={2} bordered size="small" style={{ marginTop: 16 }}>
                {selectedVisit.followUpDate && (
                  <Descriptions.Item label="Date de relance" span={1}>
                    {dayjs(selectedVisit.followUpDate).format('DD/MM/YYYY')}
                  </Descriptions.Item>
                )}
                {selectedVisit.followUpPriority && <Descriptions.Item label="Priorité de suivi" span={1}>{selectedVisit.followUpPriority}</Descriptions.Item>}
                {selectedVisit.nextVisitPlanned != null && (
                  <Descriptions.Item label="Prochaine visite planifiée" span={2}>
                    {selectedVisit.nextVisitPlanned ? 'Oui' : 'Non'}
                  </Descriptions.Item>
                )}
              </Descriptions>
            )}

            <h4 style={{ marginTop: 24 }}>Timeline</h4>
            <Timeline
              items={[
                { color: 'blue', children: `Créée le ${dayjs(selectedVisit.createdAt).format('DD/MM/YYYY HH:mm')}` },
                ...(selectedVisit.checkInAt ? [{ color: 'green', children: `Check-in le ${dayjs(selectedVisit.checkInAt).format('DD/MM/YYYY HH:mm')}` }] : []),
                ...(selectedVisit.checkOutAt ? [{ color: 'red', children: `Check-out le ${dayjs(selectedVisit.checkOutAt).format('DD/MM/YYYY HH:mm')}` }] : []),
              ]}
            />
          </>
        )}
      </Drawer>
    </div>
  );
}
