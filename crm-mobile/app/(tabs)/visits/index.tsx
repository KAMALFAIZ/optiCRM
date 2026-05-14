import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useVisits } from '../../../src/hooks/useVisits';
import { VISIT_TYPES, VISIT_STATUSES } from '../../../src/types/visit';
import type { VisitListItem } from '../../../src/types/visit';
import { getStatusColor } from '../../../src/utils/constants';
import { formatDate } from '../../../src/utils/formatting';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

// Visit type config with emoji + color
const VISIT_TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  prospection:  { emoji: '🎯', color: '#3B82F6' },
  suivi:        { emoji: '🤝', color: '#0D9488' },
  demonstration:{ emoji: '🎬', color: '#8B5CF6' },
  reclamation:  { emoji: '⚠️', color: '#EF4444' },
  autre:        { emoji: '📋', color: '#64748B' },
};

function getTypeConfig(type: string) {
  return VISIT_TYPE_CONFIG[type] ?? { emoji: '📋', color: COLORS.text3 };
}

export default function VisitListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useVisits({
    search: search || undefined,
    visitType: typeFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(
    ({ item }: { item: VisitListItem }) => {
      const { emoji, color } = getTypeConfig(item.visitType);
      const statusInfo = VISIT_STATUSES.find((s) => s.value === item.status);
      const statusColor = getStatusColor(item.status);
      const hasCheckedIn  = !!item.checkInAt;
      const hasCheckedOut = !!item.checkOutAt;

      return (
        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push(`/(tabs)/visits/${item.id}`)}
          activeOpacity={0.75}
        >
          <View style={styles.cardInner}>
            {/* Top row */}
            <View style={styles.cardTop}>
              <View style={[styles.typeCircle, { backgroundColor: color + '18' }]}>
                <Text style={styles.typeEmoji}>{emoji}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle} numberOfLines={1}>
                  {item.subject}
                </Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {item.accountName ? `${item.accountName}  ·  ` : ''}
                  {formatDate(item.visitDate)}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {statusInfo?.label || item.status}
                </Text>
              </View>
            </View>

            {/* Footer row */}
            <View style={styles.cardFooter}>
              <View style={styles.checkRow}>
                <View style={styles.checkItem}>
                  <View
                    style={[
                      styles.checkDot,
                      { backgroundColor: hasCheckedIn ? COLORS.success : COLORS.border },
                    ]}
                  />
                  <Text style={styles.checkLabel}>Check-in</Text>
                </View>
                <View style={styles.checkItem}>
                  <View
                    style={[
                      styles.checkDot,
                      { backgroundColor: hasCheckedOut ? COLORS.primary : COLORS.border },
                    ]}
                  />
                  <Text style={styles.checkLabel}>Check-out</Text>
                </View>
              </View>
              <View style={[styles.typePill, { backgroundColor: color + '12' }]}>
                <Text style={[styles.typeText, { color }]}>
                  {item.visitType ?? 'autre'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [router],
  );

  if (isLoading) return <LoadingScreen />;
  if (isError)   return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Visites terrain</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/visits/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une visite..."
            placeholderTextColor={COLORS.text4}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        <TouchableOpacity
          style={[styles.chip, !typeFilter && styles.chipSelected]}
          onPress={() => setTypeFilter(undefined)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, !typeFilter && styles.chipTextSelected]}>Tous</Text>
        </TouchableOpacity>
        {VISIT_TYPES.map((t) => {
          const active = typeFilter === t.value;
          const cfg = getTypeConfig(t.value);
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, active && styles.chipSelected]}
              onPress={() => setTypeFilter(active ? undefined : t.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextSelected]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={data?.content || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="map-marker-outline"
            title="Aucune visite"
            subtitle="Créez votre première visite avec le bouton +"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/visits/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: SPACING.xl,
    paddingTop: 52,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.text1, letterSpacing: -0.5 },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.teal,
  },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -2 },

  // Search
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface2,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text1,
    paddingVertical: 0,
  },

  // Filter chips
  chipsScroll: {
    paddingVertical: 12,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.text3 },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },

  // List
  list: { padding: SPACING.lg, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  cardInner: { padding: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  typeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  typeEmoji: { fontSize: 20 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text1, marginBottom: 3 },
  cardSub: { fontSize: 13, color: COLORS.text3 },
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: '700' },

  // Card footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  checkRow: { flexDirection: 'row', gap: 14 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  checkDot: { width: 8, height: 8, borderRadius: 4 },
  checkLabel: { fontSize: 11, color: COLORS.text3, fontWeight: '500' },
  typePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  typeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },

  // FAB
  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.teal,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 36, marginTop: -2 },
});
