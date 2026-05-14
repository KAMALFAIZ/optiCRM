import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../../src/config/theme';
import { useMonVehicule, useBonsLivraison } from '../../../../src/hooks/useVanSelling';
import BonLivraisonCard from '../../../../src/components/cards/BonLivraisonCard';
import type { StatutBonLivraison } from '../../../../src/types/vanSelling';
import { STATUT_BL_CONFIG } from '../../../../src/types/vanSelling';

const FILTRES: { label: string; value: StatutBonLivraison | undefined }[] = [
  { label: 'Tous', value: undefined },
  { label: 'Brouillon', value: 'BROUILLON' },
  { label: 'Validé', value: 'VALIDE' },
  { label: 'Livré', value: 'LIVRE' },
  { label: 'Annulé', value: 'ANNULE' },
];

export default function BLListScreen() {
  const router = useRouter();
  const { data: vehicule } = useMonVehicule();
  const [filtreStatut, setFiltreStatut] = useState<StatutBonLivraison | undefined>(undefined);

  const { data, isLoading, refetch } = useBonsLivraison({
    vehiculeId: vehicule?.id,
    statut: filtreStatut,
  });

  const bls = data?.content ?? [];

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.title}>Bons de livraison</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/van-selling/bl/create')} style={s.addBtn}>
          <MaterialCommunityIcons name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Filtres statut */}
      <View style={s.filtres}>
        {FILTRES.map((f) => (
          <TouchableOpacity
            key={f.label}
            style={[s.filtre, filtreStatut === f.value && s.filtreActif]}
            onPress={() => setFiltreStatut(f.value)}
          >
            <Text style={[s.filtreText, filtreStatut === f.value && s.filtreTextActif]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={bls}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <BonLivraisonCard
            bl={item}
            onPress={() => router.push(`/(tabs)/van-selling/bl/${item.id}`)}
          />
        )}
        contentContainerStyle={s.list}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="file-document-outline" size={44} color={COLORS.text4} />
              <Text style={s.emptyText}>Aucun bon de livraison</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12,
    paddingVertical: 12, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text1, marginLeft: 8 },
  addBtn: {
    backgroundColor: COLORS.primary, borderRadius: 8,
    width: 34, height: 34, alignItems: 'center', justifyContent: 'center',
  },
  filtres: {
    flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 10,
    gap: 8, flexWrap: 'wrap', backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  filtre: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
    backgroundColor: COLORS.surface2, borderWidth: 1, borderColor: COLORS.border,
  },
  filtreActif: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filtreText: { fontSize: 12, color: COLORS.text2, fontWeight: '500' },
  filtreTextActif: { color: '#fff' },
  list: { paddingTop: 8, paddingBottom: 20 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { marginTop: 10, color: COLORS.text3, fontSize: 14 },
});
