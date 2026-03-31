import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Linking } from 'react-native';
import { Text, Card, IconButton, Chip, Divider } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useContact } from '../../../src/hooks/useContacts';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: contact, isLoading, isError, refetch } = useContact(id!);

  if (isLoading) return <LoadingScreen />;
  if (isError || !contact) return <ErrorView onRetry={refetch} />;

  const handleCall = (phone?: string) => {
    if (phone) Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = () => {
    if (contact.email) Linking.openURL(`mailto:${contact.email}`);
  };

  const handleWhatsApp = () => {
    const num = contact.mobile || contact.phoneMobile || contact.phone;
    if (num) Linking.openURL(`https://wa.me/${num.replace(/[^0-9]/g, '')}`);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(contact.firstName?.[0] || '') + (contact.lastName?.[0] || '')}
              </Text>
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.name}>{contact.fullName}</Text>
              {contact.jobTitle && <Text style={styles.jobTitle}>{contact.jobTitle}</Text>}
              {contact.account && <Text style={styles.company}>@ {contact.account.name}</Text>}
            </View>
          </View>
          {contact.status && (
            <Chip compact style={styles.statusChip}>{contact.status}</Chip>
          )}
        </Card.Content>
      </Card>

      <View style={styles.actions}>
        <IconButton icon="phone" mode="contained" containerColor="#4CAF50" iconColor="#FFF" onPress={() => handleCall(contact.phoneOffice || contact.phoneMobile)} disabled={!contact.phoneOffice && !contact.phoneMobile} />
        <IconButton icon="email" mode="contained" containerColor="#1976D2" iconColor="#FFF" onPress={handleEmail} disabled={!contact.email} />
        <IconButton icon="whatsapp" mode="contained" containerColor="#25D366" iconColor="#FFF" onPress={handleWhatsApp} disabled={!contact.mobile && !contact.phoneMobile && !contact.phone} />
      </View>

      <Card style={styles.card}>
        <Card.Title title="Coordonnees" />
        <Card.Content>
          <InfoRow label="Email" value={contact.email} />
          <InfoRow label="Tel. bureau" value={contact.phoneOffice} />
          <InfoRow label="Tel. mobile" value={contact.phoneMobile} />
          <InfoRow label="Departement" value={contact.department} />
          <InfoRow label="Methode preferee" value={contact.preferredContactMethod} />
        </Card.Content>
      </Card>

      <Card style={styles.card}>
        <Card.Title title="Adresse" />
        <Card.Content>
          {contact.addressStreet && <Text style={styles.infoValue}>{contact.addressStreet}</Text>}
          <Text style={styles.infoValue}>
            {[contact.addressCity, contact.addressState, contact.addressPostalCode].filter(Boolean).join(', ')}
          </Text>
          {contact.addressCountry && <Text style={styles.infoValue}>{contact.addressCountry}</Text>}
        </Card.Content>
      </Card>

      {contact.description && (
        <Card style={styles.card}>
          <Card.Title title="Notes" />
          <Card.Content><Text>{contact.description}</Text></Card.Content>
        </Card>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  card: { margin: 12, marginBottom: 0, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#1976D2', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 20 },
  headerInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '700', color: '#212121' },
  jobTitle: { fontSize: 14, color: '#607D8B', marginTop: 2 },
  company: { fontSize: 14, color: '#1976D2', marginTop: 2 },
  statusChip: { alignSelf: 'flex-start', marginTop: 8 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  bottomPadding: { height: 24 },
});
