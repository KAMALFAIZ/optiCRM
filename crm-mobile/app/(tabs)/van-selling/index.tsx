import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../../src/config/theme';
import { useMonVehicule, useStockVoiture, useBonsLivraison } from '../../../src/hooks/useVanSelling';
import type { StockVoiture } from '../../../src/types/vanSelling';

export default function VanSellingDashboard() {
  const router = useRouter();
  const { data: vehicule, isLoading: loadVehicule } = useMonVehicule();
  const { data: stock, isLoading: loadStock, refetch } = useStockVoiture(vehicule?.id);
  const { data: blData } = useBonsLivraison({ vehiculeId: vehicule?.id, statut: 'VALIDE' });

  const blEnCours = blData?.content?.length ?? 0;

  const renderStockItem = ({ item }: { item: StockVoiture }) => (
    <View style={[s.stockRow, item.qteDisponible === 0 && s.stockRowEmpty]}>
      <View style={s.stockInfo}>
        <Text style={s.produitCode}>{item.produitCode}</Text>
        <Text style={s.produitNom} numberOfLines={1}>{item.produitNom}</Text>
      </View>
      <View style={s.stockQtes}>
        <View style={s.qteChip}>
          <Text style={s.qteLabel}>Dispo</Text>
          <Text style={[s.qteVal, item.qteDisponible === 0 && s.qteZero]}>
            {item.qteDisponible}
          </Text>
        </View>
        <View style={s.qteChipSm}>
          <Text style={s.qteLabelSm}>Chargé</Text>
          <Text style={s.qteValSm}>{item.qteChargee}</Text>
        </View>
        <View style={s.qteChipSm}>
          <Text style={s.qteLabelSm}>Vendu</Text>
          <Text style={s.qteValSm}>{item.qteVendue}</Text>
        </View>
      </View>
    </View>
  );

  if (loadVehicule) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <MaterialCommunityIcons name="truck" size={48} color={COLORS.text4} />
          <Text style={s.loadingText}>Chargement du véhicule...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!vehicule) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.center}>
          <MaterialCommunityIcons name="truck-alert-outline" size={48} color={COLORS.warning} />
          <Text style={s.emptyTitle}>Aucun véhicule affecté</Text>
          <Text style={s.emptySubtitle}>Contactez votre responsable pour l'affectation d'un véhicule.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* Header voiture */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>Vente en tournée</Text>
          <Text style={s.headerSub}>{vehicule.immatriculation} — {vehicule.marque} {vehicule.modele}</Text>
        </View>
        <View style={[s.statutBadge, vehicule.statut === 'ACTIF' ? s.statutActif : s.statutInactif]}>
          <Text style={s.statutText}>{vehicule.statut}</Text>
        </View>
      </View>

      {/* Actions rapides */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.actionsScroll} contentContainerStyle={s.actionsContent}>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/(tabs)/van-selling/bl/create')}>
          <MaterialCommunityIcons name="plus-circle" size={26} color={COLORS.primary} />
          <Text style={s.actionLabel}>Nouveau BL</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/(tabs)/van-selling/bl/index')}>
          <MaterialCommunityIcons name="file-document-multiple-outline" size={26} color={COLORS.accent} />
          <Text style={s.actionLabel}>Mes BL</Text>
          {blEnCours > 0 && <View style={s.badge}><Text style={s.badgeText}>{blEnCours}</Text></View>}
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/(tabs)/van-selling/chargement/index')}>
          <MaterialCommunityIcons name="truck-delivery-outline" size={26} color={COLORS.purple} />
          <Text style={s.actionLabel}>Chargements</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.actionCard} onPress={() => router.push('/(tabs)/van-selling/retour/create')}>
          <MaterialCommunityIcons name="arrow-u-left-top" size={26} color={COLORS.warning} />
          <Text style={s.actionLabel}>Retour</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Stock voiture */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Stock voiture</Text>
        <Text style={s.sectionCount}>{stock?.length ?? 0} articles</Text>
      </View>

      <FlatList
        data={stock ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderStockItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={loadStock} onRefresh={refetch} colors={[COLORS.primary]} />}
        ListEmptyComponent={
          !loadStock ? (
            <View style={s.center}>
              <MaterialCommunityIcons name="package-variant-closed" size={40} color={COLORS.text4} />
              <Text style={s.emptyTitle}>Voiture vide</Text>
              <Text style={s.emptySubtitle}>Aucun chargement validé pour ce véhicule.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  loadingText: { marginTop: 12, color: COLORS.text3, fontSize: 14 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 16, backgroundColor: COLORS.surface,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text1 },
  headerSub: { fontSize: 13, color: COLORS.text3, marginTop: 2 },
  statutBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statutActif: { backgroundColor: COLORS.successLight },
  statutInactif: { backgroundColor: COLORS.errorLight },
  statutText: { fontSize: 11, fontWeight: '700', color: COLORS.text1 },

  actionsScroll: { maxHeight: 100 },
  actionsContent: { paddingHorizontal: 12, paddingVertical: 12, gap: 10 },
  actionCard: {
    backgroundColor: COLORS.surface, borderRadius: 12, padding: 14,
    alignItems: 'center', minWidth: 80, gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 3, elevation: 2,
    position: 'relative',
  },
  actionLabel: { fontSize: 11, fontWeight: '600', color: COLORS.text2 },
  badge: {
    position: 'absolute', top: 6, right: 6, backgroundColor: COLORS.error,
    borderRadius: 8, minWidth: 16, height: 16, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 9, color: '#fff', fontWeight: '700', paddingHorizontal: 3 },

  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.text1 },
  sectionCount: { fontSize: 12, color: COLORS.text3 },

  list: { paddingBottom: 20 },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface,
    marginHorizontal: 16, marginVertical: 4, borderRadius: 10, padding: 12,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 1,
  },
  stockRowEmpty: { opacity: 0.5 },
  stockInfo: { flex: 1 },
  produitCode: { fontSize: 11, fontWeight: '700', color: COLORS.text3, marginBottom: 1 },
  produitNom: { fontSize: 13, color: COLORS.text1 },
  stockQtes: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  qteChip: {
    backgroundColor: COLORS.primaryLight, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4, alignItems: 'center',
  },
  qteLabel: { fontSize: 9, color: COLORS.primary, fontWeight: '600' },
  qteVal: { fontSize: 16, fontWeight: '700', color: COLORS.primary },
  qteZero: { color: COLORS.error },
  qteChipSm: { alignItems: 'center' },
  qteLabelSm: { fontSize: 9, color: COLORS.text4 },
  qteValSm: { fontSize: 12, fontWeight: '600', color: COLORS.text2 },

  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text2, marginTop: 12 },
  emptySubtitle: { fontSize: 13, color: COLORS.text4, textAlign: 'center', marginTop: 4 },
});
