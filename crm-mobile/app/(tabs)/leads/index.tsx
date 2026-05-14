import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useLeads } from '../../../src/hooks/useLeads';
import { LEAD_STATUSES, LEAD_RATINGS } from '../../../src/types/lead';
import type { LeadListItem } from '../../../src/types/lead';
import { getStatusColor } from '../../../src/utils/constants';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

const STATUS_EMOJI: Record<string, string> = {
  new:         '🆕',
  contacted:   '📞',
  qualified:   '✅',
  unqualified: '❌',
  converted:   '🏆',
};

const RATING_CONFIG: Record<string, { emoji: string; color: string }> = {
  hot:  { emoji: '🔥', color: '#EF4444' },
  warm: { emoji: '☀️', color: '#F59E0B' },
  cold: { emoji: '❄️', color: '#3B82F6' },
};

export default function LeadListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useLeads({
    search: search || undefined,
    status: statusFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: LeadListItem }) => {
    const statusColor = getStatusColor(item.status);
    const statusLabel = LEAD_STATUSES.find((s) => s.value === item.status)?.label || item.status;
    const statusEmoji = STATUS_EMOJI[item.status] ?? '👤';
    const ratingCfg = item.rating ? RATING_CONFIG[item.rating.toLowerCase()] : null;
    const ratingLabel = LEAD_RATINGS.find((r) => r.value === item.rating)?.label;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/leads/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          <View style={styles.cardTop}>
            <View style={[styles.typeCircle, { backgroundColor: statusColor + '18' }]}>
              <Text style={styles.typeEmoji}>{statusEmoji}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.fullName}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {item.companyName || '—'}{item.city ? `  ·  ${item.city}` : ''}
              </Text>
            </View>
            {ratingCfg && (
              <View style={[styles.ratingBadge, { backgroundColor: ratingCfg.color + '18' }]}>
                <Text style={styles.ratingEmoji}>{ratingCfg.emoji}</Text>
                <Text style={[styles.ratingText, { color: ratingCfg.color }]}>{ratingLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.cardFooter}>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {item.leadScore != null && (
              <View style={styles.scorePill}>
                <Text style={styles.scoreLabel}>Score </Text>
                <Text style={styles.scoreValue}>{item.leadScore}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Leads</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/leads/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un lead..."
            placeholderTextColor={COLORS.text4}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsScroll}
      >
        <TouchableOpacity
          style={[styles.chip, !statusFilter && styles.chipSelected]}
          onPress={() => setStatusFilter(undefined)}
          activeOpacity={0.7}
        >
          <Text style={[styles.chipText, !statusFilter && styles.chipTextSelected]}>Tous</Text>
        </TouchableOpacity>
        {LEAD_STATUSES.map((s) => {
          const active = statusFilter === s.value;
          const emoji = STATUS_EMOJI[s.value] ?? '👤';
          return (
            <TouchableOpacity
              key={s.value}
              style={[styles.chip, active && styles.chipSelected]}
              onPress={() => setStatusFilter(active ? undefined : s.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextSelected]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={data?.content || []}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }
        ListEmptyComponent={
          <EmptyState icon="account-arrow-right-outline" title="Aucun lead" subtitle="Ajoutez votre premier lead avec le bouton +" />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/leads/create')}
        activeOpacity={0.85}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

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
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -2 },

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
  searchInput: { flex: 1, fontSize: 14, color: COLORS.text1, paddingVertical: 0 },

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
  chipSelected: { backgroundColor: COLORS.accentMid, borderColor: COLORS.accent + '60' },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.text3 },
  chipTextSelected: { color: '#92400E', fontWeight: '700' },

  list: { padding: SPACING.lg, paddingBottom: 100 },

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
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  ratingEmoji: { fontSize: 12 },
  ratingText: { fontSize: 11, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  statusPill: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.full },
  statusText: { fontSize: 11, fontWeight: '700' },
  scorePill: { flexDirection: 'row', alignItems: 'center' },
  scoreLabel: { fontSize: 12, color: COLORS.text3 },
  scoreValue: { fontSize: 13, fontWeight: '800', color: COLORS.primary },

  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 36, marginTop: -2 },
});
