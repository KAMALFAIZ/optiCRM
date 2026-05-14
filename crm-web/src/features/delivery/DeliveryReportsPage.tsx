import { useState, useCallback, useEffect } from 'react';
import {
  Card, Table, Button, Space, Row, Col, Statistic, DatePicker,
  Select, Tag, Typography, Spin, Empty, Progress, Tooltip,
} from 'antd';
import {
  BarChartOutlined, SearchOutlined, UserOutlined, DollarOutlined,
  CalendarOutlined, TruckOutlined,
} from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { deliveryReportApi, TourReport } from '@/api/deliveryReporting';
import { usersApi } from '@/api/users';
import { useMessage } from '@/hooks/useMessage';
import type { UserListItem } from '@/types/user';

const { Text, Title } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'blue', ACTIVE: 'green', CLOSED: 'default',
};
const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon', ACTIVE: 'Active', CLOSED: 'Clôturée',
};

export default function DeliveryReportsPage() {
  const { message } = useMessage();
  const [reports, setReports] = useState<TourReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().startOf('month'), dayjs(),
  ]);
  const [repFilter, setRepFilter] = useState<string | undefined>(undefined);
  const [users, setUsers] = useState<UserListItem[]>([]);

  useEffect(() => {
    usersApi.getAll({ size: 200, isActive: true }).then(r => setUsers(r.content)).catch(() => {});
  }, []);

  const handleSearch = useCallback(async () => {
    if (!dateRange) return;
    setLoading(true);
    try {
      const data = await deliveryReportApi.getTourReports(
        dateRange[0].format('YYYY-MM-DD'),
        dateRange[1].format('YYYY-MM-DD'),
        repFilter,
      );
      setReports(data);
    } catch {
      message.error('Erreur chargement rapport');
    } finally {
      setLoading(false);
    }
  }, [dateRange, repFilter]);

  useEffect(() => { handleSearch(); }, []);

  const userName = (id?: string) => {
    if (!id) return '—';
    const u = users.find(u => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : id.substring(0, 8) + '…';
  };

  // ── Totaux ────────────────────────────────────────────────────────────────
  const totals = reports.reduce((acc, r) => ({
    total:     acc.total     + (r.totalAmount     || 0),
    collected: acc.collected + (r.collectedAmount || 0),
    credit:    acc.credit    + (r.creditAmount    || 0),
    outstanding: acc.outstanding + (r.outstandingCredit || 0),
    delivered: acc.delivered + (r.deliveredCount  || 0),
    absent:    acc.absent    + (r.absentCount     || 0),
  }), { total: 0, collected: 0, credit: 0, outstanding: 0, delivered: 0, absent: 0 });

  const globalRate = totals.total > 0
    ? Math.round((totals.collected / totals.total) * 100) : 0;

  const cols: TableColumnsType<TourReport> = [
    {
      title: 'Date', dataIndex: 'tourDate', sorter: (a, b) => (a.tourDate || '').localeCompare(b.tourDate || ''),
      render: d => <Space><CalendarOutlined style={{ color: '#1677ff' }} />{dayjs(d).format('DD/MM/YYYY')}</Space>,
    },
    {
      title: 'Zone', dataIndex: 'zone',
      render: z => z || <Text type="secondary">—</Text>,
    },
    {
      title: 'Représentant', dataIndex: 'representativeId',
      render: id => <Space><UserOutlined />{userName(id)}</Space>,
    },
    {
      title: 'Statut', dataIndex: 'tourStatus',
      render: s => <Tag color={STATUS_COLORS[s] || 'default'}>{STATUS_LABELS[s] || s}</Tag>,
    },
    {
      title: 'Visites', align: 'center',
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title={`${r.deliveredCount} livré(s)`}>
            <Tag color="green">{r.deliveredCount}✓</Tag>
          </Tooltip>
          {r.absentCount > 0 && <Tooltip title={`${r.absentCount} absent(s)`}><Tag color="orange">{r.absentCount}⚠</Tag></Tooltip>}
          {r.refusedCount > 0 && <Tooltip title={`${r.refusedCount} refus`}><Tag color="red">{r.refusedCount}✗</Tag></Tooltip>}
        </Space>
      ),
    },
    {
      title: 'Total facturé', dataIndex: 'totalAmount', align: 'right', sorter: (a, b) => (a.totalAmount || 0) - (b.totalAmount || 0),
      render: v => <Text strong>{Number(v || 0).toFixed(2)} DH</Text>,
    },
    {
      title: 'Espèces', dataIndex: 'cashAmount', align: 'right',
      render: v => <Text style={{ color: '#52c41a' }}>{Number(v || 0).toFixed(2)} DH</Text>,
    },
    {
      title: 'Crédit', dataIndex: 'creditAmount', align: 'right',
      render: v => <Text style={{ color: '#fa8c16' }}>{Number(v || 0).toFixed(2)} DH</Text>,
    },
    {
      title: 'Solde dû', dataIndex: 'outstandingCredit', align: 'right',
      render: v => Number(v || 0) > 0
        ? <Text style={{ color: '#ff4d4f' }}>{Number(v).toFixed(2)} DH</Text>
        : <Text style={{ color: '#52c41a' }}>0.00 DH</Text>,
    },
    {
      title: 'Taux', dataIndex: 'collectionRate', align: 'center', sorter: (a, b) => (a.collectionRate || 0) - (b.collectionRate || 0),
      render: rate => (
        <Progress
          percent={rate}
          size="small"
          strokeColor={rate >= 80 ? '#52c41a' : rate >= 50 ? '#faad14' : '#ff4d4f'}
          style={{ width: 80 }}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <Title level={4} style={{ margin: 0 }}>
          <BarChartOutlined className="mr-2" />Rapports de livraison
        </Title>
      </div>

      {/* Filtres */}
      <Card size="small" className="mb-4">
        <Row gutter={12} align="middle">
          <Col>
            <RangePicker
              value={dateRange}
              onChange={v => v && setDateRange(v as [Dayjs, Dayjs])}
              format="DD/MM/YYYY"
              presets={[
                { label: 'Ce mois', value: [dayjs().startOf('month'), dayjs()] },
                { label: 'Mois dernier', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month')] },
                { label: '7 derniers jours', value: [dayjs().subtract(6, 'd'), dayjs()] },
                { label: '30 derniers jours', value: [dayjs().subtract(29, 'd'), dayjs()] },
              ]}
            />
          </Col>
          <Col>
            <Select
              placeholder="Tous les représentants"
              style={{ width: 220 }}
              allowClear
              showSearch
              optionFilterProp="label"
              value={repFilter}
              onChange={setRepFilter}
              options={users.map(u => ({ value: u.id, label: `${u.firstName} ${u.lastName}` }))}
            />
          </Col>
          <Col>
            <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
              Rechercher
            </Button>
          </Col>
        </Row>
      </Card>

      {/* KPI résumé */}
      <Row gutter={12} className="mb-4">
        <Col span={4}><Card size="small"><Statistic title="Tournées" value={reports.length} prefix={<TruckOutlined />} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="CA total" value={totals.total.toFixed(2)} suffix="DH" prefix={<DollarOutlined />} valueStyle={{ color: '#1677ff', fontSize: 16 }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="Encaissé" value={totals.collected.toFixed(2)} suffix="DH" valueStyle={{ color: '#52c41a', fontSize: 16 }} /></Card></Col>
        <Col span={5}><Card size="small"><Statistic title="Crédit impayé" value={totals.outstanding.toFixed(2)} suffix="DH" valueStyle={{ color: totals.outstanding > 0 ? '#ff4d4f' : undefined, fontSize: 16 }} /></Card></Col>
        <Col span={5}>
          <Card size="small">
            <div><Text type="secondary" style={{ fontSize: 12 }}>Taux encaissement</Text></div>
            <Progress percent={globalRate} strokeColor={globalRate >= 80 ? '#52c41a' : globalRate >= 50 ? '#faad14' : '#ff4d4f'} size="small" className="mt-1" />
          </Card>
        </Col>
      </Row>

      {/* Tableau */}
      <Card size="small">
        <Spin spinning={loading}>
          {reports.length === 0
            ? <Empty description="Aucun rapport — sélectionnez une période et cliquez Rechercher" />
            : (
              <Table
                columns={cols}
                dataSource={reports}
                rowKey="tourId"
                size="small"
                pagination={{ pageSize: 15, showTotal: t => `${t} tournée(s)` }}
                summary={() => (
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={5}><Text strong>TOTAL</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={5} align="right"><Text strong>{totals.total.toFixed(2)} DH</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={6} align="right"><Text strong style={{ color: '#52c41a' }}>{totals.collected.toFixed(2)} DH</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={7} align="right"><Text strong style={{ color: '#fa8c16' }}>{totals.credit.toFixed(2)} DH</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={8} align="right"><Text strong style={{ color: '#ff4d4f' }}>{totals.outstanding.toFixed(2)} DH</Text></Table.Summary.Cell>
                    <Table.Summary.Cell index={9} align="center">
                      <Tag color={globalRate >= 80 ? 'green' : globalRate >= 50 ? 'orange' : 'red'}>{globalRate}%</Tag>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                )}
              />
            )
          }
        </Spin>
      </Card>
    </div>
  );
}
