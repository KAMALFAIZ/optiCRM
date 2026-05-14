import { useState, useEffect, useCallback } from 'react';
import {
  Card, Row, Col, Statistic, Spin, Progress, Tag, Table, Empty,
  Typography, Space, Tooltip, Badge,
} from 'antd';
import {
  TruckOutlined, DollarOutlined, RiseOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined,
  BarChartOutlined, UserOutlined, ShoppingOutlined, ReloadOutlined,
} from '@ant-design/icons';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, Tooltip as ChartTooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';
import { deliveryDashboardApi, DashboardKpi } from '@/api/deliveryReporting';
import { usersApi } from '@/api/users';
import { productsApi } from '@/api/products';
import { useMessage } from '@/hooks/useMessage';
import type { UserListItem } from '@/types/user';
import type { ProductListItem } from '@/types/product';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Title, ChartTooltip, Legend, Filler
);

const { Text, Title: ATitle } = Typography;

const VISIT_LABELS: Record<string, { label: string; color: string }> = {
  DELIVERED: { label: 'Livré',   color: '#52c41a' },
  PARTIAL:   { label: 'Partiel', color: '#13c2c2' },
  ABSENT:    { label: 'Absent',  color: '#fa8c16' },
  REFUSED:   { label: 'Refus',   color: '#ff4d4f' },
  CLOSED:    { label: 'Fermé',   color: '#8c8c8c' },
};

export default function DeliveryDashboardPage() {
  const { message } = useMessage();
  const [kpis, setKpis] = useState<DashboardKpi | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [products, setProducts] = useState<ProductListItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [data, usrs, prods] = await Promise.all([
        deliveryDashboardApi.getKpis(),
        usersApi.getAll({ size: 200 }),
        productsApi.getAll({ size: 200 }),
      ]);
      setKpis(data);
      setUsers(usrs.content);
      setProducts(prods.content);
    } catch {
      message.error('Erreur chargement tableau de bord');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const userName = (id?: string) => {
    if (!id) return '—';
    const u = users.find(u => u.id === id);
    return u ? `${u.firstName} ${u.lastName}` : id.substring(0, 8) + '…';
  };

  const productName = (id?: string) => {
    if (!id) return '—';
    const p = products.find(p => p.id === id);
    return p ? p.name : id.substring(0, 8) + '…';
  };

  if (!kpis && !loading) return <Empty description="Aucune donnée" />;

  // ── Graphique CA évolution ─────────────────────────────────────────────────
  const dailyLabels = (kpis?.dailyRevenue || []).map(d => dayjs(d.date).format('DD/MM'));
  const dailyRevData = (kpis?.dailyRevenue || []).map(d => Number(d.revenue || 0));

  const lineChartData = {
    labels: dailyLabels,
    datasets: [{
      label: 'CA (DH)',
      data: dailyRevData,
      borderColor: '#1677ff',
      backgroundColor: 'rgba(22,119,255,0.08)',
      fill: true,
      tension: 0.4,
      pointRadius: 3,
    }],
  };

  const lineChartOptions = {
    responsive: true,
    plugins: { legend: { display: false }, tooltip: { mode: 'index' as const } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: any) => `${v} DH` } },
    },
  };

  // ── Graphique top reps ─────────────────────────────────────────────────────
  const repLabels = (kpis?.topReps || []).map(r => userName(r.representativeId));
  const repData   = (kpis?.topReps || []).map(r => Number(r.revenue || 0));

  const repChartData = {
    labels: repLabels,
    datasets: [{
      label: 'CA (DH)',
      data: repData,
      backgroundColor: ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#13c2c2'],
      borderRadius: 6,
    }],
  };

  const barChartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v: any) => `${v} DH` } },
    },
  };

  // ── Graphique résultats visite ─────────────────────────────────────────────
  const visitKeys = Object.keys(kpis?.visitResultBreakdown || {});
  const visitDoughnut = {
    labels: visitKeys.map(k => VISIT_LABELS[k]?.label || k),
    datasets: [{
      data: visitKeys.map(k => Number(kpis?.visitResultBreakdown?.[k] || 0)),
      backgroundColor: visitKeys.map(k => VISIT_LABELS[k]?.color || '#ccc'),
      borderWidth: 2,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' as const } },
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <ATitle level={4} style={{ margin: 0 }}>
          <TruckOutlined className="mr-2" />Tableau de bord Livraison
        </ATitle>
        <Space>
          <Text type="secondary">{dayjs().format('DD/MM/YYYY')}</Text>
          <Tooltip title="Actualiser">
            <ReloadOutlined style={{ cursor: 'pointer', color: '#1677ff' }} onClick={loadData} />
          </Tooltip>
        </Space>
      </div>

      <Spin spinning={loading}>
        {/* ── Ligne 1 : Tournées ──────────────────────────────────────────── */}
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #1677ff' }}>
              <Statistic title="Tournées aujourd'hui" value={kpis?.toursToday ?? 0}
                prefix={<TruckOutlined />} valueStyle={{ color: '#1677ff' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
              <Statistic title="Tournées actives" value={kpis?.toursActive ?? 0}
                prefix={<Badge status="processing" />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #fa8c16' }}>
              <Statistic title="Brouillons" value={kpis?.toursDraft ?? 0}
                prefix={<ClockCircleOutlined />} valueStyle={{ color: '#fa8c16' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #8c8c8c' }}>
              <Statistic title="Clôturées (total)" value={kpis?.toursClosed ?? 0}
                prefix={<CheckCircleOutlined />} />
            </Card>
          </Col>
        </Row>

        {/* ── Ligne 2 : CA & Encaissement ─────────────────────────────────── */}
        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #1677ff' }}>
              <Statistic title="CA aujourd'hui" value={Number(kpis?.revenueToday ?? 0).toFixed(2)}
                suffix="DH" prefix={<DollarOutlined />} valueStyle={{ color: '#1677ff' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #52c41a' }}>
              <Statistic title="CA mois en cours" value={Number(kpis?.revenueMonth ?? 0).toFixed(2)}
                suffix="DH" prefix={<RiseOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #13c2c2' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Taux encaissement (mois)</Text>
                <div className="mt-1">
                  <Progress
                    percent={kpis?.collectionRateMonth ?? 0}
                    strokeColor={
                      (kpis?.collectionRateMonth ?? 0) >= 80 ? '#52c41a'
                        : (kpis?.collectionRateMonth ?? 0) >= 50 ? '#fa8c16' : '#ff4d4f'
                    }
                    size="small"
                  />
                </div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" style={{ borderTop: '3px solid #ff4d4f' }}>
              <Statistic title="Crédit en souffrance"
                value={Number(kpis?.totalOutstandingCredit ?? 0).toFixed(2)} suffix="DH"
                prefix={<WarningOutlined />} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
        </Row>

        {/* ── Ligne 3 : Graphiques ──────────────────────────────────────────── */}
        <Row gutter={16} className="mb-4">
          <Col span={16}>
            <Card
              size="small"
              title={<Space><BarChartOutlined />Évolution CA — 30 derniers jours</Space>}
            >
              {dailyRevData.some(v => v > 0)
                ? <Line data={lineChartData} options={lineChartOptions} height={100} />
                : <Empty description="Aucune donnée sur la période" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              }
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" title={<Space><CheckCircleOutlined />Résultats visites (mois)</Space>}>
              {visitKeys.some(k => (kpis?.visitResultBreakdown?.[k] || 0) > 0)
                ? <Doughnut data={visitDoughnut} options={doughnutOptions} />
                : <Empty description="Aucune visite ce mois" image={Empty.PRESENTED_IMAGE_SIMPLE} />
              }
            </Card>
          </Col>
        </Row>

        {/* ── Ligne 4 : Top Reps & Top Articles ─────────────────────────────── */}
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title={<Space><UserOutlined />Top représentants (mois)</Space>}>
              {(kpis?.topReps || []).length > 0 ? (
                <>
                  <Bar data={repChartData} options={barChartOptions} height={140} />
                  <Table
                    dataSource={kpis?.topReps || []}
                    rowKey="representativeId"
                    size="small"
                    pagination={false}
                    className="mt-3"
                    columns={[
                      { title: 'Représentant', dataIndex: 'representativeId',
                        render: id => <Text strong>{userName(id)}</Text> },
                      { title: 'CA', dataIndex: 'revenue', align: 'right',
                        render: v => <Text style={{ color: '#1677ff' }}>{Number(v || 0).toFixed(2)} DH</Text> },
                    ]}
                  />
                </>
              ) : <Empty description="Aucune vente ce mois" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title={<Space><ShoppingOutlined />Top articles (mois)</Space>}>
              {(kpis?.topItems || []).length > 0 ? (
                <Table
                  dataSource={kpis?.topItems || []}
                  rowKey="itemId"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '#', render: (_, __, i) => <Tag>{i + 1}</Tag>, width: 40 },
                    { title: 'Article', dataIndex: 'itemId',
                      render: id => <Text strong>{productName(id)}</Text> },
                    { title: 'Qté', dataIndex: 'quantity', align: 'center',
                      render: v => <Tag color="blue">{v}</Tag> },
                    { title: 'CA', dataIndex: 'revenue', align: 'right',
                      render: v => <Text style={{ color: '#52c41a' }}>{Number(v || 0).toFixed(2)} DH</Text> },
                  ]}
                />
              ) : <Empty description="Aucune vente ce mois" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
}
