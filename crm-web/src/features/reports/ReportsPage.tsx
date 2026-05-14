import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Statistic, Table, Spin, Alert, Tag, Empty, Tabs, Progress,
} from 'antd';
import {
  BarChartOutlined,
  TeamOutlined,
  RiseOutlined,
  TrophyOutlined,
  BankOutlined,
  UserAddOutlined,
  FundProjectionScreenOutlined,
  DollarOutlined,
} from '@ant-design/icons';

import dashboardApi from '@/api/dashboard';
import kpisApi from '@/api/kpis';
import forecastApi from '@/api/forecast';
import {
  DashboardStats,
  CommercialKpi,
  MonthlyForecast,
  RepForecast,
} from '@/types/dashboard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtMAD = (v: unknown) => {
  const n = typeof v === 'number' && !Number.isNaN(v) ? v : Number(v) || 0;
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

const cardS = { borderRadius: 8, border: '1px solid #f1f5f9' };

const p = {
  blue:   { bg: 'rgba(96,165,250,0.12)',  solid: '#60a5fa' },
  green:  { bg: 'rgba(74,222,128,0.12)',  solid: '#4ade80' },
  amber:  { bg: 'rgba(251,191,36,0.12)',  solid: '#fbbf24' },
  purple: { bg: 'rgba(167,139,250,0.12)', solid: '#a78bfa' },
  cyan:   { bg: 'rgba(34,211,238,0.12)',  solid: '#22d3ee' },
};

const medalColors: Record<number, { color: string; label: string }> = {
  0: { color: '#facc15', label: '1er' },
  1: { color: '#94a3b8', label: '2e' },
  2: { color: '#cd7f32', label: '3e' },
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [stats, setStats]         = useState<DashboardStats | null>(null);
  const [kpis, setKpis]           = useState<CommercialKpi[]>([]);
  const [forecast, setForecast]   = useState<MonthlyForecast[]>([]);
  const [repFcast, setRepFcast]   = useState<RepForecast[]>([]);
  const [loading, setLoading]     = useState(true);
  const [errStats, setErrStats]   = useState<string | null>(null);
  const [errKpis, setErrKpis]     = useState<string | null>(null);
  const [errFcast, setErrFcast]   = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [r1, r2, r3, r4] = await Promise.allSettled([
        dashboardApi.getStats(),
        kpisApi.getCommercialKpis(),
        forecastApi.getMonthlyForecast(12),
        forecastApi.getByRep(),
      ]);

      if (r1.status === 'fulfilled') setStats(r1.value);
      else setErrStats('Données de synthèse indisponibles');

      if (r2.status === 'fulfilled')
        setKpis(r2.value.sort((a, b) => b.revenue - a.revenue));
      else setErrKpis('KPIs commerciaux indisponibles');

      if (r3.status === 'fulfilled') setForecast(r3.value);
      if (r4.status === 'fulfilled') setRepFcast(r4.value);
      if (r3.status === 'rejected' && r4.status === 'rejected')
        setErrFcast('Données de prévision indisponibles');

      setLoading(false);
    };
    load();
  }, []);

  // ─── Tab 1 : Synthèse ───────────────────────────────────────────────────

  const synthTab = () => {
    if (errStats) return <Alert type="error" message={errStats} showIcon />;
    if (!stats) return <Empty description="Aucune donnée" />;

    const maxRev = stats.revenueByMonth.length
      ? Math.max(...stats.revenueByMonth.map((r) => r.amount), 1)
      : 1;

    const leadEntries = Object.entries(stats.leadsBySource).sort(([, a], [, b]) => b - a);
    const leadTotal   = leadEntries.reduce((s, [, c]) => s + c, 0) || 1;
    const leadRows    = leadEntries.map(([source, count], i) => ({
      key: i, source, count, pct: (count / leadTotal) * 100,
    }));

    return (
      <div>
        {/* KPI cards */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          {[
            { t: 'Comptes',        v: stats.totalAccounts,      icon: <BankOutlined />,                    c: p.blue   },
            { t: 'Contacts',       v: stats.totalContacts,      icon: <TeamOutlined />,                    c: p.green  },
            { t: 'Pistes',         v: stats.totalLeads,         icon: <UserAddOutlined />,                 c: p.amber  },
            { t: 'Opportunités',   v: stats.totalOpportunities, icon: <FundProjectionScreenOutlined />,    c: p.purple },
          ].map((k, i) => (
            <Col xs={12} lg={6} key={i}>
              <Card size="small" styles={{ body: { padding: '8px 12px' } }}
                style={{ ...cardS, background: k.c.bg, border: 'none' }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: k.c.solid }}>{k.t}</span>}
                  value={k.v}
                  prefix={k.icon}
                  valueStyle={{ color: k.c.solid, fontSize: 17, fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Financial cards */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          {[
            { t: 'Pipeline total',    v: stats.pipelineTotal,    c: p.blue  },
            { t: 'Pipeline pondéré',  v: stats.pipelineWeighted, c: p.cyan  },
            { t: 'CA Année en cours', v: stats.revenueThisYear,  c: p.green },
          ].map((k, i) => (
            <Col xs={24} lg={8} key={i}>
              <Card size="small" styles={{ body: { padding: '8px 12px' } }}
                style={{ ...cardS, background: k.c.bg, border: 'none' }}>
                <Statistic
                  title={<span style={{ fontSize: 11, color: k.c.solid }}>{k.t}</span>}
                  value={k.v}
                  suffix=""
                  valueStyle={{ color: k.c.solid, fontSize: 17, fontWeight: 600 }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* CA by month + leads by source */}
        <Row gutter={[8, 8]}>
          <Col xs={24} lg={14}>
            <Card size="small"
              title={<span style={{ fontSize: 12, fontWeight: 500 }}>Chiffre d'affaires par mois</span>}
              styles={{ body: { padding: 0 }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }}
              style={cardS}>
              {stats.revenueByMonth.length === 0
                ? <Empty description="Aucune donnée" style={{ padding: '24px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                : (
                  <Table
                    dataSource={stats.revenueByMonth.map((r, i) => ({ key: i, ...r }))}
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: 'Mois', dataIndex: 'month', key: 'month', width: 80,
                        render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
                      },
                      {
                        title: 'CA', dataIndex: 'amount', key: 'amount', align: 'right' as const,
                        render: (v: number) => (
                          <span style={{ fontSize: 12, fontWeight: 500, color: '#3b82f6' }}>{fmtMAD(v)}</span>
                        ),
                      },
                      {
                        title: '', dataIndex: 'amount', key: 'bar', width: 130,
                        render: (v: number) => (
                          <Progress
                            percent={Math.round((v / maxRev) * 100)}
                            showInfo={false}
                            size="small"
                            strokeColor="#3b82f6"
                          />
                        ),
                      },
                    ]}
                  />
                )}
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card size="small"
              title={<span style={{ fontSize: 12, fontWeight: 500 }}>Pistes par source</span>}
              styles={{ body: { padding: 0 }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }}
              style={cardS}>
              {leadRows.length === 0
                ? <Empty description="Aucune piste" style={{ padding: '24px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
                : (
                  <Table
                    dataSource={leadRows}
                    size="small"
                    pagination={false}
                    columns={[
                      {
                        title: 'Source', dataIndex: 'source', key: 'source',
                        render: (v: string) => <span style={{ fontSize: 12 }}>{v}</span>,
                      },
                      {
                        title: 'N°', dataIndex: 'count', key: 'count', width: 60, align: 'center' as const,
                        render: (v: number) => <Tag style={{ fontSize: 11, margin: 0 }}>{v}</Tag>,
                      },
                      {
                        title: '%', dataIndex: 'pct', key: 'pct', width: 60, align: 'right' as const,
                        render: (v: number) => <span style={{ fontSize: 11, color: '#64748b' }}>{v.toFixed(1)}%</span>,
                      },
                    ]}
                  />
                )}
            </Card>
          </Col>
        </Row>
      </div>
    );
  };

  // ─── Tab 2 : Commerciaux ────────────────────────────────────────────────

  const commTab = () => {
    if (errKpis) return <Alert type="error" message={errKpis} showIcon />;
    if (kpis.length === 0) return <Empty description="Aucun commercial trouvé" />;

    const totalRev   = kpis.reduce((s, k) => s + k.revenue, 0);
    const totalWon   = kpis.reduce((s, k) => s + k.dealsWon, 0);
    const avgWinRate = kpis.length ? kpis.reduce((s, k) => s + k.winRate, 0) / kpis.length : 0;

    const columns = [
      {
        title: '#', key: 'rank', width: 55,
        render: (_: unknown, __: CommercialKpi, index: number) => {
          if (index < 3) {
            const m = medalColors[index];
            return (
              <Tag icon={<TrophyOutlined />}
                style={{ fontSize: 11, fontWeight: 600, margin: 0,
                  background: `${m.color}22`, border: `1px solid ${m.color}`, color: m.color }}>
                {m.label}
              </Tag>
            );
          }
          return <span style={{ fontSize: 12, color: '#94a3b8' }}>{index + 1}</span>;
        },
      },
      {
        title: 'Commercial', dataIndex: 'repName', key: 'repName',
        render: (v: string, _: CommercialKpi, i: number) => (
          <span style={{ fontWeight: i < 3 ? 600 : 400, fontSize: 12 }}>{v}</span>
        ),
      },
      {
        title: 'CA Réalisé', dataIndex: 'revenue', key: 'revenue', align: 'right' as const,
        sorter: (a: CommercialKpi, b: CommercialKpi) => a.revenue - b.revenue,
        render: (v: number) => <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Gagné', dataIndex: 'dealsWon', key: 'dealsWon', align: 'center' as const, width: 80,
        sorter: (a: CommercialKpi, b: CommercialKpi) => a.dealsWon - b.dealsWon,
        render: (v: number) => <Tag color="green">{v}</Tag>,
      },
      {
        title: 'Perdu', dataIndex: 'dealsLost', key: 'dealsLost', align: 'center' as const, width: 80,
        sorter: (a: CommercialKpi, b: CommercialKpi) => a.dealsLost - b.dealsLost,
        render: (v: number) => <Tag color="red">{v}</Tag>,
      },
      {
        title: 'Win Rate', dataIndex: 'winRate', key: 'winRate', align: 'center' as const, width: 95,
        sorter: (a: CommercialKpi, b: CommercialKpi) => a.winRate - b.winRate,
        render: (v: number) => {
          const color = v >= 50 ? '#16a34a' : v >= 30 ? '#d97706' : '#dc2626';
          return <span style={{ fontSize: 12, fontWeight: 600, color }}>{v.toFixed(1)}%</span>;
        },
      },
      {
        title: 'Panier moyen', dataIndex: 'averageDealSize', key: 'averageDealSize', align: 'right' as const,
        sorter: (a: CommercialKpi, b: CommercialKpi) => a.averageDealSize - b.averageDealSize,
        render: (v: number) => <span style={{ fontSize: 12 }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Pipeline', dataIndex: 'pipeline', key: 'pipeline', align: 'right' as const,
        sorter: (a: CommercialKpi, b: CommercialKpi) => a.pipeline - b.pipeline,
        render: (v: number) => <span style={{ fontSize: 12, color: '#3b82f6' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Ouverts', dataIndex: 'openDeals', key: 'openDeals', align: 'center' as const, width: 80,
        sorter: (a: CommercialKpi, b: CommercialKpi) => a.openDeals - b.openDeals,
        render: (v: number) => <Tag color="blue">{v}</Tag>,
      },
    ];

    return (
      <div>
        {/* Summary */}
        <Row gutter={[8, 8]} style={{ marginBottom: 12 }}>
          {[
            { t: 'CA Total Équipe',     v: fmtMAD(totalRev),           c: '#16a34a' },
            { t: 'Deals Gagnés',        v: String(totalWon),            c: '#3b82f6' },
            { t: 'Win Rate Moyen',      v: `${avgWinRate.toFixed(1)}%`, c: '#d97706' },
            { t: 'Commerciaux actifs',  v: String(kpis.length),        c: '#8b5cf6' },
          ].map((k, i) => (
            <Col xs={12} lg={6} key={i}>
              <Card size="small" styles={{ body: { padding: '8px 12px' } }} style={cardS}>
                <div style={{ fontSize: 11, color: '#64748b', marginBottom: 2 }}>{k.t}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: k.c }}>{k.v}</div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Ranking table */}
        <Card size="small"
          styles={{ body: { padding: 0 }, header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' } }}
          style={cardS}>
          <Table
            dataSource={kpis}
            columns={columns}
            rowKey="repName"
            pagination={false}
            size="small"
            rowClassName={(_, i) => (i < 3 ? 'kpi-top-row' : '')}
            scroll={{ x: 900 }}
          />
        </Card>

        <style>{`.kpi-top-row td { background: rgba(250, 204, 21, 0.04) !important; }`}</style>
      </div>
    );
  };

  // ─── Tab 3 : Prévisions ─────────────────────────────────────────────────

  const forecastTab = () => {
    if (errFcast) return <Alert type="error" message={errFcast} showIcon />;

    const monthCols = [
      {
        title: 'Mois', dataIndex: 'month', key: 'month', width: 80,
        render: (v: string) => <span style={{ fontSize: 12, fontWeight: 500 }}>{v}</span>,
      },
      {
        title: 'Pipeline', dataIndex: 'pipeline', key: 'pipeline', align: 'right' as const,
        render: (v: number) => <span style={{ fontSize: 12, color: '#3b82f6' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Pondéré', dataIndex: 'weighted', key: 'weighted', align: 'right' as const,
        render: (v: number) => <span style={{ fontSize: 12, color: '#8b5cf6' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Gagné', dataIndex: 'won', key: 'won', align: 'right' as const,
        render: (v: number) => <span style={{ fontSize: 12, fontWeight: 500, color: '#16a34a' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Opport.', dataIndex: 'opportunityCount', key: 'opportunityCount', align: 'center' as const, width: 80,
        render: (v: number) => <Tag color="blue">{v}</Tag>,
      },
    ];

    const repCols = [
      {
        title: 'Commercial', dataIndex: 'repName', key: 'repName',
        render: (v: string) => <span style={{ fontSize: 12, fontWeight: 500 }}>{v}</span>,
      },
      {
        title: 'Pipeline', dataIndex: 'pipeline', key: 'pipeline', align: 'right' as const,
        sorter: (a: RepForecast, b: RepForecast) => a.pipeline - b.pipeline,
        render: (v: number) => <span style={{ fontSize: 12, color: '#3b82f6' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Pondéré', dataIndex: 'weighted', key: 'weighted', align: 'right' as const,
        render: (v: number) => <span style={{ fontSize: 12, color: '#8b5cf6' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Gagné', dataIndex: 'won', key: 'won', align: 'right' as const,
        render: (v: number) => <span style={{ fontSize: 12, color: '#16a34a' }}>{fmtMAD(v)}</span>,
      },
      {
        title: 'Deals', dataIndex: 'opportunityCount', key: 'opportunityCount', align: 'center' as const, width: 70,
        render: (v: number) => <Tag color="blue">{v}</Tag>,
      },
      {
        title: 'Win Rate', dataIndex: 'winRate', key: 'winRate', align: 'center' as const, width: 90,
        sorter: (a: RepForecast, b: RepForecast) => a.winRate - b.winRate,
        render: (v: number) => {
          const color = v >= 50 ? '#16a34a' : v >= 30 ? '#d97706' : '#dc2626';
          return <span style={{ fontSize: 12, fontWeight: 600, color }}>{v.toFixed(1)}%</span>;
        },
      },
    ];

    return (
      <Row gutter={[8, 8]}>
        <Col xs={24} lg={14}>
          <Card size="small"
            title={<span style={{ fontSize: 12, fontWeight: 500 }}>Prévisions par mois (12 mois)</span>}
            styles={{ body: { padding: 0 }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }}
            style={cardS}>
            {forecast.length === 0
              ? <Empty description="Aucune donnée" style={{ padding: '24px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : (
                <Table
                  dataSource={forecast.map((f, i) => ({ key: i, ...f }))}
                  columns={monthCols}
                  size="small"
                  pagination={false}
                />
              )}
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card size="small"
            title={<span style={{ fontSize: 12, fontWeight: 500 }}>Prévisions par commercial</span>}
            styles={{ body: { padding: 0 }, header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' } }}
            style={cardS}>
            {repFcast.length === 0
              ? <Empty description="Aucune donnée" style={{ padding: '24px 0' }} image={Empty.PRESENTED_IMAGE_SIMPLE} />
              : (
                <Table
                  dataSource={repFcast.map((r, i) => ({ key: i, ...r }))}
                  columns={repCols}
                  size="small"
                  pagination={false}
                  scroll={{ x: 500 }}
                />
              )}
          </Card>
        </Col>
      </Row>
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Chargement des rapports..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
        <BarChartOutlined /> Rapports
      </div>

      <Tabs
        size="small"
        items={[
          {
            key: 'synthese',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <DollarOutlined /> Synthèse
              </span>
            ),
            children: synthTab(),
          },
          {
            key: 'commerciaux',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TeamOutlined /> Commerciaux
              </span>
            ),
            children: commTab(),
          },
          {
            key: 'previsions',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <RiseOutlined /> Prévisions
              </span>
            ),
            children: forecastTab(),
          },
        ]}
      />
    </div>
  );
}
