/**
 * GpsTrackingPage — Vue temps réel des positions GPS des représentants.
 * Affiche la dernière position connue de chaque rep + tracé d'une tournée.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Tag, Button, Select, Space, Typography, Row, Col,
  Statistic, Badge, Tooltip, Empty, Spin, Alert,
} from 'antd';
import {
  EnvironmentOutlined, ReloadOutlined, EyeOutlined,
  CarOutlined, UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';
import { deliveryTourApi, type DeliveryTour } from '@/api/delivery';

const { Title, Text } = Typography;
const { Option } = Select;

interface LivePosition {
  id: string;
  representativeId: string;
  deliveryTourId: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  eventType: string;
  recordedAt: string;
  customerId: string | null;
}

interface TourPoint {
  id: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  eventType: string;
  recordedAt: string;
  customerId: string | null;
}


const EVENT_TYPE_COLORS: Record<string, string> = {
  TRACK:       'blue',
  TOUR_START:  'green',
  TOUR_END:    'red',
  VISIT_START: 'orange',
  VISIT_END:   'purple',
};

export default function GpsTrackingPage() {
  const [livePositions, setLivePositions] = useState<LivePosition[]>([]);
  const [tourPoints,    setTourPoints]    = useState<TourPoint[]>([]);
  const [tours,         setTours]         = useState<DeliveryTour[]>([]);
  const [selectedTour,  setSelectedTour]  = useState<string | null>(null);
  const [loadingLive,   setLoadingLive]   = useState(false);
  const [loadingTour,   setLoadingTour]   = useState(false);
  const [autoRefresh,   setAutoRefresh]   = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const loadLive = useCallback(async () => {
    setLoadingLive(true);
    setError(null);
    try {
      const res = await apiClient.get<LivePosition[]>('/delivery/gps/live');
      setLivePositions(res.data);
    } catch {
      setError('Impossible de charger les positions en temps réel');
    } finally {
      setLoadingLive(false);
    }
  }, []);

  const loadTourTrace = useCallback(async (tourId: string) => {
    setLoadingTour(true);
    try {
      const res = await apiClient.get<TourPoint[]>(`/delivery/gps/tour/${tourId}`);
      setTourPoints(res.data);
    } catch {
      setTourPoints([]);
    } finally {
      setLoadingTour(false);
    }
  }, []);

  const loadTours = useCallback(async () => {
    try {
      const data = await deliveryTourApi.list();
      setTours(data ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    loadLive();
    loadTours();
  }, [loadLive, loadTours]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(loadLive, 30_000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadLive]);

  useEffect(() => {
    if (selectedTour) loadTourTrace(selectedTour);
    else setTourPoints([]);
  }, [selectedTour, loadTourTrace]);

  const openGoogleMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  };

  const openTourTrace = () => {
    if (!tourPoints.length) return;
    const path = tourPoints.map(p => `${p.latitude},${p.longitude}`).join('|');
    window.open(`https://www.google.com/maps/dir/${path}`, '_blank');
  };

  // ── Colonnes positions live ──────────────────────────────────────────────
  const liveColumns: ColumnsType<LivePosition> = [
    {
      title: 'Représentant',
      dataIndex: 'representativeId',
      key: 'rep',
      render: (id: string) => (
        <Space>
          <UserOutlined style={{ color: '#4F46E5' }} />
          <Text copyable={{ text: id }} style={{ fontSize: 12 }}>
            {id.slice(0, 8)}…
          </Text>
        </Space>
      ),
    },
    {
      title: 'Tournée',
      dataIndex: 'deliveryTourId',
      key: 'tour',
      render: (id: string | null) =>
        id ? (
          <Space>
            <CarOutlined />
            <Text style={{ fontSize: 12 }}>{id.slice(0, 8)}…</Text>
          </Space>
        ) : <Text type="secondary">—</Text>,
    },
    {
      title: 'Position',
      key: 'pos',
      render: (_: unknown, r: LivePosition) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>Lat: {r.latitude.toFixed(5)}</Text>
          <Text style={{ fontSize: 12 }}>Lng: {r.longitude.toFixed(5)}</Text>
          {r.accuracy != null && (
            <Text type="secondary" style={{ fontSize: 11 }}>±{r.accuracy.toFixed(0)} m</Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Événement',
      dataIndex: 'eventType',
      key: 'event',
      render: (t: string) => <Tag color={EVENT_TYPE_COLORS[t] ?? 'default'}>{t}</Tag>,
    },
    {
      title: 'Horodatage',
      dataIndex: 'recordedAt',
      key: 'ts',
      render: (ts: string) => (
        <Text style={{ fontSize: 12 }}>{new Date(ts).toLocaleString('fr-FR')}</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, r: LivePosition) => (
        <Tooltip title="Voir sur Google Maps">
          <Button
            size="small"
            icon={<EnvironmentOutlined />}
            onClick={() => openGoogleMaps(r.latitude, r.longitude)}
          />
        </Tooltip>
      ),
    },
  ];

  // ── Colonnes tracé tournée ───────────────────────────────────────────────
  const traceColumns: ColumnsType<TourPoint> = [
    {
      title: '#',
      key: 'idx',
      render: (_: unknown, __: TourPoint, i: number) => <Text type="secondary">{i + 1}</Text>,
      width: 50,
    },
    {
      title: 'Lat / Lng',
      key: 'pos',
      render: (_: unknown, r: TourPoint) => (
        <Text style={{ fontSize: 12 }}>{r.latitude.toFixed(5)}, {r.longitude.toFixed(5)}</Text>
      ),
    },
    {
      title: 'Événement',
      dataIndex: 'eventType',
      key: 'event',
      render: (t: string) => <Tag color={EVENT_TYPE_COLORS[t] ?? 'default'}>{t}</Tag>,
    },
    {
      title: 'Horodatage',
      dataIndex: 'recordedAt',
      key: 'ts',
      render: (ts: string) => (
        <Text style={{ fontSize: 12 }}>{new Date(ts).toLocaleString('fr-FR')}</Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      render: (_: unknown, r: TourPoint) => (
        <Tooltip title="Voir sur Google Maps">
          <Button
            size="small"
            icon={<EnvironmentOutlined />}
            onClick={() => openGoogleMaps(r.latitude, r.longitude)}
          />
        </Tooltip>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 4 }}>
        <EnvironmentOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
        Suivi GPS
      </Title>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        Positions en temps réel des représentants et tracé des tournées
      </Text>

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} closable />}

      {/* ── KPIs ── */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Reps actifs"
              value={livePositions.length}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#4F46E5' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="En tournée"
              value={livePositions.filter(p => p.deliveryTourId).length}
              prefix={<CarOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Points tracé"
              value={tourPoints.length}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small">
            <Statistic
              title="Auto-refresh"
              value={autoRefresh ? 'Actif' : 'Inactif'}
              valueStyle={{ color: autoRefresh ? '#52c41a' : '#999', fontSize: 16 }}
            />
          </Card>
        </Col>
      </Row>

      {/* ── Positions live ── */}
      <Card
        title={
          <Space>
            <Badge status={autoRefresh ? 'processing' : 'default'} />
            Positions en temps réel
          </Space>
        }
        extra={
          <Space>
            <Button
              size="small"
              type={autoRefresh ? 'primary' : 'default'}
              onClick={() => setAutoRefresh(v => !v)}
            >
              {autoRefresh ? '⏸ Pause' : '▶ Auto 30s'}
            </Button>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={loadingLive}
              onClick={loadLive}
            >
              Rafraîchir
            </Button>
          </Space>
        }
        style={{ marginBottom: 24 }}
      >
        {loadingLive ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : livePositions.length === 0 ? (
          <Empty description="Aucune position disponible" />
        ) : (
          <Table
            dataSource={livePositions}
            columns={liveColumns}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 700 }}
          />
        )}
      </Card>

      {/* ── Tracé tournée ── */}
      <Card
        title={
          <Space>
            <CarOutlined />
            Tracé d'une tournée
          </Space>
        }
        extra={
          <Space>
            <Select
              placeholder="Sélectionner une tournée"
              style={{ width: 260 }}
              allowClear
              value={selectedTour}
              onChange={v => setSelectedTour(v ?? null)}
              showSearch
              optionFilterProp="label"
            >
              {tours.map(t => (
                <Option key={t.id ?? ''} value={t.id ?? ''} label={`${t.tourDate} — ${t.zone ?? (t.id ?? '').slice(0, 8)}`}>
                  <Space>
                    <Text>{t.tourDate}</Text>
                    <Text type="secondary">{t.zone ?? (t.id ?? '').slice(0, 8)}</Text>
                    <Tag color={t.status === 'IN_PROGRESS' ? 'green' : 'default'} style={{ margin: 0 }}>
                      {t.status}
                    </Tag>
                  </Space>
                </Option>
              ))}
            </Select>
            {tourPoints.length > 1 && (
              <Button
                size="small"
                icon={<EyeOutlined />}
                onClick={openTourTrace}
              >
                Voir l'itinéraire
              </Button>
            )}
          </Space>
        }
      >
        {loadingTour ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : !selectedTour ? (
          <Empty description="Sélectionnez une tournée pour afficher son tracé GPS" />
        ) : tourPoints.length === 0 ? (
          <Empty description="Aucun point GPS enregistré pour cette tournée" />
        ) : (
          <Table
            dataSource={tourPoints}
            columns={traceColumns}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 50, showSizeChanger: true }}
            scroll={{ x: 600 }}
          />
        )}
      </Card>
    </div>
  );
}
