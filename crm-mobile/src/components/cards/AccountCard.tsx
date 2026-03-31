import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import type { AccountListItem } from '../../types/account';
import { ACCOUNT_TYPES } from '../../types/account';
import StatusBadge from '../ui/StatusBadge';

interface AccountCardProps {
  account: AccountListItem;
}

export default function AccountCard({ account }: AccountCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/accounts/${account.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {account.name}
              </Text>
              <StatusBadge status={account.accountType} statusList={ACCOUNT_TYPES} />
            </View>
          </View>

          <View style={styles.details}>
            {account.billingCity ? (
              <View style={styles.row}>
                <Icon name="map-marker-outline" size={16} color="#757575" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {account.billingCity}
                </Text>
              </View>
            ) : null}
            {account.phone ? (
              <View style={styles.row}>
                <Icon name="phone-outline" size={16} color="#757575" />
                <Text style={styles.detailText}>{account.phone}</Text>
              </View>
            ) : null}
            {account.contactCount != null ? (
              <View style={styles.row}>
                <Icon name="account-group-outline" size={16} color="#757575" />
                <Text style={styles.detailText}>
                  {account.contactCount} contact{account.contactCount !== 1 ? 's' : ''}
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
    marginBottom: 8,
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
