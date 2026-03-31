import React, { useState, useEffect } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Text, Card, Chip, Button, TextInput } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { useVisit, useCheckIn, useCheckOut } from '../../../src/hooks/useVisits';
import { VISIT_TYPES, VISIT_STATUSES, VISIT_OUTCOMES } from '../../../src/types/visit';
import { formatDateTime, formatDate, formatCurrency } from '../../../src/utils/formatting';
import { getStatusColor } from '../../../src/utils/constants';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

export default function VisitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: visit, isLoading, isError, refetch } = useVisit(id!);
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();

  const [checkOutNotes, setCheckOutNotes] = useState('');
  const [checkOutOutcome, setCheckOutOutcome] = useState('');
  const [showCheckOutForm, setShowCheckOutForm] = useState(false);
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!visit?.checkInAt || visit?.checkOutAt) return;
    const updateTimer = () => {
      const start = new Date(visit.checkInAt!).getTime();
      const diff = Date.now() - start;
      const totalSecs = Math.floor(diff / 1000);
      const hrs = Math.floor(totalSecs / 3600);
      const mins = Math.floor((totalSecs % 3600) / 60);
      const secs = totalSecs % 60;
      if (hrs > 0) {
        setElapsed(`${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
      } else {
        setElapsed(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000); // chaque seconde
    return () => clearInterval(interval);
  }, [visit?.checkInAt, visit?.checkOutAt]);

  if (isLoading) return <LoadingScreen />;
  if (isError || !visit) return <ErrorView onRetry={refetch} />;

  const typeInfo = VISIT_TYPES.find((t) => t.value === visit.visitType);
  const statusLabel = VISIT_STATUSES.find((s) => s.value === visit.status)?.label || visit.status;

  const handleCheckIn = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lat: number | undefined;
      let lng: number | undefined;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        lat = loc.coords.latitude;
        lng = loc.coords.longitude;
      }
      await checkInMutation.mutateAsync({ id: id!, latitude: lat, longitude: lng });
      refetch();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de faire le check-in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOutMutation.mutateAsync({
        id: id!,
        notes: checkOutNotes.trim() || undefined,
        outcome: checkOutOutcome || undefined,
      });
      setShowCheckOutForm(false);
      refetch();
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de faire le check-out');
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.subject}>{visit.subject}</Text>
          {visit.account && <Text style={styles.account}>{visit.account.name}</Text>}
          <View style={styles.chipRow}>
            <Chip compact icon={typeInfo?.icon} style={{ backgroundColor: (typeInfo?.color || '#607D8B') + '20' }}>
              {typeInfo?.label || visit.visitType}
            </Chip>
            <Chip compact style={{ backgroundColor: getStatusColor(visit.status) + '20' }}>
              {statusLabel}
            </Chip>
          </View>
        </Card.Content>
      </Card>

      {/* Check-in/out section */}
      <Card style={styles.card}>
        <Card.Title title="Pointage" />
        <Card.Content>
          {visit.checkInAt ? (
            <View style={styles.checkRow}>
              <View style={[styles.checkDot, { backgroundColor: '#4CAF50' }]} />
              <Text style={styles.checkLabel}>Check-in: {formatDateTime(visit.checkInAt)}</Text>
            </View>
          ) : (
            <Button mode="contained" icon="login" onPress={handleCheckIn} loading={checkInMutation.isPending} style={[styles.checkButton, { backgroundColor: '#4CAF50' }]}>
              Check-in
            </Button>
          )}

          {visit.checkInAt && !visit.checkOutAt && (
            <>
              {elapsed ? (
                <View style={styles.timerContainer}>
                  <Text style={styles.timerLabel}>Duree en cours</Text>
                  <Text style={styles.timerValue}>{elapsed}</Text>
                </View>
              ) : null}
              {!showCheckOutForm ? (
                <Button mode="contained" icon="logout" onPress={() => setShowCheckOutForm(true)} style={[styles.checkButton, { backgroundColor: '#FF9800' }]}>
                  Check-out
                </Button>
              ) : (
                <View style={styles.checkOutForm}>
                  <TextInput label="Notes de visite" value={checkOutNotes} onChangeText={setCheckOutNotes} mode="outlined" style={styles.input} multiline numberOfLines={3} />
                  <View style={styles.outcomeChips}>
                    {VISIT_OUTCOMES.map((o) => (
                      <Chip key={o.value} selected={checkOutOutcome === o.value} onPress={() => setCheckOutOutcome(o.value)} style={styles.outcomeChip} compact>
                        {o.label}
                      </Chip>
                    ))}
                  </View>
                  <Button mode="contained" icon="check" onPress={handleCheckOut} loading={checkOutMutation.isPending} style={[styles.checkButton, { backgroundColor: '#FF9800' }]}>
                    Confirmer check-out
                  </Button>
                </View>
              )}
            </>
          )}

          {visit.checkOutAt && (
            <View style={styles.checkRow}>
              <View style={[styles.checkDot, { backgroundColor: '#FF9800' }]} />
              <Text style={styles.checkLabel}>Check-out: {formatDateTime(visit.checkOutAt)}</Text>
            </View>
          )}

          {visit.duration != null && (
            <InfoRow label="Duree totale" value={visit.duration + ' min'} />
          )}
        </Card.Content>
      </Card>

      {/* Map location */}
      {visit.latitude && visit.longitude && (
        <Card style={styles.card}>
          <Card.Title title="Localisation" />
          <Card.Content>
            <Text style={styles.gpsText}>{visit.latitude.toFixed(5)}, {visit.longitude.toFixed(5)}</Text>
            {visit.address && <Text style={styles.addressText}>{visit.address}</Text>}
          </Card.Content>
        </Card>
      )}

      <Card style={styles.card}>
        <Card.Title title="Details" />
        <Card.Content>
          <InfoRow label="Date" value={formatDate(visit.visitDate)} />
          <InfoRow label="Contact" value={visit.contact?.fullName} />
          <InfoRow label="Adresse" value={visit.address} />
          <InfoRow label="Ville" value={visit.city} />
          <InfoRow label="Objectif" value={visit.objective} />
          <InfoRow label="Montant estime" value={visit.estimatedAmount ? formatCurrency(visit.estimatedAmount) : undefined} />
          <InfoRow label="Prochain suivi" value={formatDate(visit.followUpDate)} />
          <InfoRow label="Affecte a" value={visit.assignedTo?.fullName} />
        </Card.Content>
      </Card>

      {visit.notes && (
        <Card style={styles.card}>
          <Card.Title title="Notes" />
          <Card.Content><Text>{visit.notes}</Text></Card.Content>
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
  subject: { fontSize: 22, fontWeight: '700', color: '#212121' },
  account: { fontSize: 16, color: '#1976D2', marginTop: 2 },
  chipRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 8 },
  checkDot: { width: 12, height: 12, borderRadius: 6 },
  checkLabel: { fontSize: 14, color: '#212121' },
  checkButton: { borderRadius: 8, marginVertical: 8 },
  timerContainer: { alignItems: 'center', paddingVertical: 12, backgroundColor: '#E3F2FD', borderRadius: 8, marginVertical: 8 },
  timerLabel: { fontSize: 12, color: '#607D8B' },
  timerValue: { fontSize: 24, fontWeight: '700', color: '#1976D2' },
  checkOutForm: { marginTop: 8 },
  input: { marginBottom: 8, backgroundColor: '#FFFFFF' },
  outcomeChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  outcomeChip: { marginBottom: 4 },
  gpsText: { fontSize: 14, color: '#1976D2', fontWeight: '600' },
  addressText: { fontSize: 14, color: '#607D8B', marginTop: 4 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  bottomPadding: { height: 24 },
});
