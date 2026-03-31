import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { VisitListItem } from '../../types/visit';
import { VISIT_TYPES, VISIT_STATUSES } from '../../types/visit';
import { formatDate, formatDateTime } from '../../utils/formatting';
import StatusBadge from '../ui/StatusBadge';

interface VisitCardProps {
  visit: VisitListItem;
}

export default function VisitCard({ visit }: VisitCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/visits/${visit.id}`);
  };

  const typeInfo  = VISIT_TYPES.find((t) => t.value === visit.visitType);
  const iconName  = typeInfo?.icon  || 'map-marker-outline';
  const iconColor = typeInfo?.color || '#607D8B';
  const iconBg    = iconColor + '1A';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>

          {/* ── En-tête : icône colorée + sujet + statut ── */}
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
              <MaterialCommunityIcons name={iconName as any} size={22} color={iconColor} />
            </View>
            <View style={styles.headerText}>
              <View style={styles.titleRow}>
                <Text style={styles.subject} numberOfLines={1}>
                  {visit.subject}
                </Text>
                <StatusBadge status={visit.status} statusList={VISIT_STATUSES} />
              </View>
              {typeInfo && (
                <Text style={[styles.typeLabel, { color: iconColor }]}>
                  {typeInfo.label}
                </Text>
              )}
            </View>
          </View>

          {/* ── Détails : compte, date, check-in/out ── */}
          <View style={styles.details}>
            {visit.accountName ? (
              <View style={styles.row}>
                <MaterialCommunityIcons name="office-building-outline" size={14} color="#9E9E9E" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {visit.accountName}
                </Text>
              </View>
            ) : null}

            <View style={styles.row}>
              <MaterialCommunityIcons name="calendar-outline" size={14} color="#9E9E9E" />
              <Text style={styles.detailText}>{formatDate(visit.visitDate)}</Text>
            </View>

            {(visit.checkInAt || visit.checkOutAt) && (
              <View style={styles.checkRow}>
                {visit.checkInAt ? (
                  <View style={styles.checkItem}>
                    <MaterialCommunityIcons name="arrow-right-circle-outline" size={14} color="#4CAF50" />
                    <Text style={[styles.checkText, { color: '#4CAF50' }]}>
                      {formatDateTime(visit.checkInAt).split(' ')[1] || formatDateTime(visit.checkInAt)}
                    </Text>
                  </View>
                ) : null}
                {visit.checkOutAt ? (
                  <View style={styles.checkItem}>
                    <MaterialCommunityIcons name="arrow-left-circle-outline" size={14} color="#F44336" />
                    <Text style={[styles.checkText, { color: '#F44336' }]}>
                      {formatDateTime(visit.checkOutAt).split(' ')[1] || formatDateTime(visit.checkOutAt)}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 12,
    elevation: 2,
    backgroundColor: '#FFFFFF',
  },
  content: { paddingVertical: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.2,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  details: { gap: 4 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  detailText: {
    fontSize: 12,
    color: '#757575',
    flex: 1,
  },
  checkRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  checkText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
