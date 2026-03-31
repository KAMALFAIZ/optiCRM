import { useState } from 'react';
import { Modal, Button, Spin, Typography, Tag, Row, Col, Card, Statistic, Progress, Divider, List, Badge } from 'antd';
import {
  GlobalOutlined, RobotOutlined, FireOutlined, EnvironmentOutlined,
  CarOutlined, BarChartOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { chantiersApi } from '@/api/chantiers';

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

// ── Données démo statiques ────────────────────────────────────────────────────

const DEMO_CLUSTERS = [
  {
    zone: 'Grand Casablanca',
    nb: 165,
    color: '#722ed1',
    pct: 100,
    stades: ['Gros œuvre (38%)', 'Phase équipement (28%)', 'Second œuvre (21%)'],
    top: ['Hay Hassani', 'Ain Diab', 'Sidi Bernoussi', 'Ain Sebaa'],
  },
  {
    zone: 'Axe Rabat – Salé – Témara',
    nb: 42,
    color: '#1677ff',
    pct: 25,
    stades: ['Étude / Conception (41%)', 'Autorisation (29%)', 'Gros œuvre (18%)'],
    top: ['Hay Riad', 'Agdal', 'Témara Centre', 'Salé Tabriquet'],
  },
  {
    zone: 'Marrakech',
    nb: 20,
    color: '#fa8c16',
    pct: 12,
    stades: ['Phase équipement (45%)', 'Livraison (30%)', 'Second œuvre (15%)'],
    top: ['Guéliz', 'Palmeraie', 'Agdal Marrakech'],
  },
  {
    zone: 'Tanger – Nord',
    nb: 28,
    color: '#13c2c2',
    pct: 17,
    stades: ['Gros œuvre (36%)', 'Autorisation (32%)', 'Étude (22%)'],
    top: ['Cap Spartel', 'Centre Tanger', 'Tétouan', 'Martil'],
  },
  {
    zone: 'Agadir – Souss',
    nb: 22,
    color: '#52c41a',
    pct: 13,
    stades: ['Second œuvre (40%)', 'Phase équipement (25%)', 'Livraison (20%)'],
    top: ['Agadir Centre', 'Inezgane', 'Aït Melloul'],
  },
];

const DEMO_TOURNEES = [
  {
    nom: 'Tournée Casa Nord-Est',
    nb: 8,
    km: 42,
    priorité: 'Haute',
    color: 'red',
    chantiers: [
      'Résidence Ain Sebaa – Phase équipement 🔴',
      'Programme Sidi Bernoussi B4 – Gros œuvre',
      'Résidence Hay Mohammadi – Second œuvre',
      'Cité Nassim Ain Chock – Phase équipement 🔴',
    ],
    conseil: 'Départ 8h, priorité aux 2 chantiers en phase équipement (prescription urgente).',
  },
  {
    nom: 'Tournée Rabat – Témara',
    nb: 5,
    km: 28,
    priorité: 'Moyenne',
    color: 'orange',
    chantiers: [
      'Tour Bab Riad Business – Second œuvre',
      'Résidence Agdal Heights – Gros œuvre',
      'Programme Témara Brise – Autorisation',
    ],
    conseil: 'Axe A1 recommandé. Rendez-vous architecte Agdal à confirmer au préalable.',
  },
  {
    nom: 'Tournée Tanger – Tétouan',
    nb: 6,
    km: 65,
    priorité: 'Moyenne',
    color: 'blue',
    chantiers: [
      'Résidence Cap Spartel – Autorisation',
      'Marina Bay Tanger – Phase équipement 🔴',
      'Programme Martil Brise – Gros œuvre',
      'Cité Tétouan Nord – Second œuvre',
    ],
    conseil: 'Journée complète. Opportunité ferme sur Marina Bay — préparer l\'offre alternative.',
  },
];

const DEMO_ZONES_POTENTIEL = [
  { zone: 'Kénitra', chantiers: 6, etat: 'Sous-couvert', potentiel: 'Fort', raison: 'Développement urbanistique rapide, peu visité' },
  { zone: 'Fès – Ville Nouvelle', chantiers: 7, etat: 'Sous-couvert', potentiel: 'Fort', raison: 'Projets tertiaires émergents, aucune prescription en cours' },
  { zone: 'Oujda', chantiers: 5, etat: 'Non couvert', potentiel: 'Moyen', raison: 'Éloignement compensé par croissance résidentielle soutenue' },
  { zone: 'El Jadida', chantiers: 4, etat: 'Non couvert', potentiel: 'Fort', raison: '3 chantiers haut standing sans concurrent identifié' },
  { zone: 'Nador', chantiers: 7, etat: 'Faible', potentiel: 'Moyen', raison: 'Zone franche, projets industriels & logistiques en hausse' },
];

// ─────────────────────────────────────────────────────────────────────────────

export default function ChantierGeoInsightsModal({ open, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    setShowDemo(false);
    try {
      const data = await chantiersApi.getGeoInsights();
      setAiText(data);
    } catch {
      setShowDemo(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAfterOpen = (visible: boolean) => {
    if (visible && !aiText) setShowDemo(true);
  };

  return (
    <Modal
      title={
        <span>
          <GlobalOutlined style={{ color: '#1677ff', marginRight: 8 }} />
          Insights Géographiques IA
          <Tag color="purple" style={{ marginLeft: 8, fontSize: 10 }}>Démo</Tag>
        </span>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="refresh" icon={<ReloadOutlined />} onClick={fetchInsights} loading={loading}>
          Analyse IA en temps réel
        </Button>,
        <Button key="close" onClick={onClose}>Fermer</Button>,
      ]}
      width={820}
      afterOpenChange={handleAfterOpen}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
          <br /><br />
          <Text type="secondary">Analyse géographique en cours avec l'IA...</Text>
        </div>

      ) : aiText ? (
        /* ── Résultat IA brut ── */
        <div style={{
          background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 8,
          padding: '16px 20px', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 13,
          maxHeight: 560, overflowY: 'auto',
        }}>
          {aiText}
        </div>

      ) : showDemo ? (
        /* ── Vue démo structurée ── */
        <div style={{ maxHeight: 560, overflowY: 'auto', paddingRight: 4 }}>

          {/* KPIs */}
          <Row gutter={12} style={{ marginBottom: 20 }}>
            {[
              { label: 'Chantiers géolocalisés', value: 483, suffix: '', color: '#722ed1' },
              { label: 'Villes couvertes', value: 18, suffix: '', color: '#1677ff' },
              { label: 'En phase équipement', value: 89, suffix: '', color: '#fa541c' },
              { label: 'Chantiers témoins', value: 12, suffix: '', color: '#52c41a' },
            ].map(k => (
              <Col span={6} key={k.label}>
                <Card size="small" style={{ textAlign: 'center', borderColor: k.color + '44' }}>
                  <Statistic
                    value={k.value}
                    suffix={k.suffix}
                    valueStyle={{ color: k.color, fontSize: 22, fontWeight: 700 }}
                  />
                  <Text type="secondary" style={{ fontSize: 11 }}>{k.label}</Text>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Clusters */}
          <Title level={5} style={{ marginBottom: 12 }}>
            <EnvironmentOutlined style={{ color: '#722ed1', marginRight: 6 }} />
            Clusters Géographiques
          </Title>
          {DEMO_CLUSTERS.map(c => (
            <div key={c.zone} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text strong>{c.zone}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{c.nb} chantiers — {c.top.slice(0, 2).join(', ')}</Text>
              </div>
              <Progress
                percent={c.pct}
                strokeColor={c.color}
                size="small"
                format={() => `${c.nb}`}
              />
              <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {c.stades.map(s => (
                  <Tag key={s} style={{ fontSize: 11 }}>{s}</Tag>
                ))}
              </div>
            </div>
          ))}

          <Divider />

          {/* Tournées */}
          <Title level={5} style={{ marginBottom: 12 }}>
            <CarOutlined style={{ color: '#1677ff', marginRight: 6 }} />
            Tournées Optimisées Suggérées
          </Title>
          <Row gutter={12}>
            {DEMO_TOURNEES.map(t => (
              <Col span={8} key={t.nom}>
                <Card
                  size="small"
                  title={
                    <span style={{ fontSize: 12 }}>
                      <Badge color={t.color} />
                      {' '}{t.nom}
                    </span>
                  }
                  style={{ marginBottom: 8 }}
                  extra={<Tag color={t.color}>{t.priorité}</Tag>}
                >
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {t.nb} chantiers · {t.km} km
                  </Text>
                  <List
                    size="small"
                    dataSource={t.chantiers.slice(0, 3)}
                    renderItem={item => (
                      <List.Item style={{ padding: '2px 0', fontSize: 11 }}>
                        <Text ellipsis style={{ fontSize: 11 }}>{item}</Text>
                      </List.Item>
                    )}
                    style={{ marginTop: 6 }}
                  />
                  <div style={{
                    marginTop: 8, background: '#f6f6f6', borderRadius: 4,
                    padding: '6px 8px', fontSize: 11, color: '#555',
                  }}>
                    💡 {t.conseil}
                  </div>
                </Card>
              </Col>
            ))}
          </Row>

          <Divider />

          {/* Zones à potentiel */}
          <Title level={5} style={{ marginBottom: 12 }}>
            <FireOutlined style={{ color: '#fa541c', marginRight: 6 }} />
            Zones à Fort Potentiel Non Couvertes
          </Title>
          <List
            size="small"
            dataSource={DEMO_ZONES_POTENTIEL}
            renderItem={z => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Text strong>{z.zone}</Text>
                    <span>
                      <Tag color={z.potentiel === 'Fort' ? 'volcano' : 'orange'}>{z.potentiel}</Tag>
                      <Tag>{z.etat}</Tag>
                    </span>
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {z.chantiers} chantiers · {z.raison}
                  </Text>
                </div>
              </List.Item>
            )}
          />

          <Divider />

          {/* Stats */}
          <Title level={5} style={{ marginBottom: 12 }}>
            <BarChartOutlined style={{ color: '#52c41a', marginRight: 6 }} />
            Répartition par Stade (tous clusters)
          </Title>
          <Row gutter={8}>
            {[
              { label: 'Étude / Conception', val: 18, color: '#bfbfbf' },
              { label: 'Autorisation', val: 22, color: '#d4b106' },
              { label: 'Gros œuvre', val: 31, color: '#fa8c16' },
              { label: 'Second œuvre', val: 27, color: '#1677ff' },
              { label: 'Phase équipement', val: 89, color: '#722ed1' },
              { label: 'Livraison', val: 14, color: '#52c41a' },
            ].map(s => (
              <Col span={4} key={s.label} style={{ textAlign: 'center', marginBottom: 8 }}>
                <div style={{
                  background: s.color + '22', border: `1px solid ${s.color}44`,
                  borderRadius: 6, padding: '8px 4px',
                }}>
                  <div style={{ fontWeight: 700, fontSize: 18, color: s.color }}>{s.val}</div>
                  <Text type="secondary" style={{ fontSize: 10 }}>{s.label}</Text>
                </div>
              </Col>
            ))}
          </Row>

          <div style={{
            marginTop: 16, padding: '10px 14px', background: '#f0f5ff',
            borderRadius: 6, border: '1px solid #adc6ff', fontSize: 12, color: '#1d39c4',
          }}>
            <RobotOutlined style={{ marginRight: 6 }} />
            <strong>Recommandation IA :</strong> Concentrer les efforts sur Casablanca (89 chantiers en phase équipement = fenêtre de prescription immédiate) et ouvrir Kénitra & El Jadida avant la concurrence.
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
