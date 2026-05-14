import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Modal, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import SignatureScreen, { SignatureViewRef } from 'react-native-signature-canvas';
import { COLORS } from '../../../../src/config/theme';
import {
  useBonLivraison, useValiderBL, useLivrerBL,
  useAnnulerBL, useEnregistrerSignature,
} from '../../../../src/hooks/useVanSelling';
import { imprimerBLEnPDF } from '../../../../src/utils/blPrintService';
import { handleApiError } from '../../../../src/api/client';
import { STATUT_BL_CONFIG } from '../../../../src/types/vanSelling';

export default function BLDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const sigRef = useRef<SignatureViewRef>(null);
  const [showSig, setShowSig] = useState(false);
  const [printing, setPrinting] = useState(false);

  const { data: bl, isLoading } = useBonLivraison(id);
  const valider = useValiderBL();
  const livrer = useLivrerBL();
  const annuler = useAnnulerBL();
  const saveSignature = useEnregistrerSignature();

  if (isLoading || !bl) {
    return (
      <SafeAreaView style={s.safe}>
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  const config = STATUT_BL_CONFIG[bl.statut];

  const handleValider = () =>
    Alert.alert('Valider le BL', 'Déduire les quantités du stock voiture ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Valider', style: 'default', onPress: () => valider.mutate(id, { onError: (e) => Alert.alert('Erreur', handleApiError(e)) }) },
    ]);

  const handleLivrer = () =>
    Alert.alert('Marquer comme livré ?', undefined, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Livré', onPress: () => livrer.mutate(id, { onError: (e) => Alert.alert('Erreur', handleApiError(e)) }) },
    ]);

  const handleAnnuler = () =>
    Alert.alert('Annuler le BL ?', 'Les quantités seront restituées au stock voiture.', [
      { text: 'Non', style: 'cancel' },
      { text: 'Annuler le BL', style: 'destructive', onPress: () => annuler.mutate(id, { onError: (e) => Alert.alert('Erreur', handleApiError(e)) }) },
    ]);

  const handlePrint = async () => {
    setPrinting(true);
    try { await imprimerBLEnPDF(bl); }
    catch (e) { Alert.alert('Erreur', handleApiError(e)); }
    finally { setPrinting(false); }
  };

  const handleSignatureOk = async (sig: string) => {
    setShowSig(false);
    try {
      await saveSignature.mutateAsync({ id, signatureUrl: sig });
    } catch (e) {
      Alert.alert('Erreur', handleApiError(e));
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>{bl.numero}</Text>
        <View style={[s.statutBadge, { backgroundColor: config.color + '22' }]}>
          <Text style={[s.statutText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.scroll}>
        {/* Infos générales */}
        <View style={s.card}>
          <Row label="Client" value={bl.clientNom} />
          {bl.clientSageCode && <Row label="Code Sage" value={bl.clientSageCode} />}
          <Row label="Commercial" value={bl.collaborateurNom} />
          <Row label="Véhicule" value={bl.vehiculeImmatriculation} />
          <Row label="Date" value={new Date(bl.createdAt).toLocaleDateString('fr-MA')} />
          {bl.sageReference && <Row label="Réf. Sage" value={bl.sageReference} />}
        </View>

        {/* Lignes */}
        <View style={s.card}>
          <Text style={s.cardTitle}>Articles</Text>
          {(bl.lignes ?? []).map((l) => (
            <View key={l.id} style={s.ligneRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.ligneCode}>{l.produitCode}</Text>
                <Text style={s.ligneNom}>{l.produitNom}</Text>
                {l.remisePct > 0 && (
                  <Text style={s.ligneRemise}>Remise : {l.remisePct.toFixed(0)}%</Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.ligneQte}>× {l.quantite}</Text>
                <Text style={s.lignePrix}>{l.prixApplique.toFixed(2)} MAD</Text>
                <Text style={s.ligneMontant}>{l.montantHt.toFixed(2)} HT</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={s.totauxCard}>
          <Row label="Total HT" value={`${bl.montantHt.toFixed(2)} MAD`} />
          <Row label="TVA" value={`${bl.montantTva.toFixed(2)} MAD`} />
          <View style={s.totalTtcRow}>
            <Text style={s.totalTtcLabel}>Total TTC</Text>
            <Text style={s.totalTtcVal}>{bl.montantTtc.toFixed(2)} MAD</Text>
          </View>
        </View>

        {/* GPS */}
        {bl.latitude && (
          <View style={s.gpsRow}>
            <MaterialCommunityIcons name="map-marker" size={14} color={COLORS.primary} />
            <Text style={s.gpsText}>{bl.latitude.toFixed(5)}, {bl.longitude?.toFixed(5)}</Text>
          </View>
        )}

        {/* Signature */}
        <View style={s.sigSection}>
          <Text style={s.cardTitle}>Signature client</Text>
          {bl.signatureCapturee ? (
            <View style={s.sigCaptured}>
              <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.success} />
              <Text style={s.sigCapturedText}>Signature enregistrée</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[s.btnAction, { backgroundColor: COLORS.accent + '22' }]}
              onPress={() => setShowSig(true)}
              disabled={bl.statut === 'ANNULE' || bl.statut === 'SYNCHRO_SAGE'}
            >
              <MaterialCommunityIcons name="draw" size={18} color={COLORS.accent} />
              <Text style={[s.btnActionText, { color: COLORS.accent }]}>Capturer la signature</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Actions */}
        <View style={s.actionsCol}>
          <TouchableOpacity style={[s.btnAction, { backgroundColor: COLORS.primaryLight }]} onPress={handlePrint} disabled={printing}>
            <MaterialCommunityIcons name="printer-outline" size={18} color={COLORS.primary} />
            <Text style={[s.btnActionText, { color: COLORS.primary }]}>
              {printing ? 'Génération PDF...' : 'Imprimer / Partager PDF'}
            </Text>
          </TouchableOpacity>

          {bl.statut === 'BROUILLON' && (
            <TouchableOpacity style={[s.btnAction, { backgroundColor: '#2196F322' }]} onPress={handleValider} disabled={valider.isPending}>
              <MaterialCommunityIcons name="check-all" size={18} color="#2196F3" />
              <Text style={[s.btnActionText, { color: '#2196F3' }]}>Valider le BL</Text>
            </TouchableOpacity>
          )}
          {bl.statut === 'VALIDE' && (
            <TouchableOpacity style={[s.btnAction, { backgroundColor: '#4CAF5022' }]} onPress={handleLivrer} disabled={livrer.isPending}>
              <MaterialCommunityIcons name="truck-check-outline" size={18} color="#4CAF50" />
              <Text style={[s.btnActionText, { color: '#4CAF50' }]}>Marquer livré</Text>
            </TouchableOpacity>
          )}
          {(bl.statut === 'BROUILLON' || bl.statut === 'VALIDE') && (
            <TouchableOpacity style={[s.btnAction, { backgroundColor: COLORS.errorLight }]} onPress={handleAnnuler} disabled={annuler.isPending}>
              <MaterialCommunityIcons name="close-circle-outline" size={18} color={COLORS.error} />
              <Text style={[s.btnActionText, { color: COLORS.error }]}>Annuler le BL</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal signature */}
      <Modal visible={showSig} animationType="slide">
        <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
          <View style={s.sigHeader}>
            <TouchableOpacity onPress={() => setShowSig(false)}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.text1} />
            </TouchableOpacity>
            <Text style={s.sigTitle}>Signature du client</Text>
            <TouchableOpacity onPress={() => sigRef.current?.readSignature()}>
              <Text style={{ color: COLORS.primary, fontWeight: '700' }}>Valider</Text>
            </TouchableOpacity>
          </View>
          <SignatureScreen
            ref={sigRef}
            onOK={handleSignatureOk}
            onEmpty={() => Alert.alert('Signature vide', 'Veuillez signer avant de valider.')}
            descriptionText="Signez ici"
            clearText="Effacer"
            confirmText="Confirmer"
            webStyle=".m-signature-pad { box-shadow: none; border: 1px solid #eee; } .m-signature-pad--footer { display: none; }"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text1 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  statutText: { fontSize: 11, fontWeight: '700' },
  scroll: { padding: 16, gap: 12, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
    shadowRadius: 3, elevation: 1,
  },
  cardTitle: { fontSize: 12, fontWeight: '700', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  rowLabel: { fontSize: 13, color: COLORS.text3 },
  rowValue: { fontSize: 13, color: COLORS.text1, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  ligneRow: {
    flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  ligneCode: { fontSize: 10, fontWeight: '700', color: COLORS.text3 },
  ligneNom: { fontSize: 13, color: COLORS.text1 },
  ligneRemise: { fontSize: 11, color: COLORS.warning },
  ligneQte: { fontSize: 13, color: COLORS.text2 },
  lignePrix: { fontSize: 12, color: COLORS.text2 },
  ligneMontant: { fontSize: 13, fontWeight: '700', color: COLORS.text1 },
  totauxCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 12, padding: 14,
  },
  totalTtcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, marginTop: 4, borderTopWidth: 1, borderTopColor: COLORS.primaryBorder },
  totalTtcLabel: { fontSize: 15, fontWeight: '700', color: COLORS.primaryDark },
  totalTtcVal: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  gpsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 4 },
  gpsText: { fontSize: 11, color: COLORS.text4 },
  sigSection: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 14 },
  sigCaptured: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sigCapturedText: { color: COLORS.success, fontSize: 13, fontWeight: '600' },
  actionsCol: { gap: 8 },
  btnAction: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 14, borderRadius: 10,
  },
  btnActionText: { fontSize: 14, fontWeight: '600' },
  sigHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  sigTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text1 },
});
