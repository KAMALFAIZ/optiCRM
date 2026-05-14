import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Timeline,
  Card,
  Spin,
  Alert,
  Space,
  Tag,
  Checkbox,
  Empty,
  Typography,
  Tooltip,
  Row,
  Col,
} from 'antd';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TrophyOutlined,
  FileTextOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  EditOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { accountTimelineApi, TimelineEvent } from '@/api/accountTimeline';

const { Text, Title } = Typography;

const EVENT_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  activity: { icon: <CalendarOutlined />, color: '#1890ff', label: 'Activités' },
  visit: { icon: <EnvironmentOutlined />, color: '#52c41a', label: 'Visites' },
  opportunity: { icon: <TrophyOutlined />, color: '#faad14', label: 'Opportunités' },
  quote: { icon: <FileTextOutlined />, color: '#722ed1', label: 'Devis' },
  invoice: { icon: <FileTextOutlined />, color: '#fa8c16', label: 'Factures' },
  payment: { icon: <DollarOutlined />, color: '#52c41a', label: 'Paiements' },
  order: { icon: <ShoppingCartOutlined />, color: '#13c2c2', label: 'Commandes' },
  note: { icon: <EditOutlined />, color: '#8c8c8c', label: 'Notes' },
};

const ALL_EVENT_TYPES = Object.keys(EVENT_CONFIG);

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('fr-MA', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(value);
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface HealthIndicator {
  hasRecentActivity: boolean;
  hasOpenOpportunities: boolean;
  hasOverdueInvoices: boolean;
}

function computeHealth(events: TimelineEvent[]): HealthIndicator {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const hasRecentActivity = events.some((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= thirtyDaysAgo && eventDate <= now;
  });

  const hasOpenOpportunities = events.some(
    (event) =>
      event.type === 'opportunity' &&
      event.status &&
      !['won', 'lost', 'closed', 'gagnée', 'perdue', 'fermée'].includes(event.status.toLowerCase())
  );

  const hasOverdueInvoices = events.some(
    (event) =>
      event.type === 'invoice' &&
      event.status &&
      ['overdue', 'en retard', 'en_retard'].includes(event.status.toLowerCase())
  );

  return { hasRecentActivity, hasOpenOpportunities, hasOverdueInvoices };
}

interface AccountTimelineProps {
  accountId: string;
}

export default function AccountTimeline({ accountId }: AccountTimelineProps) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(ALL_EVENT_TYPES);

  const loadTimeline = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await accountTimelineApi.getTimeline(accountId);
      setEvents(data.events);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Erreur lors du chargement de la chronologie';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    loadTimeline();
  }, [loadTimeline]);

  const filteredEvents = useMemo(() => {
    if (selectedTypes.length === ALL_EVENT_TYPES.length) {
      return events;
    }
    return events.filter((event) => selectedTypes.includes(event.type));
  }, [events, selectedTypes]);

  const health = useMemo(() => computeHealth(events), [events]);

  const handleTypeFilterChange = (checkedValues: string[]) => {
    setSelectedTypes(checkedValues);
  };

  const filterOptions = ALL_EVENT_TYPES.map((type) => ({
    label: (
      <Tag
        color={EVENT_CONFIG[type].color}
        style={{ cursor: 'pointer', marginRight: 0 }}
      >
        {EVENT_CONFIG[type].icon} {EVENT_CONFIG[type].label}
      </Tag>
    ),
    value: type,
  }));

  const timelineItems = filteredEvents.map((event) => {
    const config = EVENT_CONFIG[event.type] || EVENT_CONFIG.note;

    return {
      key: event.id,
      dot: (
        <span style={{ color: config.color, fontSize: 16 }}>
          {config.icon}
        </span>
      ),
      children: (
        <div>
          <div style={{ marginBottom: 4 }}>
            <Text strong>{event.title}</Text>
            {event.status && (
              <Tag
                style={{ marginLeft: 8 }}
                color={config.color}
              >
                {event.status}
              </Tag>
            )}
          </div>
          {event.description && (
            <div style={{ marginBottom: 4 }}>
              <Text type="secondary">{event.description}</Text>
            </div>
          )}
          <Space size="middle">
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatDate(event.date)}
            </Text>
            {event.amount !== undefined && event.amount !== null && (
              <Text strong style={{ color: config.color, fontSize: 13 }}>
                {formatCurrency(event.amount)}
              </Text>
            )}
            {event.userName && (
              <Tooltip title="Responsable">
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {event.userName}
                </Text>
              </Tooltip>
            )}
          </Space>
        </div>
      ),
    };
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" tip="Chargement de la chronologie..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert
        message="Erreur"
        description={error}
        type="error"
        showIcon
        closable
        action={
          <a onClick={loadTimeline}>Réessayer</a>
        }
        style={{ marginBottom: 16 }}
      />
    );
  }

  return (
    <div>
      {/* Health Indicators */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Title level={5} style={{ margin: 0 }}>
              Santé du compte
            </Title>
          </Col>
          <Col>
            <Space size="middle">
              <Tooltip title={health.hasRecentActivity ? 'Activité récente (30 derniers jours)' : 'Aucune activité récente'}>
                <Tag
                  icon={<CheckCircleOutlined />}
                  color={health.hasRecentActivity ? 'success' : 'default'}
                >
                  Activité récente
                </Tag>
              </Tooltip>

              <Tooltip title={health.hasOpenOpportunities ? 'Opportunités en cours' : 'Aucune opportunité ouverte'}>
                <Tag
                  icon={<InfoCircleOutlined />}
                  color={health.hasOpenOpportunities ? 'processing' : 'default'}
                >
                  Opportunités ouvertes
                </Tag>
              </Tooltip>

              <Tooltip title={health.hasOverdueInvoices ? 'Factures en retard !' : 'Pas de factures en retard'}>
                <Tag
                  icon={<WarningOutlined />}
                  color={health.hasOverdueInvoices ? 'error' : 'default'}
                >
                  Factures en retard
                </Tag>
              </Tooltip>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Event Type Filters */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space direction="vertical" size="small" style={{ width: '100%' }}>
          <Text strong>Filtrer par type</Text>
          <Checkbox.Group
            value={selectedTypes}
            onChange={handleTypeFilterChange as (checkedValues: (string | number | boolean)[]) => void}
            options={filterOptions}
            style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
          />
        </Space>
      </Card>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <Empty
          description="Aucun événement trouvé"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <Timeline
          mode="left"
          items={timelineItems}
        />
      )}
    </div>
  );
}
