import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Tag, Space, Input, Select, Card, Row, Col, Statistic,
  Switch, Modal, Tooltip, Dropdown, Typography, Tabs,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, ThunderboltOutlined, PlayCircleOutlined,
  DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined,
  CheckCircleOutlined, ExclamationCircleOutlined, AppstoreOutlined,
  ExperimentOutlined, OrderedListOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchWorkflows, fetchWorkflowStats, toggleWorkflowActive, deleteWorkflow,
  setFilters, createWorkflow,
} from './workflowsSlice';
import { WorkflowListItem, ENTITY_TYPES, TRIGGER_TYPES } from '@/types/workflow';
import { useMessage } from '@/hooks/useMessage';
import WorkflowFormModal from './WorkflowFormModal';
import WorkflowTemplatesGallery from './WorkflowTemplatesGallery';
import WorkflowRulesDrawer from './WorkflowRulesDrawer';

// ── Workflow de démonstration ─────────────────────────────────────────────────
const DEMO_WORKFLOW = {
  name: 'Qualification & Nurturing de Lead',
  description: 'Évalue le score du lead, envoie un email prioritaire ou crée une tâche de relance, puis notifie le manager après 3 jours.',
  entityType: 'LEAD',
  triggerType: 'STATUS_CHANGED',
  triggerConfig: JSON.stringify({ field: 'status', newValue: 'NEW' }),
  steps: [
    { name: 'Vérifier le score du lead',      stepType: 'CONDITION',         stepOrder: 0, isEntryPoint: true,  positionX: 240, positionY: 30,  actionConfig: JSON.stringify({ field: 'score', operator: '>=', value: 60 }) },
    { name: 'Email haute priorité',            stepType: 'SEND_EMAIL',        stepOrder: 1, isEntryPoint: false, positionX: 30,  positionY: 200, actionConfig: JSON.stringify({ templateId: 'lead-hot', subject: 'Votre demande est prioritaire !' }) },
    { name: 'Tâche de relance commerciale',    stepType: 'CREATE_TASK',       stepOrder: 2, isEntryPoint: false, positionX: 450, positionY: 200, actionConfig: JSON.stringify({ title: 'Relance lead froid', assignTo: 'commercial', dueInDays: 2 }) },
    { name: 'Attendre 3 jours',               stepType: 'DELAY',             stepOrder: 3, isEntryPoint: false, positionX: 240, positionY: 370, actionConfig: JSON.stringify({ unit: 'days', value: 3 }) },
    { name: 'Notifier le responsable',         stepType: 'SEND_NOTIFICATION', stepOrder: 4, isEntryPoint: false, positionX: 240, positionY: 540, actionConfig: JSON.stringify({ channel: 'email', to: 'manager', message: 'Lead qualifié en attente de traitement' }) },
  ],
  transitions: [
    { fromStepIndex: 0, toStepIndex: 1, label: 'Score ≥ 60' },
    { fromStepIndex: 0, toStepIndex: 2, label: 'Score < 60' },
    { fromStepIndex: 1, toStepIndex: 3, label: 'Suivant' },
    { fromStepIndex: 2, toStepIndex: 3, label: 'Suivant' },
    { fromStepIndex: 3, toStepIndex: 4, label: 'Après délai' },
  ],
};

dayjs.extend(relativeTime);
dayjs.locale('fr');

const { Title } = Typography;


const entityTypeLabels: Record<string, string> = Object.fromEntries(ENTITY_TYPES.map(e => [e.value, e.label]));
const triggerTypeLabels: Record<string, string> = Object.fromEntries(TRIGGER_TYPES.map(t => [t.value, t.label]));

export default function WorkflowsListPage() {
  const dispatch = useAppDispatch();
  const { items, loading, pagination, filters, stats } = useAppSelector(s => s.workflows);
  const { message } = useMessage();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState(filters.search || '');
  const [activeTab, setActiveTab] = useState<'workflows' | 'templates'>('workflows');
  const [creatingDemo, setCreatingDemo] = useState(false);
  const [rulesDrawerId, setRulesDrawerId] = useState<string | null>(null);

  const loadWorkflows = useCallback(() => {
    dispatch(fetchWorkflows({
      page: pagination.page,
      size: pagination.size,
      search: filters.search,
      entityType: filters.entityType,
      isActive: filters.isActive,
    }));
  }, [dispatch, pagination.page, pagination.size, filters]);

  useEffect(() => {
    loadWorkflows();
    dispatch(fetchWorkflowStats());
  }, [loadWorkflows, dispatch]);

  const handleCreateDemo = async () => {
    setCreatingDemo(true);
    try {
      await dispatch(createWorkflow(DEMO_WORKFLOW)).unwrap();
      message.success('Workflow de démonstration créé !');
      loadWorkflows();
      dispatch(fetchWorkflowStats());
    } catch {
      message.error('Erreur lors de la création du workflow exemple');
    } finally {
      setCreatingDemo(false);
    }
  };

  const handleSearch = (value: string) => {
    dispatch(setFilters({ ...filters, search: value || undefined }));
  };

  const handleToggle = async (id: string) => {
    await dispatch(toggleWorkflowActive(id));
    message.success('Statut mis à jour');
  };

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: 'Supprimer le workflow',
      content: `Êtes-vous sûr de vouloir supprimer "${name}" ? Cette action est irréversible.`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteWorkflow(id));
        message.success('Workflow supprimé');
        loadWorkflows();
      },
    });
  };

  const columns: ColumnsType<WorkflowListItem> = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record) => (
        <Space>
          <ThunderboltOutlined style={{ color: record.isActive ? '#52c41a' : '#d9d9d9' }} />
          <span
            className="font-medium"
            style={{ color: '#1890ff', cursor: 'pointer' }}
            onClick={() => setRulesDrawerId(record.id)}
          >
            {name}
          </span>
          <Tag>v{record.version}</Tag>
        </Space>
      ),
    },
    {
      title: 'Entité',
      dataIndex: 'entityType',
      key: 'entityType',
      render: (type: string) => <Tag color="blue">{entityTypeLabels[type] || type}</Tag>,
      width: 120,
    },
    {
      title: 'Déclencheur',
      dataIndex: 'triggerType',
      key: 'triggerType',
      render: (type: string) => <Tag color="purple">{triggerTypeLabels[type] || type}</Tag>,
      width: 180,
    },
    {
      title: 'Étapes',
      dataIndex: 'stepCount',
      key: 'stepCount',
      width: 80,
      align: 'center',
    },
    {
      title: 'Exécutions',
      key: 'executions',
      width: 120,
      render: (_: any, record: WorkflowListItem) => (
        <Space>
          <span>{record.totalExecutions}</span>
          {record.activeExecutions > 0 && (
            <Tag color="processing">{record.activeExecutions} en cours</Tag>
          )}
        </Space>
      ),
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive: boolean, record) => (
        <Switch
          checked={isActive}
          onChange={() => handleToggle(record.id)}
          size="small"
        />
      ),
    },
    {
      title: 'Créé',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => (
        <Tooltip title={dayjs(date).format('DD/MM/YYYY HH:mm')}>
          {dayjs(date).fromNow()}
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, record: WorkflowListItem) => (
        <Dropdown
          menu={{
            items: [
              { key: 'rules', icon: <OrderedListOutlined />, label: 'Voir les règles', onClick: () => setRulesDrawerId(record.id) },
              { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => { setEditingId(record.id); setModalOpen(true); } },
              { key: 'view', icon: <EyeOutlined />, label: 'Voir les exécutions' },
              { type: 'divider' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record.id, record.name) },
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
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <Title level={3} style={{ margin: 0 }}>
          <ThunderboltOutlined style={{ marginRight: 8, color: '#1890ff' }} />
          Workflows
        </Title>
        {activeTab === 'workflows' && (
          <Space>
            <Tooltip title="Insère un workflow « Qualification de Lead » avec 5 étapes et des transitions pour tester le builder visuel">
              <Button
                icon={<ExperimentOutlined />}
                loading={creatingDemo}
                onClick={handleCreateDemo}
                style={{ borderColor: '#722ed1', color: '#722ed1' }}
              >
                Créer un exemple
              </Button>
            </Tooltip>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => { setEditingId(null); setModalOpen(true); }}
            >
              Nouveau workflow
            </Button>
          </Space>
        )}
      </div>

      {/* Stats cards (visibles uniquement sur l'onglet Workflows) */}
      {activeTab === 'workflows' && stats && (
        <Row gutter={16} className="mb-6">
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Total" value={stats.totalWorkflows} prefix={<ThunderboltOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Actifs" value={stats.activeWorkflows} valueStyle={{ color: '#52c41a' }} prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="En cours" value={stats.runningExecutions} valueStyle={{ color: '#1890ff' }} prefix={<PlayCircleOutlined />} />
            </Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small">
              <Statistic title="Échouées" value={stats.failedExecutions} valueStyle={{ color: '#ff4d4f' }} prefix={<ExclamationCircleOutlined />} />
            </Card>
          </Col>
        </Row>
      )}

      {/* Onglets */}
      <Tabs
        activeKey={activeTab}
        onChange={key => setActiveTab(key as 'workflows' | 'templates')}
        items={[
          {
            key: 'workflows',
            label: (
              <span>
                <ThunderboltOutlined />
                Mes workflows
              </span>
            ),
            children: (
              <>
                {/* Filters */}
                <div className="flex gap-3 mb-4 flex-wrap">
                  <Input.Search
                    placeholder="Rechercher..."
                    allowClear
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    onSearch={handleSearch}
                    style={{ width: 280 }}
                    prefix={<SearchOutlined />}
                  />
                  <Select
                    placeholder="Type d'entité"
                    allowClear
                    style={{ width: 160 }}
                    value={filters.entityType}
                    onChange={v => dispatch(setFilters({ ...filters, entityType: v }))}
                    options={ENTITY_TYPES}
                  />
                  <Select
                    placeholder="Statut"
                    allowClear
                    style={{ width: 120 }}
                    value={filters.isActive === undefined ? undefined : (filters.isActive ? 'active' : 'inactive')}
                    onChange={v => dispatch(setFilters({ ...filters, isActive: v === 'active' ? true : v === 'inactive' ? false : undefined }))}
                    options={[
                      { value: 'active', label: 'Actif' },
                      { value: 'inactive', label: 'Inactif' },
                    ]}
                  />
                </div>

                {/* Table */}
                <Table<WorkflowListItem>
                  columns={columns}
                  dataSource={items}
                  rowKey="id"
                  loading={loading}
                  locale={{
                    emptyText: (
                      <div style={{ padding: '40px 0', textAlign: 'center' }}>
                        <ThunderboltOutlined style={{ fontSize: 40, color: '#d9d9d9', display: 'block', marginBottom: 12 }} />
                        <div style={{ color: '#8c8c8c', marginBottom: 16 }}>Aucun workflow configuré</div>
                        <Space>
                          <Button
                            icon={<ExperimentOutlined />}
                            loading={creatingDemo}
                            onClick={handleCreateDemo}
                            style={{ borderColor: '#722ed1', color: '#722ed1' }}
                          >
                            Créer un exemple
                          </Button>
                          <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => { setEditingId(null); setModalOpen(true); }}
                          >
                            Nouveau workflow
                          </Button>
                        </Space>
                      </div>
                    ),
                  }}
                  pagination={{
                    current: pagination.page,
                    pageSize: pagination.size,
                    total: pagination.totalElements,
                    showSizeChanger: true,
                    showTotal: (total) => `${total} workflow(s)`,
                    onChange: (page, pageSize) => {
                      dispatch(fetchWorkflows({
                        page,
                        size: pageSize,
                        ...filters,
                      }));
                    },
                  }}
                />
              </>
            ),
          },
          {
            key: 'templates',
            label: (
              <span>
                <AppstoreOutlined />
                Templates prédéfinis
              </span>
            ),
            children: <WorkflowTemplatesGallery />,
          },
        ]}
      />

      {/* Create/Edit Modal */}
      <WorkflowFormModal
        open={modalOpen}
        editingId={editingId}
        onClose={() => { setModalOpen(false); setEditingId(null); }}
        onSuccess={() => {
          setModalOpen(false);
          setEditingId(null);
          loadWorkflows();
          dispatch(fetchWorkflowStats());
          // Basculer automatiquement vers l'onglet workflows après création depuis un template
          setActiveTab('workflows');
        }}
      />

      {/* Règles de gestion drawer */}
      <WorkflowRulesDrawer
        workflowId={rulesDrawerId}
        open={rulesDrawerId !== null}
        onClose={() => setRulesDrawerId(null)}
      />
    </div>
  );
}
