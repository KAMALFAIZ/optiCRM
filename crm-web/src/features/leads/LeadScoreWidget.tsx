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
  UserOutlined,
  QuestionCircleOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import leadsApi from '@/api/leads';
import type { LeadScoreDto } from '@/types/lead';

const { Text } = Typography;

interface LeadScoreWidgetProps {
  leadId: string;
  initialScore?: number;
}

const LeadScoreWidget: React.FC<LeadScoreWidgetProps> = ({ leadId, initialScore }) => {
  const [data, setData] = useState<LeadScoreDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await leadsApi.getScore(leadId);
      setData(result);
    } catch {
      // Fail silently
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const result = await leadsApi.refreshScore(leadId);
      setData(result);
      message.success('Score recalculé et sauvegardé');
    } catch {
      message.error('Erreur lors du recalcul');
    } finally {
      setRefreshing(false);
    }
  };

  const score = data?.score ?? initialScore ?? 0;
  const color = data?.color ?? (score >= 80 ? '#52c41a' : score >= 60 ? '#73d13d' : score >= 40 ? '#faad14' : score >= 20 ? '#ff7a45' : '#ff4d4f');
  const label = data?.label ?? (score >= 80 ? 'Très qualifié' : score >= 60 ? 'Qualifié' : score >= 40 ? 'En cours' : score >= 20 ? 'Peu qualifié' : 'Non qualifié');
  const bd = data?.breakdown;

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
          <TrophyOutlined style={{ color }} />
          <Text strong>Score de Qualification</Text>
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
                    <Tooltip title={`Profil : coordonnées et informations entreprise`}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 11 }}>
                            <UserOutlined style={{ marginRight: 4, color: '#1677ff' }} />Profil
                          </Text>
                          <Text style={{ fontSize: 11 }}>{bd.profile}/35</Text>
                        </div>
                        <Progress percent={Math.round((bd.profile / 35) * 100)} showInfo={false} size="small" strokeColor="#1677ff" />
                      </div>
                    </Tooltip>
                  </Col>
                  <Col span={24}>
                    <Tooltip title="Qualification : budget, délai, produits, secteur">
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 11 }}>
                            <QuestionCircleOutlined style={{ marginRight: 4, color: '#faad14' }} />Qualification
                          </Text>
                          <Text style={{ fontSize: 11 }}>{bd.qualification}/40</Text>
                        </div>
                        <Progress percent={Math.round((bd.qualification / 40) * 100)} showInfo={false} size="small" strokeColor="#faad14" />
                      </div>
                    </Tooltip>
                  </Col>
                  <Col span={24}>
                    <Tooltip title={`Engagement : statut "${bd.status}" + température "${bd.rating || '—'}"`}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                          <Text style={{ fontSize: 11 }}>
                            <RiseOutlined style={{ marginRight: 4, color: '#52c41a' }} />Engagement
                          </Text>
                          <Text style={{ fontSize: 11 }}>{bd.engagement}/25</Text>
                        </div>
                        <Progress percent={Math.round((bd.engagement / 25) * 100)} showInfo={false} size="small" strokeColor="#52c41a" />
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
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>PROFIL</Text>
                  <Space direction="vertical" size={3}>
                    <BoolCheck ok={bd.hasEmail}        label="Email" />
                    <BoolCheck ok={bd.hasPhone}        label="Téléphone / Mobile" />
                    <BoolCheck ok={bd.hasCompany}      label="Société" />
                    <BoolCheck ok={bd.hasJobTitle}     label="Fonction" />
                    <BoolCheck ok={bd.hasCity}         label="Ville" />
                    <BoolCheck ok={bd.hasWebOrLinkedin} label="Web / LinkedIn" />
                  </Space>
                </Col>
                <Col span={12}>
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>QUALIFICATION</Text>
                  <Space direction="vertical" size={3}>
                    <BoolCheck ok={bd.hasBudgetRange}       label="Budget défini" />
                    <BoolCheck ok={bd.hasDecisionTimeframe}  label="Délai de décision" />
                    <BoolCheck ok={bd.hasInterestedProducts} label="Produits d'intérêt" />
                    <BoolCheck ok={bd.hasIndustry}           label="Secteur d'activité" />
                    <BoolCheck ok={bd.hasNumEmployees}       label="Taille entreprise" />
                  </Space>
                  <Divider style={{ margin: '8px 0' }} />
                  <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>SIGNAUX</Text>
                  <Space direction="vertical" size={3}>
                    <BoolCheck ok={bd.hasMeetingScheduled} label="Réunion planifiée" />
                    <BoolCheck ok={bd.hasDemoRequested}    label="Démo demandée" />
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

export default LeadScoreWidget;
