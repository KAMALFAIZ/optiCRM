import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

export interface MapMarker {
  lat: number;
  lng: number;
  label?: string;
  popup?: string;
  color?: string;
  number?: number;
}

interface Props {
  markers: MapMarker[];
  polyline?: boolean;
  center?: [number, number];
  zoom?: number;
  height?: number | string;
  style?: React.CSSProperties;
}

const MARKER_COLORS: Record<string, string> = {
  blue: '#2196F3',
  green: '#4CAF50',
  red: '#F44336',
  orange: '#FF9800',
  gold: '#FFC107',
  violet: '#9C27B0',
};

function createNumberedIcon(number?: number, color: string = 'blue'): L.DivIcon {
  const bg = MARKER_COLORS[color] || MARKER_COLORS.blue;
  const html = number != null
    ? `<div style="background:${bg};color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)">${number}</div>`
    : `<div style="background:${bg};width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`;
  return L.divIcon({
    html,
    className: '',
    iconSize: number != null ? [28, 28] : [14, 14],
    iconAnchor: number != null ? [14, 14] : [7, 7],
    popupAnchor: [0, number != null ? -16 : -10],
  });
}

// Auto-fit map bounds to markers
function FitBounds({ markers }: { markers: MapMarker[] }) {
  const map = useMap();
  useEffect(() => {
    if (markers.length > 0) {
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }
  }, [markers, map]);
  return null;
}

// Default center: Rabat, Morocco
const DEFAULT_CENTER: [number, number] = [33.9716, -6.8498];
const DEFAULT_ZOOM = 7;

export default function LocationMap({
  markers,
  polyline = false,
  center,
  zoom,
  height = 400,
  style,
}: Props) {
  const validMarkers = useMemo(
    () => markers.filter((m) => m.lat != null && m.lng != null && !isNaN(m.lat) && !isNaN(m.lng)),
    [markers]
  );

  const polylinePositions = useMemo(
    () => (polyline && validMarkers.length >= 2 ? validMarkers.map((m) => [m.lat, m.lng] as [number, number]) : []),
    [polyline, validMarkers]
  );

  const mapCenter = center || (validMarkers.length > 0 ? [validMarkers[0].lat, validMarkers[0].lng] as [number, number] : DEFAULT_CENTER);
  const mapZoom = zoom || (validMarkers.length > 0 ? 12 : DEFAULT_ZOOM);

  if (validMarkers.length === 0) {
    return null;
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height, width: '100%', borderRadius: 8, ...style }}
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds markers={validMarkers} />
      {polylinePositions.length >= 2 && (
        <Polyline positions={polylinePositions} color="#1890ff" weight={3} opacity={0.7} dashArray="8" />
      )}
      {validMarkers.map((marker, idx) => (
        <Marker
          key={`${marker.lat}-${marker.lng}-${idx}`}
          position={[marker.lat, marker.lng]}
          icon={createNumberedIcon(marker.number, marker.color || 'blue')}
        >
          {(marker.popup || marker.label) && (
            <Popup>
              {marker.label && <strong>{marker.label}</strong>}
              {marker.label && marker.popup && <br />}
              {marker.popup && <span>{marker.popup}</span>}
            </Popup>
          )}
        </Marker>
      ))}
    </MapContainer>
  );
}
