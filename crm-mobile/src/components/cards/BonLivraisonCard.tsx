import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../../config/theme';
import type { BonLivraison } from '../../types/vanSelling';
import { STATUT_BL_CONFIG } from '../../types/vanSelling';

interface Props {
  bl: BonLivraison;
  onPress: () => void;
}

export default function BonLivraisonCard({ bl, onPress }: Props) {
  const config = STATUT_BL_CONFIG[bl.statut];

  return (
    <TouchableOpacity style={s.card} onPress={onPress} activeOpacity={0.75}>
      <View style={s.row}>
        <View style={s.iconWrap}>
          <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.primary} />
        </View>

        <View style={s.body}>
          <View style={s.topRow}>
            <Text style={s.numero}>{bl.numero}</Text>
            <View style={[s.badge, { backgroundColor: config.color + '22' }]}>
              <Text style={[s.badgeText, { color: config.color }]}>{config.label}</Text>
            </View>
          </View>

          <Text style={s.client} numberOfLines={1}>{bl.clientNom}</Text>

          <View style={s.bottomRow}>
            <Text style={s.amount}>{bl.montantTtc.toFixed(2)} MAD</Text>
            <Text style={s.date}>
              {new Date(bl.createdAt).toLocaleDateString('fr-MA')}
            </Text>
          </View>

          {bl.signatureCapturee && (
            <View style={s.sigRow}>
              <MaterialCommunityIcons name="draw" size={12} color={COLORS.success} />
              <Text style={s.sigText}>Signature capturée</Text>
            </View>
          )}
        </View>

        <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.text4} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 5,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  body: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  numero: { fontSize: 14, fontWeight: '700', color: COLORS.text1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  client: { fontSize: 13, color: COLORS.text2, marginBottom: 4 },
  bottomRow: { flexDirection: 'row', justifyContent: 'space-between' },
  amount: { fontSize: 13, fontWeight: '700', color: COLORS.primary },
  date: { fontSize: 11, color: COLORS.text4 },
  sigRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  sigText: { fontSize: 10, color: COLORS.success },
});
