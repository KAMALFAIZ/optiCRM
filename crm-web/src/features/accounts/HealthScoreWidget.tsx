import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Progress,
  Typography,
  Space,
  Button,
  Tooltip,
  Row,
  Col,
  Tag,
  Divider,
  Spin,
  message,
} from 'antd';
import {
  ReloadOutlined,
  TrophyOutlined,
  RiseOutlined,
  DollarOutlined,
  ProfileOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import accountsApi from '@/api/accounts';
import type { HealthScoreDto } from '@/types/account';

const { Text } = Typography;

interface HealthScoreWidgetProps {
  accountId: string;
  /** Score stocké en base (affiché sans appel API au démarrage si fourni) */
  initialScore?: number;
}

const HealthScoreWidget: React.FC<HealthScoreWidgetProps> = ({ accountId, initialScore }) => {
  const [data, setData] = useState<HealthScoreDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await accountsApi.getHealthScore(accountId);
      setData(result);
    } catch {
      // Fail silently — initialScore peut être affiché
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await accountsApi.refreshHealthScore(accountId);
      setData(result);
      message.success('Score santé recalculé et sauvegardé');
    } catch {
      message.error('Erreur lors du recalcul');
    } finally {
      setRefreshing(false);
    }
  };

  // Score à afficher (préférence : données fraîches, sinon score stocké)
  const score = data?.score ?? initialScore ?? 0;
  const color = data?.color ?? (score >= 80 ? '#52c41a' : score >= 60 ? '#73d13d' : score >= 40 ? '#faad14' : score >= 20 ? '#ff7a45' : '#ff4d4f');
  const label = data?.label ?? (score >= 80 ? 'Excellent' : score >= 60 ? 'Bon' : score >= 40 ? 'Moyen' : score >= 20 ? 'Faible' : 'Critique');
  const bd = data?.breakdown;

  const formatCurrency = (v?: number) =>
    v != null ? new Intl.NumberFormat('fr-MA', { style: 'decimal', maximumFractionDigits: 0 }).format(v) + ' MAD' : '—';

  const BoolCheck: React.FC<{ ok: boolean; label: string }> = ({ ok, label: l }) => (
    <Space size={4}>
      {ok
        ? <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 12 }} />
        : <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 12 }} />}
      <Text style={{ fontSize: 12, color: ok ? '#389e0d' : '#8c8c8c' }}>{l}</Text>
    </Space>
  );

  return (
    <Card
      size="small"
      style={{ borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
      styles={{ body: { padding: '12px 16px' } }}
      title={
        <Space style={{ fontSize: 13 }}>
          <TrophyOutlined style={{ color: color }} />
          <Text strong>Score Santé Client</Text>
          {!loading && (
            <Tag color={color} style={{ marginLeft: 4, fontWeight: 600 }}>
              {label}
            </Tag>
          )}
        </Space>
      }
      extra={
        <Space size={6}>
          <Tooltip title="Recalculer et sauvegarder le score">
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={refreshing}
              onClick={handleRefresh}
            >
              Recalculer
            </Button>
          </Tooltip>
          <Button
            size="small"
            type="link"
            style={{ padding: 0, fontSize: 12 }}
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Réduire' : 'Détails'}
          </Button>
        </Space>
      }
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <Spin size="small" />
        </div>
      ) : (
        <>
          {/* ── Score principal ── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: expanded ? 16 : 0 }}>
            <Progress
              type="circle"
              percent={score}
              strokeColor={color}
              size={72}
              format={(p) => (
                <span style={{ fontWeight: 700, fontSize: 18, color }}>{p}</span>
              )}
            />
            {bd && (
              <div style={{ flex: 1 }}>
                <Row gutter={[8, 6]}>
                  <Col span={24}>
                    <Tooltip title={`Engagement pipeline : ${bd.openOpportunities} opp. ouvertes`}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 11 }}>
                            <RiseOutlined style={{ marginRight: 4, color: '#1677ff' }} />Engagement
                          </Text>
                          <Text style={{ fontSize: 11 }}>{bd.engagement}/35</Text>
                        </div>
                        <Progress percent={Math.round((bd.engagement / 35) * 100)} showInfo={false} size="small" strokeColor="#1677ff" />
                      </div>
                    </Tooltip>
                  </Col>
                  <Col span={24}>
                    <Tooltip title={`Taux de conversion : ${bd.winRate.toFixed(1)}% (${bd.wonOpportunities}/${bd.totalOpportunities})`}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 11 }}>
                            <TrophyOutlined style={{ marginRight: 4, color: '#faad14' }} />Conversion
                          </Text>
                          <Text style={{ fontSize: 11 }}>{bd.conversion}/30</Text>
                        </div>
                        <Progress percent={Math.round((bd.conversion / 30) * 100)} showInfo={false} size="small" strokeColor="#faad14" />
                      </div>
                    </Tooltip>
                  </Col>
                  <Col span={24}>
                    <Tooltip title={`Revenu gagné : ${formatCurrency(bd.wonRevenue)}`}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 11 }}>
                            <DollarOutlined style={{ marginRight: 4, color: '#52c41a' }} />Revenu
                          </Text>
                          <Text style={{ fontSize: 11 }}>{bd.revenue}/20</Text>
                        </div>
                        <Progress percent={Math.round((bd.revenue / 20) * 100)} showInfo={false} size="small" strokeColor="#52c41a" />
                      </div>
                    </Tooltip>
                  </Col>
                  <Col span={24}>
                    <Tooltip title="Complétude du profil compte">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 11 }}>
                            <ProfileOutlined style={{ marginRight: 4, color: '#722ed1' }} />Profil
                          </Text>
                          <Text style={{ fontSize: 11 }}>{bd.profile}/15</Text>
                        </div>
                        <Progress percent={Math.round((bd.profile / 15) * 100)} showInfo={false} size="small" strokeColor="#722ed1" />
                      </div>
                    </Tooltip>
                  </Col>
                </Row>
              </div>
            )}
          </div>

          {/* ── Détail étendu ── */}
          {expanded && bd && (
            <>
              <Divider style={{ margin: '10px 0' }} />
              <Row gutter={[16, 12]}>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    OPPORTUNITÉS
                  </Text>
                  <Space direction="vertical" size={3}>
                    <Text style={{ fontSize: 12 }}>
                      <strong>{bd.openOpportunities}</strong> ouvertes · <strong>{bd.wonOpportunities}</strong> gagnées
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                      Taux de conversion : <strong style={{ color }}>{bd.winRate.toFixed(1)}%</strong>
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                      Pipeline ouvert : <strong>{formatCurrency(bd.openPipeline)}</strong>
                    </Text>
                    <Text style={{ fontSize: 12 }}>
                      Revenu gagné : <strong>{formatCurrency(bd.wonRevenue)}</strong>
                    </Text>
                  </Space>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>
                    PROFIL
                  </Text>
                  <Space direction="vertical" size={4}>
                    <BoolCheck ok={bd.hasPhone} label="Téléphone" />
                    <BoolCheck ok={bd.hasWebsite} label="Site web" />
                    <BoolCheck ok={bd.hasBillingCity} label="Adresse de facturation" />
                    <BoolCheck ok={bd.hasIndustry} label="Secteur d'activité" />
                    <BoolCheck ok={bd.hasSegment} label="Segment" />
                  </Space>
                </Col>
              </Row>
            </>
          )}
        </>
      )}
    </Card>
  );
};

export default HealthScoreWidget;
