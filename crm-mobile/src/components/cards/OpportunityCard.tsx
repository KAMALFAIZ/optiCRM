import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import type { OpportunityListItem } from '../../types/opportunity';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatting';

interface OpportunityCardProps {
  opportunity: OpportunityListItem;
}

export default function OpportunityCard({ opportunity }: OpportunityCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/opportunities/${opportunity.id}`);
  };

  const stageColor = opportunity.stageColor || '#607D8B';

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {opportunity.name}
            </Text>
            <Text style={styles.amount}>
              {formatCurrency(opportunity.amount)}
            </Text>
          </View>

          <View style={styles.stageRow}>
            <Chip
              style={[styles.stageChip, { backgroundColor: stageColor + '20' }]}
              textStyle={[styles.stageText, { color: stageColor }]}
              compact
            >
              {opportunity.stageName}
            </Chip>
            <Text style={styles.probability}>
              {formatPercent(opportunity.probability)}
            </Text>
          </View>

          <View style={styles.details}>
            {opportunity.accountName ? (
              <View style={styles.row}>
                <Icon name="domain" size={16} color="#757575" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {opportunity.accountName}
                </Text>
              </View>
            ) : null}
            {opportunity.closeDate ? (
              <View style={styles.row}>
                <Icon name="calendar-outline" size={16} color="#757575" />
                <Text style={styles.detailText}>
                  {formatDate(opportunity.closeDate)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1976D2',
  },
  stageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  stageChip: {
    alignSelf: 'flex-start',
    height: 28,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  probability: {
    fontSize: 13,
    color: '#757575',
    fontWeight: '500',
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
