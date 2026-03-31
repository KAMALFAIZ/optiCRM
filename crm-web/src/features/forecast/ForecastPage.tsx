import { useEffect, useState, useCallback } from 'react';
import { Card, Table, Select, Row, Col, Spin, Alert, Tag } from 'antd';
import {
  CalendarOutlined,
  TeamOutlined,
} from '@ant-design/icons';

import forecastApi from '@/api/forecast';
import { MonthlyForecast, RepForecast } from '@/types/dashboard';

// -- Helpers ------------------------------------------------------------------

const formatMAD = (value: number): string =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const cardS = { borderRadius: 8, border: '1px solid #f1f5f9' };
const sectionTitle = (icon: React.ReactNode, t: string) => (
  <span style={{ fontSize: 13, fontWeight: 500, color: '#475569', display: 'flex', alignItems: 'center', gap: 6 }}>
    {icon} {t}
  </span>
);

// -- Component ----------------------------------------------------------------

export default function ForecastPage() {
  const [months, setMonths] = useState<number>(6);
  const [monthlyData, setMonthlyData] = useState<MonthlyForecast[]>([]);
  const [repData, setRepData] = useState<RepForecast[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async (m: number) => {
    setLoading(true);
    setError(null);
    try {
      const [monthly, byRep] = await Promise.all([
        forecastApi.getMonthlyForecast(m),
        forecastApi.getByRep(),
      ]);
      setMonthlyData(monthly);
      setRepData(byRep);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || err.response?.data?.message || 'Erreur lors du chargement des pr\u00e9visions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(months);
  }, [months, loadData]);

  // -- Monthly columns --------------------------------------------------------

  const monthlyColumns = [
    {
      title: 'Mois',
      dataIndex: 'month',
      key: 'month',
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Pipeline',
      dataIndex: 'pipeline',
      key: 'pipeline',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontSize: 12 }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Pond\u00e9r\u00e9',
      dataIndex: 'weighted',
      key: 'weighted',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontSize: 12, color: '#3b82f6' }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Gagn\u00e9',
      dataIndex: 'won',
      key: 'won',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Nb opportunit\u00e9s',
      dataIndex: 'opportunityCount',
      key: 'opportunityCount',
      align: 'center' as const,
      width: 130,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
  ];

  // -- Rep columns ------------------------------------------------------------

  const repColumns = [
    {
      title: 'Commercial',
      dataIndex: 'repName',
      key: 'repName',
      render: (v: string) => <span style={{ fontWeight: 500, fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Pipeline',
      dataIndex: 'pipeline',
      key: 'pipeline',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontSize: 12 }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Pond\u00e9r\u00e9',
      dataIndex: 'weighted',
      key: 'weighted',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontSize: 12, color: '#3b82f6' }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Gagn\u00e9',
      dataIndex: 'won',
      key: 'won',
      align: 'right' as const,
      render: (v: number) => <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 500 }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Nb',
      dataIndex: 'opportunityCount',
      key: 'opportunityCount',
      align: 'center' as const,
      width: 80,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: 'Win Rate',
      dataIndex: 'winRate',
      key: 'winRate',
      align: 'center' as const,
      width: 100,
      render: (v: number) => {
        const color = v >= 50 ? '#16a34a' : v >= 30 ? '#d97706' : '#dc2626';
        return <span style={{ fontSize: 12, fontWeight: 600, color }}>{v.toFixed(1)}%</span>;
      },
    },
  ];

  // -- Render -----------------------------------------------------------------

  if (loading && monthlyData.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Chargement des pr\u00e9visions..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b' }}>Pr\u00e9visions</div>
        <Select
          value={months}
          onChange={(v) => setMonths(v)}
          style={{ width: 140 }}
          options={[
            { value: 3, label: '3 mois' },
            { value: 6, label: '6 mois' },
            { value: 12, label: '12 mois' },
          ]}
        />
      </div>

      {error && (
        <Alert type="error" message={error} showIcon closable style={{ marginBottom: 12 }} />
      )}

      <Row gutter={[8, 8]}>
        <Col xs={24}>
          <Card
            size="small"
            title={sectionTitle(<CalendarOutlined />, 'Pr\u00e9visions mensuelles')}
            styles={{
              body: { padding: 0 },
              header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
            }}
            style={cardS}
          >
            <Table
              dataSource={monthlyData}
              columns={monthlyColumns}
              rowKey="month"
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>

        <Col xs={24}>
          <Card
            size="small"
            title={sectionTitle(<TeamOutlined />, 'Pr\u00e9visions par commercial')}
            styles={{
              body: { padding: 0 },
              header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
            }}
            style={cardS}
          >
            <Table
              dataSource={repData}
              columns={repColumns}
              rowKey="repName"
              pagination={false}
              size="small"
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
