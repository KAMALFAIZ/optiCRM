import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Text, Card, Chip, Appbar, Divider, ProgressBar } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useInvoice } from '../../../src/hooks/useInvoices';
import { INVOICE_STATUSES } from '../../../src/api/invoices';
import type { InvoiceLineItem } from '../../../src/api/invoices';
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

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: invoice, isLoading, isError, refetch } = useInvoice(id!);

  if (isLoading) return <LoadingScreen />;
  if (isError || !invoice) return <ErrorView onRetry={refetch} />;

  const statusInfo = INVOICE_STATUSES.find((s) => s.value === invoice.status);
  const isPartiallyPaid = invoice.status === 'PARTIALLY_PAID';
  const progress = isPartiallyPaid && invoice.total > 0
    ? Math.min((invoice.amountPaid || 0) / invoice.total, 1)
    : 0;
  const amountDue = invoice.amountDue ?? (invoice.total - (invoice.amountPaid || 0));

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Facture" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Infos principales */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
              <Chip
                compact
                style={{ backgroundColor: (statusInfo?.color || '#9E9E9E') + '22' }}
                textStyle={{ color: statusInfo?.color || '#9E9E9E', fontWeight: '600' }}
              >
                {statusInfo?.label || invoice.status}
              </Chip>
            </View>
            {invoice.accountName ? (
              <Text style={styles.accountName}>{invoice.accountName}</Text>
            ) : null}
            <Divider style={styles.divider} />
            <InfoRow label="Date de facturation" value={formatDate(invoice.invoiceDate)} />
            {invoice.dueDate ? (
              <InfoRow label="Date d'échéance" value={formatDate(invoice.dueDate)} />
            ) : null}
          </Card.Content>
        </Card>

        {/* Montants */}
        <Card style={styles.card}>
          <Card.Title title="Montants" />
          <Card.Content>
            {invoice.subtotal != null && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Sous-total</Text>
                <Text style={styles.infoValue}>{formatAmount(invoice.subtotal)}</Text>
              </View>
            )}
            {invoice.discount != null && invoice.discount > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Remise</Text>
                <Text style={[styles.infoValue, { color: '#F44336' }]}>
                  -{formatAmount(invoice.discount)}
                </Text>
              </View>
            )}
            {invoice.tax != null && invoice.tax > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>TVA</Text>
                <Text style={styles.infoValue}>{formatAmount(invoice.tax)}</Text>
              </View>
            )}
            <Divider style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatAmount(invoice.total)}</Text>
            </View>

            {invoice.amountPaid != null && invoice.amountPaid > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Montant payé</Text>
                <Text style={[styles.infoValue, { color: '#4CAF50', fontWeight: '600' }]}>
                  {formatAmount(invoice.amountPaid)}
                </Text>
              </View>
            )}

            {amountDue > 0 && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Montant dû</Text>
                <Text style={[styles.infoValue, { color: '#F44336', fontWeight: '700', fontSize: 15 }]}>
                  {formatAmount(amountDue)}
                </Text>
              </View>
            )}

            {isPartiallyPaid && (
              <View style={styles.progressContainer}>
                <View style={styles.progressHeader}>
                  <Text style={styles.progressLabel}>Avancement du paiement</Text>
                  <Text style={styles.progressPercent}>{Math.round(progress * 100)}%</Text>
                </View>
                <ProgressBar progress={progress} color="#00BCD4" style={styles.progressBar} />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Lignes de facture */}
        {invoice.lineItems && invoice.lineItems.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Lignes de facture" />
            <Card.Content>
              {invoice.lineItems.map((line: InvoiceLineItem, index: number) => (
                <View key={line.id || index}>
                  {index > 0 && <Divider style={styles.lineDivider} />}
                  <View style={styles.lineItem}>
                    <View style={styles.lineInfo}>
                      <Text style={styles.lineName}>{line.name}</Text>
                      {line.description ? (
                        <Text style={styles.lineDesc}>{line.description}</Text>
                      ) : null}
                      <Text style={styles.lineCalc}>
                        {line.quantity} × {formatAmount(line.unitPrice)}
                      </Text>
                    </View>
                    <Text style={styles.lineTotal}>{formatAmount(line.total)}</Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Notes */}
        {invoice.notes && (
          <Card style={styles.card}>
            <Card.Title title="Notes" />
            <Card.Content>
              <Text style={styles.bodyText}>{invoice.notes}</Text>
            </Card.Content>
          </Card>
        )}

        <View style={styles.readOnlyBanner}>
          <Text style={styles.readOnlyText}>Consultation uniquement — les factures ne sont pas modifiables sur mobile</Text>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#FFFFFF', elevation: 2 },
  scroll: { padding: 12 },
  card: { marginBottom: 12, elevation: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  invoiceNumber: { fontSize: 18, fontWeight: '700', color: '#212121', flex: 1 },
  accountName: { fontSize: 15, color: '#1976D2', marginTop: 6 },
  divider: { marginVertical: 10 },
  lineDivider: { marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  infoLabel: { fontSize: 13, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 13, color: '#212121', flex: 1.5, textAlign: 'right', fontWeight: '500' },
  grandTotalLabel: { fontSize: 16, fontWeight: '700', color: '#212121' },
  grandTotalValue: { fontSize: 16, fontWeight: '700', color: '#1976D2' },
  progressContainer: { marginTop: 12 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { fontSize: 12, color: '#607D8B' },
  progressPercent: { fontSize: 12, color: '#00BCD4', fontWeight: '600' },
  progressBar: { height: 8, borderRadius: 4 },
  lineItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  lineInfo: { flex: 1, marginRight: 12 },
  lineName: { fontSize: 14, fontWeight: '600', color: '#212121' },
  lineDesc: { fontSize: 12, color: '#607D8B', marginTop: 2 },
  lineCalc: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  lineTotal: { fontSize: 14, fontWeight: '600', color: '#1976D2' },
  bodyText: { fontSize: 14, color: '#212121', lineHeight: 20 },
  readOnlyBanner: { backgroundColor: '#FFF9C4', borderRadius: 8, padding: 12, marginBottom: 12 },
  readOnlyText: { fontSize: 12, color: '#795548', textAlign: 'center' },
  bottomPadding: { height: 24 },
});
