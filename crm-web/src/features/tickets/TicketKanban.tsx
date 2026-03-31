import { useEffect, useState } from 'react';
import { Card, Col, Row, Tag, Typography, Spin, message, Badge, Space } from 'antd';
import { ticketsApi } from '@/api/tickets';
import type { TicketListItem, TicketStatus } from '@/types/ticket';

const { Text } = Typography;

const COLUMNS: { status: TicketStatus; label: string; color: string }[] = [
  { status: 'OUVERT',     label: 'Ouvert',      color: '#1677ff' },
  { status: 'EN_COURS',   label: 'En cours',    color: '#faad14' },
  { status: 'EN_ATTENTE', label: 'En attente',  color: '#fa8c16' },
  { status: 'RESOLU',     label: 'Résolu',      color: '#52c41a' },
  { status: 'FERME',      label: 'Fermé',       color: '#8c8c8c' },
];

const PRIORITY_COLOR: Record<string, string> = {
  CRITIQUE: '#ff4d4f', HAUTE: '#fa8c16', NORMALE: '#1677ff', BASSE: '#8c8c8c',
};
const PRIORITY_LABEL: Record<string, string> = {
  CRITIQUE: 'Critique', HAUTE: 'Haute', NORMALE: 'Normale', BASSE: 'Basse',
};

interface Props {
  onTicketClick: (id: string) => void;
  onRefresh: () => void;
}

export default function TicketKanban({ onTicketClick, onRefresh: _onRefresh }: Props) {
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragging, setDragging] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await ticketsApi.getAll({ size: 200 });
      setTickets(res.content);
    } catch {
      message.error('Erreur chargement tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const byStatus = (status: TicketStatus) => tickets.filter(t => t.status === status);

  const handleDrop = async (targetStatus: TicketStatus, ticketId: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket || ticket.status === targetStatus) return;
    try {
      await ticketsApi.changeStatus(ticketId, targetStatus);
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: targetStatus } : t));
    } catch {
      message.error('Impossible de changer le statut');
    }
  };

  if (loading) return <Spin style={{ display: 'block', marginTop: 48 }} />;

  return (
    <Row gutter={12} style={{ flexWrap: 'nowrap', overflowX: 'auto', paddingBottom: 16 }}>
      {COLUMNS.map(col => {
        const colTickets = byStatus(col.status);
        return (
          <Col key={col.status} style={{ minWidth: 260, width: 260 }}>
            <div
              style={{ background: '#f5f5f5', borderRadius: 8, padding: 12, minHeight: 400 }}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (dragging) handleDrop(col.status, dragging);
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: col.color, marginRight: 8 }} />
                <Text strong>{col.label}</Text>
                <Badge count={colTickets.length} style={{ marginLeft: 8, background: col.color }} />
              </div>

              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                {colTickets.map(ticket => (
                  <Card
                    key={ticket.id}
                    size="small"
                    style={{
                      cursor: 'grab',
                      borderLeft: `3px solid ${PRIORITY_COLOR[ticket.priority] || '#ccc'}`,
                      opacity: dragging === ticket.id ? 0.5 : 1,
                    }}
                    draggable
                    onDragStart={() => setDragging(ticket.id)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => onTicketClick(ticket.id)}
                  >
                    <Text style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' }}>
                      {ticket.reference}
                    </Text>
                    <div style={{ fontWeight: 500, marginTop: 4, fontSize: 13 }}>{ticket.title}</div>
                    <Space style={{ marginTop: 8 }} size={4} wrap>
                      <Tag style={{ fontSize: 10, margin: 0 }} color={PRIORITY_COLOR[ticket.priority]}>
                        {PRIORITY_LABEL[ticket.priority]}
                      </Tag>
                      {ticket.slaBreached && <Tag color="red" style={{ fontSize: 10, margin: 0 }}>SLA!</Tag>}
                      {ticket.accountName && (
                        <Text type="secondary" style={{ fontSize: 11 }}>{ticket.accountName}</Text>
                      )}
                    </Space>
                  </Card>
                ))}
              </Space>
            </div>
          </Col>
        );
      })}
    </Row>
  );
}
