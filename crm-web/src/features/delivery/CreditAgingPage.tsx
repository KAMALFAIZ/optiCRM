import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Row, Col, Statistic, Tag, Typography, Space, Spin,
  Empty, Select, Button, Progress, Alert,
} from 'antd';
import {
  WarningOutlined, DollarOutlined, CalendarOutlined,
  SearchOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import { creditAgingApi, CreditAging, CreditLine } from '@/api/deliveryReporting';
import { accountsApi } from '@/api/accounts';
import { useMessage } from '@/hooks/useMessage';
import type { AccountListItem } from '@/types/account';

const { Text, Title } = Typography;

const BUCKET_CONFIG: Record<string, { color: string; label: string; risk: string }> = {
  '0-30':  { color: 'green',  label: '0 – 30 jours',  risk: 'Faible' },
  '31-60': { color: 'orange', label: '31 – 60 jours', risk: 'Modéré' },
  '61-90': { color: 'red',    label: '61 – 90 jours', risk: 'Élevé' },
  '+90':   { color: 'purple', label: '+90 jours',      risk: 'Critique' },
};

export default function CreditAgingPage() {
  const { message } = useMessage();
  const [aging, setAging] = useState<CreditAging | null>(null);
  const [loading, setLoading] = useState(true);
  const [customerFilter, setCustomerFilter] = useState<string | undefined>(undefined);
  const [bucketFilter, setBucketFilter] = useState<string | undefined>(undefined);
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);

  useEffect(() => {
    accountsApi.getAll({ size: 200 }).then(r => setAccounts(r.content)).catch(() => {});
  }, []);

  const loadAging = useCallback(async (customerId?: string) => {
    setLoading(true);
    try {
      const data = await creditAgingApi.getAging(customerId);
      setAging(data);
    } catch {
      message.error('Erreur chargement créances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAging(); }, [loadAging]);

  const accountName = (id?: string) => {
    if (!id) return '—';
    const a = accounts.find(a => a.id === id);
    return a ? a.name : id.substring(0, 8) + '…';
  };

  const filteredLines = (aging?.lines || []).filter(l =>
    (!bucketFilter || l.agingBucket === bucketFilter)
  );

  const totalFiltered = filteredLines.reduce((s, l) => s + (l.outstanding || 0), 0);

  const cols: TableColumnsType<CreditLine> = [
    {
      title: 'Client', dataIndex: 'customerId',
      render: id => <Text strong>{accountName(id)}</Text>,
      sorter: (a, b) => accountName(a.customerId).localeCompare(accountName(b.customerId)),
    },
    {
      title: 'Date tournée', dataIndex: 'tourDate',
      sorter: (a, b) => (a.tourDate || '').localeCompare(b.tourDate || ''),
      render: d => <Space><CalendarOutlined style={{ color: '#1677ff' }} />{dayjs(d).format('DD/MM/YYYY')}</Space>,
    },
    {
      title: 'Ancienneté', dataIndex: 'agingDays', align: 'center',
      sorter: (a, b) => (a.agingDays || 0) - (b.agingDays || 0),
      render: (days, r) => {
        const cfg = BUCKET_CONFIG[r.agingBucket] || BUCKET_CONFIG['0-30'];
        return (
          <Space size={4}>
            <Tag color={cfg.color}>{r.agingBucket}</Tag>
            <Text type="secondary" style={{ fontSize: 11 }}>{days}j</Text>
          </Space>
        );
      },
    },
    {
      title: 'Risque', dataIndex: 'agingBucket',
      render: bucket => {
        const cfg = BUCKET_CONFIG[bucket] || BUCKET_CONFIG['0-30'];
        return <Tag color={cfg.color}>{cfg.risk}</Tag>;
      },
    },
    {
      title: 'Montant facturé', dataIndex: 'invoicedAmount', align: 'right',
      render: v => `${Number(v || 0).toFixed(2)} DH`,
    },
    {
      title: 'Payé', dataIndex: 'paidAmount', align: 'right',
      render: v => <Text style={{ color: '#52c41a' }}>{Number(v || 0).toFixed(2)} DH</Text>,
    },
    {
      title: 'Solde dû', dataIndex: 'outstanding', align: 'right',
      sorter: (a, b) => (a.outstanding || 0) - (b.outstanding || 0),
      render: v => <Text strong style={{ color: '#ff4d4f' }}>{Number(v || 0).toFixed(2)} DH</Text>,
    },
    {
      title: 'Statut tournée', dataIndex: 'tourStatus',
      render: s => {
        const colors: Record<string, string> = { DRAFT: 'blue', ACTIVE: 'green', CLOSED: 'default' };
        const labels: Record<string, string> = { DRAFT: 'Brouillon', ACTIVE: 'Active', CLOSED: 'Clôturée' };
        return <Tag color={colors[s] || 'default'}>{labels[s] || s}</Tag>;
      },
    },
  ];

  const totalOut = Number(aging?.totalOutstanding || 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={4} style={{ margin: 0 }}>
          <WarningOutlined className="mr-2" style={{ color: '#ff4d4f' }} />
          Créances en souffrance (Aging Receivables)
        </Title>
      </div>

      {/* Filtres */}
      <Card size="small" className="mb-4">
        <Row gutter={12} align="middle">
          <Col>
            <Select
              placeholder="Filtrer par client"
              style={{ width: 240 }}
              allowClear showSearch optionFilterProp="label"
              value={customerFilter}
              onChange={v => { setCustomerFilter(v); loadAging(v); }}
              options={accounts.map(a => ({ value: a.id, label: a.name }))}
            />
          </Col>
          <Col>
            <Select
              placeholder="Filtrer par ancienneté"
              style={{ width: 180 }}
              allowClear
              value={bucketFilter}
              onChange={setBucketFilter}
              options={Object.entries(BUCKET_CONFIG).map(([v, c]) => ({
                value: v, label: `${c.label} — ${c.risk}`,
              }))}
            />
          </Col>
          <Col>
            <Button icon={<SearchOutlined />} onClick={() => loadAging(customerFilter)}>
              Actualiser
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Buckets aging */}
      <Spin spinning={loading}>
        <Row gutter={16} className="mb-4">
          {[
            { key: '0-30',  val: aging?.bucket0_30,  icon: null },
            { key: '31-60', val: aging?.bucket31_60, icon: null },
            { key: '61-90', val: aging?.bucket61_90, icon: <ExclamationCircleOutlined /> },
            { key: '+90',   val: aging?.bucketOver90, icon: <WarningOutlined /> },
          ].map(({ key, val, icon }) => {
            const cfg = BUCKET_CONFIG[key];
            const pct = totalOut > 0 ? Math.round((Number(val || 0) / totalOut) * 100) : 0;
            return (
              <Col span={6} key={key}>
                <Card
                  size="small"
                  style={{ borderTop: `3px solid ${key === '0-30' ? '#52c41a' : key === '31-60' ? '#fa8c16' : key === '61-90' ? '#ff4d4f' : '#722ed1'}`, cursor: 'pointer' }}
                  onClick={() => setBucketFilter(bucketFilter === key ? undefined : key)}
                  className={bucketFilter === key ? 'ant-card-selected' : ''}
                >
                  <Statistic
                    title={cfg.label}
                    value={Number(val || 0).toFixed(2)}
                    suffix="DH"
                    valueStyle={{ fontSize: 16, color: key === '0-30' ? '#52c41a' : key === '31-60' ? '#fa8c16' : '#ff4d4f' }}
                    prefix={icon}
                  />
                  <Progress percent={pct} size="small" showInfo={false}
                    strokeColor={key === '0-30' ? '#52c41a' : key === '31-60' ? '#fa8c16' : '#ff4d4f'}
                    className="mt-1"
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>{pct}% du total</Text>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* Total */}
        <Row gutter={16} className="mb-4">
          <Col span={8}>
            <Card size="small" style={{ background: totalOut > 0 ? '#fff7e6' : undefined }}>
              <Statistic
                title="Total crédit en souffrance"
                value={totalOut.toFixed(2)}
                suffix="DH"
                valueStyle={{ color: totalOut > 0 ? '#ff4d4f' : '#52c41a', fontSize: 20 }}
                prefix={<DollarOutlined />}
              />
            </Card>
          </Col>
          <Col span={16}>
            {totalOut > 10000 && (
              <Alert
                type="error"
                showIcon
                message={`⚠️ Encours crédit élevé : ${totalOut.toFixed(2)} DH`}
                description="Des clients ont des créances non réglées. Pensez à relancer les clients concernés."
              />
            )}
            {totalOut === 0 && !loading && (
              <Alert type="success" showIcon message="Aucune créance en souffrance" />
            )}
          </Col>
        </Row>

        {/* Tableau */}
        <Card size="small">
          {filteredLines.length === 0
            ? <Empty description={bucketFilter ? `Aucune créance dans la tranche ${bucketFilter}` : 'Aucune créance en souffrance'} />
            : (
              <Table
                columns={cols}
                dataSource={filteredLines}
                rowKey="lineId"
                size="small"
                pagination={{ pageSize: 15, showTotal: t => `${t} ligne(s)` }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={6}><Text strong>TOTAL ({filteredLines.length} lignes)</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right">
                      <Text strong style={{ color: '#ff4d4f' }}>{totalFiltered.toFixed(2)} DH</Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={7} />
                  </Table.Summary.Row>
                )}
              />
            )
          }
        </Card>
      </Spin>
    </div>
  );
}
