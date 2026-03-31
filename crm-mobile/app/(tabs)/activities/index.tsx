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
import { useActivities } from '../../../src/hooks/useActivities';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES } from '../../../src/types/activity';
import type { ActivityListItem } from '../../../src/types/activity';
import { getStatusColor } from '../../../src/utils/constants';
import { formatDateTime } from '../../../src/utils/formatting';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

const ACTIVITY_EMOJI: Record<string, { emoji: string; color: string }> = {
  call:     { emoji: '📞', color: '#3B82F6' },
  email:    { emoji: '✉️',  color: '#0D9488' },
  meeting:  { emoji: '🤝', color: '#8B5CF6' },
  task:     { emoji: '✅', color: '#F59E0B' },
  demo:     { emoji: '🎬', color: '#EF4444' },
  autre:    { emoji: '📋', color: '#64748B' },
};

function getActivityConfig(type: string) {
  return ACTIVITY_EMOJI[type?.toLowerCase()] ?? { emoji: '📅', color: COLORS.primary };
}

export default function ActivityListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useActivities({
    search: search || undefined,
    activityType: typeFilter,
    status: statusFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: ActivityListItem }) => {
    const { emoji, color } = getActivityConfig(item.activityType);
    const statusColor = getStatusColor(item.status);
    const statusLabel = ACTIVITY_STATUSES.find((s) => s.value === item.status)?.label || item.status;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/activities/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          {/* Top row */}
          <View style={styles.cardTop}>
            <View style={[styles.typeCircle, { backgroundColor: color + '18' }]}>
              <Text style={styles.typeEmoji}>{emoji}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle} numberOfLines={1}>{item.subject}</Text>
              <Text style={styles.cardSub} numberOfLines={1}>
                {formatDateTime(item.startDate || item.dueDate)}
              </Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <View style={[styles.typePill, { backgroundColor: color + '12' }]}>
              <Text style={[styles.typeText, { color }]}>
                {ACTIVITY_TYPES.find((t) => t.value === item.activityType)?.label || item.activityType}
              </Text>
            </View>
            {item.priority && (
              <View style={styles.priorityWrap}>
                <Text style={styles.priorityText}>{item.priority}</Text>
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

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Activités</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/activities/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une activité..."
            placeholderTextColor={COLORS.text4}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      {/* Type filter chips */}
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
        {ACTIVITY_TYPES.map((t) => {
          const active = typeFilter === t.value;
          const cfg = getActivityConfig(t.value);
          return (
            <TouchableOpacity
              key={t.value}
              style={[styles.chip, active && styles.chipSelected]}
              onPress={() => setTypeFilter(active ? undefined : t.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{cfg.emoji}</Text>
              <Text style={[styles.chipText, active && styles.chipTextSelected]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Status chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.chipsScroll, { paddingTop: 0, paddingBottom: 8 }]}
      >
        <TouchableOpacity
          style={[styles.statusChip, !statusFilter && styles.statusChipSelected]}
          onPress={() => setStatusFilter(undefined)}
          activeOpacity={0.7}
        >
          <Text style={[styles.statusChipText, !statusFilter && styles.statusChipTextSelected]}>
            Tous statuts
          </Text>
        </TouchableOpacity>
        {ACTIVITY_STATUSES.map((s) => {
          const active = statusFilter === s.value;
          const color = getStatusColor(s.value);
          return (
            <TouchableOpacity
              key={s.value}
              style={[
                styles.statusChip,
                active && { backgroundColor: color + '18', borderColor: color + '40' },
              ]}
              onPress={() => setStatusFilter(active ? undefined : s.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.statusChipText, active && { color }]}>{s.label}</Text>
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
          <EmptyState icon="calendar-check-outline" title="Aucune activité" subtitle="Créez votre première activité avec le bouton +" />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/activities/create')}
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
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.teal,
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
  chipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryBorder },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.text3 },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },

  statusChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusChipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryBorder },
  statusChipText: { fontSize: 12, fontWeight: '500', color: COLORS.text3 },
  statusChipTextSelected: { color: COLORS.primary, fontWeight: '700' },

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
  statusPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  statusText: { fontSize: 11, fontWeight: '700' },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  typePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.full },
  typeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  priorityWrap: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.accentMid,
  },
  priorityText: { fontSize: 11, fontWeight: '600', color: '#92400E', textTransform: 'capitalize' },

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
