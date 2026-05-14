import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import type { LeadListItem } from '../../types/lead';
import { LEAD_STATUSES, LEAD_RATINGS } from '../../types/lead';
import StatusBadge from '../ui/StatusBadge';

interface LeadCardProps {
  lead: LeadListItem;
}

export default function LeadCard({ lead }: LeadCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/leads/${lead.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {lead.fullName}
              </Text>
              <StatusBadge status={lead.status} statusList={LEAD_STATUSES} />
            </View>
            {lead.companyName ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {lead.companyName}
              </Text>
            ) : null}
          </View>

          <View style={styles.badges}>
            {lead.rating ? (
              <StatusBadge status={lead.rating} statusList={LEAD_RATINGS} />
            ) : null}
            {lead.leadScore != null ? (
              <View style={styles.scoreContainer}>
                <Icon name="star-outline" size={14} color="#FFC107" />
                <Text style={styles.scoreText}>{lead.leadScore}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.details}>
            {lead.source ? (
              <View style={styles.row}>
                <Icon name="source-branch" size={16} color="#757575" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {lead.source}
                </Text>
              </View>
            ) : null}
            {lead.email ? (
              <View style={styles.row}>
                <Icon name="email-outline" size={16} color="#757575" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {lead.email}
                </Text>
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
    marginVertical: 4,
    borderRadius: 8,
    elevation: 2,
  },
  content: {
    paddingVertical: 12,
  },
  header: {
    marginBottom: 6,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  subtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  scoreText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFC107',
  },
  details: {
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#616161',
    flex: 1,
  },
});
