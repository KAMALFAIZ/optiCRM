import React from 'react';
import { View, ScrollView, RefreshControl, StyleSheet, Linking } from 'react-native';
import { Text, Card, Divider, IconButton, Chip, Button } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { useAccount, useAccountStats } from '../../../src/hooks/useAccounts';
import { formatCurrency, formatNumber } from '../../../src/utils/formatting';
import { getStatusColor } from '../../../src/utils/constants';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: account, isLoading, isError, refetch } = useAccount(id!);
  const { data: stats } = useAccountStats(id!);

  if (isLoading) return <LoadingScreen />;
  if (isError || !account) return <ErrorView onRetry={refetch} />;

  const handleCall = () => {
    if (account.phone) Linking.openURL(`tel:${account.phone}`);
  };

  const handleWhatsApp = () => {
    const num = account.whatsapp || account.phone;
    if (num) Linking.openURL(`https://wa.me/${num.replace(/[^0-9]/g, '')}`);
  };

  const handleNavigate = () => {
    if (account.latitude && account.longitude) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${account.latitude},${account.longitude}`);
    } else if (account.fullBillingAddress) {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(account.fullBillingAddress)}`);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}
    >
      {/* Header */}
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.name}>{account.name}</Text>
          {account.legalName && <Text style={styles.legalName}>{account.legalName}</Text>}
          <View style={styles.chipRow}>
            <Chip compact style={{ backgroundColor: getStatusColor(account.accountType) + '30' }}>
              {account.accountType}
            </Chip>
            {account.segment && <Chip compact style={styles.chipMargin}>{account.segment}</Chip>}
          </View>
        </Card.Content>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <IconButton icon="phone" mode="contained" containerColor="#4CAF50" iconColor="#FFF" onPress={handleCall} disabled={!account.phone} />
        <IconButton icon="whatsapp" mode="contained" containerColor="#25D366" iconColor="#FFF" onPress={handleWhatsApp} disabled={!account.phone && !account.whatsapp} />
        <IconButton icon="map-marker" mode="contained" containerColor="#1976D2" iconColor="#FFF" onPress={handleNavigate} />
        {account.website && (
          <IconButton icon="web" mode="contained" containerColor="#607D8B" iconColor="#FFF" onPress={() => Linking.openURL(account.website!.startsWith('http') ? account.website! : `https://${account.website}`)} />
        )}
      </View>

      {/* Info Section */}
      <Card style={styles.card}>
        <Card.Title title="Informations" />
        <Card.Content>
          <InfoRow label="Telephone" value={account.phone} />
          <InfoRow label="Email" value={account.website} />
          <InfoRow label="Industrie" value={account.industry?.name} />
          <InfoRow label="Employes" value={account.employeeCount ? formatNumber(account.employeeCount) : undefined} />
          <InfoRow label="CA annuel" value={account.annualRevenue ? formatCurrency(account.annualRevenue) : undefined} />
          <InfoRow label="Affecte a" value={account.assignedTo?.fullName} />
        </Card.Content>
      </Card>

      {/* Moroccan IDs */}
      {(account.ice || account.identifiantFiscal || account.rc) && (
        <Card style={styles.card}>
          <Card.Title title="Identifiants marocains" />
          <Card.Content>
            <InfoRow label="ICE" value={account.ice} />
            <InfoRow label="IF" value={account.identifiantFiscal} />
            <InfoRow label="RC" value={account.rc} />
            <InfoRow label="CNSS" value={account.cnss} />
            <InfoRow label="Patente" value={account.patente} />
          </Card.Content>
        </Card>
      )}

      {/* Address */}
      <Card style={styles.card}>
        <Card.Title title="Adresse" />
        <Card.Content>
          {account.billingStreet && <Text style={styles.infoValue}>{account.billingStreet}</Text>}
          <Text style={styles.infoValue}>
            {[account.billingCity, account.billingState, account.billingPostalCode].filter(Boolean).join(', ')}
          </Text>
          {account.billingCountry && <Text style={styles.infoValue}>{account.billingCountry}</Text>}
        </Card.Content>
      </Card>

      {/* Stats */}
      {stats && (
        <Card style={styles.card}>
          <Card.Title title="Statistiques" />
          <Card.Content>
            <InfoRow label="Contacts" value={formatNumber(stats.totalContacts)} />
            <InfoRow label="Opportunites" value={formatNumber(stats.totalOpportunities)} />
            <InfoRow label="Gagnees" value={formatNumber(stats.wonOpportunities)} />
            <InfoRow label="Montant gagne" value={formatCurrency(stats.wonAmount)} />
            <InfoRow label="Pipeline ouvert" value={formatCurrency(stats.openPipeline)} />
            <InfoRow label="CA annee en cours" value={formatCurrency(stats.caCurrentYear)} />
          </Card.Content>
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
  name: { fontSize: 22, fontWeight: '700', color: '#212121' },
  legalName: { fontSize: 14, color: '#607D8B', marginTop: 2 },
  chipRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  chipMargin: { marginLeft: 4 },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 14, color: '#212121', flex: 1.5, textAlign: 'right' },
  bottomPadding: { height: 24 },
});
