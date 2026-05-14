import React, { useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Text, Card, Chip, Button, ProgressBar, Appbar, Divider } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTour } from '../../../src/hooks/useTours';
import toursApi from '../../../src/api/tours';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Brouillon', color: '#9E9E9E' },
  planned: { label: 'Planifiée', color: '#2196F3' },
  in_progress: { label: 'En cours', color: '#FF9800' },
  completed: { label: 'Terminée', color: '#4CAF50' },
  cancelled: { label: 'Annulée', color: '#F44336' },
};

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function TourDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: tour, isLoading, isError, refetch } = useTour(id!);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const handleStart = async () => {
    Alert.alert(
      'Démarrer la tournée',
      'Voulez-vous démarrer cette tournée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Démarrer',
          onPress: async () => {
            try {
              await toursApi.start(id!);
              refetch();
            } catch {
              Alert.alert('Erreur', 'Impossible de démarrer la tournée.');
            }
          },
        },
      ]
    );
  };

  const handleComplete = async () => {
    Alert.alert(
      'Terminer la tournée',
      'Voulez-vous marquer cette tournée comme terminée ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          onPress: async () => {
            try {
              await toursApi.complete(id!);
              refetch();
            } catch {
              Alert.alert('Erreur', 'Impossible de terminer la tournée.');
            }
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingScreen />;
  if (isError || !tour) return <ErrorView onRetry={refetch} />;

  const statusInfo = STATUS_CONFIG[tour.status] || { label: tour.status, color: '#9E9E9E' };
  const progressValue = tour.totalVisits > 0 ? tour.completedVisits / tour.totalVisits : 0;
  const dateStr = tour.tourDate ? new Date(tour.tourDate).toLocaleDateString('fr-FR') : '';

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color="#FFFFFF" />
        <Appbar.Content title="Tournée" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        {/* Informations */}
        <Card style={styles.card}>
          <Card.Title title="Informations" titleStyle={styles.sectionTitle} />
          <Card.Content>
            <Text style={styles.tourName}>{tour.name}</Text>
            <View style={styles.chipRow}>
              <Chip compact style={{ backgroundColor: statusInfo.color + '20' }}>
                <Text style={{ color: statusInfo.color, fontWeight: '600' }}>{statusInfo.label}</Text>
              </Chip>
            </View>
            <Divider style={styles.divider} />
            <InfoRow label="Date" value={dateStr} />
            <InfoRow label="Région" value={tour.region} />
            <InfoRow label="Objectif" value={tour.objective} />
            <InfoRow label="Description" value={tour.description} />
            <InfoRow label="Assigné à" value={tour.assignedToName} />
          </Card.Content>
        </Card>

        {/* Progression */}
        <Card style={styles.card}>
          <Card.Title title="Progression" titleStyle={styles.sectionTitle} />
          <Card.Content>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabel}>Visites complétées</Text>
              <Text style={styles.progressCount}>{tour.completedVisits}/{tour.totalVisits} visites</Text>
            </View>
            <ProgressBar
              progress={progressValue}
              color={statusInfo.color}
              style={styles.progressBar}
            />
            <Text style={styles.progressPercent}>
              {tour.totalVisits > 0 ? Math.round(progressValue * 100) : 0}% complété
            </Text>
          </Card.Content>
        </Card>

        {/* Transport */}
        <Card style={styles.card}>
          <Card.Title title="Transport" titleStyle={styles.sectionTitle} />
          <Card.Content>
            <InfoRow label="Type de véhicule" value={tour.vehicleType} />
            <InfoRow label="Distance totale" value={tour.totalDistance != null ? `${tour.totalDistance} km` : null} />
            <InfoRow label="Coût carburant" value={tour.fuelCost != null ? `${tour.fuelCost} MAD` : null} />
            <InfoRow label="Dépenses totales" value={tour.totalExpenses != null ? `${tour.totalExpenses} MAD` : null} />
            <InfoRow label="Adresse de départ" value={tour.startAddress} />
            <InfoRow label="Adresse d'arrivée" value={tour.endAddress} />
          </Card.Content>
        </Card>

        {/* Résultats (si completed) */}
        {tour.status === 'completed' && (
          <Card style={styles.card}>
            <Card.Title title="Résultats" titleStyle={styles.sectionTitle} />
            <Card.Content>
              <InfoRow label="Résultat" value={tour.tourResult} />
              <InfoRow label="Revenue estimé" value={tour.estimatedRevenue != null ? `${tour.estimatedRevenue} MAD` : null} />
              <InfoRow label="Revenue réel" value={tour.actualRevenue != null ? `${tour.actualRevenue} MAD` : null} />
              <InfoRow label="Notes de suivi" value={tour.followUpNotes} />
            </Card.Content>
          </Card>
        )}

        {tour.notes && (
          <Card style={styles.card}>
            <Card.Title title="Notes" titleStyle={styles.sectionTitle} />
            <Card.Content>
              <Text style={styles.notesText}>{tour.notes}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        {tour.status === 'planned' && (
          <Button
            mode="contained"
            icon="play-circle-outline"
            onPress={handleStart}
            style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
            contentStyle={styles.actionButtonContent}
          >
            Démarrer la tournée
          </Button>
        )}

        {tour.status === 'in_progress' && (
          <Button
            mode="contained"
            icon="check-circle-outline"
            onPress={handleComplete}
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            contentStyle={styles.actionButtonContent}
          >
            Terminer la tournée
          </Button>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#1976D2' },
  appbarTitle: { color: '#FFFFFF', fontWeight: '600' },
  scroll: { flex: 1 },
  card: { margin: 12, marginBottom: 0, elevation: 2 },
  sectionTitle: { color: '#1976D2', fontWeight: '600' },
  tourName: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  divider: { marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  progressLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 14, color: '#607D8B' },
  progressCount: { fontSize: 14, color: '#212121', fontWeight: '600' },
  progressBar: { height: 8, borderRadius: 4 },
  progressPercent: { fontSize: 12, color: '#607D8B', marginTop: 6, textAlign: 'right' },
  notesText: { fontSize: 14, color: '#212121', lineHeight: 20 },
  actionButton: { margin: 12, borderRadius: 8 },
  actionButtonContent: { height: 50 },
  bottomPadding: { height: 24 },
});
