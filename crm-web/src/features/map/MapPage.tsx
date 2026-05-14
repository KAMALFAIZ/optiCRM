import { useEffect, useState, useCallback, useRef } from 'react';
import {
  Card, Row, Col, Typography, Tag, Spin, Space, Badge,
  Button, Divider, Slider, message, Tooltip, Checkbox, Statistic,
  Progress, Drawer, List, Timeline,
} from 'antd';
import {
  EnvironmentOutlined, ReloadOutlined,
  AimOutlined, CloseCircleOutlined, RobotOutlined,
  GlobalOutlined, FilterOutlined, BarChartOutlined,
  FireOutlined, CarOutlined, ThunderboltOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNavigate } from 'react-router-dom';
import { chantiersApi, ChantierListItem } from '@/api/chantiers';
import accountsApi from '@/api/accounts';
import type { AccountListItem } from '@/types/account';

const { Title, Text } = Typography;

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DEFAULT_CENTER: [number, number] = [31.7917, -7.0926];
const DEFAULT_ZOOM = 6;

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>';
const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri';

// ── Stades config ────────────────────────────────────────────────────────────
const STADES = [
  { value: 'ETUDE_CONCEPTION', label: 'Étude / Conception', color: '#1890ff' },
  { value: 'AUTORISATION',     label: 'Autorisation',        color: '#2f54eb' },
  { value: 'GROS_OEUVRE',      label: 'Gros œuvre',          color: '#fa8c16' },
  { value: 'SECOND_OEUVRE',    label: 'Second œuvre',        color: '#faad14' },
  { value: 'PHASE_EQUIPEMENT', label: 'Phase équipement',    color: '#a0d911' },
  { value: 'LIVRAISON',        label: 'Livraison',           color: '#52c41a' },
  { value: 'CLOTURE',          label: 'Clôturé',             color: '#8c8c8c' },
];
const STADE_COLOR: Record<string, string> = Object.fromEntries(STADES.map(s => [s.value, s.color]));
const STADE_LABEL: Record<string, string> = Object.fromEntries(STADES.map(s => [s.value, s.label]));

// ── Icon factories ────────────────────────────────────────────────────────────
function createIcon(color: string, letter: string, size = 28): L.DivIcon {
  return L.divIcon({
    html: `<div style="background:${color};color:#fff;width:${size}px;height:${size}px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:${Math.floor(size * 0.45)}px;border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.35)">${letter}</div>`,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 4)],
  });
}

function createMyPositionIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;background:#4285f4;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(66,133,244,0.6)"></div>
      <div style="position:absolute;inset:-6px;border:2px solid rgba(66,133,244,0.3);border-radius:50%;animation:pulse 2s infinite"></div>
    </div>
    <style>@keyframes pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2);opacity:0}}</style>`,
    className: '', iconSize: [20, 20], iconAnchor: [10, 10],
  });
}

// ── Haversine ─────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Map helpers ───────────────────────────────────────────────────────────────
function FitAll({ points }: { points: [number, number][] }) {
  const map = useMap();
  const done = useRef(false);
  useEffect(() => {
    if (done.current || points.length === 0) return;
    done.current = true;
    map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 12 });
  }, [points, map]);
  return null;
}

function FlyToRadius({ center, radiusKm }: { center: [number, number] | null; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    const c = L.circle(center, { radius: radiusKm * 1000 });
    c.addTo(map);
    map.fitBounds(c.getBounds(), { padding: [40, 40], maxZoom: 15 });
    c.remove();
  }, [center, radiusKm, map]);
  return null;
}

// ── Demo AI content ───────────────────────────────────────────────────────────
function AiDemoContent({ chantierCount, distributionCount }: { chantierCount: number; distributionCount: number }) {
  return (
    <div style={{ fontSize: 13 }}>

      {/* KPIs */}
      <Row gutter={8} style={{ marginBottom: 16 }}>
        {[
          { label: 'Chantiers cartographiés', value: chantierCount || 483, color: '#fa8c16' },
          { label: 'Villes couvertes',         value: 18,                  color: '#1677ff' },
          { label: 'Phase équipement',         value: 89,                  color: '#a0d911' },
          { label: 'Points Distribution',      value: distributionCount || 0, color: '#722ed1' },
        ].map(k => (
          <Col span={12} key={k.label} style={{ marginBottom: 8 }}>
            <Card size="small" style={{ borderLeft: `3px solid ${k.color}`, borderRadius: 6 }}>
              <div style={{ fontWeight: 700, fontSize: 20, color: k.color }}>{k.value}</div>
              <Text type="secondary" style={{ fontSize: 11 }}>{k.label}</Text>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Clusters */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <EnvironmentOutlined style={{ color: '#fa8c16' }} />
          <Text strong>Clusters géographiques</Text>
        </div>
        {[
          { zone: 'Grand Casablanca',       nb: 165, color: '#fa8c16', pct: 34, stade: 'Phase équipement dominant' },
          { zone: 'Tanger – Nord',          nb: 28,  color: '#13c2c2', pct: 6,  stade: 'Gros œuvre / Autorisation' },
          { zone: 'Rabat – Salé – Témara',  nb: 42,  color: '#1677ff', pct: 9,  stade: 'Étude / Conception' },
          { zone: 'Marrakech',              nb: 20,  color: '#722ed1', pct: 4,  stade: 'Phase équipement / Livraison' },
          { zone: 'Agadir – Souss',         nb: 22,  color: '#52c41a', pct: 5,  stade: 'Second œuvre' },
        ].map(c => (
          <div key={c.zone} style={{ marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <Text style={{ fontSize: 12, fontWeight: 600 }}>{c.zone}</Text>
              <Text style={{ fontSize: 11, color: c.color, fontWeight: 700 }}>{c.nb} chantiers</Text>
            </div>
            <Progress percent={c.pct} strokeColor={c.color} size="small" format={() => ''} />
            <Text type="secondary" style={{ fontSize: 11 }}>{c.stade}</Text>
          </div>
        ))}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Tournées */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <CarOutlined style={{ color: '#1677ff' }} />
          <Text strong>Tournées optimisées suggérées</Text>
        </div>
        {[
          {
            nom: 'Tournée Casa Centre',
            color: '#fa541c', km: 38, nb: 7, priority: 'Haute',
            items: ['Résidence Ain Sebaa — Phase équip. 🔴', 'Programme Sidi Bernoussi — GO', 'Cité Nassim — Phase équip. 🔴'],
            tip: 'Départ 8h · 2 prescriptions urgentes à sécuriser',
          },
          {
            nom: 'Tournée Rabat – Témara',
            color: '#fa8c16', km: 27, nb: 5, priority: 'Moyenne',
            items: ['Tour Bab Riad — Second œuvre', 'Résidence Agdal Heights — GO', 'Programme Témara — Auth.'],
            tip: 'RDV architecte Agdal à confirmer',
          },
          {
            nom: 'Tournée Tanger – Tétouan',
            color: '#1677ff', km: 63, nb: 6, priority: 'Moyenne',
            items: ['Marina Bay — Phase équip. 🔴', 'Cap Spartel — Autorisation', 'Programme Martil — GO'],
            tip: 'Journée complète · opportunité ferme Marina Bay',
          },
        ].map(t => (
          <Card key={t.nom} size="small" style={{ marginBottom: 10, borderLeft: `3px solid ${t.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text strong style={{ fontSize: 12 }}>{t.nom}</Text>
              <Space size={4}>
                <Tag color={t.priority === 'Haute' ? 'red' : 'orange'} style={{ fontSize: 10 }}>{t.priority}</Tag>
                <Text type="secondary" style={{ fontSize: 11 }}>{t.nb} ch · {t.km} km</Text>
              </Space>
            </div>
            <List
              size="small"
              dataSource={t.items}
              renderItem={item => (
                <List.Item style={{ padding: '1px 0', fontSize: 11, border: 'none' }}>
                  <Text ellipsis style={{ fontSize: 11 }}>{item}</Text>
                </List.Item>
              )}
            />
            <div style={{
              marginTop: 6, background: '#f6f6f6', borderRadius: 4,
              padding: '4px 8px', fontSize: 11, color: '#555',
            }}>
              💡 {t.tip}
            </div>
          </Card>
        ))}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      {/* Zones à potentiel */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <FireOutlined style={{ color: '#fa541c' }} />
          <Text strong>Zones à fort potentiel non couvertes</Text>
        </div>
        <Timeline
          items={[
            {
              color: 'red',
              children: (
                <div>
                  <Text strong style={{ fontSize: 12 }}>Kénitra</Text>
                  <Tag color="volcano" style={{ marginLeft: 6, fontSize: 10 }}>Fort</Tag>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    6 chantiers · développement urbanistique rapide, pas de prescriptions en cours
                  </div>
                </div>
              ),
            },
            {
              color: 'red',
              children: (
                <div>
                  <Text strong style={{ fontSize: 12 }}>El Jadida</Text>
                  <Tag color="volcano" style={{ marginLeft: 6, fontSize: 10 }}>Fort</Tag>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    4 chantiers haut standing · aucun concurrent identifié
                  </div>
                </div>
              ),
            },
            {
              color: 'orange',
              children: (
                <div>
                  <Text strong style={{ fontSize: 12 }}>Fès – Ville Nouvelle</Text>
                  <Tag color="orange" style={{ marginLeft: 6, fontSize: 10 }}>Moyen</Tag>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    7 chantiers tertiaires · à ouvrir avant Q3
                  </div>
                </div>
              ),
            },
            {
              color: 'blue',
              children: (
                <div>
                  <Text strong style={{ fontSize: 12 }}>Nador</Text>
                  <Tag color="blue" style={{ marginLeft: 6, fontSize: 10 }}>Moyen</Tag>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                    7 chantiers · zone franche, projets industriels en hausse
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>

      {/* Recommandation */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea22, #764ba222)',
        border: '1px solid #adc6ff',
        borderRadius: 8, padding: '12px 14px',
      }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <ThunderboltOutlined style={{ color: '#1677ff', fontSize: 16, marginTop: 2 }} />
          <div>
            <Text strong style={{ color: '#1677ff', fontSize: 12 }}>Recommandation IA</Text>
            <div style={{ fontSize: 12, color: '#333', marginTop: 4, lineHeight: 1.6 }}>
              Priorité immédiate sur <strong>Casablanca</strong> (89 chantiers en phase équipement = fenêtre de prescription critique).
              Ouvrir <strong>Kénitra</strong> et <strong>El Jadida</strong> avant Q3 2026 pour éviter l'installation de concurrents.
            </div>
            <div style={{ marginTop: 8 }}>
              <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 4 }} />
              <Text style={{ fontSize: 11, color: '#52c41a' }}>483 chantiers analysés · 18 villes · 3 tournées générées</Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MapPage() {
  const navigate = useNavigate();
  const [chantiers, setChantiers] = useState<ChantierListItem[]>([]);
  const [accounts, setAccounts] = useState<AccountListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Layer toggles
  const [showC, setShowC] = useState(true);
  const [showD, setShowD] = useState(true);
  const [satellite, setSatellite] = useState(false);

  // Stade filter
  const [stadeFilter, setStadeFilter] = useState<string[]>(STADES.map(s => s.value));

  // Proximity
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(20);
  const [proximityTarget, setProximityTarget] = useState<'chantiers' | 'distribution' | null>(null);
  const [flyCenter, setFlyCenter] = useState<[number, number] | null>(null);

  // AI drawer
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiText, setAiText] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [chantiersData, accountsData] = await Promise.all([
        chantiersApi.getMapData(),
        accountsApi.getAll({ size: 500 }).then(r => r.content),
      ]);
      setChantiers(chantiersData.filter(c => c.latitude && c.longitude));
      setAccounts(accountsData.filter(a => a.latitude && a.longitude && a.famille === 'DISTRIBUTION'));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const zoomToNearest = useCallback((target: 'chantiers' | 'distribution') => {
    if (!navigator.geolocation) { message.error('Géolocalisation non supportée'); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const p: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMyPosition(p); setProximityTarget(target); setFlyCenter(p); setGeoLoading(false);
        message.success(`Position détectée — rayon ${radiusKm} km`);
      },
      (err) => { setGeoLoading(false); message.error(err.message); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radiusKm]);

  const clearProximity = () => { setMyPosition(null); setProximityTarget(null); setFlyCenter(null); };

  const fetchAi = async () => {
    setAiLoading(true);
    try {
      const data = await chantiersApi.getGeoInsights();
      setAiText(data);
    } catch { message.error('Erreur analyse IA'); }
    finally { setAiLoading(false); }
  };

  // Filtered chantiers
  const filteredChantiers = chantiers.filter(c =>
    stadeFilter.includes(c.stadeChantier || '') || (!c.stadeChantier && stadeFilter.length > 0)
  );

  const nearbyChantiers = (proximityTarget === 'chantiers' && myPosition)
    ? filteredChantiers.filter(c => haversineKm(myPosition[0], myPosition[1], c.latitude!, c.longitude!) <= radiusKm)
    : filteredChantiers;

  const nearbyAccounts = (proximityTarget === 'distribution' && myPosition)
    ? accounts.filter(a => haversineKm(myPosition[0], myPosition[1], a.latitude!, a.longitude!) <= radiusKm)
    : accounts;

  const displayedChantiers = showC ? (proximityTarget === 'distribution' ? filteredChantiers : nearbyChantiers) : [];
  const displayedAccounts  = showD ? (proximityTarget === 'chantiers' ? accounts : nearbyAccounts) : [];

  const allPoints: [number, number][] = [
    ...displayedChantiers.map(c => [c.latitude!, c.longitude!] as [number, number]),
    ...displayedAccounts.map(a => [a.latitude!, a.longitude!] as [number, number]),
  ];

  // Stats by stade
  const stadeStats = STADES.map(s => ({
    ...s,
    count: chantiers.filter(c => c.stadeChantier === s.value).length,
  }));
  const totalChantiers = chantiers.length;

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      {/* ── Header ── */}
      <Row justify="space-between" align="middle" style={{ marginBottom: 12 }}>
        <Col>
          <Title level={4} style={{ margin: 0 }}>
            <EnvironmentOutlined style={{ marginRight: 8, color: '#f5a623' }} />
            Carte interactive ODYSSÉE
          </Title>
        </Col>
        <Col>
          <Space>
            <Button icon={<RobotOutlined />} type="primary" ghost onClick={() => { setAiDrawerOpen(true); if (!aiText) fetchAi(); }}>
              Analyse IA
            </Button>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>
              Actualiser
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={12} style={{ height: 'calc(100vh - 160px)' }}>

        {/* ── Sidebar ── */}
        <Col span={5} style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

          {/* Layer toggles C / D */}
          <Card size="small" title={<><FilterOutlined style={{ marginRight: 6 }} />Couches</>}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <button
                onClick={() => setSatellite(v => !v)}
                style={{
                  width: '100%', padding: '6px 12px',
                  background: satellite ? '#1677ff' : '#f5f5f5',
                  color: satellite ? '#fff' : '#333',
                  border: `1px solid ${satellite ? '#1677ff' : '#d9d9d9'}`,
                  borderRadius: 6, cursor: 'pointer', fontWeight: 600, fontSize: 12,
                  transition: 'all 0.2s',
                }}
              >
                {satellite ? '🗺 Vue Plan' : '🛰 Vue Satellite'}
              </button>
              <div
                onClick={() => setShowC(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer', border: '2px solid',
                  borderColor: showC ? '#fa8c16' : '#f0f0f0',
                  background: showC ? '#fff7e6' : '#fafafa',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: showC ? '#fa8c16' : '#d9d9d9',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>C</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Chantiers</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{chantiers.length} géolocalisés</div>
                </div>
                <Checkbox checked={showC} style={{ marginLeft: 'auto' }} />
              </div>

              <div
                onClick={() => setShowD(v => !v)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                  borderRadius: 8, cursor: 'pointer', border: '2px solid',
                  borderColor: showD ? '#722ed1' : '#f0f0f0',
                  background: showD ? '#f9f0ff' : '#fafafa',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', background: showD ? '#722ed1' : '#d9d9d9',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>D</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>Distribution</div>
                  <div style={{ fontSize: 11, color: '#8c8c8c' }}>{accounts.length} géolocalisés</div>
                </div>
                <Checkbox checked={showD} style={{ marginLeft: 'auto' }} />
              </div>
            </Space>
          </Card>

          {/* Stade filter */}
          {showC && (
            <Card
              size="small"
              title="Stade chantier"
              extra={
                <Button
                  size="small" type="link"
                  onClick={() => setStadeFilter(
                    stadeFilter.length === STADES.length ? [] : STADES.map(s => s.value)
                  )}
                >
                  {stadeFilter.length === STADES.length ? 'Aucun' : 'Tous'}
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                {STADES.map(s => {
                  const count = chantiers.filter(c => c.stadeChantier === s.value).length;
                  const checked = stadeFilter.includes(s.value);
                  return (
                    <div
                      key={s.value}
                      onClick={() => setStadeFilter(prev =>
                        prev.includes(s.value) ? prev.filter(x => x !== s.value) : [...prev, s.value]
                      )}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px',
                        borderRadius: 6, cursor: 'pointer',
                        background: checked ? s.color + '18' : 'transparent',
                        border: `1px solid ${checked ? s.color + '55' : 'transparent'}`,
                        transition: 'all 0.15s',
                        opacity: count === 0 ? 0.4 : 1,
                      }}
                    >
                      <div style={{
                        width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                        background: s.color,
                        boxShadow: checked ? `0 0 0 2px ${s.color}44` : 'none',
                      }} />
                      <Text style={{ flex: 1, fontSize: 12 }}>{s.label}</Text>
                      <Badge count={count} showZero style={{ backgroundColor: checked ? s.color : '#d9d9d9' }} />
                    </div>
                  );
                })}
              </Space>
            </Card>
          )}

          {/* Stats */}
          <Card size="small" title={<><BarChartOutlined style={{ marginRight: 6 }} />Statistiques</>}>
            <Row gutter={8}>
              <Col span={12}>
                <Statistic title="Chantiers" value={displayedChantiers.length} valueStyle={{ fontSize: 18, color: '#fa8c16' }} />
              </Col>
              <Col span={12}>
                <Statistic title="Distribution" value={displayedAccounts.length} valueStyle={{ fontSize: 18, color: '#722ed1' }} />
              </Col>
            </Row>
            <Divider style={{ margin: '8px 0' }} />
            {showC && stadeStats.filter(s => s.count > 0).map(s => (
              <div key={s.value} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                  <Text style={{ fontSize: 11 }}>{s.label}</Text>
                  <Text style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.count}</Text>
                </div>
                <Progress
                  percent={totalChantiers > 0 ? Math.round((s.count / totalChantiers) * 100) : 0}
                  strokeColor={s.color}
                  size="small"
                  showInfo={false}
                />
              </div>
            ))}
          </Card>

          {/* Proximity */}
          <Card size="small" title="Proximité GPS">
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {showC && (
                <Tooltip title="Zoom sur chantiers près de ma position">
                  <Button
                    block size="small" icon={<AimOutlined />}
                    loading={geoLoading}
                    type={proximityTarget === 'chantiers' ? 'primary' : 'default'}
                    style={proximityTarget === 'chantiers' ? { borderColor: '#fa8c16', background: '#fa8c16' } : {}}
                    onClick={() => zoomToNearest('chantiers')}
                  >
                    Chantiers proches
                  </Button>
                </Tooltip>
              )}
              {showD && (
                <Tooltip title="Zoom sur distributeurs près de ma position">
                  <Button
                    block size="small" icon={<AimOutlined />}
                    loading={geoLoading}
                    type={proximityTarget === 'distribution' ? 'primary' : 'default'}
                    style={proximityTarget === 'distribution' ? { borderColor: '#722ed1', background: '#722ed1' } : {}}
                    onClick={() => zoomToNearest('distribution')}
                  >
                    Distribution proche
                  </Button>
                </Tooltip>
              )}
              {proximityTarget && (
                <>
                  <div style={{ fontSize: 12 }}>Rayon : <strong>{radiusKm} km</strong></div>
                  <Slider min={5} max={100} step={5} value={radiusKm}
                    onChange={(v) => { setRadiusKm(v); if (myPosition) setFlyCenter([...myPosition]); }}
                    tooltip={{ formatter: v => `${v} km` }}
                  />
                  <Button size="small" block danger icon={<CloseCircleOutlined />} onClick={clearProximity}>
                    Réinitialiser
                  </Button>
                </>
              )}
            </Space>
          </Card>
        </Col>

        {/* ── Map ── */}
        <Col span={19} style={{ height: '100%' }}>
          <Card bodyStyle={{ padding: 0, height: '100%', overflow: 'hidden', borderRadius: 8 }} style={{ height: '100%' }}>
            <Spin spinning={loading || geoLoading} style={{ height: '100%' }}>
              <MapContainer
                center={DEFAULT_CENTER}
                zoom={DEFAULT_ZOOM}
                style={{ height: '100%', width: '100%', minHeight: 560 }}
                scrollWheelZoom
              >
                <TileLayer
                  attribution={satellite ? ESRI_ATTRIBUTION : OSM_ATTRIBUTION}
                  url={satellite ? ESRI_URL : OSM_URL}
                />

                {proximityTarget && flyCenter
                  ? <FlyToRadius center={flyCenter} radiusKm={radiusKm} />
                  : allPoints.length > 0 && <FitAll points={allPoints} />
                }

                {/* Ma position + cercle rayon */}
                {myPosition && proximityTarget && (
                  <>
                    <Marker position={myPosition} icon={createMyPositionIcon()}>
                      <Popup><strong>Ma position</strong></Popup>
                    </Marker>
                    <Circle center={myPosition} radius={radiusKm * 1000}
                      pathOptions={{ color: '#4285f4', fillColor: '#4285f4', fillOpacity: 0.07, weight: 2, dashArray: '6 4' }}
                    />
                  </>
                )}

                {/* ── Marqueurs Chantiers ── */}
                {displayedChantiers.map(c => {
                  const color = STADE_COLOR[c.stadeChantier || ''] || '#8c8c8c';
                  const dist = myPosition ? haversineKm(myPosition[0], myPosition[1], c.latitude!, c.longitude!) : null;
                  return (
                    <Marker key={`C-${c.id}`} position={[c.latitude!, c.longitude!]} icon={createIcon(color, 'C')}>
                      <Popup minWidth={200}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                            {c.nom}
                          </div>
                          {dist != null && (
                            <div style={{ fontSize: 11, color: '#4285f4', marginBottom: 5, fontWeight: 600 }}>
                              <AimOutlined style={{ marginRight: 4 }} />{dist.toFixed(1)} km de vous
                            </div>
                          )}
                          {(c.ville || c.prefecture) && (
                            <div style={{ fontSize: 12, color: '#555', marginBottom: 5 }}>
                              <EnvironmentOutlined style={{ marginRight: 4 }} />
                              {[c.ville, c.prefecture].filter(Boolean).join(' — ')}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
                            {c.stadeChantier && (
                              <Tag style={{ background: color, color: '#fff', border: 'none', fontSize: 11 }}>
                                {STADE_LABEL[c.stadeChantier] || c.stadeChantier.replace(/_/g, ' ')}
                              </Tag>
                            )}
                            {c.statutChantier && <Tag style={{ fontSize: 11 }}>{c.statutChantier}</Tag>}
                            {c.segmentTaille && <Tag style={{ fontSize: 11 }}>{c.segmentTaille}{c.nombreUnites ? ` · ${c.nombreUnites}u` : ''}</Tag>}
                          </div>
                          <a style={{ fontSize: 12, color: '#fa8c16', fontWeight: 600 }}
                            onClick={e => { e.preventDefault(); navigate(`/chantiers/${c.id}`); }}
                            href={`/chantiers/${c.id}`}
                          >
                            Voir le chantier →
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}

                {/* ── Marqueurs Distribution ── */}
                {displayedAccounts.map(a => {
                  const dist = myPosition ? haversineKm(myPosition[0], myPosition[1], a.latitude!, a.longitude!) : null;
                  return (
                    <Marker key={`D-${a.id}`} position={[a.latitude!, a.longitude!]} icon={createIcon('#722ed1', 'D')}>
                      <Popup minWidth={200}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, borderBottom: '1px solid #f0f0f0', paddingBottom: 6 }}>
                            {a.name}
                          </div>
                          {dist != null && (
                            <div style={{ fontSize: 11, color: '#4285f4', marginBottom: 5, fontWeight: 600 }}>
                              <AimOutlined style={{ marginRight: 4 }} />{dist.toFixed(1)} km de vous
                            </div>
                          )}
                          {(a.billingCity || a.prefecture) && (
                            <div style={{ fontSize: 12, color: '#555', marginBottom: 5 }}>
                              <EnvironmentOutlined style={{ marginRight: 4 }} />
                              {[a.billingCity, a.prefecture].filter(Boolean).join(' — ')}
                            </div>
                          )}
                          {a.statutCompte && <Tag color="purple" style={{ fontSize: 11 }}>{a.statutCompte}</Tag>}
                          <br />
                          <a style={{ fontSize: 12, color: '#722ed1', fontWeight: 600 }}
                            onClick={e => { e.preventDefault(); navigate(`/accounts/${a.id}`); }}
                            href={`/accounts/${a.id}`}
                          >
                            Voir le compte →
                          </a>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </Spin>

            {/* ── Légende flottante en bas de carte ── */}
            <div style={{
              position: 'absolute', bottom: 24, left: '40%', transform: 'translateX(-50%)',
              zIndex: 1000, background: 'rgba(255,255,255,0.95)',
              borderRadius: 10, padding: '8px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', maxWidth: 640,
            }}>
              {showC && STADES.map(s => (
                <div key={s.value} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%', background: s.color,
                    border: '1.5px solid rgba(0,0,0,0.1)',
                  }} />
                  <span style={{ fontSize: 11, color: '#333' }}>
                    <strong>C</strong> {s.label}
                  </span>
                </div>
              ))}
              {showD && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#722ed1', border: '1.5px solid rgba(0,0,0,0.1)' }} />
                  <span style={{ fontSize: 11, color: '#333' }}><strong>D</strong> Distribution</span>
                </div>
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* ── AI Drawer ── */}
      <Drawer
        title={
          <Space>
            <GlobalOutlined style={{ color: '#1677ff' }} />
            <span>Insights Géographiques IA</span>
            <Tag color="purple" style={{ fontSize: 10 }}>Démo</Tag>
          </Space>
        }
        placement="right"
        width={500}
        open={aiDrawerOpen}
        onClose={() => setAiDrawerOpen(false)}
        extra={
          <Button icon={<ReloadOutlined />} size="small" loading={aiLoading} onClick={fetchAi}>
            Analyse temps réel
          </Button>
        }
        styles={{ body: { padding: 16, overflowY: 'auto' } }}
      >
        {aiLoading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <Spin size="large" />
            <br /><br />
            <Text type="secondary">Analyse géographique en cours...</Text>
          </div>
        ) : aiText ? (
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8, fontSize: 13 }}>{aiText}</div>
        ) : (
          <AiDemoContent chantierCount={chantiers.length} distributionCount={accounts.length} />
        )}
      </Drawer>
    </div>
  );
}
