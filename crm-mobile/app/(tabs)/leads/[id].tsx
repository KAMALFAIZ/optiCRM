import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Text, Card, Chip, Button, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLead, useConvertLead } from '../../../src/hooks/useLeads';
import { LEAD_STATUSES, LEAD_RATINGS } from '../../../src/types/lead';
import { formatDate, formatRelativeDate } from '../../../src/utils/formatting';
import { getStatusColor } from '../../../src/utils/constants';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

export default function LeadDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: lead, isLoading, isError, refetch } = useLead(id!);
  const convertMutation = useConvertLead();

  if (isLoading) return <LoadingScreen />;
  if (isError || !lead) return <ErrorView onRetry={refetch} />;

  const statusLabel = LEAD_STATUSES.find((s) => s.value === lead.status)?.label || lead.status;
  const ratingInfo = LEAD_RATINGS.find((r) => r.value === lead.rating);

  const handleConvert = () => {
    Alert.alert(
      'Convertir le lead',
      'Voulez-vous convertir ce lead en compte et contact ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Convertir',
          onPress: async () => {
            try {
              await convertMutation.mutateAsync({
                id: id!,
                data: { createAccount: true, createContact: true, accountName: lead.companyName || lead.fullName },
              });
              router.back();
            } catch { /* error handled by mutation */ }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.name}>{lead.fullName}</Text>
          {lead.companyName && <Text style={styles.company}>{lead.companyName}</Text>}
          {lead.jobTitle && <Text style={styles.jobTitle}>{lead.jobTitle}</Text>}
          <View style={styles.chipRow}>
            <Chip compact style={{ backgroundColor: getStatusColor(lead.status) + '30' }}>{statusLabel}</Chip>
            {ratingInfo && (
              <Chip compact textStyle={{ color: '#FFF' }} style={{ backgroundColor: ratingInfo.color }}>
                {ratingInfo.label}
              </Chip>
            )}
          </View>
          {lead.leadScore != null && (
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreLabel}>Score</Text>
              <View style={[styles.scoreBadge, { backgroundColor: lead.leadScore >= 70 ? '#4CAF50' : lead.leadScore >= 40 ? '#FF9800' : '#F44336' }]}>
                <Text style={styles.scoreValue}>{lead.leadScore}</Text>
              </View>
            </View>
          )}
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Coordonnees" />
        <Card.Content>
          <InfoRow label="Email" value={lead.email} />
          <InfoRow label="Telephone" value={lead.phone} />
          <InfoRow label="Mobile" value={lead.mobile} />
          <InfoRow label="Site web" value={lead.website} />
          <InfoRow label="Ville" value={lead.city} />
          <InfoRow label="Pays" value={lead.country} />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Qualification" />
        <Card.Content>
          <InfoRow label="Source" value={lead.source} />
          <InfoRow label="Budget" value={lead.budgetRange} />
          <InfoRow label="Delai decision" value={lead.decisionTimeframe} />
          <InfoRow label="Priorite" value={lead.priority} />
          <InfoRow label="Prochain suivi" value={formatDate(lead.nextFollowUpDate)} />
        </Card.Content>
      </Card>

      {lead.description && (
        <Card style={styles.card}>
          <Card.Title title="Description" />
          <Card.Content><Text>{lead.description}</Text></Card.Content>
        </Card>
      )}

      {!lead.isConverted && (
        <View style={styles.convertSection}>
          <Button
            mode="contained"
            icon="swap-horizontal-bold"
            onPress={handleConvert}
            loading={convertMutation.isPending}
            style={styles.convertButton}
            contentStyle={styles.convertContent}
          >
            Convertir le lead
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
  name: { fontSize: 22, fontWeight: '700', color: '#212121' },
  company: { fontSize: 16, color: '#1976D2', marginTop: 2 },
  jobTitle: { fontSize: 14, color: '#607D8B', marginTop: 2 },
  chipRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  scoreContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  scoreLabel: { fontSize: 14, color: '#607D8B' },
  scoreBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  scoreValue: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  convertSection: { padding: 16 },
  convertButton: { borderRadius: 8, backgroundColor: '#FF9800' },
  convertContent: { height: 48 },
  bottomPadding: { height: 24 },
});
