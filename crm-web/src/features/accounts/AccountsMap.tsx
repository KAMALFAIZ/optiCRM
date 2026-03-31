import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Space, Tag, Spin, Button, Slider, Row, Col, Typography, Tooltip, Card as AntCard, message } from 'antd';
import {
  BankOutlined, EnvironmentOutlined, PhoneOutlined,
  AimOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { AccountListItem } from '@/types/account';

const { Text } = Typography;

// Fix default marker icon issue with vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const TYPE_COLORS: Record<string, string> = {
  Client: '#52c41a',
  Prospect: '#1890ff',
  Partenaire: '#722ed1',
  Fournisseur: '#fa8c16',
};

function createDotIcon(type: string): L.DivIcon {
  const color = TYPE_COLORS[type] || '#8c8c8c';
  const html = `<div style="background:${color};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.35)"></div>`;
  return L.divIcon({ html, className: '', iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -10] });
}

/** Haversine distance in km between two lat/lng points */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Create a pulsing icon for "my position" */
function createMyPositionIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="position:relative;width:20px;height:20px">
      <div style="position:absolute;inset:0;background:#4285f4;border-radius:50%;border:3px solid #fff;box-shadow:0 0 8px rgba(66,133,244,0.6)"></div>
      <div style="position:absolute;inset:-6px;border:2px solid rgba(66,133,244,0.3);border-radius:50%;animation:pulse 2s infinite"></div>
    </div>
    <style>@keyframes pulse{0%{transform:scale(1);opacity:1}100%{transform:scale(2);opacity:0}}</style>`,
    className: '',
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

function FitBounds({ accounts }: { accounts: AccountListItem[] }) {
  const map = useMap();
  useEffect(() => {
    if (accounts.length === 0) return;
    const bounds = L.latLngBounds(accounts.map(a => [a.latitude!, a.longitude!]));
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
  }, [accounts, map]);
  return null;
}

/** Fly the map to a given center + radius */
function FlyToRadius({ center, radiusKm }: { center: [number, number] | null; radiusKm: number }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    const radiusM = radiusKm * 1000;
    const circle = L.circle(center, { radius: radiusM });
    circle.addTo(map);
    map.fitBounds(circle.getBounds(), { padding: [40, 40], maxZoom: 15 });
    circle.remove();
  }, [center, radiusKm, map]);
  return null;
}

const DEFAULT_CENTER: [number, number] = [31.5, -6.5]; // centre Maroc

interface Props {
  accounts: AccountListItem[];
  height?: string | number;
  loading?: boolean;
}

const AccountsMap: React.FC<Props> = ({ accounts, height = 'calc(100vh - 310px)', loading = false }) => {
  const navigate = useNavigate();

  // Proximity state
  const [myPosition, setMyPosition] = useState<[number, number] | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [radiusKm, setRadiusKm] = useState(20);
  const [proximityActive, setProximityActive] = useState(false);
  const [flyCenter, setFlyCenter] = useState<[number, number] | null>(null);

  const validAccounts = useMemo(
    () => accounts.filter(
      a => a.latitude != null && a.longitude != null && !isNaN(a.latitude!) && !isNaN(a.longitude!)
    ),
    [accounts]
  );

  // Auto-detect user position on mount
  const autoGeoTriggered = React.useRef(false);
  useEffect(() => {
    if (autoGeoTriggered.current || validAccounts.length === 0) return;
    if (!navigator.geolocation) return;
    autoGeoTriggered.current = true;
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMyPosition(userPos);
        setProximityActive(true);
        setFlyCenter(userPos);
        setGeoLoading(false);
      },
      () => {
        // Silently fall back to showing all accounts
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [validAccounts.length]);

  // Filter accounts by proximity when active
  const displayedAccounts = useMemo(() => {
    if (!proximityActive || !myPosition) return validAccounts;
    return validAccounts.filter(a =>
      haversineKm(myPosition[0], myPosition[1], a.latitude!, a.longitude!) <= radiusKm
    );
  }, [validAccounts, proximityActive, myPosition, radiusKm]);

  /** Get user GPS and zoom to nearest accounts */
  const zoomToMyPosition = useCallback(() => {
    if (!navigator.geolocation) {
      message.error("La géolocalisation n'est pas supportée par votre navigateur");
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const userPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setMyPosition(userPos);
        setProximityActive(true);
        setFlyCenter(userPos);
        setGeoLoading(false);
        message.success(`Position détectée — zoom sur les comptes dans un rayon de ${radiusKm} km`);
      },
      (err) => {
        setGeoLoading(false);
        message.error(`Impossible d'obtenir la position : ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [radiusKm]);

  /** Clear proximity mode */
  const clearProximity = () => {
    setMyPosition(null);
    setProximityActive(false);
    setFlyCenter(null);
  };

  if (loading) {
    return (
      <div style={{
        height: typeof height === 'number' ? height : height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fafafa', borderRadius: 8, border: '1px dashed #d9d9d9',
      }}>
        <Spin tip="Chargement de la carte..." />
      </div>
    );
  }

  if (validAccounts.length === 0) {
    return (
      <div style={{
        height: typeof height === 'number' ? height : height,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#fafafa', borderRadius: 8, border: '1px dashed #d9d9d9',
      }}>
        <Space direction="vertical" align="center" style={{ color: '#8c8c8c' }}>
          <EnvironmentOutlined style={{ fontSize: 40 }} />
          <span style={{ fontWeight: 500 }}>Aucun compte géolocalisé</span>
          <span style={{ fontSize: 12 }}>
            Ajoutez des coordonnées GPS (latitude / longitude) dans la fiche compte pour les afficher ici.
          </span>
        </Space>
      </div>
    );
  }

  return (
    <div>
      {/* Légende + compteur + proximity button */}
      <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: '#595959', flexWrap: 'wrap' }}>
        <Tooltip title="Cliquer pour zoomer sur les comptes les plus proches de votre position GPS">
          <AntCard
            size="small"
            hoverable
            onClick={zoomToMyPosition}
            style={{
              borderLeft: '4px solid #4285f4',
              cursor: 'pointer',
              ...(proximityActive ? { boxShadow: '0 0 0 2px #4285f4' } : {}),
            }}
          >
            <Space>
              <AimOutlined spin={geoLoading} style={{ color: '#4285f4' }} />
              <Text strong>
                {proximityActive ? displayedAccounts.length : validAccounts.length}
              </Text>
              <Text type="secondary">
                {proximityActive
                  ? `comptes dans ${radiusKm} km`
                  : 'comptes géolocalisés — cliquer pour zoomer sur ma position'}
              </Text>
            </Space>
          </AntCard>
        </Tooltip>

        {accounts.length !== validAccounts.length && (
          <span style={{ color: '#bfbfbf' }}>
            ({accounts.length - validAccounts.length} sans coordonnées GPS)
          </span>
        )}

        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <span key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{
                display: 'inline-block', width: 10, height: 10, borderRadius: '50%',
                background: color, border: '1.5px solid #fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
              {type}
            </span>
          ))}
        </span>
      </div>

      {/* Proximity controls (slider + reset) */}
      {proximityActive && (
        <AntCard size="small" style={{ marginBottom: 8, borderLeft: '4px solid #4285f4' }}>
          <Row align="middle" gutter={12}>
            <Col>
              <Text style={{ fontSize: 12, whiteSpace: 'nowrap' }}>
                Rayon : <strong>{radiusKm} km</strong>
              </Text>
            </Col>
            <Col flex="auto">
              <Slider
                min={5}
                max={100}
                step={5}
                value={radiusKm}
                onChange={(val) => {
                  setRadiusKm(val);
                  if (myPosition) setFlyCenter([...myPosition]);
                }}
                tooltip={{ formatter: (v) => `${v} km` }}
              />
            </Col>
            <Col>
              <Button
                size="small"
                icon={<CloseCircleOutlined />}
                onClick={clearProximity}
                type="text"
                danger
              >
                Réinitialiser
              </Button>
            </Col>
          </Row>
        </AntCard>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={6}
        style={{ height, width: '100%', borderRadius: 8 }}
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Auto-fit or fly to proximity */}
        {proximityActive && flyCenter
          ? <FlyToRadius center={flyCenter} radiusKm={radiusKm} />
          : <FitBounds accounts={displayedAccounts} />
        }

        {/* My position marker + radius circle */}
        {myPosition && proximityActive && (
          <>
            <Marker position={myPosition} icon={createMyPositionIcon()}>
              <Popup>
                <strong>Ma position</strong><br />
                <span style={{ fontSize: 11, color: '#666' }}>
                  {myPosition[0].toFixed(5)}, {myPosition[1].toFixed(5)}
                </span>
              </Popup>
            </Marker>
            <Circle
              center={myPosition}
              radius={radiusKm * 1000}
              pathOptions={{
                color: '#4285f4',
                fillColor: '#4285f4',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '6 4',
              }}
            />
          </>
        )}

        {displayedAccounts.map(account => {
          const dist = myPosition
            ? haversineKm(myPosition[0], myPosition[1], account.latitude!, account.longitude!)
            : null;
          return (
            <Marker
              key={account.id}
              position={[account.latitude!, account.longitude!]}
              icon={createDotIcon(account.accountType)}
            >
              <Popup maxWidth={220}>
                <div style={{ minWidth: 180 }}>
                  {/* Nom (lien) */}
                  <div style={{ marginBottom: 6 }}>
                    <a
                      style={{ fontWeight: 700, fontSize: 14, cursor: 'pointer', color: '#1890ff' }}
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      <BankOutlined style={{ marginRight: 5 }} />
                      {account.name}
                    </a>
                  </div>

                  {/* Distance from user */}
                  {dist != null && (
                    <div style={{ fontSize: 11, color: '#4285f4', marginBottom: 4, fontWeight: 600 }}>
                      <AimOutlined style={{ marginRight: 4 }} />
                      {dist.toFixed(1)} km de vous
                    </div>
                  )}

                  {/* Type */}
                  <Tag
                    style={{
                      background: TYPE_COLORS[account.accountType] || '#d9d9d9',
                      color: '#fff', border: 'none', marginBottom: 6,
                    }}
                  >
                    {account.accountType}
                  </Tag>

                  {/* Ville */}
                  {account.billingCity && (
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 4 }}>
                      <EnvironmentOutlined style={{ marginRight: 4 }} />
                      {account.billingCity}
                      {account.billingCountry ? `, ${account.billingCountry}` : ''}
                    </div>
                  )}

                  {/* Téléphone */}
                  {account.phone && (
                    <div style={{ fontSize: 12, color: '#595959', marginTop: 2 }}>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      <a href={`tel:${account.phone}`}>{account.phone}</a>
                    </div>
                  )}

                  {/* Sage code */}
                  {account.sageCode && (
                    <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                      Code Sage : <strong>{account.sageCode}</strong>
                    </div>
                  )}

                  {/* Lien détail */}
                  <div style={{ marginTop: 10, borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                    <a
                      style={{ fontSize: 12, cursor: 'pointer', color: '#1890ff' }}
                      onClick={() => navigate(`/accounts/${account.id}`)}
                    >
                      Voir la fiche →
                    </a>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default AccountsMap;
