import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, Appbar, Divider, Icon } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { usePayment } from '../../../src/hooks/usePayments';
import { PAYMENT_STATUSES, PAYMENT_METHODS } from '../../../src/api/payments';
import LoadingScreen from '../../../src/components/ui/LoadingScreen';
import ErrorView from '../../../src/components/ui/ErrorView';

const formatAmount = (n?: number) =>
  n != null ? n.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : '—';

const formatDate = (d?: string) => {
  if (!d) return '—';
  try {
    const date = new Date(d);
    return date.toLocaleDateString('fr-MA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return d;
  }
};

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function PaymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: payment, isLoading, isError, refetch } = usePayment(id!);

  if (isLoading) return <LoadingScreen />;
  if (isError || !payment) return <ErrorView onRetry={refetch} />;

  const statusInfo = PAYMENT_STATUSES.find((s) => s.value === payment.status);
  const methodInfo = PAYMENT_METHODS.find((m) => m.value === payment.paymentMethod);

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Paiement" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Montant principal */}
        <Card style={styles.amountCard}>
          <Card.Content style={styles.amountContent}>
            <Text style={styles.amountLabel}>Montant</Text>
            <Text style={styles.amountValue}>{formatAmount(payment.amount)}</Text>
            <Chip
              compact
              style={{ backgroundColor: (statusInfo?.color || '#9E9E9E') + '22', alignSelf: 'center', marginTop: 8 }}
              textStyle={{ color: statusInfo?.color || '#9E9E9E', fontWeight: '600' }}
            >
              {statusInfo?.label || payment.status}
            </Chip>
          </Card.Content>
        </Card>

        {/* Informations */}
        <Card style={styles.card}>
          <Card.Title title="Informations" />
          <Card.Content>
            <InfoRow label="N° Paiement" value={payment.paymentNumber} />
            <Divider style={styles.divider} />
            {payment.accountName ? (
              <InfoRow label="Compte" value={payment.accountName} />
            ) : null}
            <InfoRow label="Date" value={formatDate(payment.paymentDate)} />
            <View style={styles.methodRow}>
              <Text style={styles.infoLabel}>Méthode</Text>
              <View style={styles.methodValue}>
                <Icon source={methodInfo?.icon || 'cash'} size={16} color="#1976D2" />
                <Text style={styles.methodText}>{methodInfo?.label || payment.paymentMethod}</Text>
              </View>
            </View>
            {payment.reference ? (
              <InfoRow label="Référence" value={payment.reference} />
            ) : null}
            {payment.bankAccount ? (
              <InfoRow label="Compte bancaire" value={payment.bankAccount} />
            ) : null}
          </Card.Content>
        </Card>

        {/* Allocations */}
        {(payment.allocatedAmount != null || payment.unallocatedAmount != null) && (
          <Card style={styles.card}>
            <Card.Title title="Allocations" />
            <Card.Content>
              {payment.allocatedAmount != null && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Montant alloué</Text>
                  <Text style={[styles.infoValue, { color: '#4CAF50', fontWeight: '600' }]}>
                    {formatAmount(payment.allocatedAmount)}
                  </Text>
                </View>
              )}
              {payment.unallocatedAmount != null && payment.unallocatedAmount > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Non alloué</Text>
                  <Text style={[styles.infoValue, { color: '#FF9800', fontWeight: '600' }]}>
                    {formatAmount(payment.unallocatedAmount)}
                  </Text>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        {payment.notes ? (
          <Card style={styles.card}>
            <Card.Title title="Notes" />
            <Card.Content>
              <Text style={styles.notesText}>{payment.notes}</Text>
            </Card.Content>
          </Card>
        ) : null}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#FFFFFF', elevation: 2 },
  scroll: { padding: 12 },
  amountCard: { marginBottom: 12, elevation: 3, backgroundColor: '#1976D2' },
  amountContent: { alignItems: 'center', paddingVertical: 20 },
  amountLabel: { fontSize: 13, color: '#BBDEFB', marginBottom: 4 },
  amountValue: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  card: { marginBottom: 12, elevation: 2 },
  divider: { marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  infoLabel: { fontSize: 13, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 13, color: '#212121', flex: 1.5, textAlign: 'right', fontWeight: '500' },
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 5 },
  methodValue: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  methodText: { fontSize: 13, color: '#212121', fontWeight: '500' },
  notesText: { fontSize: 14, color: '#212121', lineHeight: 20 },
  bottomPadding: { height: 24 },
});
