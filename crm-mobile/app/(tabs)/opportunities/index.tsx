import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useOpportunities, usePipeline } from '../../../src/hooks/useOpportunities';
import { formatCurrency } from '../../../src/utils/formatting';
import type { OpportunityListItem, PipelineStageData } from '../../../src/types/opportunity';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';
import EmptyState from '../../../src/components/ui/EmptyState';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

export default function OpportunityListScreen() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list');
  const [search, setSearch] = useState('');

  const { data: listData, isLoading: listLoading, isError: listError, refetch: refetchList } = useOpportunities({
    search: search || undefined,
  });

  const { data: pipelineData, isLoading: pipelineLoading, isError: pipelineError, refetch: refetchPipeline } = usePipeline();

  const isLoading = viewMode === 'list' ? listLoading : pipelineLoading;
  const isError = viewMode === 'list' ? listError : pipelineError;
  const refetch = viewMode === 'list' ? refetchList : refetchPipeline;
  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const renderListItem = useCallback(({ item }: { item: OpportunityListItem }) => {
    const stageColor = item.stageColor || COLORS.primary;
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/(tabs)/opportunities/${item.id}`)}
        activeOpacity={0.75}
      >
        <View style={styles.cardInner}>
          <View style={[styles.stageBar, { backgroundColor: stageColor }]} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.cardSub} numberOfLines={1}>{item.accountName}</Text>
            <View style={styles.cardFooter}>
              <View style={[styles.stagePill, { backgroundColor: stageColor + '18' }]}>
                <Text style={[styles.stageText, { color: stageColor }]}>{item.stageName}</Text>
              </View>
              <Text style={styles.probability}>{item.probability}%</Text>
            </View>
          </View>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
        </View>
      </TouchableOpacity>
    );
  }, [router]);

  const renderPipelineStage = (stage: PipelineStageData) => (
    <View key={stage.id} style={styles.pipelineColumn}>
      <View style={[styles.pipelineHeader, { borderTopColor: stage.color, borderTopWidth: 3 }]}>
        <Text style={[styles.pipelineStageName, { color: stage.color }]} numberOfLines={1}>
          {stage.name}
        </Text>
        <Text style={styles.pipelineCount}>
          {stage.count} · {formatCurrency(stage.totalAmount)}
        </Text>
      </View>
      {stage.opportunities.map((opp) => (
        <TouchableOpacity
          key={opp.id}
          style={styles.pipelineCard}
          onPress={() => router.push(`/(tabs)/opportunities/${opp.id}`)}
          activeOpacity={0.75}
        >
          <Text style={styles.pipelineOppName} numberOfLines={1}>{opp.name}</Text>
          <Text style={styles.pipelineOppAccount} numberOfLines={1}>{opp.accountName}</Text>
          <Text style={[styles.pipelineOppAmount, { color: stage.color }]}>
            {formatCurrency(opp.amount)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView onRetry={refetch} />;

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Opportunités</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/(tabs)/opportunities/create')}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* View toggle */}
        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
            onPress={() => setViewMode('list')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
              📋 Liste
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'pipeline' && styles.toggleBtnActive]}
            onPress={() => setViewMode('pipeline')}
            activeOpacity={0.7}
          >
            <Text style={[styles.toggleText, viewMode === 'pipeline' && styles.toggleTextActive]}>
              📊 Pipeline
            </Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'list' && (
          <View style={styles.searchWrap}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher une opportunité..."
              placeholderTextColor={COLORS.text4}
              value={search}
              onChangeText={setSearch}
            />
          </View>
        )}
      </View>

      {viewMode === 'list' ? (
        <FlatList
          data={listData?.content || []}
          keyExtractor={(item) => item.id}
          renderItem={renderListItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          ListEmptyComponent={
            <EmptyState icon="trending-up" title="Aucune opportunité" subtitle="Créez votre première opportunité avec le bouton +" />
          }
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          horizontal
          contentContainerStyle={styles.pipelineContainer}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
          showsHorizontalScrollIndicator={false}
        >
          {pipelineData?.stages.map(renderPipelineStage)}
        </ScrollView>
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/opportunities/create')}
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
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  addBtnText: { color: '#fff', fontSize: 26, fontWeight: '300', lineHeight: 30, marginTop: -2 },

  toggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primaryBorder,
  },
  toggleText: { fontSize: 13, fontWeight: '600', color: COLORS.text3 },
  toggleTextActive: { color: COLORS.primary },

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

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
    overflow: 'hidden',
  },
  cardInner: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  stageBar: { width: 4, height: '100%', borderRadius: 2, minHeight: 50, flexShrink: 0 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text1, marginBottom: 3 },
  cardSub: { fontSize: 13, color: COLORS.text3, marginBottom: 8 },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stagePill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: RADIUS.full },
  stageText: { fontSize: 11, fontWeight: '700' },
  probability: { fontSize: 12, color: COLORS.text3, fontWeight: '600' },
  amount: { fontSize: 14, fontWeight: '800', color: COLORS.text1, flexShrink: 0 },

  // Pipeline
  pipelineContainer: { padding: SPACING.lg, paddingBottom: 100, gap: 12 },
  pipelineColumn: {
    width: 240,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
    ...SHADOW.sm,
  },
  pipelineHeader: {
    padding: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pipelineStageName: { fontSize: 13, fontWeight: '700' },
  pipelineCount: { fontSize: 12, color: COLORS.text3, marginTop: 2 },
  pipelineCard: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  pipelineOppName: { fontSize: 13, fontWeight: '600', color: COLORS.text1, marginBottom: 2 },
  pipelineOppAccount: { fontSize: 12, color: COLORS.text3, marginBottom: 4 },
  pipelineOppAmount: { fontSize: 13, fontWeight: '700' },

  fab: {
    position: 'absolute',
    right: SPACING.xl,
    bottom: SPACING.xl,
    width: 58,
    height: 58,
    borderRadius: 16,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOW.sm,
  },
  fabIcon: { color: '#fff', fontSize: 32, fontWeight: '300', lineHeight: 36, marginTop: -2 },
});
