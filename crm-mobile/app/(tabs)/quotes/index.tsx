import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { Searchbar, Chip, Card, Text, FAB, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useQuotes } from '../../../src/hooks/useQuotes';
import { QUOTE_STATUSES } from '../../../src/api/quotes';
import type { QuoteStatus, QuoteListItem } from '../../../src/api/quotes';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';

const formatAmount = (n?: number) =>
  n != null ? n.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : '—';

const formatDate = (d?: string) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
};

export default function QuoteListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<QuoteStatus | undefined>();

  const { data, isLoading, isError, refetch } = useQuotes({
    search: search || undefined,
    status: statusFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: QuoteListItem }) => {
    const statusInfo = QUOTE_STATUSES.find((s) => s.value === item.status);

    return (
      <Card style={styles.card} onPress={() => router.push(`/(tabs)/quotes/${item.id}`)}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#1976D220' }]}>
              <Icon source="file-document-outline" size={24} color="#1976D2" />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardNumber}>{item.quoteNumber}</Text>
                <Text style={[styles.cardAmount, { color: '#1976D2' }]}>{formatAmount(item.total)}</Text>
              </View>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
              {item.accountName ? (
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.accountName}</Text>
              ) : null}
              <Text style={styles.cardDate}>{formatDate(item.quoteDate)}</Text>
            </View>
          </View>
          <View style={styles.cardFooter}>
            <Chip
              compact
              style={{ backgroundColor: (statusInfo?.color || '#9E9E9E') + '22' }}
              textStyle={{ color: statusInfo?.color || '#9E9E9E', fontSize: 11, fontWeight: '600' }}
            >
              {statusInfo?.label || item.status}
            </Chip>
            {item.validUntil ? (
              <Text style={styles.validUntil}>Valide jusqu'au {formatDate(item.validUntil)}</Text>
            ) : null}
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
        placeholder="Rechercher un devis..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
      />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsContainer}
        style={styles.chipsScroll}
      >
        <Chip
          selected={!statusFilter}
          onPress={() => setStatusFilter(undefined)}
          style={styles.chip}
          compact
        >
          Tous
        </Chip>
        {QUOTE_STATUSES.map((s) => (
          <Chip
            key={s.value}
            selected={statusFilter === s.value}
            onPress={() => setStatusFilter(statusFilter === s.value ? undefined : s.value)}
            style={[styles.chip, statusFilter === s.value && { backgroundColor: s.color + '22' }]}
            selectedColor={s.color}
            compact
          >
            {s.label}
          </Chip>
        ))}
      </ScrollView>
      <FlatList
        data={data?.content || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
        ListEmptyComponent={<EmptyState title="Aucun devis" icon="file-document-outline" />}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/quotes/create')}
        color="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  searchbar: { margin: 12, elevation: 2 },
  chipsScroll: { maxHeight: 48 },
  chipsContainer: { paddingHorizontal: 12, paddingBottom: 8, gap: 6, flexDirection: 'row', alignItems: 'center' },
  chip: { marginRight: 4 },
  list: { padding: 12, paddingBottom: 80 },
  card: { marginBottom: 8, elevation: 2 },
  cardContent: { paddingVertical: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { fontSize: 12, color: '#607D8B', fontWeight: '500' },
  cardAmount: { fontSize: 15, fontWeight: '700' },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#212121', marginTop: 2 },
  cardSubtitle: { fontSize: 13, color: '#607D8B', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  validUntil: { fontSize: 11, color: '#9E9E9E' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976D2' },
});
