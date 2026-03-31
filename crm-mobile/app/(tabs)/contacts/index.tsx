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
import { useContacts } from '../../../src/hooks/useContacts';
import { CONTACT_STATUSES } from '../../../src/types/contact';
import type { ContactListItem } from '../../../src/types/contact';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

function getInitials(firstName?: string, lastName?: string) {
  return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase() || '?';
}

// Deterministic color from name
const AVATAR_COLORS = [
  '#0D9488', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981',
];
function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function ContactListScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>();

  const { data, isLoading, isError, refetch } = useContacts({
    search: search || undefined,
    status: statusFilter,
  });

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderItem = useCallback(({ item }: { item: ContactListItem }) => {
    const initials = getInitials(item.firstName, item.lastName);
    const avatarColor = getAvatarColor(item.fullName || initials);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/contacts/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.fullName}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {item.jobTitle ? `${item.jobTitle}` : ''}
              {item.jobTitle && item.accountName ? '  ·  ' : ''}
              {item.accountName ? item.accountName : ''}
            </Text>
            {(item.email || item.phoneMobile) ? (
              <Text style={styles.cardContact} numberOfLines={1}>
                {item.email || item.phoneMobile}
              </Text>
            ) : null}
          </View>
          <Text style={styles.chevron}>›</Text>
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
          <Text style={styles.headerTitle}>Contacts</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/contacts/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchWrap}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un contact..."
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
        {CONTACT_STATUSES.map((s) => {
          const active = statusFilter === s.value;
          return (
            <TouchableOpacity
              key={s.value}
              style={[styles.chip, active && styles.chipSelected]}
              onPress={() => setStatusFilter(active ? undefined : s.value)}
              activeOpacity={0.7}
            >
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
          <EmptyState icon="account-group-outline" title="Aucun contact" subtitle="Ajoutez votre premier contact avec le bouton +" />
        }
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/contacts/create')}
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
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipSelected: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primaryBorder },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.text3 },
  chipTextSelected: { color: COLORS.primary, fontWeight: '700' },

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },
  cardInner: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text1, marginBottom: 2 },
  cardSub: { fontSize: 13, color: COLORS.text3, marginBottom: 2 },
  cardContact: { fontSize: 12, color: COLORS.primary, fontWeight: '500' },
  chevron: { fontSize: 22, color: COLORS.text5, fontWeight: '300' },

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
