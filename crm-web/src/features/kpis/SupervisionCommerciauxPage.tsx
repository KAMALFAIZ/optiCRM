import { Component, ErrorInfo, ReactNode, useEffect, useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Spin,
  Alert,
  Tag,
  Avatar,
  Progress,
  Tooltip,
  Empty,
  Select,
  Badge,
} from 'antd';
import {
  TrophyOutlined,
  UserOutlined,
  RiseOutlined,
  DollarOutlined,
  TeamOutlined,
  FundProjectionScreenOutlined,
  FireOutlined,
  FallOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  WalletOutlined,
  DashboardOutlined,
  AlertOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  SwapOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  MinusOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

import kpisApi from '@/api/kpis';
import { CommercialKpi, SupervisionData, TrendData } from '@/types/dashboard';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ChartTitle, ChartTooltip, Legend, Filler
);

// -- Safe helpers --------------------------------------------------------------

const num = (v: unknown): number => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const parsed = Number(v);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const str = (v: unknown): string =>
  typeof v === 'string' && v.trim() !== '' ? v : 'Inconnu';

const pct = (v: unknown): string => `${num(v).toFixed(1)}%`;

const formatMAD = (v: unknown) =>
  num(v).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const initials = (name: unknown) => {
  const s = str(name).trim();
  const parts = s.split(' ').filter(Boolean);
  return parts.map((p) => p[0]).join('').slice(0, 2).toUpperCase() || '?';
};

const safe = (record: unknown): CommercialKpi => {
  const r = (record ?? {}) as Partial<CommercialKpi>;
  return {
    repName: str(r.repName),
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
  };
};

const avatarColors = [
  '#4F46E5', '#10B981', '#f7b84b', '#f06548', '#299cdb',
  '#45cb85', '#e83e8c', '#6f42c1', '#fd7e14', '#20c997',
];

const winRateColor = (v: number) =>
  v >= 60 ? '#10B981' : v >= 40 ? '#f7b84b' : '#f06548';

const cardS = { borderRadius: 10, border: '1px solid #f1f5f9' };

// -- Error Boundary -----------------------------------------------------------

class KpiErrorBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null as string | null };

  static getDerivedStateFromError(err: Error) {
    return { error: err.message || 'Erreur inattendue' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error('[SupervisionCommerciaux] Render error:', err, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24 }}>
          <Alert
            type="error"
            message="Erreur d'affichage"
            description={this.state.error}
            showIcon
            action={
              <button onClick={() => this.setState({ error: null })} style={{ cursor: 'pointer' }}>
                Réessayer
              </button>
            }
          />
        </div>
      );
    }
    return this.children;
  }

  get children() {
    return this.props.children;
  }
}

// -- Component ----------------------------------------------------------------

const scoreColor = (s: number) =>
  s >= 70 ? '#10B981' : s >= 50 ? '#f7b84b' : s >= 30 ? '#fd7e14' : '#f06548';

const scoreLabel = (s: number) =>
  s >= 70 ? 'Excellent' : s >= 50 ? 'Bon' : s >= 30 ? 'À améliorer' : 'Critique';

const severityConfig: Record<string, { color: string; icon: ReactNode; tag: string }> = {
  CRITICAL: { color: '#f06548', icon: <ExclamationCircleOutlined />, tag: 'red' },
  WARNING: { color: '#f7b84b', icon: <WarningOutlined />, tag: 'orange' },
  INFO: { color: '#299cdb', icon: <InfoCircleOutlined />, tag: 'blue' },
};

function SupervisionCommerciauxContent() {
  const [data, setData] = useState<(CommercialKpi & { _uid: string })[]>([]);
  const [supervision, setSupervision] = useState<SupervisionData | null>(null);
  const [trends, setTrends] = useState<TrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<keyof CommercialKpi>('revenue');
  const [trendMetric, setTrendMetric] = useState<'revenue' | 'deals' | 'visits'>('revenue');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [raw, sup, trd] = await Promise.all([
          kpisApi.getCommercialKpis(),
          kpisApi.getSupervision().catch(() => null),
          kpisApi.getTrends().catch(() => null),
        ]);
        const arr = Array.isArray(raw) ? raw : [];
        const result = arr.map((r, i) => ({ ...safe(r), _uid: `rep-${i}` }));
        result.sort((a, b) => b.revenue - a.revenue);
        result.forEach((r, i) => { r._uid = `rep-${i}`; });
        setData(result);
        if (sup) setSupervision(sup);
        if (trd) setTrends(trd);
      } catch (err: unknown) {
        const e = err as { response?: { data?: { error?: { message?: string }; message?: string } } };
        setError(
          e?.response?.data?.error?.message ||
            e?.response?.data?.message ||
            'Erreur lors du chargement'
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // -- Aggregates -------------------------------------------------------------

  const totalRevenue = data.reduce((s, r) => s + num(r.revenue), 0);
  const totalPipeline = data.reduce((s, r) => s + num(r.pipeline), 0);
  const totalWon = data.reduce((s, r) => s + num(r.dealsWon), 0);
  const totalLost = data.reduce((s, r) => s + num(r.dealsLost), 0);
  const avgWinRate =
    data.length > 0
      ? data.reduce((s, r) => s + num(r.winRate), 0) / data.length
      : 0;
  const best: CommercialKpi | null = data.length > 0 ? data[0] : null;

  // Terrain aggregates
  const totalVisitsAll = data.reduce((s, r) => s + num(r.totalVisits), 0);
  const totalCompletedAll = data.reduce((s, r) => s + num(r.completedVisits), 0);
  const totalPlannedAll = data.reduce((s, r) => s + num(r.plannedVisits), 0);
  const totalInProgressAll = data.reduce((s, r) => s + num(r.inProgressVisits), 0);
  const avgCompletionRate = data.length > 0
    ? data.reduce((s, r) => s + num(r.visitCompletionRate), 0) / data.length
    : 0;
  const totalMileageAll = data.reduce((s, r) => s + num(r.totalMileage), 0);
  const totalExpensesAll = data.reduce((s, r) => s + num(r.totalExpenses), 0);

  const sorted = [...data].sort(
    (a, b) => num(b[sortKey]) - num(a[sortKey])
  );

  // -- Table columns ----------------------------------------------------------

  const columns = [
    {
      title: '#',
      key: 'rank',
      width: 46,
      render: (_: unknown, __: unknown, i: number) => {
        const medals: Record<number, string> = { 0: '🥇', 1: '🥈', 2: '🥉' };
        return (
          <span style={{ fontSize: 16 }}>
            {medals[i] ?? <span style={{ color: '#94a3b8', fontSize: 12 }}>{i + 1}</span>}
          </span>
        );
      },
    },
    {
      title: 'Commercial',
      dataIndex: 'repName',
      key: 'repName',
      render: (name: unknown, _: unknown, i: number) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            size={28}
            style={{
              background: avatarColors[i % avatarColors.length],
              fontSize: 11,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {initials(name)}
          </Avatar>
          <span style={{ fontSize: 12, fontWeight: i < 3 ? 600 : 400 }}>{str(name)}</span>
        </div>
      ),
    },
    {
      title: 'CA Réalisé',
      dataIndex: 'revenue',
      key: 'revenue',
      align: 'right' as const,
      sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.revenue) - num(b.revenue),
      render: (v: unknown) => (
        <span style={{ fontSize: 12, fontWeight: 600, color: '#10B981' }}>
          {formatMAD(v)}
        </span>
      ),
    },
    {
      title: 'Taux de gain',
      dataIndex: 'winRate',
      key: 'winRate',
      align: 'center' as const,
      width: 130,
      sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.winRate) - num(b.winRate),
      render: (v: unknown) => {
        const n = num(v);
        return (
          <Tooltip title={pct(n)}>
            <Progress
              percent={parseFloat(n.toFixed(1))}
              size="small"
              strokeColor={winRateColor(n)}
              trailColor="#f1f5f9"
              format={(p) => (
                <span style={{ fontSize: 10, color: winRateColor(n), fontWeight: 600 }}>
                  {p}%
                </span>
              )}
            />
          </Tooltip>
        );
      },
    },
    {
      title: 'Gagné',
      dataIndex: 'dealsWon',
      key: 'dealsWon',
      align: 'center' as const,
      width: 72,
      sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.dealsWon) - num(b.dealsWon),
      render: (v: unknown) => <Tag color="green">{num(v)}</Tag>,
    },
    {
      title: 'Perdu',
      dataIndex: 'dealsLost',
      key: 'dealsLost',
      align: 'center' as const,
      width: 72,
      sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.dealsLost) - num(b.dealsLost),
      render: (v: unknown) => <Tag color="red">{num(v)}</Tag>,
    },
    {
      title: 'Panier moy.',
      dataIndex: 'averageDealSize',
      key: 'averageDealSize',
      align: 'right' as const,
      sorter: (a: CommercialKpi, b: CommercialKpi) =>
        num(a.averageDealSize) - num(b.averageDealSize),
      render: (v: unknown) => (
        <span style={{ fontSize: 12, color: '#64748b' }}>{formatMAD(v)}</span>
      ),
    },
    {
      title: 'Pipeline',
      dataIndex: 'pipeline',
      key: 'pipeline',
      align: 'right' as const,
      sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.pipeline) - num(b.pipeline),
      render: (v: unknown) => (
        <span style={{ fontSize: 12, color: '#4F46E5', fontWeight: 500 }}>
          {formatMAD(v)}
        </span>
      ),
    },
    {
      title: 'Ouverts',
      dataIndex: 'openDeals',
      key: 'openDeals',
      align: 'center' as const,
      width: 80,
      sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.openDeals) - num(b.openDeals),
      render: (v: unknown) => <Tag color="blue">{num(v)}</Tag>,
    },
  ];

  // -- Loading / Error --------------------------------------------------------

  if (loading && data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Chargement supervision…"><div /></Spin>
      </div>
    );
  }

  // -- Render -----------------------------------------------------------------

  return (
    <div style={{ padding: '12px 16px' }}>
      {/* Title */}
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <TeamOutlined style={{ color: '#4F46E5' }} />
        Supervision des Commerciaux
      </div>

      {error && (
        <Alert type="error" message={error} showIcon closable style={{ marginBottom: 12 }} />
      )}

      {/* ── Row 1 : KPI globaux ─────────────────────────────── */}
      <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
        {[
          {
            t: 'CA Total Équipe',
            v: formatMAD(totalRevenue),
            icon: <DollarOutlined />,
            bg: 'rgba(10,179,156,0.12)',
            color: '#10B981',
          },
          {
            t: 'Pipeline Total',
            v: formatMAD(totalPipeline),
            icon: <FundProjectionScreenOutlined />,
            bg: 'rgba(64,81,137,0.12)',
            color: '#4F46E5',
          },
          {
            t: 'Taux de gain moyen',
            v: pct(avgWinRate),
            icon: <RiseOutlined />,
            bg: 'rgba(247,184,75,0.14)',
            color: '#f7b84b',
          },
          {
            t: 'Deals Gagnés / Perdus',
            v: `${totalWon} / ${totalLost}`,
            icon: <TrophyOutlined />,
            bg: 'rgba(240,101,72,0.10)',
            color: '#f06548',
          },
          {
            t: 'Commerciaux actifs',
            v: data.length,
            icon: <UserOutlined />,
            bg: 'rgba(41,156,219,0.12)',
            color: '#299cdb',
          },
        ].map((k, i) => (
          <Col xs={12} sm={8} lg={24 / 5} key={`kpi-${i}`}>
            <Card
              size="small"
              styles={{ body: { padding: '10px 14px' } }}
              style={{ ...cardS, background: k.bg, border: 'none' }}
            >
              <Statistic
                title={<span style={{ fontSize: 11, color: k.color }}>{k.t}</span>}
                value={k.v}
                prefix={k.icon}
                valueStyle={{ color: k.color, fontSize: 16, fontWeight: 700, lineHeight: '24px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Score Performance + Alertes ────────────────────────── */}
      {supervision && supervision.scores.length > 0 && (
        <>
          <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
            {/* Score Performance */}
            <Col xs={24} lg={16}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <DashboardOutlined style={{ color: '#4F46E5' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      Score Performance
                    </span>
                    <Tag color="geekblue" style={{ fontSize: 10, margin: 0, marginLeft: 'auto' }}>
                      Moyenne équipe : {supervision.teamAverageScore.toFixed(0)}/100
                    </Tag>
                  </div>
                }
                styles={{
                  body: { padding: '10px 14px 14px' },
                  header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
                }}
                style={cardS}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {supervision.scores.map((rep, i) => {
                    const color = scoreColor(rep.score);
                    const maxScore = supervision.scores.length > 0
                      ? Math.max(...supervision.scores.map((s) => s.score), 1)
                      : 1;
                    const barPct = (rep.score / maxScore) * 100;
                    return (
                      <div key={`score-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 22, textAlign: 'right', fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <Avatar
                          size={24}
                          style={{ background: avatarColors[i % avatarColors.length], fontSize: 9, fontWeight: 600, flexShrink: 0 }}
                        >
                          {initials(rep.repName)}
                        </Avatar>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                            <span style={{ fontSize: 11, fontWeight: 500, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {str(rep.repName)}
                            </span>
                            <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0, marginLeft: 8 }}>
                              {scoreLabel(rep.score)}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ flex: 1, height: 10, background: '#f1f5f9', borderRadius: 5, overflow: 'hidden' }}>
                              <div
                                style={{
                                  width: `${Math.max(barPct, 2)}%`,
                                  height: '100%',
                                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                                  borderRadius: 5,
                                  transition: 'width 0.5s ease',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 700, color, minWidth: 38, textAlign: 'right' }}>
                              {rep.score}
                            </span>
                          </div>
                          <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                            <Tooltip title="CA">
                              <Tag style={{ fontSize: 9, margin: 0, padding: '0 4px' }} color="green">CA {rep.revenueScore}</Tag>
                            </Tooltip>
                            <Tooltip title="Taux de gain">
                              <Tag style={{ fontSize: 9, margin: 0, padding: '0 4px' }} color="gold">TG {rep.winRateScore}</Tag>
                            </Tooltip>
                            <Tooltip title="Complétion visites">
                              <Tag style={{ fontSize: 9, margin: 0, padding: '0 4px' }} color="cyan">Vis {rep.visitCompletionScore}</Tag>
                            </Tooltip>
                            <Tooltip title="Fréquence visites">
                              <Tag style={{ fontSize: 9, margin: 0, padding: '0 4px' }} color="purple">Freq {rep.visitFrequencyScore}</Tag>
                            </Tooltip>
                            <Tooltip title="Pipeline">
                              <Tag style={{ fontSize: 9, margin: 0, padding: '0 4px' }} color="blue">Pipe {rep.pipelineScore}</Tag>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </Col>

            {/* Alertes */}
            <Col xs={24} lg={8}>
              <Card
                size="small"
                title={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertOutlined style={{ color: '#f06548' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                      Alertes & Signaux
                    </span>
                    {supervision.alerts.length > 0 && (
                      <Badge
                        count={supervision.alerts.length}
                        style={{ backgroundColor: '#f06548', fontSize: 10, marginLeft: 'auto' }}
                      />
                    )}
                  </div>
                }
                styles={{
                  body: { padding: supervision.alerts.length > 0 ? '8px 12px 12px' : '20px 12px' },
                  header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
                }}
                style={{ ...cardS, height: '100%' }}
              >
                {supervision.alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#10B981' }}>
                    <CheckCircleOutlined style={{ fontSize: 28, marginBottom: 8 }} />
                    <div style={{ fontSize: 12, fontWeight: 500 }}>Aucune alerte — équipe performante</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflowY: 'auto' }}>
                    {supervision.alerts.map((alert, i) => {
                      const cfg = severityConfig[alert.severity] || severityConfig.INFO;
                      return (
                        <div
                          key={`alert-${i}`}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 8,
                            padding: '8px 10px',
                            background: `${cfg.color}08`,
                            border: `1px solid ${cfg.color}30`,
                            borderRadius: 6,
                          }}
                        >
                          <span style={{ color: cfg.color, fontSize: 14, marginTop: 1, flexShrink: 0 }}>
                            {cfg.icon}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#1e293b' }}>
                                {str(alert.repName)}
                              </span>
                              <Tag color={cfg.tag} style={{ fontSize: 9, margin: 0, padding: '0 4px', lineHeight: '16px' }}>
                                {alert.severity}
                              </Tag>
                            </div>
                            <div style={{ fontSize: 11, color: '#475569', lineHeight: '16px' }}>
                              {alert.message}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* ── Comparaison & Analyse comparative ────────────────────────── */}
      {supervision && supervision.repBenchmarks && supervision.repBenchmarks.length > 0 && supervision.teamBenchmark && (() => {
        const tb = supervision.teamBenchmark!;
        const reps = supervision.repBenchmarks;

        const devTag = (val: number, suffix = '%') => {
          if (Math.abs(val) < 0.5) return <Tag style={{ fontSize: 10, margin: 0 }} color="default"><MinusOutlined /> Moy.</Tag>;
          if (val > 0) return <Tag style={{ fontSize: 10, margin: 0 }} color="green"><ArrowUpOutlined /> +{val.toFixed(1)}{suffix}</Tag>;
          return <Tag style={{ fontSize: 10, margin: 0 }} color="red"><ArrowDownOutlined /> {val.toFixed(1)}{suffix}</Tag>;
        };

        const devPtsTag = (val: number) => {
          if (Math.abs(val) < 0.5) return <Tag style={{ fontSize: 10, margin: 0 }} color="default"><MinusOutlined /> Moy.</Tag>;
          if (val > 0) return <Tag style={{ fontSize: 10, margin: 0 }} color="green"><ArrowUpOutlined /> +{val.toFixed(1)} pts</Tag>;
          return <Tag style={{ fontSize: 10, margin: 0 }} color="red"><ArrowDownOutlined /> {val.toFixed(1)} pts</Tag>;
        };

        const benchColumns = [
          {
            title: 'Commercial',
            dataIndex: 'repName',
            key: 'repName',
            fixed: 'left' as const,
            width: 140,
            render: (name: string, _: unknown, i: number) => (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Avatar size={22} style={{ background: avatarColors[i % avatarColors.length], fontSize: 9, fontWeight: 600, flexShrink: 0 }}>
                  {initials(name)}
                </Avatar>
                <span style={{ fontSize: 11, fontWeight: 500 }}>{str(name)}</span>
              </div>
            ),
          },
          {
            title: 'CA Réalisé',
            key: 'revenue',
            align: 'center' as const,
            children: [
              { title: 'Valeur', dataIndex: 'revenue', key: 'rev_val', align: 'right' as const, width: 90,
                render: (v: number) => <span style={{ fontSize: 11 }}>{formatMAD(v)}</span> },
              { title: 'vs Moy.', dataIndex: 'revenueDeviation', key: 'rev_dev', align: 'center' as const, width: 90,
                sorter: (a: any, b: any) => a.revenueDeviation - b.revenueDeviation,
                render: (v: number) => devTag(v) },
            ],
          },
          {
            title: 'Taux de gain',
            key: 'winRate',
            align: 'center' as const,
            children: [
              { title: 'Valeur', dataIndex: 'winRate', key: 'wr_val', align: 'center' as const, width: 70,
                render: (v: number) => <span style={{ fontSize: 11, fontWeight: 600, color: winRateColor(v) }}>{v.toFixed(1)}%</span> },
              { title: 'vs Moy.', dataIndex: 'winRateDeviation', key: 'wr_dev', align: 'center' as const, width: 90,
                sorter: (a: any, b: any) => a.winRateDeviation - b.winRateDeviation,
                render: (v: number) => devPtsTag(v) },
            ],
          },
          {
            title: 'Pipeline',
            key: 'pipeline',
            align: 'center' as const,
            children: [
              { title: 'Valeur', dataIndex: 'pipelineValue', key: 'pipe_val', align: 'right' as const, width: 90,
                render: (v: number) => <span style={{ fontSize: 11 }}>{formatMAD(v)}</span> },
              { title: 'vs Moy.', dataIndex: 'pipelineDeviation', key: 'pipe_dev', align: 'center' as const, width: 90,
                sorter: (a: any, b: any) => a.pipelineDeviation - b.pipelineDeviation,
                render: (v: number) => devTag(v) },
            ],
          },
          {
            title: 'Visites',
            key: 'visits',
            align: 'center' as const,
            children: [
              { title: 'Total', dataIndex: 'totalVisits', key: 'vis_val', align: 'center' as const, width: 60,
                render: (v: number) => <Tag color="blue" style={{ fontSize: 10, margin: 0 }}>{v}</Tag> },
              { title: 'vs Moy.', dataIndex: 'visitsDeviation', key: 'vis_dev', align: 'center' as const, width: 90,
                sorter: (a: any, b: any) => a.visitsDeviation - b.visitsDeviation,
                render: (v: number) => devTag(v) },
            ],
          },
          {
            title: 'Complétion',
            key: 'completion',
            align: 'center' as const,
            children: [
              { title: 'Taux', dataIndex: 'visitCompletionRate', key: 'vc_val', align: 'center' as const, width: 70,
                render: (v: number) => <span style={{ fontSize: 11, fontWeight: 600, color: v >= 70 ? '#10B981' : v >= 40 ? '#f7b84b' : '#f06548' }}>{v.toFixed(1)}%</span> },
              { title: 'vs Moy.', dataIndex: 'visitCompletionDeviation', key: 'vc_dev', align: 'center' as const, width: 90,
                sorter: (a: any, b: any) => a.visitCompletionDeviation - b.visitCompletionDeviation,
                render: (v: number) => devPtsTag(v) },
            ],
          },
        ];

        return (
          <Card
            size="small"
            title={
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SwapOutlined style={{ color: '#4F46E5' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  Comparaison & Analyse comparative
                </span>
                <span style={{ fontSize: 10, color: '#94a3b8', marginLeft: 'auto' }}>
                  Moyennes : CA {formatMAD(tb.avgRevenue)} · TG {tb.avgWinRate.toFixed(1)}% · Pipeline {formatMAD(tb.avgPipeline)} · Visites {tb.avgVisits.toFixed(1)}
                </span>
              </div>
            }
            styles={{
              body: { padding: 0 },
              header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
            }}
            style={{ ...cardS, marginBottom: 12 }}
          >
            <Table
              dataSource={reps}
              columns={benchColumns}
              rowKey={(r) => r.userId || r.repName}
              pagination={false}
              size="small"
              scroll={{ x: 1000 }}
              bordered
              locale={{ emptyText: <Empty description="Aucune donnée" image={Empty.PRESENTED_IMAGE_SIMPLE} /> }}
            />
          </Card>
        );
      })()}

      {/* ── Row Terrain : KPIs Suivi Terrain ─────────────────── */}
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <EnvironmentOutlined style={{ color: '#299cdb' }} />
        Suivi Terrain
      </div>

      <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
        {[
          {
            t: 'Total Visites',
            v: totalVisitsAll,
            icon: <CalendarOutlined />,
            bg: 'rgba(41,156,219,0.12)',
            color: '#299cdb',
          },
          {
            t: 'Complétées',
            v: totalCompletedAll,
            icon: <CheckCircleOutlined />,
            bg: 'rgba(10,179,156,0.12)',
            color: '#10B981',
          },
          {
            t: 'Planifiées',
            v: totalPlannedAll,
            icon: <ClockCircleOutlined />,
            bg: 'rgba(247,184,75,0.14)',
            color: '#f7b84b',
          },
          {
            t: 'En cours',
            v: totalInProgressAll,
            icon: <FireOutlined />,
            bg: 'rgba(64,81,137,0.12)',
            color: '#4F46E5',
          },
          {
            t: 'Taux complétion',
            v: pct(avgCompletionRate),
            icon: <RiseOutlined />,
            bg: 'rgba(10,179,156,0.08)',
            color: '#10B981',
          },
          {
            t: 'Km parcourus',
            v: formatMAD(totalMileageAll),
            icon: <CarOutlined />,
            bg: 'rgba(240,101,72,0.10)',
            color: '#f06548',
          },
          {
            t: 'Frais terrain',
            v: `${formatMAD(totalExpensesAll)} MAD`,
            icon: <WalletOutlined />,
            bg: 'rgba(111,66,193,0.10)',
            color: '#6f42c1',
          },
        ].map((k, i) => (
          <Col xs={12} sm={8} lg={Math.floor(24 / 7)} key={`terrain-${i}`}>
            <Card
              size="small"
              styles={{ body: { padding: '10px 14px' } }}
              style={{ ...cardS, background: k.bg, border: 'none' }}
            >
              <Statistic
                title={<span style={{ fontSize: 11, color: k.color }}>{k.t}</span>}
                value={k.v}
                prefix={k.icon}
                valueStyle={{ color: k.color, fontSize: 16, fontWeight: 700, lineHeight: '24px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Terrain per-rep breakdown */}
      {data.length > 0 && (
        <Card
          size="small"
          title={
            <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
              <EnvironmentOutlined style={{ marginRight: 6 }} />
              Détail Terrain par Commercial
            </span>
          }
          styles={{
            body: { padding: 0 },
            header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
          }}
          style={{ ...cardS, marginBottom: 12 }}
        >
          <Table
            dataSource={data}
            rowKey="_uid"
            pagination={false}
            size="small"
            scroll={{ x: 700 }}
            locale={{
              emptyText: (
                <Empty description="Aucune donnée terrain" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              ),
            }}
            columns={[
              {
                title: 'Commercial',
                dataIndex: 'repName',
                key: 'repName',
                render: (name: unknown, _: unknown, i: number) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar
                      size={24}
                      style={{
                        background: avatarColors[i % avatarColors.length],
                        fontSize: 10,
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {initials(name)}
                    </Avatar>
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{str(name)}</span>
                  </div>
                ),
              },
              {
                title: 'Total',
                dataIndex: 'totalVisits',
                key: 'totalVisits',
                align: 'center' as const,
                width: 70,
                sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.totalVisits) - num(b.totalVisits),
                render: (v: unknown) => <Tag color="blue">{num(v)}</Tag>,
              },
              {
                title: 'Complétées',
                dataIndex: 'completedVisits',
                key: 'completedVisits',
                align: 'center' as const,
                width: 90,
                sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.completedVisits) - num(b.completedVisits),
                render: (v: unknown) => <Tag color="green">{num(v)}</Tag>,
              },
              {
                title: 'Planifiées',
                dataIndex: 'plannedVisits',
                key: 'plannedVisits',
                align: 'center' as const,
                width: 80,
                sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.plannedVisits) - num(b.plannedVisits),
                render: (v: unknown) => <Tag color="orange">{num(v)}</Tag>,
              },
              {
                title: 'En cours',
                dataIndex: 'inProgressVisits',
                key: 'inProgressVisits',
                align: 'center' as const,
                width: 80,
                sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.inProgressVisits) - num(b.inProgressVisits),
                render: (v: unknown) => <Tag color="purple">{num(v)}</Tag>,
              },
              {
                title: 'Complétion',
                dataIndex: 'visitCompletionRate',
                key: 'visitCompletionRate',
                align: 'center' as const,
                width: 120,
                sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.visitCompletionRate) - num(b.visitCompletionRate),
                render: (v: unknown) => {
                  const n = num(v);
                  return (
                    <Progress
                      percent={parseFloat(n.toFixed(1))}
                      size="small"
                      strokeColor={n >= 70 ? '#10B981' : n >= 40 ? '#f7b84b' : '#f06548'}
                      trailColor="#f1f5f9"
                      format={(p) => (
                        <span style={{ fontSize: 10, fontWeight: 600, color: n >= 70 ? '#10B981' : n >= 40 ? '#f7b84b' : '#f06548' }}>
                          {p}%
                        </span>
                      )}
                    />
                  );
                },
              },
              {
                title: 'Km',
                dataIndex: 'totalMileage',
                key: 'totalMileage',
                align: 'right' as const,
                width: 80,
                sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.totalMileage) - num(b.totalMileage),
                render: (v: unknown) => (
                  <span style={{ fontSize: 12, color: '#64748b' }}>{formatMAD(v)}</span>
                ),
              },
              {
                title: 'Frais',
                dataIndex: 'totalExpenses',
                key: 'totalExpenses',
                align: 'right' as const,
                width: 90,
                sorter: (a: CommercialKpi, b: CommercialKpi) => num(a.totalExpenses) - num(b.totalExpenses),
                render: (v: unknown) => (
                  <span style={{ fontSize: 12, color: '#6f42c1', fontWeight: 500 }}>
                    {formatMAD(v)}
                  </span>
                ),
              },
            ]}
          />
        </Card>
      )}

      {/* ── Tendances ─────────────────────────────────────────── */}
      {trends && trends.teamTrend.length > 0 && (() => {
        const labels = trends.teamTrend.map((m) => {
          const [y, mo] = m.month.split('-');
          const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          return `${monthNames[parseInt(mo, 10) - 1]} ${y.slice(2)}`;
        });

        const chartOpts: any = {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index' as const, intersect: false },
          plugins: {
            legend: { position: 'top' as const, labels: { font: { size: 10 }, usePointStyle: true, pointStyleWidth: 10 } },
          },
          scales: {
            x: { grid: { display: false }, ticks: { font: { size: 10 } } },
            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 } } },
          },
        };

        const revenueData = {
          labels,
          datasets: [
            {
              label: 'CA Réalisé',
              data: trends.teamTrend.map((m) => num(m.revenue)),
              borderColor: '#10B981',
              backgroundColor: 'rgba(10,179,156,0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#10B981',
            },
            {
              label: 'Pipeline',
              data: trends.teamTrend.map((m) => num(m.pipeline)),
              borderColor: '#4F46E5',
              backgroundColor: 'rgba(64,81,137,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#4F46E5',
            },
          ],
        };

        const dealsData = {
          labels,
          datasets: [
            {
              label: 'Deals gagnés',
              data: trends.teamTrend.map((m) => num(m.dealsWon)),
              backgroundColor: 'rgba(10,179,156,0.7)',
              borderRadius: 4,
            },
            {
              label: 'Deals perdus',
              data: trends.teamTrend.map((m) => num(m.dealsLost)),
              backgroundColor: 'rgba(240,101,72,0.7)',
              borderRadius: 4,
            },
            {
              label: 'Nouveaux deals',
              data: trends.teamTrend.map((m) => num(m.newDeals)),
              backgroundColor: 'rgba(41,156,219,0.5)',
              borderRadius: 4,
            },
          ],
        };

        const visitsData = {
          labels,
          datasets: [
            {
              label: 'Visites totales',
              data: trends.teamTrend.map((m) => num(m.visits)),
              borderColor: '#299cdb',
              backgroundColor: 'rgba(41,156,219,0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#299cdb',
            },
            {
              label: 'Visites complétées',
              data: trends.teamTrend.map((m) => num(m.completedVisits)),
              borderColor: '#10B981',
              backgroundColor: 'rgba(10,179,156,0.08)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#10B981',
            },
          ],
        };

        const winRateData = {
          labels,
          datasets: [
            {
              label: 'Taux de gain (%)',
              data: trends.teamTrend.map((m) => num(m.winRate)),
              borderColor: '#f7b84b',
              backgroundColor: 'rgba(247,184,75,0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 4,
              pointBackgroundColor: '#f7b84b',
            },
          ],
        };

        // Per-rep revenue lines
        const repRevenueData = {
          labels,
          datasets: trends.repTrends.map((rep, i) => ({
            label: str(rep.repName),
            data: rep.months.map((m) => num(m.revenue)),
            borderColor: avatarColors[i % avatarColors.length],
            backgroundColor: 'transparent',
            tension: 0.3,
            pointRadius: 3,
            borderWidth: 2,
            pointBackgroundColor: avatarColors[i % avatarColors.length],
          })),
        };

        return (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <LineChartOutlined style={{ color: '#4F46E5', fontSize: 14 }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>
                Tendances — {trends.monthsIncluded} derniers mois
              </span>
              <Select
                size="small"
                value={trendMetric}
                onChange={(v) => setTrendMetric(v)}
                options={[
                  { value: 'revenue', label: 'CA & Pipeline' },
                  { value: 'deals', label: 'Deals' },
                  { value: 'visits', label: 'Visites' },
                ]}
                style={{ width: 140, marginLeft: 'auto' }}
              />
            </div>

            <Row gutter={[10, 10]}>
              <Col xs={24} lg={14}>
                <Card size="small" styles={{ body: { padding: '10px 14px' } }} style={cardS}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    {trendMetric === 'revenue' ? 'CA Réalisé & Pipeline — Équipe' :
                     trendMetric === 'deals' ? 'Deals Gagnés / Perdus / Nouveaux — Équipe' :
                     'Visites Terrain — Équipe'}
                  </div>
                  <div style={{ height: 260 }}>
                    {trendMetric === 'revenue' && <Line data={revenueData} options={chartOpts} />}
                    {trendMetric === 'deals' && <Bar data={dealsData} options={chartOpts} />}
                    {trendMetric === 'visits' && <Line data={visitsData} options={chartOpts} />}
                  </div>
                </Card>
              </Col>
              <Col xs={24} lg={10}>
                <Card size="small" styles={{ body: { padding: '10px 14px' } }} style={cardS}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 6 }}>
                    {trendMetric === 'revenue' ? 'CA par Commercial' :
                     trendMetric === 'deals' ? 'Taux de gain — Évolution' :
                     'Taux Complétion Visites'}
                  </div>
                  <div style={{ height: 260 }}>
                    {trendMetric === 'revenue' && <Line data={repRevenueData} options={chartOpts} />}
                    {trendMetric === 'deals' && <Line data={winRateData} options={{
                      ...chartOpts,
                      scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 100, ticks: { ...chartOpts.scales.y.ticks, callback: (v: number) => `${v}%` } } },
                    }} />}
                    {trendMetric === 'visits' && <Line data={{
                      labels,
                      datasets: trends.repTrends.map((rep, i) => ({
                        label: str(rep.repName),
                        data: rep.months.map((m) => num(m.visits)),
                        borderColor: avatarColors[i % avatarColors.length],
                        backgroundColor: 'transparent',
                        tension: 0.3,
                        pointRadius: 3,
                        borderWidth: 2,
                        pointBackgroundColor: avatarColors[i % avatarColors.length],
                      })),
                    }} options={chartOpts} />}
                  </div>
                </Card>
              </Col>
            </Row>
          </div>
        );
      })()}

      {/* ── Row 2 : Classement visuel + Top performer ───────── */}
      <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
        {/* Ranking bar chart */}
        <Col xs={24} lg={16}>
          <Card
            size="small"
            title={
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
                  Classement — CA Réalisé
                </span>
                <Select
                  size="small"
                  value={sortKey}
                  onChange={(v) => setSortKey(v as keyof CommercialKpi)}
                  options={[
                    { value: 'revenue', label: 'CA Réalisé' },
                    { value: 'pipeline', label: 'Pipeline' },
                    { value: 'winRate', label: 'Taux de gain' },
                    { value: 'dealsWon', label: 'Deals gagnés' },
                    { value: 'openDeals', label: 'Deals ouverts' },
                  ]}
                  style={{ width: 140 }}
                />
              </div>
            }
            styles={{
              body: { padding: '10px 14px 14px' },
              header: { minHeight: 36, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
            }}
            style={cardS}
          >
            {sorted.length === 0 ? (
              <Empty description="Aucune donnée" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '20px 0' }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {sorted.map((rep, i) => {
                  const val = num(rep[sortKey]);
                  const maxVal = sorted.length ? Math.max(...sorted.map((r) => num(r[sortKey])), 1) : 1;
                  const pctBar = maxVal > 0 ? (val / maxVal) * 100 : 0;
                  const color = avatarColors[i % avatarColors.length];
                  return (
                    <div key={`rank-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 26, textAlign: 'right', fontSize: 11, color: '#94a3b8', flexShrink: 0 }}>
                        {i + 1}
                      </div>
                      <Avatar
                        size={22}
                        style={{ background: color, fontSize: 9, fontWeight: 600, flexShrink: 0 }}
                      >
                        {initials(rep.repName)}
                      </Avatar>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 500, color: '#1e293b', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {str(rep.repName)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div
                            style={{
                              flex: 1,
                              height: 8,
                              background: '#f1f5f9',
                              borderRadius: 4,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.max(pctBar, 1)}%`,
                                height: '100%',
                                background: color,
                                borderRadius: 4,
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color, whiteSpace: 'nowrap', minWidth: 70, textAlign: 'right' }}>
                            {sortKey === 'winRate'
                              ? pct(val)
                              : val > 1000
                              ? formatMAD(val)
                              : val}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </Col>

        {/* Top performer card + Win rate */}
        <Col xs={24} lg={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%' }}>
            {/* Best performer */}
            {best && (
              <Card
                size="small"
                styles={{ body: { padding: '14px 16px' } }}
                style={{ ...cardS, background: 'rgba(247,184,75,0.06)' }}
              >
                <div style={{ fontSize: 11, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>
                  🏆 Meilleur Performeur
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar
                    size={44}
                    style={{ background: '#f7b84b', fontSize: 15, fontWeight: 700, flexShrink: 0 }}
                  >
                    {initials(best.repName)}
                  </Avatar>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{str(best.repName)}</div>
                    <div style={{ fontSize: 12, color: '#10B981', fontWeight: 600 }}>
                      {formatMAD(best.revenue)} MAD
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {num(best.dealsWon)} affaires · TG {pct(best.winRate)}
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Win rate distribution */}
            <Card
              size="small"
              title={<span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>Taux de gain par commercial</span>}
              styles={{
                body: { padding: '8px 14px 12px' },
                header: { minHeight: 32, padding: '0 12px', borderBottom: '1px solid #f1f5f9' },
              }}
              style={{ ...cardS, flex: 1 }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {data.map((rep, i) => {
                  const wr = num(rep.winRate);
                  const name = str(rep.repName);
                  return (
                    <div key={`wr-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#94a3b8', width: 14, textAlign: 'right', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ fontSize: 11, color: '#475569', width: 90, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flexShrink: 0 }}>
                        {name.split(' ')[0] || name}
                      </span>
                      <Progress
                        percent={parseFloat(wr.toFixed(1))}
                        size="small"
                        strokeColor={winRateColor(wr)}
                        trailColor="#f1f5f9"
                        style={{ flex: 1, margin: 0 }}
                        format={(p) => (
                          <span style={{ fontSize: 10, color: winRateColor(wr), fontWeight: 600 }}>
                            {p}%
                          </span>
                        )}
                      />
                    </div>
                  );
                })}
                {data.length === 0 && (
                  <Empty description="Aucune donnée" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ margin: '8px 0' }} />
                )}
              </div>
            </Card>
          </div>
        </Col>
      </Row>

      {/* ── Row 3 : Cartes individuelles ───────────────────── */}
      {data.length > 0 && (
        <Row gutter={[10, 10]} style={{ marginBottom: 12 }}>
          {data.map((rep, i) => {
            const color = avatarColors[i % avatarColors.length];
            const share = totalRevenue > 0 ? (num(rep.revenue) / totalRevenue) * 100 : 0;
            const wr = num(rep.winRate);
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={`card-${i}`}>
                <Card
                  size="small"
                  styles={{ body: { padding: '12px 14px' } }}
                  style={{ ...cardS }}
                  hoverable
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <Avatar size={36} style={{ background: color, fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                      {initials(rep.repName)}
                    </Avatar>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {str(rep.repName)}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        Part du CA : {share.toFixed(1)}%
                      </div>
                    </div>
                    {i === 0 && <TrophyOutlined style={{ color: '#f7b84b', fontSize: 16, marginLeft: 'auto', flexShrink: 0 }} />}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#10B981' }}>{formatMAD(rep.revenue)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>CA réalisé</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: '#4F46E5' }}>{formatMAD(rep.pipeline)}</div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>Pipeline</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                    <Tag icon={<RiseOutlined />} color="green" style={{ fontSize: 10, margin: 0 }}>
                      {num(rep.dealsWon)} gagnés
                    </Tag>
                    <Tag icon={<FallOutlined />} color="red" style={{ fontSize: 10, margin: 0 }}>
                      {num(rep.dealsLost)} perdus
                    </Tag>
                    <Tag icon={<FireOutlined />} color="blue" style={{ fontSize: 10, margin: 0 }}>
                      {num(rep.openDeals)} ouverts
                    </Tag>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, padding: '6px 8px', background: 'rgba(41,156,219,0.06)', borderRadius: 6 }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#299cdb' }}>{num(rep.totalVisits)}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Visites</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>{num(rep.completedVisits)}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Faites</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f7b84b' }}>{num(rep.plannedVisits)}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Planif.</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#64748b' }}>{formatMAD(rep.totalMileage)}</div>
                      <div style={{ fontSize: 9, color: '#94a3b8' }}>Km</div>
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>
                      Taux de gain — {pct(wr)}
                    </div>
                    <Progress
                      percent={parseFloat(wr.toFixed(1))}
                      size="small"
                      strokeColor={winRateColor(wr)}
                      trailColor="#f1f5f9"
                      showInfo={false}
                    />
                  </div>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}

      {/* ── Row 4 : Tableau détaillé ────────────────────────── */}
      <Card
        size="small"
        title={
          <span style={{ fontSize: 12, fontWeight: 600, color: '#475569' }}>
            Tableau détaillé
          </span>
        }
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
          scroll={{ x: 860 }}
          locale={{
            emptyText: (
              <Empty description="Aucune donnée disponible" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ),
          }}
        />
      </Card>
    </div>
  );
}

// -- Export with Error Boundary ------------------------------------------------

export default function SupervisionCommerciauxPage() {
  return (
    <KpiErrorBoundary>
      <SupervisionCommerciauxContent />
    </KpiErrorBoundary>
  );
}
