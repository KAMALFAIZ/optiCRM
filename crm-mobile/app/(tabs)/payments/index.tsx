import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { Searchbar, Chip, Card, Text, FAB, Icon } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { usePayments } from '../../../src/hooks/usePayments';
import { PAYMENT_STATUSES, PAYMENT_METHODS } from '../../../src/api/payments';
import type { PaymentStatus, PaymentListItem } from '../../../src/api/payments';
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

export default function PaymentListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | undefined>();

  const { data, isLoading, isError, refetch } = usePayments({
    search: search || undefined,
    status: statusFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: PaymentListItem }) => {
    const statusInfo = PAYMENT_STATUSES.find((s) => s.value === item.status);
    const methodInfo = PAYMENT_METHODS.find((m) => m.value === item.paymentMethod);

    return (
      <Card style={styles.card} onPress={() => router.push(`/(tabs)/payments/${item.id}`)}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#1976D220' }]}>
              <Icon source="cash-multiple" size={24} color="#1976D2" />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardNumber}>{item.paymentNumber}</Text>
                <Text style={styles.cardAmount}>{formatAmount(item.amount)}</Text>
              </View>
              {item.accountName ? (
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.accountName}</Text>
              ) : null}
              <View style={styles.cardMeta}>
                <Icon
                  source={methodInfo?.icon || 'cash'}
                  size={14}
                  color="#607D8B"
                />
                <Text style={styles.cardMetaText}>
                  {methodInfo?.label || item.paymentMethod}
                </Text>
                <Text style={styles.cardDate}>{formatDate(item.paymentDate)}</Text>
              </View>
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
            {item.reference ? (
              <Text style={styles.reference}>Réf: {item.reference}</Text>
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
        placeholder="Rechercher un paiement..."
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
        {PAYMENT_STATUSES.map((s) => (
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
        ListEmptyComponent={<EmptyState title="Aucun paiement" icon="cash-remove-outline" />}
      />
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={() => router.push('/(tabs)/payments/create')}
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
  cardAmount: { fontSize: 17, fontWeight: '700', color: '#1976D2' },
  cardSubtitle: { fontSize: 13, color: '#607D8B', marginTop: 2 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  cardMetaText: { fontSize: 12, color: '#607D8B' },
  cardDate: { fontSize: 12, color: '#9E9E9E', marginLeft: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  reference: { fontSize: 11, color: '#9E9E9E' },
  fab: { position: 'absolute', right: 16, bottom: 16, backgroundColor: '#1976D2' },
});
