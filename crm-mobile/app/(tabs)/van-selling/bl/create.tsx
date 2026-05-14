import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS } from '../../../../src/config/theme';
import { useMonVehicule, useStockDisponible, useCreateBonLivraison } from '../../../../src/hooks/useVanSelling';
import { handleApiError } from '../../../../src/api/client';
import type { StockVoiture } from '../../../../src/types/vanSelling';

interface LigneForm {
  stock: StockVoiture;
  quantite: string;
  prixApplique: string;
}

export default function CreateBLScreen() {
  const router = useRouter();
  const { data: vehicule } = useMonVehicule();
  const { data: stockDispo } = useStockDisponible(vehicule?.id);
  const createBL = useCreateBonLivraison();

  const [clientId, setClientId] = useState('');
  const [clientNom, setClientNom] = useState('');
  const [notes, setNotes] = useState('');
  const [lignes, setLignes] = useState<LigneForm[]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [showProduits, setShowProduits] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setCoords({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  const ajouterLigne = (stock: StockVoiture) => {
    if (lignes.some((l) => l.stock.produitId === stock.produitId)) return;
    setLignes([...lignes, {
      stock,
      quantite: '1',
      prixApplique: stock.qteDisponible > 0 ? '' : '0',
    }]);
    setShowProduits(false);
  };

  const updateLigne = (index: number, field: 'quantite' | 'prixApplique', value: string) => {
    const updated = [...lignes];
    updated[index] = { ...updated[index], [field]: value };
    setLignes(updated);
  };

  const supprimerLigne = (index: number) => {
    setLignes(lignes.filter((_, i) => i !== index));
  };

  const totalTtc = lignes.reduce((acc, l) => {
    const q = parseFloat(l.quantite) || 0;
    const p = parseFloat(l.prixApplique) || 0;
    return acc + q * p * 1.2; // TVA 20% estimée
  }, 0);

  const handleSubmit = async () => {
    if (!clientId.trim()) { Alert.alert('Erreur', 'Saisissez l\'identifiant client.'); return; }
    if (lignes.length === 0) { Alert.alert('Erreur', 'Ajoutez au moins un article.'); return; }

    const invalidLigne = lignes.find(
      (l) => !parseFloat(l.quantite) || !parseFloat(l.prixApplique)
    );
    if (invalidLigne) {
      Alert.alert('Erreur', 'Vérifiez les quantités et prix de toutes les lignes.');
      return;
    }

    try {
      await createBL.mutateAsync({
        vehiculeId: vehicule!.id,
        clientId: clientId.trim(),
        latitude: coords?.lat,
        longitude: coords?.lng,
        notes: notes.trim() || undefined,
        lignes: lignes.map((l) => ({
          produitId: l.stock.produitId,
          quantite: parseFloat(l.quantite),
          prixApplique: parseFloat(l.prixApplique),
        })),
      });
      router.replace('/(tabs)/van-selling/bl/index');
    } catch (err) {
      Alert.alert('Erreur', handleApiError(err));
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Nouveau bon de livraison</Text>
        {coords && (
          <MaterialCommunityIcons name="map-marker-check" size={18} color={COLORS.success} />
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll}>

          {/* Client */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Client</Text>
            <TextInput
              style={s.input}
              placeholder="ID client (code CRM ou Sage)"
              placeholderTextColor={COLORS.text4}
              value={clientId}
              onChangeText={setClientId}
            />
            <TextInput
              style={[s.input, { marginTop: 8 }]}
              placeholder="Nom client (affiché uniquement)"
              placeholderTextColor={COLORS.text4}
              value={clientNom}
              onChangeText={setClientNom}
            />
          </View>

          {/* Articles */}
          <View style={s.section}>
            <View style={s.sectionRow}>
              <Text style={s.sectionLabel}>Articles ({lignes.length})</Text>
              <TouchableOpacity style={s.btnAdd} onPress={() => setShowProduits(!showProduits)}>
                <MaterialCommunityIcons name="plus" size={14} color="#fff" />
                <Text style={s.btnAddText}>Ajouter</Text>
              </TouchableOpacity>
            </View>

            {showProduits && (
              <FlatList
                data={stockDispo ?? []}
                keyExtractor={(item) => item.produitId}
                style={s.produitsList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={s.produitItem}
                    onPress={() => ajouterLigne(item)}
                    disabled={lignes.some((l) => l.stock.produitId === item.produitId)}
                  >
                    <View>
                      <Text style={s.produitItemCode}>{item.produitCode}</Text>
                      <Text style={s.produitItemNom}>{item.produitNom}</Text>
                    </View>
                    <Text style={s.produitDispo}>Dispo: {item.qteDisponible}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={s.noStock}>Stock voiture vide</Text>}
                scrollEnabled={false}
              />
            )}

            {lignes.map((ligne, idx) => (
              <View key={ligne.stock.produitId} style={s.ligneCard}>
                <View style={s.ligneHeader}>
                  <View>
                    <Text style={s.ligneCode}>{ligne.stock.produitCode}</Text>
                    <Text style={s.ligneNom}>{ligne.stock.produitNom}</Text>
                    <Text style={s.ligneDispo}>Stock dispo : {ligne.stock.qteDisponible}</Text>
                  </View>
                  <TouchableOpacity onPress={() => supprimerLigne(idx)}>
                    <MaterialCommunityIcons name="trash-can-outline" size={18} color={COLORS.error} />
                  </TouchableOpacity>
                </View>
                <View style={s.ligneInputs}>
                  <View style={s.inputWrap}>
                    <Text style={s.inputLabel}>Quantité</Text>
                    <TextInput
                      style={s.inputSmall}
                      value={ligne.quantite}
                      onChangeText={(v) => updateLigne(idx, 'quantite', v)}
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <View style={s.inputWrap}>
                    <Text style={s.inputLabel}>Prix HT (MAD)</Text>
                    <TextInput
                      style={s.inputSmall}
                      value={ligne.prixApplique}
                      onChangeText={(v) => updateLigne(idx, 'prixApplique', v)}
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Notes */}
          <View style={s.section}>
            <Text style={s.sectionLabel}>Notes</Text>
            <TextInput
              style={[s.input, { height: 72, textAlignVertical: 'top' }]}
              placeholder="Remarques..."
              placeholderTextColor={COLORS.text4}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>

          {/* Total estimé */}
          {lignes.length > 0 && (
            <View style={s.totalCard}>
              <Text style={s.totalLabel}>Total TTC estimé (TVA 20%)</Text>
              <Text style={s.totalVal}>{totalTtc.toFixed(2)} MAD</Text>
            </View>
          )}

          <TouchableOpacity
            style={[s.btnSubmit, createBL.isPending && s.btnDisabled]}
            onPress={handleSubmit}
            disabled={createBL.isPending}
          >
            <MaterialCommunityIcons name="check" size={18} color="#fff" />
            <Text style={s.btnSubmitText}>
              {createBL.isPending ? 'Création...' : 'Créer le bon de livraison'}
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
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  section: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04,
    shadowRadius: 3, elevation: 1,
  },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionLabel: { fontSize: 12, fontWeight: '700', color: COLORS.text3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  input: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: COLORS.text1,
    backgroundColor: COLORS.surface2,
  },
  btnAdd: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.primary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  btnAddText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  produitsList: { maxHeight: 200, marginTop: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  produitItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  produitItemCode: { fontSize: 11, fontWeight: '700', color: COLORS.text3 },
  produitItemNom: { fontSize: 13, color: COLORS.text1 },
  produitDispo: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  noStock: { textAlign: 'center', padding: 16, color: COLORS.text4, fontSize: 13 },
  ligneCard: {
    marginTop: 10, borderWidth: 1, borderColor: COLORS.border,
    borderRadius: 8, padding: 10, backgroundColor: COLORS.surface2,
  },
  ligneHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  ligneCode: { fontSize: 11, fontWeight: '700', color: COLORS.text3 },
  ligneNom: { fontSize: 13, color: COLORS.text1 },
  ligneDispo: { fontSize: 11, color: COLORS.primary, marginTop: 1 },
  ligneInputs: { flexDirection: 'row', gap: 10 },
  inputWrap: { flex: 1 },
  inputLabel: { fontSize: 11, color: COLORS.text3, marginBottom: 4 },
  inputSmall: {
    borderWidth: 1, borderColor: COLORS.border, borderRadius: 6,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: COLORS.text1,
    backgroundColor: COLORS.surface,
  },
  totalCard: {
    backgroundColor: COLORS.primaryLight, borderRadius: 10, padding: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  totalLabel: { fontSize: 13, color: COLORS.primaryDark, fontWeight: '600' },
  totalVal: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  btnSubmit: {
    backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnSubmitText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
