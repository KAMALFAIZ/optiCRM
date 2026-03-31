import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Appbar, ActivityIndicator, Text } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { useAuthStore } from '../../../src/stores/authStore';
import apiClient from '../../../src/api/client';

const getStadeColor = (stade?: string): string => {
  if (!stade) return '#607D8B';
  const s = stade.toUpperCase();
  if (s.includes('ETUDE') || s.includes('ÉTUDE')) return '#1890ff';
  if (s.includes('AUTORIS')) return '#2f54eb';
  if (s.includes('GROS')) return '#fa8c16';
  if (s.includes('SECOND')) return '#faad14';
  if (s.includes('EQUIP') || s.includes('ÉQUIP')) return '#a0d911';
  if (s.includes('LIVR')) return '#52c41a';
  if (s.includes('CLOS')) return '#8c8c8c';
  return '#607D8B';
};

const generateMapHTML = (chantiers: any[]): string => {
  const markers = chantiers
    .filter(c => c.latitude && c.longitude)
    .map(c => {
      const nom = (c.nom || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const ville = (c.ville || '').replace(/'/g, "\\'");
      const stade = (c.stadeChantier || 'N/A').replace(/'/g, "\\'");
      return `
      L.circleMarker([${c.latitude}, ${c.longitude}], {
        radius: 10,
        fillColor: '${getStadeColor(c.stadeChantier)}',
        color: '#fff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map).bindPopup('<b>${nom}</b><br>${ville}<br>Stade: ${stade}');
    `;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" crossorigin=""/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" crossorigin=""></script>
<style>
  html, body, #map {
    height: 100%;
    margin: 0;
    padding: 0;
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map').setView([31.7917, -7.0926], 6);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 18
  }).addTo(map);
  ${markers}
</script>
</body>
</html>`;
};

export default function MapScreen() {
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken, isHydrated } = useAuthStore();

  useEffect(() => {
    if (!isHydrated || !accessToken) return;
    setLoading(true);
    setError(null);
    apiClient
      .get('/chantiers', { params: { page: 1, perPage: 200 } })
      .then(r => setChantiers(r.data.data || []))
      .catch(() => setError('Impossible de charger les chantiers'))
      .finally(() => setLoading(false));
  }, [isHydrated, accessToken]);

  const mappableChantiers = chantiers.filter(c => c.latitude && c.longitude);
  const total = mappableChantiers.length;
  const html = generateMapHTML(chantiers);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content
          title={loading ? 'Carte chantiers' : `Carte (${total} chantier${total !== 1 ? 's' : ''})`}
          titleStyle={styles.title}
        />
      </Appbar.Header>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#1976D2" />
          <Text style={styles.loadingText}>Chargement de la carte...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <WebView
          source={{ html }}
          style={styles.map}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          startInLoadingState
          renderLoading={() => (
            <View style={[styles.center, StyleSheet.absoluteFillObject]}>
              <ActivityIndicator size="large" color="#1976D2" />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  appbar: { backgroundColor: '#1976D2' },
  title: { color: '#FFFFFF', fontWeight: '600' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: { color: '#607D8B', marginTop: 8 },
  errorText: { color: '#F44336', fontSize: 14 },
  map: { flex: 1 },
});
