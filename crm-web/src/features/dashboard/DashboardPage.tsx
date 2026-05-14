import { useEffect } from 'react';
import { Card, Row, Col, Statistic, Table, Spin, Alert } from 'antd';
import {
  BankOutlined,
  TeamOutlined,
  UserAddOutlined,
  FundProjectionScreenOutlined,
  DollarOutlined,
  RiseOutlined,
  TrophyOutlined,
} from '@ant-design/icons';

import { useAppDispatch, useAppSelector } from '@/store';
import { fetchDashboardStats } from './dashboardSlice';

// -- Helpers ------------------------------------------------------------------

const formatMAD = (value: number): string =>
  value.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

// -- Pastel palette -----------------------------------------------------------

const p = {
  blue:   { bg: 'rgba(96,165,250,0.15)',  solid: '#60a5fa' },
  green:  { bg: 'rgba(74,222,128,0.15)',   solid: '#4ade80' },
  amber:  { bg: 'rgba(251,191,36,0.15)',   solid: '#fbbf24' },
  purple: { bg: 'rgba(167,139,250,0.15)',  solid: '#a78bfa' },
  cyan:   { bg: 'rgba(34,211,238,0.15)',   solid: '#22d3ee' },
  rose:   { bg: 'rgba(251,113,133,0.15)',  solid: '#fb7185' },
};

const cardS = { borderRadius: 8, border: '1px solid #f1f5f9' };
const sectionTitle = (t: string) => (
  <span style={{ fontSize: 12, fontWeight: 500, color: '#475569' }}>{t}</span>
);

// -- Component ----------------------------------------------------------------

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { stats, loading, error } = useAppSelector((s) => s.dashboard);

  useEffect(() => {
    dispatch(fetchDashboardStats());
  }, [dispatch]);

  if (loading && !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="Chargement du tableau de bord..." />
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div style={{ padding: '24px 16px' }}>
        <Alert type="error" message="Erreur" description={error} showIcon />
      </div>
    );
  }

  if (!stats) return null;

  // -- Derived data -----------------------------------------------------------

  const maxRevenue = stats.revenueByMonth.length
    ? Math.max(...stats.revenueByMonth.map((r) => r.amount))
    : 1;

  const leadSourceEntries = Object.entries(stats.leadsBySource).sort(
    ([, a], [, b]) => b - a
  );

  const leadSourceColumns = [
    {
      title: 'Source',
      dataIndex: 'source',
      key: 'source',
      render: (v: string) => <span style={{ fontSize: 12, fontWeight: 500 }}>{v}</span>,
    },
    {
      title: 'Nombre',
      dataIndex: 'count',
      key: 'count',
      width: 100,
      render: (v: number) => <span style={{ fontSize: 12 }}>{v}</span>,
    },
    {
      title: '%',
      dataIndex: 'percent',
      key: 'percent',
      width: 80,
      render: (v: number) => <span style={{ fontSize: 12, color: '#64748b' }}>{v.toFixed(1)}%</span>,
    },
  ];

  const totalLeadsSrc = leadSourceEntries.reduce((s, [, c]) => s + c, 0) || 1;
  const leadSourceData = leadSourceEntries.map(([source, count], idx) => ({
    key: idx,
    source,
    count,
    percent: (count / totalLeadsSrc) * 100,
  }));

  // -- Render -----------------------------------------------------------------

  return (
    <div style={{ padding: '12px 16px' }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: '#1e293b', marginBottom: 10 }}>
        Tableau de bord
      </div>

      {/* Row 1 - KPI cards */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        {[
          { t: 'Comptes', v: stats.totalAccounts, icon: <BankOutlined />, c: p.blue },
          { t: 'Contacts', v: stats.totalContacts, icon: <TeamOutlined />, c: p.green },
          { t: 'Pistes', v: stats.totalLeads, icon: <UserAddOutlined />, c: p.amber },
          { t: 'Opportunit\u00e9s', v: stats.totalOpportunities, icon: <FundProjectionScreenOutlined />, c: p.purple },
        ].map((k, i) => (
          <Col xs={12} lg={6} key={i}>
            <Card
              size="small"
              styles={{ body: { padding: '8px 12px' } }}
              style={{ ...cardS, background: k.c.bg, border: 'none' }}
            >
              <Statistic
                title={<span style={{ fontSize: 11, color: k.c.solid }}>{k.t}</span>}
                value={k.v}
                prefix={k.icon}
                valueStyle={{ color: k.c.solid, fontSize: 17, fontWeight: 600, lineHeight: '24px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 2 - Financial cards */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        {[
          { t: 'Pipeline total', v: stats.pipelineTotal, icon: <DollarOutlined />, c: p.blue },
          { t: 'Pipeline pond\u00e9r\u00e9', v: stats.pipelineWeighted, icon: <RiseOutlined />, c: p.cyan },
          { t: 'CA Ann\u00e9e', v: stats.revenueThisYear, icon: <TrophyOutlined />, c: p.green },
        ].map((k, i) => (
          <Col xs={24} lg={8} key={i}>
            <Card
              size="small"
              styles={{ body: { padding: '8px 12px' } }}
              style={{ ...cardS, background: k.c.bg, border: 'none' }}
            >
              <Statistic
                title={<span style={{ fontSize: 11, color: k.c.solid }}>{k.t}</span>}
                value={k.v}
                prefix={k.icon}
                suffix=""
                valueStyle={{ color: k.c.solid, fontSize: 17, fontWeight: 600, lineHeight: '24px' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Row 3 - Conversion rate + Revenue by month bar chart */}
      <Row gutter={[8, 8]} style={{ marginBottom: 8 }}>
        <Col xs={24} lg={6}>
          <Card
            size="small"
            title={sectionTitle('Taux de conversion')}
            styles={{
              body: { padding: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200 },
              header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' },
            }}
            style={cardS}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                border: `6px solid ${p.green.solid}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: p.green.solid }}>
                {stats.conversionRate.toFixed(1)}%
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
              Gagn\u00e9 ce mois : {formatMAD(stats.wonThisMonth)}
            </div>
            <div style={{ fontSize: 11, color: '#64748b', textAlign: 'center' }}>
              Gagn\u00e9 cette ann\u00e9e : {stats.wonThisYear} deals
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={18}>
          <Card
            size="small"
            title={sectionTitle('Chiffre d\'affaires par mois')}
            styles={{
              body: { padding: '8px 12px 12px' },
              header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' },
            }}
            style={cardS}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180 }}>
              {stats.revenueByMonth.map((r, idx) => {
                const pct = maxRevenue > 0 ? (r.amount / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      height: '100%',
                    }}
                  >
                    <span style={{ fontSize: 9, color: '#64748b', marginBottom: 4 }}>
                      {(r.amount / 1000).toFixed(0)}K
                    </span>
                    <div
                      style={{
                        width: '70%',
                        height: `${Math.max(pct, 2)}%`,
                        background: 'linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: 4,
                        transition: 'height 0.3s ease',
                      }}
                    />
                    <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 4 }}>
                      {r.month}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Row 4 - Leads by source */}
      <Row gutter={[8, 8]}>
        <Col xs={24} lg={24}>
          <Card
            size="small"
            title={sectionTitle('Pistes par source')}
            styles={{
              body: { padding: 0 },
              header: { minHeight: 32, padding: '0 10px', borderBottom: '1px solid #f1f5f9' },
            }}
            style={cardS}
          >
            <Table
              dataSource={leadSourceData}
              columns={leadSourceColumns}
              rowKey="key"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
