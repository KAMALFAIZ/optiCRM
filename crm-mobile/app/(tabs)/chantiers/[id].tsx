import React, { useState, useCallback } from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Alert } from 'react-native';
import { Text, Card, Chip, Button, ProgressBar, Appbar, Divider, Modal, Portal, Surface, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useChantier } from '../../../src/hooks/useChantiers';
import chantiersApi from '../../../src/api/chantiers';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

const STADE_CONFIG: Record<string, { label: string; color: string }> = {
  'Étude de projet': { label: 'Étude de projet', color: '#1890ff' },
  'ETUDE': { label: 'Étude', color: '#1890ff' },
  'Autorisation': { label: 'Autorisation', color: '#2f54eb' },
  'Gros œuvre': { label: 'Gros œuvre', color: '#fa8c16' },
  'Second œuvre': { label: 'Second œuvre', color: '#faad14' },
  'Phase équipement': { label: 'Phase équipement', color: '#a0d911' },
  'Livraison': { label: 'Livraison', color: '#52c41a' },
  'Clôturé': { label: 'Clôturé', color: '#8c8c8c' },
};

function getStadeInfo(stade?: string): { label: string; color: string } {
  if (!stade) return { label: 'Non défini', color: '#9E9E9E' };
  const direct = STADE_CONFIG[stade];
  if (direct) return direct;
  return { label: stade, color: '#607D8B' };
}

function getHealthColor(score: number): string {
  if (score >= 70) return '#4CAF50';
  if (score >= 40) return '#FF9800';
  return '#F44336';
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{String(value)}</Text>
    </View>
  );
}

export default function ChantierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: chantier, isLoading, isError, refetch } = useChantier(id!);

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [aiResult, setAiResult] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const onRefresh = useCallback(() => { refetch(); }, [refetch]);

  const handleAnalyzeAI = async () => {
    setAiLoading(true);
    setAiModalVisible(true);
    try {
      const result = await chantiersApi.analyzeAI(id!);
      setAiResult(result);
    } catch {
      setAiResult('');
      setAiModalVisible(false);
      Alert.alert('Erreur', 'Impossible d\'analyser ce chantier avec l\'IA.');
    } finally {
      setAiLoading(false);
    }
  };

  if (isLoading) return <LoadingScreen />;
  if (isError || !chantier) return <ErrorView onRetry={refetch} />;

  const stadeInfo = getStadeInfo(chantier.stadeChantier);
  const hasHealthScore = typeof chantier.healthScore === 'number' && chantier.healthScore > 0;
  const healthColor = hasHealthScore ? getHealthColor(chantier.healthScore!) : '#9E9E9E';
  const healthProgress = hasHealthScore ? chantier.healthScore! / 100 : 0;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color="#FFFFFF" />
        <Appbar.Content title="Chantier" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
      >
        {/* Informations */}
        <Card style={styles.card}>
          <Card.Title title="Informations" titleStyle={styles.sectionTitle} />
          <Card.Content>
            <Text style={styles.chantierName}>{chantier.nom}</Text>
            <View style={styles.chipRow}>
              {chantier.stadeChantier && (
                <Chip compact style={{ backgroundColor: stadeInfo.color + '20' }}>
                  <Text style={{ color: stadeInfo.color, fontWeight: '600' }}>{stadeInfo.label}</Text>
                </Chip>
              )}
              {chantier.statutChantier && (
                <Chip compact style={{ backgroundColor: '#E3F2FD' }}>
                  <Text style={{ color: '#1976D2' }}>{chantier.statutChantier}</Text>
                </Chip>
              )}
            </View>
            <Divider style={styles.divider} />
            <InfoRow label="Ville" value={chantier.ville} />
            <InfoRow label="Préfecture" value={chantier.prefecture} />
            <InfoRow label="Adresse" value={chantier.adresse} />
            <InfoRow label="Type de projet" value={chantier.typeProjet} />
            <InfoRow label="Sous-type" value={chantier.sousTypeProjet} />
            <InfoRow label="Nombre d'unités" value={chantier.nombreUnites} />
            {chantier.account && (
              <InfoRow label="Compte" value={chantier.account.name} />
            )}
            {!chantier.account && chantier.accountName && (
              <InfoRow label="Compte" value={chantier.accountName} />
            )}
            <InfoRow label="Assigné à" value={chantier.assignedTo?.fullName || chantier.assignedToName} />
          </Card.Content>
        </Card>

        {/* Opportunité */}
        <Card style={styles.card}>
          <Card.Title title="Opportunité" titleStyle={styles.sectionTitle} />
          <Card.Content>
            <InfoRow label="Niveau d'opportunité" value={chantier.niveauOpportunite} />
            <InfoRow label="Concurrent" value={chantier.concurrentFerme} />
            <InfoRow label="Déciseur" value={chantier.deciseur} />
            <InfoRow label="Prochaine action" value={chantier.actionSuivante} />
            <InfoRow
              label="Date prochaine action"
              value={chantier.dateProchaineAction ? new Date(chantier.dateProchaineAction).toLocaleDateString('fr-FR') : null}
            />
            <InfoRow label="Installateur" value={chantier.installateur} />
            <InfoRow label="Promoteur" value={chantier.promoteur} />
          </Card.Content>
        </Card>

        {/* Health Score */}
        {hasHealthScore && (
          <Card style={styles.card}>
            <Card.Title title="Score de santé" titleStyle={styles.sectionTitle} />
            <Card.Content>
              <View style={styles.healthLabelRow}>
                <Text style={styles.healthLabel}>Health Score</Text>
                <Text style={[styles.healthValue, { color: healthColor }]}>{chantier.healthScore}/100</Text>
              </View>
              <ProgressBar
                progress={healthProgress}
                color={healthColor}
                style={styles.healthBar}
              />
              {typeof chantier.conversionProbability === 'number' && (
                <>
                  <View style={[styles.healthLabelRow, { marginTop: 12 }]}>
                    <Text style={styles.healthLabel}>Probabilité de conversion</Text>
                    <Text style={styles.healthValue}>{Math.round(chantier.conversionProbability * 100)}%</Text>
                  </View>
                  <ProgressBar
                    progress={chantier.conversionProbability}
                    color="#1976D2"
                    style={styles.healthBar}
                  />
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Analyse IA */}
        <Card style={styles.card}>
          <Card.Title title="Analyse IA" titleStyle={styles.sectionTitle} />
          <Card.Content>
            {chantier.aiSummary && (
              <Text style={styles.aiSummaryText}>{chantier.aiSummary}</Text>
            )}
            <Button
              mode="contained"
              icon="robot-outline"
              onPress={handleAnalyzeAI}
              style={styles.aiButton}
              buttonColor="#7C4DFF"
            >
              Analyser ce chantier
            </Button>
          </Card.Content>
        </Card>

        {/* Acteurs */}
        {chantier.acteurs && chantier.acteurs.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Acteurs" titleStyle={styles.sectionTitle} />
            <Card.Content>
              {chantier.acteurs.map((acteur, idx) => (
                <View key={acteur.id} style={[styles.acteurRow, idx > 0 && styles.acteurBorder]}>
                  <View style={styles.acteurInfo}>
                    <Text style={styles.acteurNom}>{acteur.nom}</Text>
                    <Text style={styles.acteurRole}>{acteur.roleActeur}</Text>
                  </View>
                  {acteur.telephone && (
                    <Text style={styles.acteurPhone}>{acteur.telephone}</Text>
                  )}
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modal IA */}
      <Portal>
        <Modal
          visible={aiModalVisible}
          onDismiss={() => setAiModalVisible(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <Surface style={styles.modalContent}>
            <Text style={styles.modalTitle}>Analyse IA</Text>
            <Divider style={styles.modalDivider} />
            {aiLoading ? (
              <View style={styles.aiLoadingContainer}>
                <ActivityIndicator size="large" color="#7C4DFF" />
                <Text style={styles.aiLoadingText}>Analyse en cours...</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalScrollView}>
                <Text style={styles.modalText}>{aiResult}</Text>
              </ScrollView>
            )}
            <Button
              mode="contained"
              onPress={() => setAiModalVisible(false)}
              style={styles.modalButton}
              buttonColor="#1976D2"
            >
              Fermer
            </Button>
          </Surface>
        </Modal>
      </Portal>
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
  chantierName: { fontSize: 20, fontWeight: '700', color: '#212121', marginBottom: 8 },
  chipRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 4 },
  divider: { marginVertical: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  healthLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  healthLabel: { fontSize: 14, color: '#607D8B' },
  healthValue: { fontSize: 14, fontWeight: '700' },
  healthBar: { height: 8, borderRadius: 4 },
  aiSummaryText: { fontSize: 14, color: '#212121', lineHeight: 20, marginBottom: 12 },
  aiButton: { borderRadius: 8, marginTop: 4 },
  acteurRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  acteurBorder: { borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  acteurInfo: { flex: 1 },
  acteurNom: { fontSize: 15, fontWeight: '600', color: '#212121' },
  acteurRole: { fontSize: 12, color: '#607D8B', marginTop: 2 },
  acteurPhone: { fontSize: 13, color: '#1976D2', fontWeight: '500' },
  bottomPadding: { height: 24 },
  modalContainer: { margin: 20 },
  modalContent: { borderRadius: 12, padding: 20, elevation: 4, backgroundColor: '#FFFFFF', maxHeight: '80%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#212121', marginBottom: 4 },
  modalDivider: { marginVertical: 12 },
  modalScrollView: { maxHeight: 300 },
  modalText: { fontSize: 14, color: '#212121', lineHeight: 22 },
  modalButton: { marginTop: 16, borderRadius: 8 },
  aiLoadingContainer: { alignItems: 'center', paddingVertical: 32 },
  aiLoadingText: { marginTop: 12, color: '#607D8B', fontSize: 14 },
});
