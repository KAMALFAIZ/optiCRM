import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { Text, Card, Chip, Button, Appbar, Divider, Menu, ActivityIndicator } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuote, useUpdateQuoteStatus, useDuplicateQuote } from '../../../src/hooks/useQuotes';
import { QUOTE_STATUSES } from '../../../src/api/quotes';
import type { QuoteLineItem } from '../../../src/api/quotes';
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

export default function QuoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: quote, isLoading, isError, refetch } = useQuote(id!);
  const updateStatusMutation = useUpdateQuoteStatus();
  const duplicateMutation = useDuplicateQuote();
  const [menuVisible, setMenuVisible] = useState(false);

  if (isLoading) return <LoadingScreen />;
  if (isError || !quote) return <ErrorView onRetry={refetch} />;

  const statusInfo = QUOTE_STATUSES.find((s) => s.value === quote.status);

  const handleUpdateStatus = async (status: typeof quote.status) => {
    try {
      await updateStatusMutation.mutateAsync({ id: id!, status });
      refetch();
    } catch {
      Alert.alert('Erreur', 'Impossible de mettre à jour le statut');
    }
  };

  const handleDuplicate = async () => {
    setMenuVisible(false);
    try {
      const newQuote = await duplicateMutation.mutateAsync(id!);
      Alert.alert('Succès', 'Devis dupliqué avec succès', [
        { text: 'Voir', onPress: () => router.push(`/(tabs)/quotes/${newQuote.id}`) },
        { text: 'OK' },
      ]);
    } catch {
      Alert.alert('Erreur', 'Impossible de dupliquer le devis');
    }
  };

  const isBusy = updateStatusMutation.isPending || duplicateMutation.isPending;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Devis" />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action icon="dots-vertical" onPress={() => setMenuVisible(true)} />
          }
        >
          <Menu.Item
            onPress={handleDuplicate}
            title="Dupliquer"
            leadingIcon="content-copy"
          />
        </Menu>
      </Appbar.Header>

      {isBusy && (
        <View style={styles.busyBar}>
          <ActivityIndicator size="small" color="#1976D2" />
          <Text style={styles.busyText}>Mise à jour...</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scroll}>

        {/* Infos principales */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.quoteName}>{quote.name}</Text>
            {quote.accountName ? (
              <Text style={styles.accountName}>{quote.accountName}</Text>
            ) : null}
            <View style={styles.chipRow}>
              <Chip
                compact
                style={{ backgroundColor: (statusInfo?.color || '#9E9E9E') + '22' }}
                textStyle={{ color: statusInfo?.color || '#9E9E9E', fontWeight: '600' }}
              >
                {statusInfo?.label || quote.status}
              </Chip>
            </View>
            <Divider style={styles.divider} />
            <InfoRow label="N° Devis" value={quote.quoteNumber} />
            <InfoRow label="Date" value={formatDate(quote.quoteDate)} />
            <InfoRow label="Valide jusqu'au" value={formatDate(quote.validUntil)} />
            {quote.contactName ? (
              <InfoRow label="Contact" value={quote.contactName} />
            ) : null}
            {quote.assignedToName ? (
              <InfoRow label="Assigné à" value={quote.assignedToName} />
            ) : null}
          </Card.Content>
        </Card>

        {/* Lignes de devis */}
        {quote.lineItems && quote.lineItems.length > 0 && (
          <Card style={styles.card}>
            <Card.Title title="Lignes de devis" />
            <Card.Content>
              {quote.lineItems.map((line: QuoteLineItem, index: number) => (
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

        {/* Totaux */}
        <Card style={styles.card}>
          <Card.Title title="Totaux" />
          <Card.Content>
            {quote.subtotal != null && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Sous-total</Text>
                <Text style={styles.totalValue}>{formatAmount(quote.subtotal)}</Text>
              </View>
            )}
            {quote.discount != null && quote.discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Remise</Text>
                <Text style={[styles.totalValue, { color: '#F44336' }]}>
                  -{formatAmount(quote.discount)}
                </Text>
              </View>
            )}
            {quote.tax != null && quote.tax > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>TVA</Text>
                <Text style={styles.totalValue}>{formatAmount(quote.tax)}</Text>
              </View>
            )}
            <Divider style={styles.divider} />
            <View style={styles.totalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>{formatAmount(quote.total)}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Notes et Conditions */}
        {(quote.notes || quote.terms) && (
          <Card style={styles.card}>
            <Card.Title title="Notes & Conditions" />
            <Card.Content>
              {quote.notes ? (
                <>
                  <Text style={styles.sectionSubtitle}>Notes</Text>
                  <Text style={styles.bodyText}>{quote.notes}</Text>
                </>
              ) : null}
              {quote.terms ? (
                <>
                  {quote.notes && <Divider style={styles.divider} />}
                  <Text style={styles.sectionSubtitle}>Conditions</Text>
                  <Text style={styles.bodyText}>{quote.terms}</Text>
                </>
              ) : null}
            </Card.Content>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actionsContainer}>
          {quote.status === 'DRAFT' && (
            <Button
              mode="contained"
              icon="send-outline"
              onPress={() => handleUpdateStatus('SENT')}
              loading={updateStatusMutation.isPending}
              disabled={isBusy}
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              contentStyle={styles.buttonContent}
            >
              Envoyer
            </Button>
          )}
          {(quote.status === 'SENT' || quote.status === 'VIEWED') && (
            <View style={styles.actionRow}>
              <Button
                mode="contained"
                icon="check-circle-outline"
                onPress={() => handleUpdateStatus('ACCEPTED')}
                loading={updateStatusMutation.isPending}
                disabled={isBusy}
                style={[styles.actionButton, styles.halfButton, { backgroundColor: '#4CAF50' }]}
                contentStyle={styles.buttonContent}
              >
                Accepter
              </Button>
              <Button
                mode="contained"
                icon="close-circle-outline"
                onPress={() => {
                  Alert.alert('Confirmer', 'Refuser ce devis ?', [
                    { text: 'Annuler', style: 'cancel' },
                    { text: 'Refuser', style: 'destructive', onPress: () => handleUpdateStatus('REJECTED') },
                  ]);
                }}
                disabled={isBusy}
                style={[styles.actionButton, styles.halfButton, { backgroundColor: '#F44336' }]}
                contentStyle={styles.buttonContent}
              >
                Refuser
              </Button>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  appbar: { backgroundColor: '#FFFFFF', elevation: 2 },
  busyBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', padding: 8, paddingHorizontal: 16, gap: 8 },
  busyText: { fontSize: 13, color: '#1976D2' },
  scroll: { padding: 12 },
  card: { marginBottom: 12, elevation: 2 },
  quoteName: { fontSize: 20, fontWeight: '700', color: '#212121' },
  accountName: { fontSize: 15, color: '#1976D2', marginTop: 4 },
  chipRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  divider: { marginVertical: 10 },
  lineDivider: { marginVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  infoLabel: { fontSize: 13, color: '#607D8B', flex: 1 },
  infoValue: { fontSize: 13, color: '#212121', flex: 1.5, textAlign: 'right', fontWeight: '500' },
  lineItem: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  lineInfo: { flex: 1, marginRight: 12 },
  lineName: { fontSize: 14, fontWeight: '600', color: '#212121' },
  lineDesc: { fontSize: 12, color: '#607D8B', marginTop: 2 },
  lineCalc: { fontSize: 12, color: '#9E9E9E', marginTop: 2 },
  lineTotal: { fontSize: 14, fontWeight: '600', color: '#1976D2' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  totalLabel: { fontSize: 14, color: '#607D8B' },
  totalValue: { fontSize: 14, color: '#212121', fontWeight: '500' },
  grandTotalLabel: { fontSize: 17, fontWeight: '700', color: '#212121' },
  grandTotalValue: { fontSize: 17, fontWeight: '700', color: '#1976D2' },
  sectionSubtitle: { fontSize: 13, fontWeight: '600', color: '#607D8B', marginBottom: 4 },
  bodyText: { fontSize: 14, color: '#212121', lineHeight: 20 },
  actionsContainer: { marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 12 },
  actionButton: { borderRadius: 8, marginBottom: 8 },
  halfButton: { flex: 1 },
  buttonContent: { height: 48 },
  bottomPadding: { height: 24 },
});
