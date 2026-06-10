import { useEffect, useState, useCallback } from 'react';
import {
  Card, Table, Button, Space, Input, Select, Tag, Dropdown, Modal, message,
  Row, Col, Drawer, Descriptions, Timeline, Rate, Typography, Tooltip, Avatar,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, DeleteOutlined, EditOutlined, MoreOutlined,
  LoginOutlined, LogoutOutlined, EnvironmentOutlined, EyeOutlined,
  FilterOutlined, ReloadOutlined, UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import { selectUser } from '@/features/auth/authSlice';
import { fetchVisitById, clearSelectedVisit, deleteVisit, checkInVisit, checkOutVisit } from './visitsSlice';
import visitsApi from '@/api/visits';
import { supervisorApi } from '@/api/supervisor';
import { CollaboratorSummary } from '@/types/dashboard';
import { VisitListItem, Visit, VISIT_TYPES, VISIT_STATUSES, VISIT_OUTCOMES } from '@/types/visit';
import VisitFormModal from './VisitFormModal';

const { Text } = Typography;
const { Search } = Input;

interface LocalFilters {
  search?: string;
  status?: string;
  visitType?: string;
  assignedToId?: string;
  page: number;
  size: number;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

export default function VisitsListPage() {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const selectedVisit: Visit | null = useAppSelector((s: any) => s.visits.selectedVisit);

  // Rôle
  const roleName: string = (currentUser?.role as any)?.name ?? currentUser?.role ?? '';
  const isSuperviseur = ['SUPERVISEUR', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(roleName);
  const isCommercial = !isSuperviseur;

  // ── État local — données ──────────────────────────────────────────
  const [visits, setVisits] = useState<VisitListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  // ── État local — filtres ──────────────────────────────────────────
  const [filters, setFilters] = useState<LocalFilters>({
    page: 1,
    size: 20,
    sortBy: 'visitDate',
    sortDirection: 'desc',
  });

  // ── État UI ───────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [collaborators, setCollaborators] = useState<CollaboratorSummary[]>([]);

  // Éviter le chargement avant que currentUser soit prêt
  const userReady = !!currentUser?.id;

  // ── Chargement collaborateurs (superviseur uniquement) ────────────
  useEffect(() => {
    if (isSuperviseur) {
      supervisorApi.getAssignableUsers().then(setCollaborators).catch(() => {});
    }
  }, [isSuperviseur]);

  // ── Chargement des visites ────────────────────────────────────────
  const loadVisits = useCallback(async () => {
    if (!userReady) return;

    const effectiveAssignedToId = isCommercial ? currentUser!.id : filters.assignedToId;

    setLoading(true);
    try {
      const result = await visitsApi.getAll({
        page: filters.page,
        size: filters.size,
        search: filters.search,
        status: filters.status,
        visitType: filters.visitType,
        assignedToId: effectiveAssignedToId,
        sortBy: filters.sortBy,
        sortDirection: filters.sortDirection,
      });
      setVisits(result.content);
      setTotal(result.totalElements);
    } catch (err) {
      message.error('Erreur lors du chargement des visites');
    } finally {
      setLoading(false);
    }
  }, [filters, isCommercial, currentUser?.id, userReady]);

  useEffect(() => {
    loadVisits();
  }, [loadVisits]);

  // ── Mise à jour partielle des filtres ─────────────────────────────
  const updateFilters = (patch: Partial<LocalFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
  };

  // ── Actions ───────────────────────────────────────────────────────
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
        loadVisits();
      },
    });
  };

  const handleCheckIn = async (id: string) => {
    await dispatch(checkInVisit({ id }));
    message.success('Check-in effectué');
    loadVisits();
  };

  const handleCheckOut = async (id: string) => {
    await dispatch(checkOutVisit({ id }));
    message.success('Check-out effectué');
    loadVisits();
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
    loadVisits();
    message.success(editingId ? 'Visite mise à jour' : 'Visite créée');
  };

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = {
    total,
    planned: visits.filter((i) => i.status === 'planned').length,
    inProgress: visits.filter((i) => i.status === 'in_progress').length,
    completed: visits.filter((i) => i.status === 'completed').length,
  };

  // ── Colonnes ──────────────────────────────────────────────────────
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
      render: (min: number) => min ? <Tag color="processing">{min} min</Tag> : '-',
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

  // ── Rendu ─────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
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
                onSearch={(v) => updateFilters({ search: v || undefined })}
                style={{ maxWidth: 260 }}
              />
            </Col>

            {/* Filtre "Assigné à" — toujours visible pour admin/superviseur */}
            {isSuperviseur && (
              <Col style={{ minWidth: 220 }}>
                <Select
                  placeholder={<Space size={4}><UserOutlined />Assigné à</Space>}
                  allowClear
                  value={filters.assignedToId ?? undefined}
                  style={{ width: '100%' }}
                  size="small"
                  onChange={(v) => updateFilters({ assignedToId: v || undefined })}
                  optionFilterProp="label"
                  showSearch
                  options={collaborators.map((c) => ({
                    value: c.userId,
                    label: c.fullName,
                    title: c.email,
                  }))}
                  optionRender={(opt) => (
                    <Space size={8}>
                      <Avatar size={20} icon={<UserOutlined />} style={{ backgroundColor: '#4F46E5' }} />
                      <span>{opt.label}</span>
                    </Space>
                  )}
                />
              </Col>
            )}

            <Col>
              <Space>
                <Button size="small" icon={<FilterOutlined />} onClick={() => setShowFilters(!showFilters)}>
                  Filtres
                </Button>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadVisits}>
                  Actualiser
                </Button>
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
                value={filters.status}
                onChange={(v) => updateFilters({ status: v || undefined })}
                options={VISIT_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </Col>
            <Col span={5}>
              <Select
                placeholder="Type"
                allowClear
                style={{ width: '100%' }}
                size="small"
                value={filters.visitType}
                onChange={(v) => updateFilters({ visitType: v || undefined })}
                options={VISIT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </Col>

            {/* Commercial : son propre nom en lecture seule */}
            {isCommercial && (
              <Col span={6}>
                <Space size={6} style={{ fontSize: 12, color: '#595959', paddingLeft: 4 }}>
                  <Avatar size={18} icon={<UserOutlined />} style={{ backgroundColor: '#4F46E5' }} />
                  <span>{currentUser?.firstName} {currentUser?.lastName}</span>
                </Space>
              </Col>
            )}

            <Col>
              <Button
                size="small"
                onClick={() => setFilters({
                  page: 1,
                  size: 20,
                  sortBy: 'visitDate',
                  sortDirection: 'desc',
                })}
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        )}

        <Table
          rowKey="id"
          columns={columns}
          dataSource={visits}
          loading={loading}
          scroll={{ x: 1460, y: 'calc(100vh - 330px)' }}
          pagination={{
            current: filters.page,
            pageSize: filters.size,
            total,
            showSizeChanger: true,
            showTotal: (t, range) => `${range[0]}-${range[1]} sur ${t}`,
            onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, size: pageSize })),
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
