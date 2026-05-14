import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Searchbar, Chip, Card, Text, FAB, Icon, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useTours } from '../../../src/hooks/useTours';
import type { TourListItem } from '../../../src/api/tours';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#9E9E9E' },
  planned: { label: 'Planifiée', color: '#2196F3' },
  in_progress: { label: 'En cours', color: '#FF9800' },
  completed: { label: 'Terminée', color: '#4CAF50' },
  cancelled: { label: 'Annulée', color: '#F44336' },
};

const STATUS_FILTERS = [
  { value: undefined, label: 'Tous' },
  { value: 'draft', label: 'Brouillon' },
  { value: 'planned', label: 'Planifiée' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'completed', label: 'Terminée' },
];

export default function TourListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useTours({
    search: search || undefined,
    status: statusFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: TourListItem }) => {
    const statusInfo = STATUS_CONFIG[item.status] || { label: item.status, color: '#9E9E9E' };
    const progressValue = item.totalVisits > 0 ? item.completedVisits / item.totalVisits : 0;
    const dateStr = item.tourDate ? new Date(item.tourDate).toLocaleDateString('fr-FR') : '';

    return (
      <Card style={styles.card} onPress={() => router.push(`/(tabs)/tours/${item.id}`)}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: statusInfo.color + '20' }]}>
              <Icon source="map-route" size={24} color={statusInfo.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {dateStr}{item.region ? ` · ${item.region}` : ''}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
              <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Visites</Text>
              <Text style={styles.progressValue}>{item.completedVisits}/{item.totalVisits}</Text>
            </View>
            <ProgressBar
              progress={progressValue}
              color={statusInfo.color}
              style={styles.progressBar}
            />
          </View>

          {item.assignedToName && (
            <Text style={styles.assignedTo} numberOfLines={1}>
              Assigné à : {item.assignedToName}
            </Text>
          )}
        </Card.Content>
      </Card>
    );
  }, [router]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher une tournée..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      <View style={styles.chips}>
        {STATUS_FILTERS.map((f) => (
          <Chip
            key={f.label}
            selected={statusFilter === f.value}
            onPress={() => setStatusFilter(f.value)}
            style={styles.chip}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>
      <FlatList
        data={data?.content || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState title="Aucune tournée" icon="map-outline" />}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/tours/create')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  searchbar: { margin: 12, elevation: 2 },
  chips: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 8, flexWrap: 'wrap', gap: 6 },
  chip: { marginBottom: 4 },
  list: { padding: 12, paddingBottom: 80 },
  card: { marginBottom: 8, elevation: 2 },
  cardContent: { paddingVertical: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#212121' },
  cardSubtitle: { fontSize: 13, color: '#607D8B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },
  progressSection: { marginTop: 10 },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 12, color: '#607D8B' },
  progressValue: { fontSize: 12, color: '#212121', fontWeight: '600' },
  progressBar: { height: 6, borderRadius: 3 },
  assignedTo: { fontSize: 12, color: '#607D8B', marginTop: 6 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976D2' },
});
