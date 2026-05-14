import { useState } from 'react';
import {
  Card, Table, Button, Empty, Spin, DatePicker, Select,
  Input, Row, Col, Tag, Space, Typography, Tooltip, Alert,
} from 'antd';
import { SearchOutlined, HistoryOutlined, UserOutlined, FileTextOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import { useMessage } from '@/hooks/useMessage';
import dayjs, { Dayjs } from 'dayjs';
import { auditTrailApi, AuditTrail } from '@/api/delivery';

const { Text } = Typography;

const ENTITY_TYPES = [
  'DeliveryTour', 'DeliveryLine', 'VehicleLoad',
  'ReturnEntry', 'StockReplenishment', 'SettlementReport',
];

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'green', UPDATE: 'blue', DELETE: 'red', CLOSE: 'orange',
  APPROVE: 'purple', APPLY: 'cyan', RECEIVE: 'gold', VALIDATE: 'lime',
};

const getActionColor = (action: string) => ACTION_COLORS[action?.toUpperCase()] || 'default';

export default function AuditTrailListPage() {
  const { message } = useMessage();
  const [auditTrails, setAuditTrails] = useState<AuditTrail[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | undefined>(undefined);
  const [entityIdFilter, setEntityIdFilter] = useState('');
  const [searchMode, setSearchMode] = useState<'daterange' | 'entity'>('daterange');

  const handleSearchByDate = async () => {
    if (!dateRange) { message.warning('Selectionnez une plage de dates'); return; }
    setLoading(true);
    try {
      const data = await auditTrailApi.getByDateRange(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
      );
      setAuditTrails(data);
      if (data.length === 0) message.info('Aucun resultat pour cette periode');
    } catch {
      message.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchByEntity = async () => {
    if (!entityTypeFilter || !entityIdFilter.trim()) {
      message.warning("Selectionnez un type d'entite et saisissez son ID");
      return;
    }
    setLoading(true);
    try {
      const data = await auditTrailApi.getByEntity(entityTypeFilter, entityIdFilter.trim());
      setAuditTrails(data);
      if (data.length === 0) message.info('Aucun historique pour cette entite');
    } catch {
      message.error('Erreur lors de la recherche');
    } finally {
      setLoading(false);
    }
  };

  const columns: TableColumnsType<AuditTrail> = [
    {
      title: 'Date/Heure',
      dataIndex: 'whenDate',
      sorter: (a, b) => (a.whenDate || '').localeCompare(b.whenDate || ''),
      defaultSortOrder: 'descend',
      render: (date) => date ? (
        <Space direction="vertical" size={0}>
          <Text strong>{dayjs(date).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(date).format('HH:mm:ss')}</Text>
        </Space>
      ) : '---',
    },
    {
      title: 'Action',
      dataIndex: 'action',
      filters: Object.keys(ACTION_COLORS).map(k => ({ text: k, value: k })),
      onFilter: (v, r) => r.action?.toUpperCase() === v,
      render: (action) => <Tag color={getActionColor(action)}>{action || '---'}</Tag>,
    },
    {
      title: 'Type entite',
      dataIndex: 'entityType',
      filters: ENTITY_TYPES.map(t => ({ text: t, value: t })),
      onFilter: (v, r) => r.entityType === v,
      render: (type) => <Tag icon={<FileTextOutlined />}>{type || '---'}</Tag>,
    },
    {
      title: 'ID entite',
      dataIndex: 'entityId',
      render: (v) => v ? (
        <Tooltip title={v}>
          <Text code style={{ fontSize: 12 }}>{String(v).substring(0, 8)}...</Text>
        </Tooltip>
      ) : <Text type="secondary">---</Text>,
    },
    {
      title: 'Utilisateur',
      dataIndex: 'whoUserId',
      render: (v) => v ? (
        <Space>
          <UserOutlined />
          <Tooltip title={v}><Text code style={{ fontSize: 12 }}>{String(v).substring(0, 8)}...</Text></Tooltip>
        </Space>
      ) : <Text type="secondary">---</Text>,
    },
    {
      title: 'Modifications',
      dataIndex: 'whatChanged',
      ellipsis: true,
      render: (v) => v ? <Tooltip title={v}><Text>{v}</Text></Tooltip> : <Text type="secondary">---</Text>,
    },
    {
      title: 'Localisation',
      dataIndex: 'whereLocation',
      render: (v) => v || <Text type="secondary">---</Text>,
    },
    {
      title: 'Raison',
      dataIndex: 'whyReason',
      ellipsis: true,
      render: (v) => v ? <Tooltip title={v}><Text type="secondary">{v}</Text></Tooltip> : <Text type="secondary">---</Text>,
    },
  ];

  return (
    <div className="p-6">
      <Card title={<Space><HistoryOutlined />Historique d&apos;audit</Space>}>
        <Alert
          message="Deux modes de recherche disponibles"
          description="Recherchez l'historique par plage de dates, ou retrouvez toutes les actions sur une entite specifique."
          type="info"
          showIcon
          className="mb-4"
        />
        <Row gutter={16} className="mb-4">
          <Col span={24}>
            <Space className="mb-3">
              <Button type={searchMode === 'daterange' ? 'primary' : 'default'} onClick={() => setSearchMode('daterange')}>
                Par plage de dates
              </Button>
              <Button type={searchMode === 'entity' ? 'primary' : 'default'} onClick={() => setSearchMode('entity')}>
                Par entite
              </Button>
            </Space>
            {searchMode === 'daterange' ? (
              <Space wrap>
                <DatePicker.RangePicker
                  format="DD/MM/YYYY"
                  value={dateRange as any}
                  onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
                  presets={[
                    { label: "Aujourd'hui",       value: [dayjs(), dayjs()] },
                    { label: '7 derniers jours',  value: [dayjs().subtract(7, 'd'), dayjs()] },
                    { label: '30 derniers jours', value: [dayjs().subtract(30, 'd'), dayjs()] },
                    { label: 'Ce mois',           value: [dayjs().startOf('month'), dayjs()] },
                  ]}
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchByDate} loading={loading}>
                  Rechercher
                </Button>
              </Space>
            ) : (
              <Space wrap>
                <Select
                  placeholder="Type d'entite"
                  style={{ width: 220 }}
                  value={entityTypeFilter}
                  onChange={setEntityTypeFilter}
                  allowClear
                  options={ENTITY_TYPES.map(t => ({ value: t, label: t }))}
                />
                <Input
                  placeholder="UUID de l'entite"
                  style={{ width: 320 }}
                  value={entityIdFilter}
                  onChange={(e) => setEntityIdFilter(e.target.value)}
                  onPressEnter={handleSearchByEntity}
                />
                <Button type="primary" icon={<SearchOutlined />} onClick={handleSearchByEntity} loading={loading}>
                  Rechercher
                </Button>
              </Space>
            )}
          </Col>
        </Row>
        <Spin spinning={loading}>
          {auditTrails.length === 0 ? (
            <Empty
              image={<HistoryOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
              description="Aucun enregistrement - lancez une recherche"
            />
          ) : (
            <Table
              columns={columns}
              dataSource={auditTrails}
              rowKey="id"
              size="small"
              pagination={{ pageSize: 20, showTotal: (t) => `${t} entree(s)` }}
            />
          )}
        </Spin>
      </Card>
    </div>
  );
}
