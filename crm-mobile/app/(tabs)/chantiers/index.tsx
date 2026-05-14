import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { Searchbar, Chip, Card, Text, FAB, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useChantiers } from '../../../src/hooks/useChantiers';
import type { ChantierListItem } from '../../../src/api/chantiers';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';

const STADE_CONFIG: Record<string, { label: string; color: string }> = {
  'Étude de projet': { label: 'Étude', color: '#1890ff' },
  'ETUDE': { label: 'Étude', color: '#1890ff' },
  'Autorisation': { label: 'Autorisation', color: '#2f54eb' },
  'Gros œuvre': { label: 'Gros œuvre', color: '#fa8c16' },
  'Second œuvre': { label: 'Second œuvre', color: '#faad14' },
  'Phase équipement': { label: 'Équipement', color: '#a0d911' },
  'Livraison': { label: 'Livraison', color: '#52c41a' },
  'Clôturé': { label: 'Clôturé', color: '#8c8c8c' },
};

const STADE_FILTERS = [
  { value: undefined, label: 'Tous' },
  { value: 'Étude de projet', label: 'Étude' },
  { value: 'Autorisation', label: 'Autorisation' },
  { value: 'Gros œuvre', label: 'Gros œuvre' },
  { value: 'Second œuvre', label: 'Second œuvre' },
  { value: 'Livraison', label: 'Livraison' },
];

function getStadeInfo(stade?: string): { label: string; color: string } {
  if (!stade) return { label: 'Inconnu', color: '#9E9E9E' };
  const direct = STADE_CONFIG[stade];
  if (direct) return direct;
  const lower = stade.toLowerCase();
  if (lower.includes('etude') || lower.includes('étude')) return { label: stade, color: '#1890ff' };
  if (lower.includes('autorisation')) return { label: stade, color: '#2f54eb' };
  if (lower.includes('gros')) return { label: stade, color: '#fa8c16' };
  if (lower.includes('second')) return { label: stade, color: '#faad14' };
  if (lower.includes('livraison')) return { label: stade, color: '#52c41a' };
  if (lower.includes('clôturé') || lower.includes('cloture')) return { label: stade, color: '#8c8c8c' };
  return { label: stade, color: '#607D8B' };
}

function getHealthColor(score: number): string {
  if (score >= 70) return '#4CAF50';
  if (score >= 40) return '#FF9800';
  return '#F44336';
}

export default function ChantierListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [stadeFilter, setStadeFilter] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useChantiers({
    search: search || undefined,
    stadeChantier: stadeFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: ChantierListItem }) => {
    const stadeInfo = getStadeInfo(item.stadeChantier);
    const hasHealthScore = typeof item.healthScore === 'number' && item.healthScore > 0;
    const healthColor = hasHealthScore ? getHealthColor(item.healthScore!) : '#9E9E9E';
    const location = [item.ville, item.prefecture].filter(Boolean).join(', ');

    return (
      <Card style={styles.card} onPress={() => router.push(`/(tabs)/chantiers/${item.id}`)}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: stadeInfo.color + '20' }]}>
              <Icon source="crane" size={24} color={stadeInfo.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.nom}</Text>
              {location ? (
                <Text style={styles.cardSubtitle} numberOfLines={1}>{location}</Text>
              ) : null}
            </View>
            {hasHealthScore && (
              <View style={styles.healthContainer}>
                <Icon source="heart" size={16} color={healthColor} />
                <Text style={[styles.healthScore, { color: healthColor }]}>{item.healthScore}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.footerLeft}>
              {item.stadeChantier && (
                <Chip compact style={{ backgroundColor: stadeInfo.color + '20' }}>
                  <Text style={{ color: stadeInfo.color, fontSize: 11 }}>{stadeInfo.label}</Text>
                </Chip>
              )}
              {item.typeProjet && (
                <Text style={styles.typeText} numberOfLines={1}>{item.typeProjet}</Text>
              )}
            </View>
            {item.accountName && (
              <Text style={styles.accountText} numberOfLines={1}>{item.accountName}</Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  }, [router]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.container}>
      <Searchbar
        placeholder="Rechercher un chantier..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      <View style={styles.chips}>
        {STADE_FILTERS.map((f) => (
          <Chip
            key={f.label}
            selected={stadeFilter === f.value}
            onPress={() => setStadeFilter(f.value)}
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
        ListEmptyComponent={<EmptyState title="Aucun chantier" icon="crane-outline" />}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/chantiers/create')}
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
  healthContainer: { flexDirection: 'row', alignItems: 'center', gap: 2, marginLeft: 8 },
  healthScore: { fontSize: 13, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  typeText: { fontSize: 12, color: '#607D8B' },
  accountText: { fontSize: 12, color: '#1976D2', fontWeight: '500', maxWidth: 120 },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976D2' },
});
