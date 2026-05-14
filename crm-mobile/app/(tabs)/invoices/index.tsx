import React, { useState, useCallback } from 'react';
import { View, FlatList, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import { Searchbar, Chip, Card, Text, Icon, ProgressBar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useInvoices } from '../../../src/hooks/useInvoices';
import { INVOICE_STATUSES } from '../../../src/api/invoices';
import type { InvoiceStatus, InvoiceListItem } from '../../../src/api/invoices';
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

export default function InvoiceListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | undefined>();

  const { data, isLoading, isError, refetch } = useInvoices({
    search: search || undefined,
    status: statusFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: InvoiceListItem }) => {
    const statusInfo = INVOICE_STATUSES.find((s) => s.value === item.status);
    const isPartiallyPaid = item.status === 'PARTIALLY_PAID';
    const progress = isPartiallyPaid && item.total > 0
      ? Math.min((item.amountPaid || 0) / item.total, 1)
      : 0;
    const amountDue = item.amountDue ?? (item.total - (item.amountPaid || 0));
    const hasDue = amountDue > 0;

    return (
      <Card style={styles.card} onPress={() => router.push(`/(tabs)/invoices/${item.id}`)}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={[styles.cardIcon, { backgroundColor: '#1976D220' }]}>
              <Icon source="receipt-outline" size={24} color="#1976D2" />
            </View>
            <View style={styles.cardInfo}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardNumber}>{item.invoiceNumber}</Text>
                <Text style={styles.cardAmount}>{formatAmount(item.total)}</Text>
              </View>
              {item.accountName ? (
                <Text style={styles.cardSubtitle} numberOfLines={1}>{item.accountName}</Text>
              ) : null}
              <Text style={styles.cardDate}>{formatDate(item.invoiceDate)}</Text>
              {hasDue && (
                <Text style={styles.amountDue}>Dû : {formatAmount(amountDue)}</Text>
              )}
            </View>
          </View>

          {isPartiallyPaid && (
            <View style={styles.progressContainer}>
              <ProgressBar progress={progress} color="#00BCD4" style={styles.progressBar} />
              <Text style={styles.progressText}>
                {Math.round(progress * 100)}% payé
              </Text>
            </View>
          )}

          <View style={styles.cardFooter}>
            <Chip
              compact
              style={{ backgroundColor: (statusInfo?.color || '#9E9E9E') + '22' }}
              textStyle={{ color: statusInfo?.color || '#9E9E9E', fontSize: 11, fontWeight: '600' }}
            >
              {statusInfo?.label || item.status}
            </Chip>
            {item.dueDate ? (
              <Text style={styles.dueDate}>Échéance : {formatDate(item.dueDate)}</Text>
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
        placeholder="Rechercher une facture..."
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
          Toutes
        </Chip>
        {INVOICE_STATUSES.map((s) => (
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
        ListEmptyComponent={<EmptyState title="Aucune facture" icon="receipt-outline" />}
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
  list: { padding: 12, paddingBottom: 24 },
  card: { marginBottom: 8, elevation: 2 },
  cardContent: { paddingVertical: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  cardIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardNumber: { fontSize: 12, color: '#607D8B', fontWeight: '500' },
  cardAmount: { fontSize: 15, fontWeight: '700', color: '#212121' },
  cardSubtitle: { fontSize: 13, color: '#607D8B', marginTop: 2 },
  cardDate: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  amountDue: { fontSize: 12, color: '#F44336', fontWeight: '600', marginTop: 2 },
  progressContainer: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  progressText: { fontSize: 11, color: '#607D8B', minWidth: 50 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  dueDate: { fontSize: 11, color: '#9E9E9E' },
});
