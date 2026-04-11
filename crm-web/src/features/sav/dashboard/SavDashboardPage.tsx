import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Card, Statistic, Table, Tag, Button, Badge, Typography,
  Progress, Space, Divider, message,
} from 'antd';
import {
  AlertOutlined, CheckCircleOutlined, RobotOutlined, BookOutlined,
  ArrowRightOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { savDashboardApi } from '@/api/sav';

const { Title, Text } = Typography;

const CRITICITE_COLORS: Record<string, string> = { P1: 'red', P2: 'orange', P3: 'blue' };

export default function SavDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [prendreLoading, setPrendreLoading] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const { data } = await savDashboardApi.getStats();
      setStats(data);
    } catch {
      message.error('Erreur chargement dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const handlePrendreEnCharge = async (id: string) => {
    setPrendreLoading(id);
    try {
      await savDashboardApi.prendreEnCharge(id);
      message.success('Escalade prise en charge');
      fetchStats();
    } finally {
      setPrendreLoading(null);
    }
  };

  const totalOuverts = (stats.tickets_ouverts_p1 || 0) + (stats.tickets_ouverts_p2 || 0) + (stats.tickets_ouverts_p3 || 0);
  const tauxAuto = Math.round(stats.taux_resolution_ia || 0);

  const escaladeColumns = [
    {
      title: 'Ticket',
      dataIndex: 'numero_ticket',
      key: 'numero',
      render: (v: string) => <span className="font-mono font-semibold">{v}</span>,
    },
    { title: 'Client', dataIndex: 'client', key: 'client' },
    {
      title: 'Criticité',
      dataIndex: 'criticite',
      key: 'criticite',
      render: (v: string) => <Tag color={CRITICITE_COLORS[v]}>{v}</Tag>,
    },
    { title: 'Domaine', dataIndex: 'domaine', key: 'domaine', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Raison',
      dataIndex: 'raison',
      key: 'raison',
      ellipsis: true,
      render: (v: string) => <Text type="secondary" className="text-xs">{v}</Text>,
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          size="small"
          type="primary"
          loading={prendreLoading === record.id}
          onClick={() => handlePrendreEnCharge(record.id)}
          icon={<ArrowRightOutlined />}
          className="rounded-lg"
        >
          Prendre en charge
        </Button>
      ),
    },
  ];

  const domaineData = Object.entries(stats.tickets_par_domaine || {}).map(([k, v]) => ({
    domaine: k, count: v as number,
  }));

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <Title level={3} className="!mb-0">📊 Dashboard SAV IA</Title>
        <Button icon={<ReloadOutlined />} onClick={fetchStats} loading={loading}>
          Actualiser
        </Button>
      </div>

      {/* KPI Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} xl={6}>
          <Card className="rounded-xl shadow">
            <Statistic
              title={<><AlertOutlined className="text-orange-500 mr-1" />Tickets ouverts</>}
              value={totalOuverts}
              suffix={
                <Space className="text-sm ml-2">
                  <Tag color="red">P1: {stats.tickets_ouverts_p1 || 0}</Tag>
                  <Tag color="orange">P2: {stats.tickets_ouverts_p2 || 0}</Tag>
                  <Tag color="blue">P3: {stats.tickets_ouverts_p3 || 0}</Tag>
                </Space>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="rounded-xl shadow">
            <Statistic
              title={<><CheckCircleOutlined className="text-green-500 mr-1" />Résolus (7 jours)</>}
              value={stats.resolus_7_jours || 0}
              valueStyle={{ color: '#16a34a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="rounded-xl shadow">
            <div className="flex flex-col">
              <Text type="secondary" className="mb-2">
                <AlertOutlined className="text-red-500 mr-1" />Escalades en attente
              </Text>
              <div className="flex items-center gap-2">
                <Badge count={stats.escalades_en_attente || 0} color="red" />
                <Button size="small" onClick={() => navigate('/app/sav/escalades')} className="rounded-lg">
                  Voir
                </Button>
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="rounded-xl shadow">
            <div>
              <Text type="secondary"><RobotOutlined className="mr-1" />Taux résolution IA</Text>
              <div className="mt-2">
                <Progress percent={tauxAuto} strokeColor="#2563eb" format={(p) => `${p}%`} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Escalades en attente */}
      {(stats.escalades_liste?.length > 0) && (
        <Card
          title={<><AlertOutlined className="text-red-500 mr-2" />⚠️ Escalades en attente</>}
          className="rounded-xl shadow mb-6"
          extra={<Tag color="red">{stats.escalades_en_attente} en attente</Tag>}
        >
          <Table
            columns={escaladeColumns}
            dataSource={stats.escalades_liste || []}
            rowKey="id"
            pagination={false}
            size="small"
          />
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {/* Tickets par domaine */}
        <Col xs={24} md={12}>
          <Card title="📈 Tickets par domaine (7 jours)" className="rounded-xl shadow">
            {domaineData.length === 0 ? (
              <Text type="secondary">Aucun ticket cette semaine</Text>
            ) : (
              <Table
                dataSource={domaineData}
                rowKey="domaine"
                size="small"
                pagination={false}
                columns={[
                  { title: 'Domaine', dataIndex: 'domaine', render: (v) => <Tag>{v}</Tag> },
                  { title: 'Tickets', dataIndex: 'count', align: 'right' },
                ]}
              />
            )}
          </Card>
        </Col>

        {/* KB Stats */}
        <Col xs={24} md={12}>
          <Card
            title="🧠 État Knowledge Base"
            className="rounded-xl shadow"
            extra={
              <Button size="small" onClick={() => navigate('/app/sav/kb')} icon={<BookOutlined />} className="rounded-lg">
                Gérer la KB →
              </Button>
            }
          >
            <Row gutter={16}>
              <Col span={12}>
                <Statistic title="Articles actifs" value={stats.kb_articles_actifs || 0} />
              </Col>
              <Col span={12}>
                <Statistic title="Validés" value={stats.kb_articles_valides || 0} valueStyle={{ color: '#16a34a' }} />
              </Col>
            </Row>
            <Divider className="my-3" />
            <Progress
              percent={stats.kb_articles_actifs > 0
                ? Math.round((stats.kb_articles_valides / stats.kb_articles_actifs) * 100)
                : 0}
              format={(p) => `${p}% validés`}
              strokeColor="#16a34a"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
