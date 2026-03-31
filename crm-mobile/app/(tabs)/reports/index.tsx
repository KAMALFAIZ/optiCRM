import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import { Appbar, Card, Text, ProgressBar } from 'react-native-paper';
import { useMyStats, useVisitStats } from '../../../src/hooks/useReports';
import { useActivities } from '../../../src/hooks/useActivities';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';

interface KpiCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

function KpiCard({ icon, label, value, color }: KpiCardProps) {
  return (
    <Card style={[styles.kpiCard, { borderLeftColor: color, borderLeftWidth: 4 }]}>
      <Card.Content style={styles.kpiContent}>
        <Text style={[styles.kpiValue, { color }]}>{value}</Text>
        <Text style={styles.kpiLabel}>{label}</Text>
      </Card.Content>
    </Card>
  );
}

const VISIT_TYPES = [
  { key: 'PROSPECTION', label: 'Prospection', color: '#1976D2' },
  { key: 'SUIVI', label: 'Suivi', color: '#4CAF50' },
  { key: 'DEMONSTRATION', label: 'Démonstration', color: '#FF9800' },
  { key: 'RECLAMATION', label: 'Réclamation', color: '#F44336' },
  { key: 'AUTRE', label: 'Autre', color: '#9E9E9E' },
];

export default function ReportsScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useMyStats();

  const {
    data: visitStats,
    isLoading: visitLoading,
    refetch: refetchVisits,
  } = useVisitStats();

  const {
    data: activitiesData,
    isLoading: activitiesLoading,
    refetch: refetchActivities,
  } = useActivities({ size: 5, sortBy: 'dueDate', sortDirection: 'desc' });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchStats(), refetchVisits(), refetchActivities()]);
    setRefreshing(false);
  }, [refetchStats, refetchVisits, refetchActivities]);

  if (statsLoading && !refreshing) {
    return <LoadingScreen />;
  }

  const recentActivities = activitiesData?.content?.slice(0, 5) || [];

  const visitByType = visitStats?.byType || {};
  const maxVisitCount = Math.max(...Object.values(visitByType), 1);

  const convRate = stats?.conversionRate ?? 0;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.Content title="Mes Rapports" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1976D2']} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Section Vue d'ensemble */}
        <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
        <View style={styles.kpiGrid}>
          <KpiCard
            icon="domain"
            label="Comptes"
            value={stats?.totalAccounts ?? 0}
            color="#1976D2"
          />
          <KpiCard
            icon="account-arrow-right-outline"
            label="Leads"
            value={stats?.totalLeads ?? 0}
            color="#FF9800"
          />
          <KpiCard
            icon="map-marker-check-outline"
            label="Visites"
            value={stats?.totalVisits ?? 0}
            color="#4CAF50"
          />
          <KpiCard
            icon="calendar-check-outline"
            label="Activités"
            value={stats?.totalActivities ?? 0}
            color="#9C27B0"
          />
          <KpiCard
            icon="chart-line-variant"
            label="Opportunités"
            value={stats?.totalOpportunities ?? 0}
            color="#00BCD4"
          />
          <KpiCard
            icon="percent"
            label="Taux conv."
            value={`${convRate.toFixed(1)}%`}
            color="#E91E63"
          />
        </View>

        {/* Section Mes Visites */}
        <Text style={styles.sectionTitle}>Mes Visites par type</Text>
        <Card style={styles.card}>
          <Card.Content>
            {visitLoading ? (
              <Text style={styles.loadingText}>Chargement...</Text>
            ) : (
              VISIT_TYPES.map(({ key, label, color }) => {
                const count = visitByType[key] || 0;
                const progress = count / maxVisitCount;
                return (
                  <View key={key} style={styles.progressRow}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>{label}</Text>
                      <Text style={[styles.progressCount, { color }]}>{count}</Text>
                    </View>
                    <ProgressBar
                      progress={progress}
                      color={color}
                      style={styles.progressBar}
                    />
                  </View>
                );
              })
            )}
          </Card.Content>
        </Card>

        {/* Section Activités récentes */}
        <Text style={styles.sectionTitle}>Activités récentes</Text>
        <Card style={styles.card}>
          <Card.Content>
            {activitiesLoading ? (
              <Text style={styles.loadingText}>Chargement...</Text>
            ) : recentActivities.length === 0 ? (
              <Text style={styles.emptyText}>Aucune activité récente</Text>
            ) : (
              recentActivities.map((activity: any, index: number) => (
                <View key={activity.id}>
                  <View style={styles.activityRow}>
                    <View
                      style={[
                        styles.activityDot,
                        { backgroundColor: '#9C27B0' },
                      ]}
                    />
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>
                        {activity.subject || activity.title || 'Activité'}
                      </Text>
                      <Text style={styles.activitySub} numberOfLines={1}>
                        {activity.activityType || ''}{activity.accountName ? ` · ${activity.accountName}` : ''}
                      </Text>
                    </View>
                    {activity.dueDate && (
                      <Text style={styles.activityDate}>
                        {new Date(activity.dueDate).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                  {index < recentActivities.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </View>
              ))
            )}
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#1976D2' },
  appbarTitle: { color: '#FFFFFF', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 32 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#607D8B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 8,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '47.5%',
    elevation: 2,
  },
  kpiContent: {
    paddingVertical: 12,
  },
  kpiValue: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#607D8B',
    marginTop: 2,
  },
  card: { elevation: 2, marginBottom: 16 },
  loadingText: { color: '#9E9E9E', textAlign: 'center', paddingVertical: 8 },
  emptyText: { color: '#9E9E9E', textAlign: 'center', paddingVertical: 8 },
  progressRow: { marginBottom: 14 },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: { fontSize: 14, color: '#212121', fontWeight: '500' },
  progressCount: { fontSize: 14, fontWeight: '700' },
  progressBar: { height: 8, borderRadius: 4 },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 10,
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  activityInfo: { flex: 1 },
  activityTitle: { fontSize: 14, fontWeight: '600', color: '#212121' },
  activitySub: { fontSize: 12, color: '#607D8B', marginTop: 1 },
  activityDate: { fontSize: 12, color: '#9E9E9E' },
  separator: { height: 1, backgroundColor: '#F0F0F0', marginLeft: 20 },
});
