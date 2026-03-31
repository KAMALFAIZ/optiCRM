import React, { useCallback } from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useDashboard } from '../../src/hooks/useDashboard';
import { useAuthStore } from '../../src/stores/authStore';
import { useUnreadCount } from '../../src/hooks/useNotifications';
import { formatCurrency, formatNumber } from '../../src/utils/formatting';
import LoadingScreen from '../../src/components/ui/LoadingScreen';
import ErrorView from '../../src/components/ui/ErrorView';
import KPICard from '../../src/components/ui/KPICard';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../src/config/theme';
import { StatusBar } from 'expo-status-bar';

// ─── Mini Bar Chart ────────────────────────────────────────────────────────────
// Uses rgba to avoid the '#fff' + '40' = '#fff40' bug (invalid hex)
function MiniBarChart({
  data,
  barColor,
  dimColor,
  labelColor,
}: {
  data: number[];
  barColor: string;
  dimColor: string;
  labelColor: string;
}) {
  const max = Math.max(...data, 1);
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const highlightIdx = data.length - 2; // yesterday = second-to-last

  return (
    <View style={chart.wrap}>
      {data.map((v, i) => {
        const isHighlight = i === highlightIdx;
        return (
          <View key={i} style={chart.col}>
            <View
              style={[
                chart.bar,
                {
                  height: Math.max((v / max) * 64, 4),
                  backgroundColor: isHighlight ? barColor : dimColor,
                  borderTopLeftRadius: 5,
                  borderTopRightRadius: 5,
                },
              ]}
            />
            <Text style={[chart.label, { color: isHighlight ? barColor : labelColor }]}>
              {labels[i]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const chart = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 84,
    gap: 5,
    paddingHorizontal: 2,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'flex-end' },
  bar: { width: '100%', minHeight: 4 },
  label: { fontSize: 9, marginTop: 5, fontWeight: '600' },
});

// ─── Ring Progress ─────────────────────────────────────────────────────────────
// Fixed: pass explicit colors so it works on any background
function RingProgress({
  percent,
  size = 76,
  arcColor = COLORS.primary,
  trackColor = COLORS.border,
  textColor = COLORS.text1,
  label,
  labelColor = COLORS.text3,
}: {
  percent: number;
  size?: number;
  arcColor?: string;
  trackColor?: string;
  textColor?: string;
  label: string;
  labelColor?: string;
}) {
  const deg = Math.min(percent, 99) * 3.6;
  return (
    <View style={{ alignItems: 'center' }}>
      {/* Track ring */}
      <View
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 7,
          borderColor: trackColor,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {/* Arc ring (rotated, one side transparent) */}
        <View
          style={{
            position: 'absolute',
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 7,
            borderColor: arcColor,
            borderBottomColor: 'transparent',
            borderLeftColor: deg > 180 ? arcColor : 'transparent',
            transform: [{ rotate: `${deg - 90}deg` }],
          }}
        />
        <Text style={{ fontSize: 12, fontWeight: '800', color: textColor }}>
          {percent}%
        </Text>
      </View>
      <Text style={{ fontSize: 10, color: labelColor, marginTop: 5, fontWeight: '500' }}>
        {label}
      </Text>
    </View>
  );
}

// ─── Quick Actions ─────────────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: '📍', label: 'Visite',    route: '/(tabs)/visits/create',    bg: COLORS.primaryLight, color: COLORS.primary },
  { emoji: '📅', label: 'Activité',  route: '/(tabs)/activities/create', bg: COLORS.purpleLight,  color: COLORS.purple },
  { emoji: '👤', label: 'Lead',      route: '/(tabs)/leads/create',      bg: COLORS.accentMid,    color: '#92400E' },
  { emoji: '🏗️', label: 'Chantier', route: '/(tabs)/chantiers/create',  bg: '#FEE2E2',           color: '#EF4444' },
];

// ─── Dashboard Screen ──────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { data: unreadCount } = useUnreadCount();
  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  if (isLoading) return <LoadingScreen />;
  if (isError) return <ErrorView message={String(error)} onRetry={refetch} />;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
  const emoji = hour < 12 ? '☀️' : hour < 18 ? '👋' : '🌙';
  const initials = ((user?.firstName?.[0] || '') + (user?.lastName?.[0] || '')).toUpperCase() || 'U';

  // Simulated weekly bar data (in real app: from API)
  const barData = [3, 5, 4, 7, 6, 8, 5];
  const convPct = Math.min(Math.round((data?.conversionRate ?? 0) * 100), 99);

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>{greeting} {emoji}</Text>
          <Text style={s.userName}>{user?.firstName} {user?.lastName}</Text>
        </View>
        <TouchableOpacity
          style={s.avatarWrap}
          onPress={() => router.push('/(tabs)/notifications')}
        >
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials}</Text>
          </View>
          {unreadCount != null && unreadCount > 0 && (
            <View style={s.notifDot}>
              <Text style={s.notifNum}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Card ── */}
        <View style={s.heroCard}>
          <View style={s.heroTop}>
            {/* Left: stats */}
            <View style={{ flex: 1 }}>
              <Text style={s.heroLabel}>Activités ce mois</Text>
              <Text style={s.heroValue}>{formatNumber(data?.totalAccounts)}</Text>
              <View style={s.trendRow}>
                <View style={s.trendBadge}>
                  <Text style={s.trendText}>↑ +7% vs mois dernier</Text>
                </View>
              </View>
            </View>
            {/* Right: ring */}
            <View style={s.heroRight}>
              <RingProgress
                percent={convPct}
                size={72}
                arcColor="rgba(255,255,255,0.95)"
                trackColor="rgba(255,255,255,0.25)"
                textColor="#fff"
                label="Taux conv."
                labelColor="rgba(255,255,255,0.7)"
              />
            </View>
          </View>

          {/* Bar chart — rgba fixes the #fff+alpha bug */}
          <MiniBarChart
            data={barData}
            barColor="rgba(255,255,255,0.95)"
            dimColor="rgba(255,255,255,0.28)"
            labelColor="rgba(255,255,255,0.55)"
          />
        </View>

        {/* ── KPI Grid ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Vue d'ensemble</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/reports' as any)}>
            <Text style={s.sectionLink}>Voir tout →</Text>
          </TouchableOpacity>
        </View>
        <View style={s.kpiRow}>
          <KPICard title="Comptes"    value={formatNumber(data?.totalAccounts)}      icon="domain"              color={COLORS.blue} />
          <KPICard title="Leads"      value={formatNumber(data?.totalLeads)}         icon="account-arrow-right-outline" color={COLORS.accent} />
        </View>
        <View style={s.kpiRow}>
          <KPICard title="Pipeline"   value={formatCurrency(data?.pipelineTotal)}    icon="chart-bell-curve-cumulative" color={COLORS.purple} />
          <KPICard title="CA ce mois" value={formatCurrency(data?.revenueThisMonth)} icon="cash-multiple"               color={COLORS.primary} />
        </View>

        {/* ── Quick Actions ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Actions rapides</Text>
        </View>
        <View style={s.actionsRow}>
          {QUICK_ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.route}
              style={[s.actionBtn, { backgroundColor: a.bg }]}
              onPress={() => router.push(a.route as any)}
              activeOpacity={0.75}
            >
              <Text style={s.actionEmoji}>{a.emoji}</Text>
              <Text style={[s.actionLabel, { color: a.color }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Shortcuts ── */}
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Raccourcis</Text>
        </View>
        <View style={s.summaryRow}>
          {[
            { emoji: '📊', label: 'Rapports', route: '/(tabs)/reports' },
            { emoji: '🗓️', label: 'Planning', route: '/(tabs)/planning' },
            { emoji: '🗺️', label: 'Carte',    route: '/(tabs)/map' },
          ].map((item) => (
            <TouchableOpacity
              key={item.route}
              style={s.summaryCard}
              onPress={() => router.push(item.route as any)}
              activeOpacity={0.75}
            >
              <Text style={s.summaryEmoji}>{item.emoji}</Text>
              <Text style={s.summaryLabel}>{item.label}</Text>
              <Text style={s.summaryArrow}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  greeting:  { fontSize: 13, color: COLORS.text3, fontWeight: '500' },
  userName:  { fontSize: 20, fontWeight: '800', color: COLORS.text1, letterSpacing: -0.5 },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  notifDot: {
    position: 'absolute', top: -2, right: -2,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: COLORS.rose,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff',
  },
  notifNum: { fontSize: 9, color: '#fff', fontWeight: '700' },

  scroll: { paddingBottom: 32 },

  // Hero card
  heroCard: {
    margin: 16,
    borderRadius: RADIUS.xxl,
    backgroundColor: COLORS.primary,
    padding: 20,
    ...SHADOW.teal,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  heroLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '700',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroValue:   { fontSize: 36, fontWeight: '800', color: '#fff', letterSpacing: -1.5 },
  trendRow:    { marginTop: 8 },
  trendBadge:  {
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  trendText:   { color: '#fff', fontSize: 11, fontWeight: '600' },
  heroRight:   { justifyContent: 'center', alignItems: 'center' },

  // Section
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text1 },
  sectionLink:  { fontSize: 12, color: COLORS.primary, fontWeight: '600' },

  // KPI grid
  kpiRow: { flexDirection: 'row', paddingHorizontal: 12, marginBottom: 0 },

  // Quick Actions
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  actionBtn: {
    flex: 1,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionEmoji: { fontSize: 24 },
  actionLabel: { fontSize: 11, fontWeight: '700' },

  // Shortcuts
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 0 },
  summaryCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    ...SHADOW.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryEmoji: { fontSize: 22 },
  summaryLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text2 },
  summaryArrow: { fontSize: 16, color: COLORS.primary, fontWeight: '700' },
});
