import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet } from 'react-native';
import { Text, Card, Chip, ProgressBar, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useOpportunity } from '../../../src/hooks/useOpportunities';
import { formatCurrency, formatDate } from '../../../src/utils/formatting';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: opp, isLoading, isError, refetch } = useOpportunity(id!);

  if (isLoading) return <LoadingScreen />;
  if (isError || !opp) return <ErrorView onRetry={refetch} />;

  const stageProgress = (opp.stage.probability || 0) / 100;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.name}>{opp.name}</Text>
          <Text style={styles.account}>{opp.account.name}</Text>
          <View style={styles.chipRow}>
            <Chip compact style={{ backgroundColor: (opp.stage.color || '#1976D2') + '30' }}>
              {opp.stage.name}
            </Chip>
            {opp.isClosed && (
              <Chip compact style={{ backgroundColor: opp.isWon ? '#4CAF50' + '30' : '#F44336' + '30' }}>
                {opp.isWon ? 'Gagnee' : 'Perdue'}
              </Chip>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Stage Progress */}
      <Card style={styles.card}>
        <Card.Title title="Progression" />
        <Card.Content>
          <ProgressBar progress={stageProgress} color={opp.stage.color || '#1976D2'} style={styles.progressBar} />
          <View style={styles.progressLabels}>
            <Text style={styles.progressText}>{opp.stage.name}</Text>
            <Text style={styles.progressText}>{opp.probability}%</Text>
          </View>
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Details financiers" />
        <Card.Content>
          <InfoRow label="Montant" value={formatCurrency(opp.amount)} />
          <InfoRow label="Montant pondere" value={formatCurrency(opp.weightedAmount)} />
          <InfoRow label="Devise" value={opp.currency} />
          <InfoRow label="Probabilite" value={`${opp.probability}%`} />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Informations" />
        <Card.Content>
          <InfoRow label="Type" value={opp.type} />
          <InfoRow label="Source" value={opp.leadSource} />
          <InfoRow label="Date de cloture" value={formatDate(opp.closeDate)} />
          <InfoRow label="Contact principal" value={opp.primaryContact?.fullName} />
          <InfoRow label="Affecte a" value={opp.assignedTo?.fullName} />
          <InfoRow label="Prochaine etape" value={opp.nextStep} />
        </Card.Content>
      </Card>

      {opp.description && (
        <Card style={styles.card}>
          <Card.Title title="Description" />
          <Card.Content><Text>{opp.description}</Text></Card.Content>
        </Card>
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
  name: { fontSize: 22, fontWeight: '700', color: '#212121' },
  account: { fontSize: 16, color: '#1976D2', marginTop: 2 },
  chipRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  progressBar: { height: 8, borderRadius: 4, marginBottom: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 13, color: '#607D8B' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  bottomPadding: { height: 24 },
});
