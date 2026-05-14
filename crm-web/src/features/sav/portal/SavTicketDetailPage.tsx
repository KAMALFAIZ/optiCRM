import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Card, Typography, Tag, Button, Rate, Input, message, Spin, Timeline, Space, Divider,
} from 'antd';
import {
  CheckCircleOutlined, CloseCircleOutlined, UserOutlined, RobotOutlined, TeamOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { savPortalApi } from '@/api/sav';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUT_COLORS: Record<string, string> = {
  OUVERT: 'blue', EN_ANALYSE: 'processing', EN_COURS: 'processing',
  RESOLU: 'success', ESCALADE: 'warning', FERME: 'default', ANNULE: 'default',
};

const EXPEDITEUR_ICONS = {
  CLIENT: <UserOutlined />,
  AGENT_IA: <RobotOutlined />,
  KAMAL: <TeamOutlined />,
};

interface TicketData {
  ticket: Record<string, any>;
  messages: Array<{ expediteur: string; contenu: string; langue: string; date: string }>;
}

export default function SavTicketDetailPage() {
  const { numero } = useParams<{ numero: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('sav_token') || '';

  const [data, setData] = useState<TicketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [rating, setRating] = useState(0);

  const fetchTicket = useCallback(async () => {
    try {
      const { data: res } = await savPortalApi.getTicket(token, numero!);
      setData(res);
    } catch {
      message.error('Ticket non trouvé');
      navigate('/sav/historique');
    } finally {
      setLoading(false);
    }
  }, [numero, token, navigate]);

  useEffect(() => {
    if (!token) { navigate('/sav'); return; }
    fetchTicket();
    // Polling toutes les 5 secondes si ticket actif
    const interval = setInterval(() => {
      if (data?.ticket?.statut && !['RESOLU', 'FERME', 'ANNULE'].includes(data.ticket.statut)) {
        fetchTicket();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchTicket, token, navigate]);

  const handleConfirm = async (resolved: boolean) => {
    setConfirming(true);
    try {
      await savPortalApi.confirmResolution(token, numero!, resolved);
      message.success(resolved ? 'Merci ! Ticket fermé.' : 'Dossier transmis à notre équipe.');
      fetchTicket();
    } finally {
      setConfirming(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spin size="large" /></div>;
  if (!data) return null;

  const { ticket, messages } = data;
  const isEnCours = ticket.statut === 'EN_COURS';
  const isResolu = ticket.statut === 'RESOLU';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/sav/historique')} className="mb-4">
          Mes tickets
        </Button>

        <Card className="shadow-lg rounded-2xl mb-4">
          <div className="flex justify-between items-start">
            <div>
              <Title level={4} className="!mb-1">Ticket {ticket.numero}</Title>
              <Space>
                <Tag color={STATUT_COLORS[ticket.statut] || 'default'}>{ticket.statut.replace('_', ' ')}</Tag>
                {ticket.criticite && <Tag color={ticket.criticite === 'P1' ? 'red' : ticket.criticite === 'P2' ? 'orange' : 'blue'}>{ticket.criticite}</Tag>}
                {ticket.domaine && <Tag>{ticket.domaine}</Tag>}
              </Space>
            </div>
          </div>
        </Card>

        {/* Messages */}
        <Card className="shadow-lg rounded-2xl mb-4">
          <Title level={5}>Conversation</Title>
          <Timeline
            items={messages.map((msg, i) => ({
              key: i,
              dot: EXPEDITEUR_ICONS[msg.expediteur as keyof typeof EXPEDITEUR_ICONS] || <UserOutlined />,
              color: msg.expediteur === 'AGENT_IA' ? 'blue' : msg.expediteur === 'KAMAL' ? 'green' : 'gray',
              children: (
                <div className={`p-3 rounded-lg mb-2 ${msg.expediteur === 'AGENT_IA' ? 'bg-blue-50' : msg.expediteur === 'KAMAL' ? 'bg-green-50' : 'bg-gray-50'}`}>
                  <div className="flex justify-between mb-1">
                    <Text strong className="text-sm">
                      {msg.expediteur === 'AGENT_IA' ? '🤖 Assistant KASOFT' : msg.expediteur === 'KAMAL' ? '👨‍💻 Équipe KASOFT' : '👤 Vous'}
                    </Text>
                    <Text type="secondary" className="text-xs">{new Date(msg.date).toLocaleString('fr-MA')}</Text>
                  </div>
                  <Paragraph className="!mb-0 whitespace-pre-wrap">{msg.contenu}</Paragraph>
                </div>
              ),
            }))}
          />
        </Card>

        {/* Confirmation résolution */}
        {isEnCours && (
          <Card className="shadow-lg rounded-2xl mb-4 border-blue-200">
            <Title level={5}>Le problème est-il résolu ?</Title>
            <Space size="middle">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                loading={confirming}
                onClick={() => handleConfirm(true)}
                className="bg-green-600 hover:bg-green-700 rounded-lg"
              >
                ✅ Oui, problème résolu
              </Button>
              <Button
                danger
                icon={<CloseCircleOutlined />}
                loading={confirming}
                onClick={() => handleConfirm(false)}
                className="rounded-lg"
              >
                ❌ Toujours bloqué
              </Button>
            </Space>
          </Card>
        )}

        {/* Évaluation */}
        {isResolu && (
          <Card className="shadow-lg rounded-2xl border-green-200">
            <Title level={5}>Évaluez notre assistance</Title>
            <Rate value={rating} onChange={setRating} className="text-2xl" />
            {rating > 0 && (
              <div className="mt-2">
                <Text type="secondary">Merci pour votre retour ! ⭐</Text>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
