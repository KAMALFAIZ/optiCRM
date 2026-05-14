import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Select, Tag, Space, Card, Row, Col,
  Dropdown, Modal, message, Typography, Progress,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined,
  EyeOutlined, EditOutlined, MoreOutlined, ProjectOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '@/api/projects';
import type { ProjectListItem, ProjectStatus } from '@/types/project';
import ProjectFormModal from './ProjectFormModal';

const { Text } = Typography;

const STATUS_MAP: Record<ProjectStatus, { label: string; color: string }> = {
  DRAFT:    { label: 'Brouillon', color: 'default' },
  ACTIF:    { label: 'Actif',     color: 'green' },
  EN_PAUSE: { label: 'En pause',  color: 'orange' },
  TERMINE:  { label: 'Terminé',   color: 'blue' },
  ANNULE:   { label: 'Annulé',    color: 'red' },
};

export default function ProjectsListPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await projectsApi.getAll({
        page: page - 1, size: 20,
        search: search || undefined,
        status: statusFilter,
      });
      setProjects(res.content);
      setTotal(res.totalElements);
    } catch {
      message.error('Erreur lors du chargement des projets');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: `Supprimer le projet "${name}" ?`,
      content: 'Toutes les tâches et milestones associés seront supprimés.',
      okText: 'Supprimer', okType: 'danger', cancelText: 'Annuler',
      onOk: async () => { await projectsApi.delete(id); message.success('Projet supprimé'); load(); },
    });
  };

  const columns: ColumnsType<ProjectListItem> = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      width: 110,
      render: (ref, r) => (
        <a onClick={() => navigate(`/projects/${r.id}`)} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {ref}
        </a>
      ),
    },
    {
      title: 'Projet',
      dataIndex: 'name',
      render: (name, r) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => navigate(`/projects/${r.id}`)} style={{ fontWeight: 500 }}>{name}</a>
          {r.accountName && <Text type="secondary" style={{ fontSize: 12 }}>{r.accountName}</Text>}
        </Space>
      ),
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 110,
      render: (v: ProjectStatus) => (
        <Tag color={STATUS_MAP[v]?.color}>{STATUS_MAP[v]?.label}</Tag>
      ),
    },
    {
      title: 'Avancement',
      dataIndex: 'progressPct',
      width: 160,
      render: pct => <Progress percent={pct} size="small" />,
    },
    {
      title: 'Dates',
      width: 180,
      render: (_, r) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {r.startDate ? new Date(r.startDate).toLocaleDateString('fr-FR') : '-'}
          {' → '}
          {r.endDate ? new Date(r.endDate).toLocaleDateString('fr-FR') : '-'}
        </Text>
      ),
    },
    {
      title: 'Chef de projet',
      dataIndex: 'managerName',
      width: 150,
      render: v => v || <Text type="secondary">-</Text>,
    },
    {
      title: 'Tâches',
      dataIndex: 'taskCount',
      width: 80,
      align: 'center',
      render: v => <Tag>{v}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view',   icon: <EyeOutlined />,    label: 'Voir',     onClick: () => navigate(`/projects/${r.id}`) },
              { key: 'edit',   icon: <EditOutlined />,   label: 'Modifier', onClick: () => { setEditingId(r.id); setModalOpen(true); } },
              { type: 'divider' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(r.id, r.name) },
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
    <div style={{ padding: 24 }}>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Typography.Title level={4} style={{ margin: 0 }}>
            <ProjectOutlined style={{ marginRight: 8, color: '#722ed1' }} />
            Projets
          </Typography.Title>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); setModalOpen(true); }}>
            Nouveau projet
          </Button>
        </Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input
            placeholder="Rechercher..."
            prefix={<SearchOutlined />}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            style={{ width: 240 }}
            allowClear
          />
          <Select
            placeholder="Statut"
            value={statusFilter}
            onChange={v => { setStatusFilter(v); setPage(1); }}
            allowClear style={{ width: 140 }}
            options={Object.entries(STATUS_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={projects}
        rowKey="id"
        loading={loading}
        pagination={{
          current: page, pageSize: 20, total,
          onChange: setPage, showSizeChanger: false,
          showTotal: t => `${t} projet(s)`,
        }}
        size="middle"
      />

      <ProjectFormModal
        open={modalOpen}
        projectId={editingId}
        onClose={refresh => { setModalOpen(false); setEditingId(null); if (refresh) load(); }}
      />
    </div>
  );
}
