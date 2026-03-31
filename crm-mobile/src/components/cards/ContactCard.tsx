import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Card, Text } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import type { ContactListItem } from '../../types/contact';
import { CONTACT_STATUSES } from '../../types/contact';
import StatusBadge from '../ui/StatusBadge';

interface ContactCardProps {
  contact: ContactListItem;
}

export default function ContactCard({ contact }: ContactCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/contacts/${contact.id}`);
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>
      <Card style={styles.card}>
        <Card.Content style={styles.content}>
          <View style={styles.header}>
            <View style={styles.nameRow}>
              <Text style={styles.name} numberOfLines={1}>
                {contact.fullName}
              </Text>
              {contact.status ? (
                <StatusBadge status={contact.status} statusList={CONTACT_STATUSES} />
              ) : null}
            </View>
            {contact.jobTitle ? (
              <Text style={styles.subtitle} numberOfLines={1}>
                {contact.jobTitle}
              </Text>
            ) : null}
          </View>

          <View style={styles.details}>
            {contact.accountName ? (
              <View style={styles.row}>
                <Icon name="domain" size={16} color="#757575" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {contact.accountName}
                </Text>
              </View>
            ) : null}
            {contact.email ? (
              <View style={styles.row}>
                <Icon name="email-outline" size={16} color="#757575" />
                <Text style={styles.detailText} numberOfLines={1}>
                  {contact.email}
                </Text>
              </View>
            ) : null}
            {contact.phoneMobile ? (
              <View style={styles.row}>
                <Icon name="phone-outline" size={16} color="#757575" />
                <Text style={styles.detailText}>{contact.phoneMobile}</Text>
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
  subtitle: {
    fontSize: 13,
    color: '#757575',
    marginTop: 2,
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
