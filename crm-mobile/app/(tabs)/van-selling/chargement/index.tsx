import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../../src/config/theme';
import { useMonVehicule, useChargements } from '../../../../src/hooks/useVanSelling';
import type { Chargement, StatutChargement } from '../../../../src/types/vanSelling';

const STATUT_CONFIG: Record<StatutChargement, { label: string; color: string; icon: string }> = {
  EN_COURS: { label: 'En cours',  color: '#FF9800', icon: 'clock-outline' },
  VALIDE:   { label: 'Validé',    color: '#4CAF50', icon: 'check-circle-outline' },
  ANNULE:   { label: 'Annulé',    color: '#F44336', icon: 'close-circle-outline' },
};

export default function ChargementsScreen() {
  const router = useRouter();
  const { data: vehicule } = useMonVehicule();
  const { data, isLoading, refetch } = useChargements(vehicule?.id);

  const chargements: Chargement[] = data?.content ?? [];

  const renderItem = ({ item }: { item: Chargement }) => {
    const cfg = STATUT_CONFIG[item.statut];
    const totalProduits = item.lignes?.length ?? '—';
    const partiel = item.lignes?.some((l) => l.partiel);

    return (
      <View style={s.card}>
        <View style={s.cardRow}>
          <View style={[s.iconWrap, { backgroundColor: cfg.color + '22' }]}>
            <MaterialCommunityIcons name={cfg.icon as any} size={20} color={cfg.color} />
          </View>
          <View style={s.cardBody}>
            <View style={s.topRow}>
              <Text style={s.entrepot}>{item.entrepotNom}</Text>
              <View style={[s.badge, { backgroundColor: cfg.color + '22' }]}>
                <Text style={[s.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            <Text style={s.date}>
              {new Date(item.dateChargement).toLocaleDateString('fr-MA', {
                day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}
            </Text>
            <View style={s.statsRow}>
              <Text style={s.stat}>{totalProduits} articles</Text>
              {partiel && (
                <View style={s.partielBadge}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={12} color={COLORS.warning} />
                  <Text style={s.partielText}>Partiel</Text>
                </View>
              )}
              {item.validePar && (
                <Text style={s.validePar}>Validé par {item.validePar}</Text>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Chargements</Text>
      </View>

      <FlatList
        data={chargements}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={s.empty}>
              <MaterialCommunityIcons name="truck-delivery-outline" size={44} color={COLORS.text4} />
              <Text style={s.emptyTitle}>Aucun chargement</Text>
              <Text style={s.emptyText}>Les chargements validés par le responsable apparaîtront ici.</Text>
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
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', color: COLORS.text1 },
  list: { padding: 12, gap: 8, paddingBottom: 30 },
  card: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 3, elevation: 2,
  },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cardBody: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  entrepot: { fontSize: 14, fontWeight: '700', color: COLORS.text1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  date: { fontSize: 12, color: COLORS.text3, marginBottom: 5 },
  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  stat: { fontSize: 12, color: COLORS.text2 },
  partielBadge: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  partielText: { fontSize: 11, color: COLORS.warning, fontWeight: '600' },
  validePar: { fontSize: 11, color: COLORS.text4 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyTitle: { marginTop: 12, fontSize: 16, fontWeight: '600', color: COLORS.text2 },
  emptyText: { marginTop: 4, fontSize: 13, color: COLORS.text4, textAlign: 'center' },
});
