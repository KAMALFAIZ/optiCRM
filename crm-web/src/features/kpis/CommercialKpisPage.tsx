import { useEffect, useState } from 'react';
import { Card, Table, Spin, Alert, Tag, Empty } from 'antd';
import {
  TrophyOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

import kpisApi from '@/api/kpis';
import { CommercialKpi } from '@/types/dashboard';

// -- Helpers ------------------------------------------------------------------

const num = (v: unknown): number => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const parsed = Number(v);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const formatMAD = (v: unknown): string =>
  num(v).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const cardS = { borderRadius: 8, border: '1px solid #f1f5f9' };

const medalColors: Record<number, { color: string; label: string }> = {
  0: { color: '#facc15', label: '1er' },
  1: { color: '#94a3b8', label: '2e' },
  2: { color: '#cd7f32', label: '3e' },
};

// -- Component ----------------------------------------------------------------

export default function CommercialKpisPage() {
  const [data, setData] = useState<(CommercialKpi & { _uid: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const raw = await kpisApi.getCommercialKpis();
        const result = (Array.isArray(raw) ? raw : []).map((r, i) => ({
          _uid: `kpi-${i}`,
          repName: typeof r.repName === 'string' && r.repName.trim() ? r.repName : 'Inconnu',
          revenue: num(r.revenue),
          dealsWon: num(r.dealsWon),
          dealsLost: num(r.dealsLost),
          winRate: num(r.winRate),
          averageDealSize: num(r.averageDealSize),
          pipeline: num(r.pipeline),
          openDeals: num(r.openDeals),
          totalVisits: num(r.totalVisits),
          completedVisits: num(r.completedVisits),
          plannedVisits: num(r.plannedVisits),
          inProgressVisits: num(r.inProgressVisits),
          visitCompletionRate: num(r.visitCompletionRate),
          totalMileage: num(r.totalMileage),
          totalExpenses: num(r.totalExpenses),
        }));
        result.sort((a, b) => b.revenue - a.revenue);
        result.forEach((r, i) => { r._uid = `kpi-${i}`; });
        setData(result);
      } catch (err: any) {
        setError(err.response?.data?.error?.message || err.response?.data?.message || 'Erreur lors du chargement des KPIs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // -- Columns ----------------------------------------------------------------

  const columns = [
    {
      title: '#',
      key: 'rank',
      width: 55,
      render: (_: unknown, __: CommercialKpi, index: number) => {
        if (index < 3) {
          const medal = medalColors[index];
          return (
            <Tag
              icon={<TrophyOutlined />}
              style={{
                fontSize: 11,
                fontWeight: 600,
                margin: 0,
                background: `${medal.color}22`,
                border: `1px solid ${medal.color}`,
                color: medal.color,
              }}
            >
              {medal.label}
            </Tag>
          );
        }
        return <span style={{ fontSize: 12, color: '#94a3b8' }}>{index + 1}</span>;
      },
    },
    {
      title: 'Commercial',
      dataIndex: 'repName',
      key: 'repName',
      render: (v: string, _: CommercialKpi, index: number) => (
        <span style={{ fontWeight: index < 3 ? 600 : 400, fontSize: 12 }}>{v}</span>
      ),
    },
    {
      title: 'CA R\u00e9alis\u00e9',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      sorter: (a: CommercialKpi, b: CommercialKpi) => a.revenue - b.revenue,
      render: (v: number) => (
        <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a' }}>{formatMAD(v)}</span>
      ),
    },
    {
      title: 'Deals gagn\u00e9s',
      dataIndex: 'dealsWon',
      key: 'dealsWon',
      align: 'center' as const,
      width: 110,
      sorter: (a: CommercialKpi, b: CommercialKpi) => a.dealsWon - b.dealsWon,
      render: (v: number) => <Tag color="green">{v}</Tag>,
    },
    {
      title: 'Deals perdus',
      dataIndex: 'dealsLost',
      key: 'dealsLost',
      align: 'center' as const,
      width: 110,
      sorter: (a: CommercialKpi, b: CommercialKpi) => a.dealsLost - b.dealsLost,
      render: (v: number) => <Tag color="red">{v}</Tag>,
    },
    {
      title: 'Win Rate (%)',
      dataIndex: 'winRate',
      key: 'winRate',
      align: 'center' as const,
      width: 110,
      sorter: (a: CommercialKpi, b: CommercialKpi) => a.winRate - b.winRate,
      render: (v: unknown) => {
        const n = num(v);
        const color = n >= 50 ? '#16a34a' : n >= 30 ? '#d97706' : '#dc2626';
        return <span style={{ fontSize: 12, fontWeight: 600, color }}>{n.toFixed(1)}%</span>;
      },
    },
    {
      title: 'Panier moyen',
      dataIndex: 'averageDealSize',
      key: 'averageDealSize',
      align: 'right' as const,
      sorter: (a: CommercialKpi, b: CommercialKpi) => a.averageDealSize - b.averageDealSize,
      render: (v: number) => <span style={{ fontSize: 12 }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Pipeline',
      dataIndex: 'pipeline',
      key: 'pipeline',
      align: 'right' as const,
      sorter: (a: CommercialKpi, b: CommercialKpi) => a.pipeline - b.pipeline,
      render: (v: number) => <span style={{ fontSize: 12, color: '#3b82f6' }}>{formatMAD(v)}</span>,
    },
    {
      title: 'Deals ouverts',
      dataIndex: 'openDeals',
      key: 'openDeals',
      align: 'center' as const,
      width: 110,
      sorter: (a: CommercialKpi, b: CommercialKpi) => a.openDeals - b.openDeals,
      render: (v: number) => <Tag color="blue">{v}</Tag>,
    },
  ];

  // -- Render -----------------------------------------------------------------

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Chargement des KPIs..."><div /></Spin>
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChartOutlined /> KPIs Commerciaux
      </div>

      {error && (
        <Alert type="error" message={error} showIcon closable style={{ marginBottom: 12 }} />
      )}

      <Card
        size="small"
        styles={{
          body: { padding: 0 },
          header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
        }}
        style={cardS}
      >
        <Table
          dataSource={data}
          columns={columns}
          rowKey="_uid"
          pagination={false}
          size="small"
          loading={loading}
          rowClassName={(_, index) => (index < 3 ? 'top-performer-row' : '')}
          scroll={{ x: 900 }}
          locale={{ emptyText: <Empty description="Aucune donnée KPI disponible" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
        />
      </Card>

      <style>{`
        .top-performer-row td {
          background: rgba(250, 204, 21, 0.04) !important;
        }
      `}</style>
    </div>
  );
}
