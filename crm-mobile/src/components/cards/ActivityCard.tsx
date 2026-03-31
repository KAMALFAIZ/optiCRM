import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { ActivityListItem } from '../../types/activity';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, ACTIVITY_PRIORITIES } from '../../types/activity';
import { formatDate } from '../../utils/formatting';
import StatusBadge from '../ui/StatusBadge';

interface ActivityCardProps {
  activity: ActivityListItem;
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/activities/${activity.id}`);
  };

  const typeInfo   = ACTIVITY_TYPES.find((t) => t.value === activity.activityType);
  const priorityInfo = ACTIVITY_PRIORITIES.find((p) => p.value === activity.priority);

  const iconName  = typeInfo?.icon  || 'calendar-outline';
  const iconColor = typeInfo?.color || '#607D8B';
  const iconBg    = iconColor + '1A'; // 10% opacity

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>

          {/* ── En-tête : icône colorée + sujet + type ── */}
          <View style={styles.header}>
            <View style={[styles.iconBadge, { backgroundColor: iconBg }]}>
              <MaterialCommunityIcons name={iconName as any} size={22} color={iconColor} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.subject} numberOfLines={1}>
                {activity.subject}
              </Text>
              <Text style={[styles.typeLabel, { color: iconColor }]}>
                {typeInfo?.label || activity.activityType}
              </Text>
            </View>
          </View>

          {/* ── Badges statut / priorité ── */}
          <View style={styles.badges}>
            <StatusBadge status={activity.status}   statusList={ACTIVITY_STATUSES} />
            {priorityInfo && (
              <StatusBadge status={activity.priority} statusList={ACTIVITY_PRIORITIES} />
            )}
          </View>

          {/* ── Détails date ── */}
          <View style={styles.details}>
            {activity.dueDate ? (
              <View style={styles.row}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#9E9E9E" />
                <Text style={styles.detailText}>Échéance : {formatDate(activity.dueDate)}</Text>
              </View>
            ) : activity.startDate ? (
              <View style={styles.row}>
                <MaterialCommunityIcons name="calendar-outline" size={14} color="#9E9E9E" />
                <Text style={styles.detailText}>Début : {formatDate(activity.startDate)}</Text>
              </View>
            ) : null}
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
  subject: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A2E',
    letterSpacing: -0.2,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
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
  },
});
