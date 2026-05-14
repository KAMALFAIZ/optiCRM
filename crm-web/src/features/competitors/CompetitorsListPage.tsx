import { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Input, Tag, Space, Card, Dropdown, Modal, message, Row, Col, Statistic, Tooltip, Descriptions, Typography,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, MoreOutlined,
  TrophyOutlined, CheckCircleOutlined, StopOutlined, GlobalOutlined, ReloadOutlined,
} from '@ant-design/icons';

import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '@/store';
import { fetchCompetitors, deleteCompetitor } from './competitorsSlice';
import CompetitorFormModal from './CompetitorFormModal';
import { Competitor } from '@/types/competitor';

const { Text } = Typography;
const { Search } = Input;

export default function CompetitorsListPage() {
  const dispatch = useAppDispatch();
  const { items, loading, pagination } = useAppSelector((state) => state.competitors);

  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCompetitor, setEditingCompetitor] = useState<Competitor | null>(null);

  const loadData = useCallback(() => {
    dispatch(fetchCompetitors({
      page: pagination.page,
      size: pagination.size,
      search: search || undefined,
    }));
  }, [dispatch, pagination.page, pagination.size, search]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (value: string) => {
    setSearch(value);
  };

  const handleEdit = (record: Competitor) => {
    setEditingCompetitor(record);
    setModalOpen(true);
  };

  const handleDelete = (record: Competitor) => {
    Modal.confirm({
      title: 'Supprimer le concurrent',
      content: `Êtes-vous sûr de vouloir supprimer "${record.name}" ?`,
      okText: 'Supprimer',
      okType: 'danger',
      cancelText: 'Annuler',
      onOk: async () => {
        await dispatch(deleteCompetitor(record.id));
        message.success('Concurrent supprimé');
        loadData();
      },
    });
  };

  const getActions = (record: Competitor): MenuProps['items'] => [
    { key: 'edit', icon: <EditOutlined />, label: 'Modifier', onClick: () => handleEdit(record) },
    { type: 'divider' },
    { key: 'delete', icon: <DeleteOutlined />, label: 'Supprimer', danger: true, onClick: () => handleDelete(record) },
  ];

  const activeCount = items.filter((c) => c.isActive).length;
  const inactiveCount = items.filter((c) => !c.isActive).length;

  const columns = [
    {
      title: 'Nom',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      ellipsis: { showTitle: false },
      render: (name: string, record: Competitor) => (
        <Tooltip title={name} placement="topLeft">
          <Space>
            <TrophyOutlined style={{ color: '#fa8c16' }} />
            <span style={{ fontWeight: 500 }}>{name}</span>
            {!record.isActive && <Tag color="red">Inactif</Tag>}
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Site web',
      dataIndex: 'website',
      key: 'website',
      width: 160,
      ellipsis: { showTitle: false },
      render: (url: string) => url ? (
        <Tooltip title={url} placement="topLeft">
          <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <GlobalOutlined /> {url}
          </a>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: { showTitle: false },
      width: 200,
      render: (text: string) => text ? (
        <Tooltip title={text} placement="topLeft">
          <span>{text}</span>
        </Tooltip>
      ) : '-',
    },
    {
      title: 'Forces',
      dataIndex: 'strengths',
      key: 'strengths',
      ellipsis: { showTitle: true },
      width: 200,
      render: (text: string) => text || '-',
    },
    {
      title: 'Faiblesses',
      dataIndex: 'weaknesses',
      key: 'weaknesses',
      ellipsis: { showTitle: true },
      width: 200,
      render: (text: string) => text || '-',
    },
    {
      title: 'Statut',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? 'green' : 'red'} icon={active ? <CheckCircleOutlined /> : <StopOutlined />}>
          {active ? 'Actif' : 'Inactif'}
        </Tag>
      ),
    },
    {
      title: 'Créé le',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: Competitor) => (
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
          <Text strong style={{ fontSize: 20 }}>Concurrents</Text>
          <Space size={16} style={{ fontSize: 13 }}>
            <span><TrophyOutlined style={{ marginRight: 4 }} /><strong>{pagination.totalElements}</strong> <Text type="secondary">total</Text></span>
            <span style={{ color: '#52c41a' }}><strong>{activeCount}</strong> <Text type="secondary">actifs</Text></span>
          </Space>
        </Space>
        <Space>
          <Button size="small" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingCompetitor(null); setModalOpen(true); }}>
            Ajouter
          </Button>
        </Space>
      </div>

      {/* ── Stat cards ── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 12 }}>
        <Col xs={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Total" value={pagination.totalElements} prefix={<TrophyOutlined />} valueStyle={{ fontSize: 20, fontWeight: 600 }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Actifs" value={activeCount} valueStyle={{ fontSize: 20, fontWeight: 600, color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={8}>
          <Card size="small" styles={{ body: { padding: '8px 12px' } }}>
            <Statistic title="Inactifs" value={inactiveCount} valueStyle={{ fontSize: 20, fontWeight: 600, color: '#ff4d4f' }} />
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
              <Button size="small" icon={<ReloadOutlined />} onClick={loadData}>Actualiser</Button>
            </Col>
          </Row>
        }
      >
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          loading={loading}
          scroll={{ x: 1210, y: 'calc(100vh - 330px)' }}
          expandable={{
            expandedRowRender: (record: Competitor) => (
              <Descriptions size="small" column={2} bordered>
                {record.description && <Descriptions.Item label="Description" span={2}>{record.description}</Descriptions.Item>}
                {record.strengths && <Descriptions.Item label="Forces">{record.strengths}</Descriptions.Item>}
                {record.weaknesses && <Descriptions.Item label="Faiblesses">{record.weaknesses}</Descriptions.Item>}
                {record.website && <Descriptions.Item label="Site web" span={2}><a href={record.website.startsWith('http') ? record.website : `https://${record.website}`} target="_blank" rel="noopener noreferrer">{record.website}</a></Descriptions.Item>}
              </Descriptions>
            ),
            rowExpandable: (record: Competitor) => !!(record.description || record.strengths || record.weaknesses),
          }}
          pagination={{
            current: pagination.page || 1,
            pageSize: pagination.size,
            total: pagination.totalElements,
            showSizeChanger: true,
            showTotal: (total) => `${total} concurrent(s)`,
            onChange: (page, pageSize) => {
              dispatch(fetchCompetitors({ page, size: pageSize, search: search || undefined }));
            },
          }}
        />
      </Card>

      <CompetitorFormModal
        open={modalOpen}
        competitor={editingCompetitor}
        onClose={() => { setModalOpen(false); setEditingCompetitor(null); }}
        onSuccess={() => { setModalOpen(false); setEditingCompetitor(null); loadData(); }}
      />
    </div>
  );
}
