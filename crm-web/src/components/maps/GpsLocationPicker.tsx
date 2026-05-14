import { useState, useCallback, useEffect, useRef } from 'react';
import { Button, Space, Typography, Tooltip, message, Spin, Modal, Alert } from 'antd';
import { AimOutlined, EnvironmentOutlined, CloseCircleOutlined, GlobalOutlined, LockOutlined } from '@ant-design/icons';

// La géolocalisation nécessite HTTPS (sauf localhost)
const IS_SECURE = typeof window !== 'undefined' && window.isSecureContext;
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { Text } = Typography;

// Fix default marker icon issue in bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

interface Props {
  value?: GpsCoordinates;
  onChange?: (coords: GpsCoordinates | undefined) => void;
  onAddressChange?: (address: string | undefined) => void;
  label?: string;
  compact?: boolean;
  autoCapture?: boolean;
}

// ── Reverse-geocoding via Nominatim (OpenStreetMap) ──
async function reverseGeocode(lat: number, lng: number): Promise<string | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr`,
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    return data.display_name || undefined;
  } catch {
    return undefined;
  }
}

// Centre par defaut : Casablanca, Maroc
const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898];
const DEFAULT_ZOOM = 6;

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; OpenStreetMap contributors';
const ESRI_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_ATTRIBUTION = 'Tiles &copy; Esri';

export default function GpsLocationPicker({
  value,
  onChange,
  onAddressChange,
  label,
  compact = false,
  autoCapture = false,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<GpsCoordinates | null>(null);
  const [autoCaptured, setAutoCaptured] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteRef = useRef(false);
  const [satellite, setSatellite] = useState(false);

  const toggleSatellite = useCallback(() => {
    const next = !satelliteRef.current;
    satelliteRef.current = next;
    setSatellite(next);
    tileLayerRef.current?.setUrl(next ? ESRI_URL : OSM_URL);
  }, []);

  // ── Capture GPS via navigateur ──
  const captureGps = useCallback(
    (opts?: { silent?: boolean }) => {
      // Contexte non sécurisé (HTTP sur serveur) → ouvrir la carte directement
      if (!IS_SECURE) {
        if (!opts?.silent) {
          message.info('GPS indisponible sur HTTP — sélectionnez la position sur la carte');
        }
        setTempCoords(value || null);
        setMapOpen(true);
        return;
      }

      if (!navigator.geolocation) {
        if (!opts?.silent) {
          message.error("La géolocalisation n'est pas supportée par votre navigateur");
        }
        setTempCoords(value || null);
        setMapOpen(true);
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GpsCoordinates = {
            latitude: Math.round(position.coords.latitude * 100000000) / 100000000,
            longitude: Math.round(position.coords.longitude * 100000000) / 100000000,
          };
          onChange?.(coords);
          // Reverse-geocoding automatique
          reverseGeocode(coords.latitude, coords.longitude).then((addr) => {
            if (addr) onAddressChange?.(addr);
          });
          setLoading(false);
          if (!opts?.silent) {
            message.success('Position GPS capturee automatiquement');
          }
        },
        (error) => {
          setLoading(false);
          if (opts?.silent) {
            // En mode silencieux (auto-capture), on ouvre la carte comme fallback
            setTempCoords(value || null);
            setMapOpen(true);
            return;
          }
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message.warning(
                'GPS refuse — utilisez la carte pour selectionner la position',
              );
              setTempCoords(value || null);
              setMapOpen(true);
              break;
            case error.POSITION_UNAVAILABLE:
              message.warning(
                'GPS indisponible — utilisez la carte pour selectionner la position',
              );
              setTempCoords(value || null);
              setMapOpen(true);
              break;
            case error.TIMEOUT:
              message.warning(
                "Delai GPS depasse — utilisez la carte pour selectionner la position",
              );
              setTempCoords(value || null);
              setMapOpen(true);
              break;
            default:
              message.error('Erreur de geolocalisation');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        },
      );
    },
    [onChange, onAddressChange, value],
  );

  // ── Auto-capture au montage ──
  useEffect(() => {
    if (autoCapture && !value && !autoCaptured) {
      setAutoCaptured(true);
      captureGps({ silent: true });
    }
  }, [autoCapture, value, autoCaptured, captureGps]);

  const handleClear = useCallback(() => {
    onChange?.(undefined);
    onAddressChange?.(undefined);
  }, [onChange, onAddressChange]);

  // ── Ouvrir la carte ──
  const handleOpenMap = useCallback(() => {
    setTempCoords(value || null);
    setMapOpen(true);
  }, [value]);

  // ── Initialiser Leaflet quand la modale s'ouvre ──
  useEffect(() => {
    if (!mapOpen) return;

    // Petit delai pour que le DOM soit pret
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      // Nettoyer si deja initialise
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const center: [number, number] = tempCoords
        ? [tempCoords.latitude, tempCoords.longitude]
        : value
          ? [value.latitude, value.longitude]
          : DEFAULT_CENTER;

      const zoom = tempCoords || value ? 15 : DEFAULT_ZOOM;

      const map = L.map(mapContainerRef.current, {
        center,
        zoom,
        zoomControl: true,
      });

      const tl = L.tileLayer(satelliteRef.current ? ESRI_URL : OSM_URL, {
        attribution: satelliteRef.current ? ESRI_ATTRIBUTION : OSM_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
      tileLayerRef.current = tl;

      // Placer le marqueur si on a des coordonnees
      if (tempCoords || value) {
        const coords = tempCoords || value!;
        const marker = L.marker([coords.latitude, coords.longitude], {
          draggable: true,
        }).addTo(map);

        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          setTempCoords({
            latitude: Math.round(pos.lat * 100000000) / 100000000,
            longitude: Math.round(pos.lng * 100000000) / 100000000,
          });
        });

        markerRef.current = marker;
      }

      // Click sur la carte pour placer/deplacer le marqueur
      map.on('click', (e: L.LeafletMouseEvent) => {
        const newCoords: GpsCoordinates = {
          latitude: Math.round(e.latlng.lat * 100000000) / 100000000,
          longitude: Math.round(e.latlng.lng * 100000000) / 100000000,
        };
        setTempCoords(newCoords);

        if (markerRef.current) {
          markerRef.current.setLatLng(e.latlng);
        } else {
          const marker = L.marker(e.latlng, { draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            setTempCoords({
              latitude: Math.round(pos.lat * 100000000) / 100000000,
              longitude: Math.round(pos.lng * 100000000) / 100000000,
            });
          });
          markerRef.current = marker;
        }
      });

      mapRef.current = map;

      // Force le recalcul de la taille de la carte
      setTimeout(() => map.invalidateSize(), 200);
    }, 100);

    return () => {
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapOpen]);

  // ── Confirmer la selection depuis la carte ──
  const handleMapConfirm = useCallback(() => {
    if (tempCoords) {
      onChange?.(tempCoords);
      // Reverse-geocoding automatique
      reverseGeocode(tempCoords.latitude, tempCoords.longitude).then((addr) => {
        if (addr) onAddressChange?.(addr);
      });
      message.success('Position selectionnee depuis la carte');
    }
    setMapOpen(false);
    // Nettoyer
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markerRef.current = null;
  }, [tempCoords, onChange, onAddressChange]);

  const handleMapCancel = useCallback(() => {
    setMapOpen(false);
    setTempCoords(null);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
    markerRef.current = null;
  }, []);

  // ── Localiser sur la carte ──
  const handleLocateOnMap = useCallback(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 15);

        const newCoords: GpsCoordinates = {
          latitude: Math.round(lat * 100000000) / 100000000,
          longitude: Math.round(lng * 100000000) / 100000000,
        };
        setTempCoords(newCoords);

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            setTempCoords({
              latitude: Math.round(pos.lat * 100000000) / 100000000,
              longitude: Math.round(pos.lng * 100000000) / 100000000,
            });
          });
          markerRef.current = marker;
        }
      },
      () => {
        message.error('Impossible de recuperer la position GPS');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  // ── Rendu COMPACT ──
  if (compact) {
    return (
      <>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <Space.Compact size="small">
            <Tooltip
              title={
                !IS_SECURE
                  ? 'GPS indisponible (HTTP) — cliquez pour choisir sur la carte'
                  : value
                  ? 'Recapturer ma position'
                  : 'Capturer ma position GPS'
              }
            >
              <Button
                icon={
                  loading ? (
                    <Spin size="small" />
                  ) : !IS_SECURE ? (
                    <LockOutlined style={{ color: '#faad14' }} />
                  ) : value ? (
                    <EnvironmentOutlined style={{ color: '#52c41a' }} />
                  ) : (
                    <AimOutlined />
                  )
                }
                onClick={() => captureGps()}
                size="small"
                type={value ? 'default' : 'dashed'}
                disabled={loading}
              />
            </Tooltip>
            <Tooltip title="Choisir sur la carte">
              <Button
                icon={<GlobalOutlined />}
                onClick={handleOpenMap}
                size="small"
                type="dashed"
              />
            </Tooltip>
          </Space.Compact>
          {value && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              background: '#f6ffed',
              border: '1px solid #b7eb8f',
              borderRadius: 6,
              padding: '1px 6px',
              fontSize: 11,
            }}>
              <EnvironmentOutlined style={{ color: '#52c41a', flexShrink: 0 }} />
              <span style={{ fontFamily: 'monospace', color: '#389e0d' }}>
                {value.latitude.toFixed(5)}, {value.longitude.toFixed(5)}
              </span>
              <Tooltip title="Effacer">
                <Button
                  icon={<CloseCircleOutlined />}
                  onClick={handleClear}
                  size="small"
                  type="text"
                  danger
                  style={{ padding: 0, height: 'auto', minWidth: 'auto' }}
                />
              </Tooltip>
            </div>
          )}
        </div>
        {renderMapModal()}
      </>
    );
  }

  // ── Rendu NORMAL ──
  function renderMapModal() {
    return (
      <Modal
        title={
          <Space>
            <GlobalOutlined style={{ color: '#1890ff' }} />
            <span>Selectionner la position sur la carte</span>
          </Space>
        }
        open={mapOpen}
        onOk={handleMapConfirm}
        onCancel={handleMapCancel}
        okText="Confirmer cette position"
        cancelText="Annuler"
        okButtonProps={{ disabled: !tempCoords }}
        width={720}
        destroyOnHidden
        styles={{ body: { padding: 0 } }}
      >
        <div style={{ padding: '8px 16px', background: '#f5f5f5', borderBottom: '1px solid #e8e8e8' }}>
          <Space>
            <Button
              icon={<AimOutlined />}
              size="small"
              onClick={handleLocateOnMap}
              type="primary"
              ghost
            >
              Ma position GPS
            </Button>
            <Button
              size="small"
              onClick={toggleSatellite}
              type={satellite ? 'primary' : 'default'}
            >
              {satellite ? '🗺 Plan' : '🛰 Satellite'}
            </Button>
            {tempCoords && (
              <Text code style={{ fontSize: 12 }}>
                <EnvironmentOutlined style={{ color: '#52c41a', marginRight: 4 }} />
                {tempCoords.latitude.toFixed(6)}, {tempCoords.longitude.toFixed(6)}
              </Text>
            )}
            {!tempCoords && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                Cliquez sur la carte pour placer le marqueur
              </Text>
            )}
          </Space>
        </div>
        <div
          ref={mapContainerRef}
          style={{ height: 420, width: '100%' }}
        />
      </Modal>
    );
  }

  return (
    <div>
      {label && (
        <Text type="secondary" style={{ display: 'block', marginBottom: 4, fontSize: 13 }}>
          {label}
        </Text>
      )}
      {/* Avertissement HTTP */}
      {!IS_SECURE && (
        <Alert
          type="warning"
          showIcon
          icon={<LockOutlined />}
          message="GPS indisponible — connexion non sécurisée (HTTP)"
          description="La géolocalisation nécessite HTTPS. Utilisez la carte pour sélectionner la position manuellement."
          style={{ marginBottom: 8, fontSize: 12 }}
          banner
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {/* Boutons d'action GPS */}
        <Space.Compact>
          <Tooltip title={!IS_SECURE ? 'GPS indisponible (HTTP) — choisir sur la carte' : value ? 'Recapturer ma position' : 'Capturer ma position'}>
            <Button
              icon={!IS_SECURE ? <LockOutlined /> : <AimOutlined />}
              onClick={() => captureGps()}
              loading={loading}
              type={value ? 'default' : 'dashed'}
              style={{ color: !IS_SECURE ? '#faad14' : value ? '#1677ff' : undefined }}
            />
          </Tooltip>
          <Tooltip title="Choisir sur la carte">
            <Button
              icon={<GlobalOutlined />}
              onClick={handleOpenMap}
              type="dashed"
            />
          </Tooltip>
        </Space.Compact>

        {/* Coordonnées + effacer */}
        {value && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: '#f6ffed',
            border: '1px solid #b7eb8f',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: 12,
          }}>
            <EnvironmentOutlined style={{ color: '#52c41a', flexShrink: 0 }} />
            <Text style={{ fontSize: 12, fontFamily: 'monospace', color: '#389e0d' }}>
              {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
            </Text>
            <Tooltip title="Effacer la localisation">
              <Button
                icon={<CloseCircleOutlined />}
                onClick={handleClear}
                size="small"
                type="text"
                danger
                style={{ padding: 0, height: 'auto', minWidth: 'auto' }}
              />
            </Tooltip>
          </div>
        )}
      </div>
      {renderMapModal()}
    </div>
  );
}
