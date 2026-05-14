import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Tag, Button, Typography, Space, Divider,
  Timeline, Input, Switch, message, Spin, Select, Breadcrumb,
  Descriptions, Badge,
} from 'antd';
import {
  ArrowLeftOutlined, SendOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsApi } from '@/api/tickets';
import type { Ticket, TicketStatus, TicketPriority } from '@/types/ticket';
import TicketFormModal from './TicketFormModal';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const STATUS_OPTIONS: { value: TicketStatus; label: string; color: string }[] = [
  { value: 'OUVERT',     label: 'Ouvert',      color: 'blue' },
  { value: 'EN_COURS',   label: 'En cours',    color: 'processing' },
  { value: 'EN_ATTENTE', label: 'En attente',  color: 'warning' },
  { value: 'RESOLU',     label: 'Résolu',      color: 'success' },
  { value: 'FERME',      label: 'Fermé',       color: 'default' },
];

const PRIORITY_COLOR: Record<TicketPriority, string> = {
  BASSE: 'default', NORMALE: 'blue', HAUTE: 'orange', CRITIQUE: 'red',
};
const PRIORITY_LABEL: Record<TicketPriority, string> = {
  BASSE: 'Basse', NORMALE: 'Normale', HAUTE: 'Haute', CRITIQUE: 'Critique',
};
const CATEGORY_LABEL: Record<string, string> = {
  SAV: 'SAV', TECHNIQUE: 'Technique', COMMERCIAL: 'Commercial',
  FACTURATION: 'Facturation', LIVRAISON: 'Livraison', AUTRE: 'Autre',
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setTicket(await ticketsApi.getById(id));
    } catch {
      message.error('Ticket introuvable');
      navigate('/tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusChange = async (status: TicketStatus) => {
    if (!id) return;
    try {
      const updated = await ticketsApi.changeStatus(id, status);
      setTicket(updated);
      message.success('Statut mis à jour');
    } catch {
      message.error('Erreur');
    }
  };

  const handleSendComment = async () => {
    if (!id || !comment.trim()) return;
    setSendingComment(true);
    try {
      await ticketsApi.addComment(id, comment, isInternal);
      setComment('');
      await load();
      message.success('Commentaire ajouté');
    } catch {
      message.error('Erreur');
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!ticket) return null;

  const statusOpt = STATUS_OPTIONS.find(s => s.value === ticket.status);

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/tickets')}>Retour</Button>
        <Breadcrumb items={[
          { title: 'Tickets' },
          { title: ticket.reference },
        ]} />
      </Space>

      <Row gutter={24}>
        {/* Colonne principale */}
        <Col xs={24} lg={16}>
          <Card>
            <Space style={{ marginBottom: 8 }}>
              <Text type="secondary" style={{ fontFamily: 'monospace' }}>{ticket.reference}</Text>
              <Badge status={statusOpt?.color as any} text={statusOpt?.label} />
              {ticket.slaBreached && <Tag color="red">SLA dépassé</Tag>}
            </Space>

            <Title level={4} style={{ marginTop: 8 }}>{ticket.title}</Title>

            <Space wrap style={{ marginBottom: 16 }}>
              <Tag color={PRIORITY_COLOR[ticket.priority]}>{PRIORITY_LABEL[ticket.priority]}</Tag>
              <Tag>{CATEGORY_LABEL[ticket.category] || ticket.category}</Tag>
            </Space>

            {ticket.description && (
              <Paragraph style={{ background: '#fafafa', padding: 12, borderRadius: 6 }}>
                {ticket.description}
              </Paragraph>
            )}

            <Divider>Commentaires ({ticket.comments.length})</Divider>

            <Timeline
              items={ticket.comments.map(c => ({
                color: c.internal ? 'orange' : 'blue',
                children: (
                  <Card
                    size="small"
                    style={{ background: c.internal ? '#fffbe6' : '#fff', marginBottom: 8 }}
                  >
                    <Space style={{ marginBottom: 4 }}>
                      <Text strong style={{ fontSize: 13 }}>{c.authorName || 'Inconnu'}</Text>
                      {c.internal && <Tag color="orange" style={{ fontSize: 10 }}>Note interne</Tag>}
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        {new Date(c.createdAt).toLocaleString('fr-FR')}
                      </Text>
                    </Space>
                    <Paragraph style={{ margin: 0, fontSize: 13 }}>{c.content}</Paragraph>
                  </Card>
                ),
              }))}
            />

            <Divider>Ajouter un commentaire</Divider>
            <TextArea
              rows={3}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Votre commentaire..."
            />
            <Space style={{ marginTop: 8 }} align="center">
              <Switch
                checked={isInternal}
                onChange={setIsInternal}
                size="small"
              />
              <Text style={{ fontSize: 12 }}>Note interne (non visible client)</Text>
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendComment}
                loading={sendingComment}
                disabled={!comment.trim()}
              >
                Envoyer
              </Button>
            </Space>
          </Card>
        </Col>

        {/* Colonne droite */}
        <Col xs={24} lg={8}>
          <Card title="Actions" style={{ marginBottom: 16 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>Statut</Text>
                <Select
                  value={ticket.status}
                  onChange={handleStatusChange}
                  style={{ width: '100%', marginTop: 4 }}
                  options={STATUS_OPTIONS.map(s => ({ value: s.value, label: s.label }))}
                />
              </div>
              <Button block onClick={() => setEditOpen(true)}>Modifier le ticket</Button>
            </Space>
          </Card>

          <Card title="Informations">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Client">
                {ticket.account ? (
                  <a onClick={() => navigate(`/accounts/${ticket.account!.id}`)}>
                    {ticket.account.name}
                  </a>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Contact">
                {ticket.contact?.name || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Assigné à">
                {ticket.assignedTo?.fullName || <Text type="secondary">Non assigné</Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Créé par">
                {ticket.createdBy?.fullName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Créé le">
                {new Date(ticket.createdAt).toLocaleString('fr-FR')}
              </Descriptions.Item>
              {ticket.slaDeadline && (
                <Descriptions.Item label="SLA deadline">
                  <Text type={ticket.slaBreached ? 'danger' : undefined}>
                    {new Date(ticket.slaDeadline).toLocaleString('fr-FR')}
                  </Text>
                </Descriptions.Item>
              )}
              {ticket.resolvedAt && (
                <Descriptions.Item label="Résolu le">
                  {new Date(ticket.resolvedAt).toLocaleString('fr-FR')}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <TicketFormModal
        open={editOpen}
        ticketId={id!}
        onClose={refresh => { setEditOpen(false); if (refresh) load(); }}
      />
    </div>
  );
}
