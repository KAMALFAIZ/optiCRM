import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Table, Button, Input, Tag, Space, Card, Dropdown, Modal, message, Row, Col, Statistic, Select, Switch, Progress, Typography, Tooltip,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined,
  MailOutlined, CheckCircleOutlined, EyeOutlined, FilterOutlined, ReloadOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchEmailTemplates,
  deleteEmailTemplate,
  toggleEmailTemplateActive,
} from './emailTemplatesSlice';
import EmailTemplateFormModal from './EmailTemplateFormModal';
import {
  EmailTemplateListItem,
  EMAIL_CATEGORIES,
  EMAIL_CATEGORY_CONFIG,
} from '@/types/emailTemplate';

const { Text } = Typography;
const { Search } = Input;

const CATEGORY_OPTIONS = EMAIL_CATEGORIES.map((cat) => ({
  value: cat.value,
  label: cat.label,
}));

export default function EmailTemplatesListPage() {
  const dispatch = useAppDispatch();
  const { emailTemplates, loading, pagination } = useAppSelector((state) => state.emailTemplates);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateListItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(() => {
    dispatch(fetchEmailTemplates({
      page: pagination.page,
      size: pagination.size,
      search: search || undefined,
      category: categoryFilter,
    }));
  }, [dispatch, pagination.page, pagination.size, search, categoryFilter]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleEdit = (record: EmailTemplateListItem) => {
    setEditingTemplate(record);
    setModalOpen(true);
  };

  const handleToggleActive = async (record: EmailTemplateListItem) => {
    try {
      await dispatch(toggleEmailTemplateActive(record.id)).unwrap();
      message.success(record.isActive ? 'Modèle désactivé' : 'Modèle activé');
      loadData();
    } catch {
      message.error('Erreur lors du changement de statut');
    }
  };

  const handleDelete = (record: EmailTemplateListItem) => {
    Modal.confirm({
      title: 'Supprimer le modèle',
      content: `Êtes-vous sûr de vouloir supprimer "${record.name}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteEmailTemplate(record.id));
        message.success('Modèle supprimé');
        loadData();
      },
    });
  };

  const getActions = (record: EmailTemplateListItem): MenuProps['items'] => {
    return [
      { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record) },
      {
        key: 'toggle',
        icon: <CheckCircleOutlined />,
        label: record.isActive ? 'Désactiver' : 'Activer',
        onClick: () => handleToggleActive(record),
      },
      { type: 'divider' },
      { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record) },
    ];
  };

  const kpis = useMemo(() => {
    const actifs = emailTemplates.filter((t) => t.isActive).length;
    const templatesWithOpenRate = emailTemplates.filter((t) => t.openRate !== undefined && t.openRate !== null);
    const avgOpenRate = templatesWithOpenRate.length > 0
      ? templatesWithOpenRate.reduce((sum, t) => sum + (t.openRate || 0), 0) / templatesWithOpenRate.length
      : 0;
    return { actifs, avgOpenRate };
  }, [emailTemplates]);

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: { showTitle: false },
      render: (name: string) => (
        <Tooltip title={name} placement="topLeft">
          <span style={{ fontWeight: 500 }}>{name}</span>
        </Tooltip>
      ),
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
      title: 'Catégorie',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category: string) => {
        if (!category) return '-';
        const cfg = EMAIL_CATEGORY_CONFIG[category];
        return <Tag color={cfg?.color}>{cfg?.label || category}</Tag>;
      },
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 90,
      align: 'center' as const,
      render: (isActive: boolean, record: EmailTemplateListItem) => (
        <Switch
          checked={isActive}
          size="small"
          onChange={() => handleToggleActive(record)}
        />
      ),
    },
    {
      title: 'Utilisations',
      dataIndex: 'usageCount',
      key: 'usageCount',
      width: 110,
      align: 'right' as const,
      render: (count: number) => count || 0,
    },
    {
      title: 'Taux ouverture',
      dataIndex: 'openRate',
      key: 'openRate',
      width: 150,
      align: 'right' as const,
      render: (rate: number | undefined) => {
        if (rate === undefined || rate === null) return '-';
        return (
          <Space>
            <Progress percent={rate} size="small" style={{ width: 60 }} showInfo={false}
              strokeColor={rate >= 30 ? '#52c41a' : rate >= 15 ? '#faad14' : '#ff4d4f'} />
            <span style={{ fontWeight: 500 }}>{rate.toFixed(1)}%</span>
          </Space>
        );
      },
    },
    {
      title: 'Taux clic',
      dataIndex: 'clickRate',
      key: 'clickRate',
      width: 140,
      align: 'right' as const,
      render: (rate: number | undefined) => {
        if (rate === undefined || rate === null) return '-';
        return (
          <Space>
            <Progress percent={rate} size="small" style={{ width: 60 }} showInfo={false}
              strokeColor={rate >= 20 ? '#52c41a' : rate >= 10 ? '#faad14' : '#ff4d4f'} />
            <span style={{ fontWeight: 500 }}>{rate.toFixed(1)}%</span>
          </Space>
        );
      },
    },
    {
      title: 'Créé par',
      dataIndex: 'createdByName',
      key: 'createdByName',
      width: 130,
      ellipsis: { showTitle: true },
      render: (name: string) => name || '-',
    },
    {
      title: 'Mis à jour',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: EmailTemplateListItem) => (
        <Dropdown menu={{ items: getActions(record) }} trigger={['click']}>
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
          <Text strong style={{ fontSize: 20 }}>Modèles d'email</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><MailOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{kpis.actifs}</strong> <Text type="secondary">actifs</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTemplate(null); setModalOpen(true); }}>
            Nouveau modèle
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Total modèles" value={pagination.totalElements} prefix={<MailOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Actifs" value={kpis.actifs} prefix={<CheckCircleOutlined />} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Taux d'ouverture moyen" value={kpis.avgOpenRate} prefix={<EyeOutlined />} suffix="%" precision={1} valueStyle={{ fontSize: 18, fontWeight: 600, color: '#1677ff' }} />
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
                placeholder="Catégorie"
                allowClear
                style={{ width: '100%' }}
                size="small"
                options={CATEGORY_OPTIONS}
                onChange={(val) => setCategoryFilter(val as string)}
                value={categoryFilter}
              />
            </Col>
            <Col>
              <Button size="small" onClick={() => setCategoryFilter(undefined)}>Réinitialiser</Button>
            </Col>
          </Row>
        )}

        <Table
          dataSource={emailTemplates}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={{
            current: (pagination.page || 0) + 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total) => `${total} modèle(s)`,
            onChange: (page, pageSize) => {
              dispatch(fetchEmailTemplates({
                page: page - 1,
                size: pageSize,
                search: search || undefined,
                category: categoryFilter,
              }));
            },
          }}
          scroll={{ x: 1310, y: 'calc(100vh - 330px)' }}
        />
      </Card>

      <EmailTemplateFormModal
        open={modalOpen}
        templateId={editingTemplate?.id || null}
        onClose={() => { setModalOpen(false); setEditingTemplate(null); }}
        onSuccess={() => { setModalOpen(false); setEditingTemplate(null); loadData(); }}
      />
    </div>
  );
}
