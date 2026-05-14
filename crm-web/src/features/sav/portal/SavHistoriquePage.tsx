import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Table, Tag, Button, Typography, Space, message } from 'antd';
import { PlusOutlined, EyeOutlined } from '@ant-design/icons';
import { savPortalApi } from '@/api/sav';

const { Title } = Typography;

const STATUT_COLORS: Record<string, string> = {
  OUVERT: 'blue', EN_ANALYSE: 'processing', EN_COURS: 'processing',
  RESOLU: 'success', ESCALADE: 'warning', FERME: 'default', ANNULE: 'default',
};

const CRITICITE_COLORS: Record<string, string> = {
  P1: 'red', P2: 'orange', P3: 'blue',
};

export default function SavHistoriquePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('sav_token') || '';
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) { navigate('/sav'); return; }
    savPortalApi.getMyTickets(token)
      .then(({ data }) => setTickets(Array.isArray(data) ? data : []))
      .catch(() => message.error('Erreur chargement tickets'))
      .finally(() => setLoading(false));
  }, [token, navigate]);

  const columns = [
    {
      title: 'N° Ticket',
      dataIndex: 'numero',
      key: 'numero',
      render: (v: string) => <span className="font-mono font-medium">{v}</span>,
    },
    {
      title: 'Domaine',
      dataIndex: 'domaine',
      key: 'domaine',
      render: (v: string) => v ? <Tag>{v}</Tag> : '—',
    },
    {
      title: 'Criticité',
      dataIndex: 'criticite',
      key: 'criticite',
      render: (v: string) => v ? <Tag color={CRITICITE_COLORS[v]}>{v}</Tag> : '—',
    },
    {
      title: 'Statut',
      dataIndex: 'statut',
      key: 'statut',
      render: (v: string) => <Tag color={STATUT_COLORS[v] || 'default'}>{v?.replace('_', ' ')}</Tag>,
    },
    {
      title: 'Date',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (v: string) => new Date(v).toLocaleDateString('fr-MA'),
    },
    {
      title: '',
      key: 'action',
      render: (_: any, record: any) => (
        <Button
          icon={<EyeOutlined />}
          size="small"
          onClick={() => navigate(`/sav/ticket/${record.numero}`)}
          className="rounded-lg"
        >
          Voir
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="!mb-0">Mes Tickets SAV</Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/sav/nouveau')}
              className="rounded-lg bg-blue-600"
            >
              Nouveau ticket
            </Button>
          </div>

          <Table
            columns={columns}
            dataSource={tickets}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: 'Aucun ticket pour le moment' }}
          />
        </Card>
      </div>
    </div>
  );
}
