import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../../src/config/theme';
import { useMonVehicule, useStockVoiture, useCreateRetour } from '../../../../src/hooks/useVanSelling';
import { handleApiError } from '../../../../src/api/client';
import type { MotifRetour, StockVoiture } from '../../../../src/types/vanSelling';
import { MOTIF_RETOUR_LABELS } from '../../../../src/types/vanSelling';

const ENTREPOT_DEFAULT_ID = ''; // À remplacer par la sélection d'entrepôt

interface RetourLigne {
  stock: StockVoiture;
  qteRetournee: string;
  motif: MotifRetour;
}

export default function RetourCreateScreen() {
  const router = useRouter();
  const { data: vehicule } = useMonVehicule();
  const { data: stock } = useStockVoiture(vehicule?.id);
  const createRetour = useCreateRetour();

  const [entrepotId, setEntrepotId] = useState('');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<RetourLigne[]>([]);

  const stockNonVide = (stock ?? []).filter((s) => s.qteDisponible > 0);

  const initialiserTout = () => {
    setLignes(
      stockNonVide.map((s) => ({
        stock: s,
        qteRetournee: String(s.qteDisponible),
        motif: 'INVENDU',
      }))
    );
  };

  const updateLigne = (index: number, field: keyof RetourLigne, value: string) => {
    const updated = [...lignes];
    (updated[index] as any)[field] = value;
    setLignes(updated);
  };

  const supprimerLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!entrepotId.trim()) { Alert.alert('Erreur', 'Saisissez l\'identifiant d\'entrepôt.'); return; }
    if (lignes.length === 0) { Alert.alert('Erreur', 'Ajoutez au moins un article à retourner.'); return; }

    const invalid = lignes.find((l) => !parseFloat(l.qteRetournee) || parseFloat(l.qteRetournee) > l.stock.qteDisponible);
    if (invalid) {
      Alert.alert('Erreur', `Quantité invalide pour ${invalid.stock.produitNom} (max : ${invalid.stock.qteDisponible})`);
      return;
    }

    Alert.alert(
      'Confirmer le retour',
      `Retourner ${lignes.length} article(s) à l'entrepôt ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await createRetour.mutateAsync({
                vehiculeId: vehicule!.id,
                entrepotId: entrepotId.trim(),
                notes: notes.trim() || undefined,
                lignes: lignes.map((l) => ({
                  produitId: l.stock.produitId,
                  qteRetournee: parseFloat(l.qteRetournee),
                  motif: l.motif,
                })),
              });
              Alert.alert('Succès', 'Retour créé. En attente de validation par le responsable.');
              router.back();
            } catch (e) {
              Alert.alert('Erreur', handleApiError(e));
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Retour fin de journée</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Résumé stock restant */}
          <View style={s.summaryCard}>
            <MaterialCommunityIcons name="package-variant-closed" size={20} color={COLORS.warning} />
            <View>
              <Text style={s.summaryTitle}>Stock restant dans le véhicule</Text>
              <Text style={s.summaryText}>{stockNonVide.length} produit(s) à retourner</Text>
            </View>
            <TouchableOpacity style={s.btnAll} onPress={initialiserTout}>
              <Text style={s.btnAllText}>Tout sélectionner</Text>
            </TouchableOpacity>
          </View>

          {/* Entrepôt destination */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Entrepôt destination</Text>
            <TextInput
              style={s.input}
              placeholder="ID entrepôt"
              placeholderTextColor={COLORS.text4}
              value={entrepotId}
              onChangeText={setEntrepotId}
            />
          </View>

          {/* Lignes retour */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>Articles à retourner ({lignes.length})</Text>
            </View>

            {stockNonVide.filter((sv) => !lignes.some((l) => l.stock.produitId === sv.produitId)).map((sv) => (
              <TouchableOpacity
                key={sv.produitId}
                style={s.produitAdd}
                onPress={() => setLignes([...lignes, { stock: sv, qteRetournee: String(sv.qteDisponible), motif: 'INVENDU' }])}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.produitCode}>{sv.produitCode}</Text>
                  <Text style={s.produitNom}>{sv.produitNom}</Text>
                </View>
                <Text style={s.produitDispo}>Dispo: {sv.qteDisponible}</Text>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))}

            {lignes.map((ligne, idx) => (
              <View key={ligne.stock.produitId} style={s.ligneCard}>
                <View style={s.ligneTop}>
                  <View>
                    <Text style={s.ligneCode}>{ligne.stock.produitCode}</Text>
                    <Text style={s.ligneNom}>{ligne.stock.produitNom}</Text>
                    <Text style={s.ligneDispo}>Disponible : {ligne.stock.qteDisponible}</Text>
                  </View>
                  <TouchableOpacity onPress={() => supprimerLigne(idx)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>

                <View style={s.ligneRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.inputLabel}>Quantité retournée</Text>
                    <TextInput
                      style={s.inputSmall}
                      value={ligne.qteRetournee}
                      onChangeText={(v) => updateLigne(idx, 'qteRetournee', v)}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.inputLabel}>Motif</Text>
                    <View style={s.motifRow}>
                      {(['INVENDU', 'ENDOMMAGE', 'PERIME'] as MotifRetour[]).map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[s.motifBtn, ligne.motif === m && s.motifBtnActif]}
                          onPress={() => updateLigne(idx, 'motif', m)}
                        >
                          <Text style={[s.motifText, ligne.motif === m && s.motifTextActif]}>
                            {MOTIF_RETOUR_LABELS[m]}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Notes</Text>
            <TextInput
              style={[s.input, { height: 64, textAlignVertical: 'top' }]}
              placeholder="Remarques..."
              placeholderTextColor={COLORS.text4}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          <TouchableOpacity
            style={[s.btnSubmit, (createRetour.isPending || lignes.length === 0) && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={createRetour.isPending || lignes.length === 0}
          >
            <MaterialCommunityIcons name="arrow-u-left-top" size={18} color="#fff" />
            <Text style={s.btnSubmitText}>
              {createRetour.isPending ? 'Envoi...' : 'Déclarer le retour'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  scroll: { padding: 16, gap: 14, paddingBottom: 40 },
  summaryCard: {
    backgroundColor: '#FFF3E0', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  summaryTitle: { fontSize: 13, fontWeight: '600', color: COLORS.text1 },
  summaryText: { fontSize: 12, color: COLORS.text3 },
  btnAll: { marginLeft: 'auto', backgroundColor: COLORS.warning + '22', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  btnAllText: { fontSize: 11, fontWeight: '600', color: COLORS.warning },
  section: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text1,
    backgroundColor: COLORS.surface2,
  },
  produitAdd: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  produitCode: { fontSize: 10, fontWeight: '700', color: COLORS.text3 },
  produitNom: { fontSize: 13, color: COLORS.text1 },
  produitDispo: { fontSize: 12, color: COLORS.warning, fontWeight: '600' },
  ligneCard: {
    marginTop: 8, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 10, backgroundColor: COLORS.surface2,
  },
  ligneTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  ligneCode: { fontSize: 10, fontWeight: '700', color: COLORS.text3 },
  ligneNom: { fontSize: 13, color: COLORS.text1 },
  ligneDispo: { fontSize: 11, color: COLORS.warning },
  ligneRow: { flexDirection: 'row', gap: 10 },
  inputLabel: { fontSize: 11, color: COLORS.text3, marginBottom: 4 },
  inputSmall: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: COLORS.text1,
    backgroundColor: COLORS.surface,
  },
  motifRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  motifBtn: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
    backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border,
  },
  motifBtnActif: { backgroundColor: COLORS.warning + '22', borderColor: COLORS.warning },
  motifText: { fontSize: 10, color: COLORS.text2 },
  motifTextActif: { color: COLORS.warning, fontWeight: '700' },
  btnSubmit: {
    backgroundColor: COLORS.warning, borderRadius: 10, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  btnSubmitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
