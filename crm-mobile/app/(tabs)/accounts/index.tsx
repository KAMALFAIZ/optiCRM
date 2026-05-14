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
import { useAccounts } from '../../../src/hooks/useAccounts';
import { ACCOUNT_TYPES } from '../../../src/types/account';
import type { AccountListItem } from '../../../src/types/account';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

const TYPE_CONFIG: Record<string, { emoji: string; color: string }> = {
  prospect:    { emoji: '🎯', color: '#F59E0B' },
  client:      { emoji: '🏢', color: '#0D9488' },
  partenaire:  { emoji: '🤝', color: '#8B5CF6' },
  fournisseur: { emoji: '📦', color: '#3B82F6' },
  autre:       { emoji: '📋', color: '#64748B' },
};

function getTypeConfig(type?: string) {
  if (!type) return { emoji: '🏢', color: COLORS.primary };
  const key = type.toLowerCase();
  return TYPE_CONFIG[key] ?? { emoji: '🏢', color: COLORS.primary };
}

export default function AccountListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useAccounts({
    search: search || undefined,
    accountType: typeFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: AccountListItem }) => {
    const { emoji, color } = getTypeConfig(item.accountType);
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/accounts/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          <View style={[styles.typeCircle, { backgroundColor: color + '18' }]}>
            <Text style={styles.typeEmoji}>{emoji}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {item.accountType}{item.billingCity ? `  ·  ${item.billingCity}` : ''}
            </Text>
          </View>
          {item.phone ? (
            <Text style={styles.cardPhone} numberOfLines={1}>{item.phone}</Text>
          ) : null}
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
          <Text style={styles.headerTitle}>Comptes</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/accounts/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un compte..."
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
        {ACCOUNT_TYPES.map((t) => {
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
              <Text style={[styles.chipText, active && styles.chipTextSelected]}>{t.label}</Text>
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
          <EmptyState icon="office-building-outline" title="Aucun compte" subtitle="Créez votre premier compte avec le bouton +" />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/accounts/create')}
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

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  cardInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
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
  cardSub: { fontSize: 13, color: COLORS.text3, textTransform: 'capitalize' },
  cardPhone: { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

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
