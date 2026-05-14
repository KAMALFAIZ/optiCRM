import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Select, Tag, Space, Card, Row, Col,
  Tooltip, Dropdown, Modal, message, Typography, Badge,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined, SearchOutlined, DeleteOutlined,
  EyeOutlined, EditOutlined, MoreOutlined,
  CustomerServiceOutlined, AppstoreOutlined, UnorderedListOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import type { TicketListItem, TicketCategory, TicketPriority, TicketStatus } from '@/types/ticket';
import TicketFormModal from './TicketFormModal';
import TicketKanban from './TicketKanban';

const { Text } = Typography;

const CATEGORY_MAP: Record<TicketCategory, { label: string; color: string }> = {
  SAV:        { label: 'SAV',         color: 'red' },
  TECHNIQUE:  { label: 'Technique',   color: 'blue' },
  COMMERCIAL: { label: 'Commercial',  color: 'purple' },
  FACTURATION:{ label: 'Facturation', color: 'orange' },
  LIVRAISON:  { label: 'Livraison',   color: 'cyan' },
  AUTRE:      { label: 'Autre',       color: 'default' },
};

const PRIORITY_MAP: Record<TicketPriority, { label: string; color: string }> = {
  BASSE:    { label: 'Basse',    color: 'default' },
  NORMALE:  { label: 'Normale',  color: 'blue' },
  HAUTE:    { label: 'Haute',    color: 'orange' },
  CRITIQUE: { label: 'Critique', color: 'red' },
};

const STATUS_MAP: Record<TicketStatus, { label: string; color: string }> = {
  OUVERT:     { label: 'Ouvert',      color: 'blue' },
  EN_COURS:   { label: 'En cours',    color: 'processing' },
  EN_ATTENTE: { label: 'En attente',  color: 'warning' },
  RESOLU:     { label: 'Résolu',      color: 'success' },
  FERME:      { label: 'Fermé',       color: 'default' },
};

export default function TicketsListPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>();
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [view, setView] = useState<'list' | 'kanban'>('list');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ticketsApi.getAll({
        page: page - 1, size: 20,
        search: search || undefined,
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
      });
      setTickets(res.content);
      setTotal(res.totalElements);
    } catch {
      message.error('Erreur lors du chargement des tickets');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, categoryFilter, priorityFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (id: string, title: string) => {
    Modal.confirm({
      title: `Supprimer le ticket "${title}" ?`,
      content: 'Cette action est irréversible.',
      okText: 'Supprimer', okType: 'danger', cancelText: 'Annuler',
      onOk: async () => { await ticketsApi.delete(id); message.success('Ticket supprimé'); load(); },
    });
  };

  const columns: ColumnsType<TicketListItem> = [
    {
      title: 'Référence',
      dataIndex: 'reference',
      width: 110,
      render: (ref, r) => (
        <a onClick={() => navigate(`/tickets/${r.id}`)} style={{ fontFamily: 'monospace', fontWeight: 600 }}>
          {ref}
        </a>
      ),
    },
    {
      title: 'Titre',
      dataIndex: 'title',
      render: (title, r) => (
        <Space direction="vertical" size={0}>
          <a onClick={() => navigate(`/tickets/${r.id}`)} style={{ fontWeight: 500 }}>{title}</a>
          {r.accountName && <Text type="secondary" style={{ fontSize: 12 }}>{r.accountName}</Text>}
        </Space>
      ),
    },
    {
      title: 'Catégorie',
      dataIndex: 'category',
      width: 120,
      render: (v: TicketCategory) => v ? (
        <Tag color={CATEGORY_MAP[v]?.color}>{CATEGORY_MAP[v]?.label}</Tag>
      ) : '-',
    },
    {
      title: 'Priorité',
      dataIndex: 'priority',
      width: 100,
      render: (v: TicketPriority) => v ? (
        <Tag color={PRIORITY_MAP[v]?.color}>{PRIORITY_MAP[v]?.label}</Tag>
      ) : '-',
    },
    {
      title: 'Statut',
      dataIndex: 'status',
      width: 120,
      render: (v: TicketStatus, r) => (
        <Space>
          <Badge status={STATUS_MAP[v]?.color as any} text={STATUS_MAP[v]?.label} />
          {r.slaBreached && <Tooltip title="SLA dépassé"><Tag color="red" style={{ fontSize: 10 }}>SLA!</Tag></Tooltip>}
        </Space>
      ),
    },
    {
      title: 'Assigné à',
      dataIndex: 'assignedToName',
      width: 140,
      render: v => v || <Text type="secondary">Non assigné</Text>,
    },
    {
      title: 'Créé le',
      dataIndex: 'createdAt',
      width: 110,
      render: v => new Date(v).toLocaleDateString('fr-FR'),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_, r) => (
        <Dropdown
          menu={{
            items: [
              { key: 'view',   icon: <EyeOutlined />,    label: 'Voir',     onClick: () => navigate(`/tickets/${r.id}`) },
              { key: 'edit',   icon: <EditOutlined />,   label: 'Modifier', onClick: () => { setEditingId(r.id); setModalOpen(true); } },
              { type: 'divider' },
              { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(r.id, r.title) },
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
            <CustomerServiceOutlined style={{ marginRight: 8, color: '#1677ff' }} />
            Tickets Support
          </Typography.Title>
        </Col>
        <Col>
          <Space>
            <Button.Group>
              <Button
                icon={<UnorderedListOutlined />}
                type={view === 'list' ? 'primary' : 'default'}
                onClick={() => setView('list')}
              />
              <Button
                icon={<AppstoreOutlined />}
                type={view === 'kanban' ? 'primary' : 'default'}
                onClick={() => setView('kanban')}
              />
            </Button.Group>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingId(null); setModalOpen(true); }}>
              Nouveau ticket
            </Button>
          </Space>
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
          <Select
            placeholder="Catégorie"
            value={categoryFilter}
            onChange={v => { setCategoryFilter(v); setPage(1); }}
            allowClear style={{ width: 140 }}
            options={Object.entries(CATEGORY_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
          <Select
            placeholder="Priorité"
            value={priorityFilter}
            onChange={v => { setPriorityFilter(v); setPage(1); }}
            allowClear style={{ width: 130 }}
            options={Object.entries(PRIORITY_MAP).map(([k, v]) => ({ value: k, label: v.label }))}
          />
        </Space>
      </Card>

      {view === 'kanban' ? (
        <TicketKanban onTicketClick={id => navigate(`/tickets/${id}`)} onRefresh={load} />
      ) : (
        <Table
          columns={columns}
          dataSource={tickets}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize: 20,
            total,
            onChange: setPage,
            showSizeChanger: false,
            showTotal: t => `${t} ticket(s)`,
          }}
          size="middle"
        />
      )}

      <TicketFormModal
        open={modalOpen}
        ticketId={editingId}
        onClose={refresh => { setModalOpen(false); setEditingId(null); if (refresh) load(); }}
      />
    </div>
  );
}
