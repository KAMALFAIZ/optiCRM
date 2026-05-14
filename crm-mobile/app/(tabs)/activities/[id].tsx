import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Text, Card, Chip, Button } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useActivity, useCompleteActivity } from '../../../src/hooks/useActivities';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, ACTIVITY_PRIORITIES } from '../../../src/types/activity';
import { formatDateTime, formatDate, formatCurrency } from '../../../src/utils/formatting';
import { getStatusColor } from '../../../src/utils/constants';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

export default function ActivityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: activity, isLoading, isError, refetch } = useActivity(id!);
  const completeMutation = useCompleteActivity();

  if (isLoading) return <LoadingScreen />;
  if (isError || !activity) return <ErrorView onRetry={refetch} />;

  const typeInfo = ACTIVITY_TYPES.find((t) => t.value === activity.activityType);
  const statusLabel = ACTIVITY_STATUSES.find((s) => s.value === activity.status)?.label || activity.status;
  const priorityLabel = ACTIVITY_PRIORITIES.find((p) => p.value === activity.priority)?.label || activity.priority;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.subject}>{activity.subject}</Text>
          <View style={styles.chipRow}>
            <Chip compact icon={typeInfo?.icon} style={{ backgroundColor: (typeInfo?.color || '#607D8B') + '20' }}>
              {typeInfo?.label || activity.activityType}
            </Chip>
            <Chip compact style={{ backgroundColor: getStatusColor(activity.status) + '20' }}>
              {statusLabel}
            </Chip>
            <Chip compact>{priorityLabel}</Chip>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Planification" />
        <Card.Content>
          <InfoRow label="Date debut" value={formatDateTime(activity.startDate)} />
          <InfoRow label="Date fin" value={formatDateTime(activity.endDate)} />
          <InfoRow label="Echeance" value={formatDate(activity.dueDate)} />
          <InfoRow label="Duree (min)" value={activity.duration?.toString()} />
          <InfoRow label="Lieu" value={activity.location} />
          <InfoRow label="Affecte a" value={activity.assignedTo?.fullName} />
        </Card.Content>
      </Card>

      {(activity.objective || activity.result) && (
        <Card style={styles.card}>
          <Card.Title title="Objectif & Resultat" />
          <Card.Content>
            {activity.objective && <Text style={styles.textBlock}><Text style={styles.label}>Objectif: </Text>{activity.objective}</Text>}
            {activity.result && <Text style={styles.textBlock}><Text style={styles.label}>Resultat: </Text>{activity.result}</Text>}
          </Card.Content>
        </Card>
      )}

      {activity.description && (
        <Card style={styles.card}>
          <Card.Title title="Description" />
          <Card.Content><Text>{activity.description}</Text></Card.Content>
        </Card>
      )}

      {activity.status !== 'completed' && activity.status !== 'cancelled' && (
        <View style={styles.actionSection}>
          <Button
            mode="contained"
            icon="check-circle-outline"
            onPress={() => completeMutation.mutate(id!)}
            loading={completeMutation.isPending}
            style={styles.completeButton}
          >
            Marquer comme terminee
          </Button>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  card: { margin: 12, marginBottom: 0, elevation: 2 },
  subject: { fontSize: 22, fontWeight: '700', color: '#212121' },
  chipRow: { flexDirection: 'row', marginTop: 8, gap: 8, flexWrap: 'wrap' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  label: { fontWeight: '600', color: '#607D8B' },
  textBlock: { marginBottom: 8, fontSize: 14, color: '#212121' },
  actionSection: { padding: 16 },
  completeButton: { borderRadius: 8, backgroundColor: '#4CAF50' },
  bottomPadding: { height: 24 },
});
