import React, { useState, useCallback } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Snackbar, Text, Divider, Appbar, Card, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateQuote } from '../../../src/hooks/useQuotes';
import { useAuthStore } from '../../../src/stores/authStore';
import { handleApiError } from '../../../src/api/client';

interface LineItem {
  name: string;
  quantity: string;
  unitPrice: string;
}

const formatAmount = (n?: number) =>
  n != null ? n.toLocaleString('fr-MA', { minimumFractionDigits: 2 }) + ' MAD' : '—';

export default function CreateQuoteScreen() {
  const router = useRouter();
  const createMutation = useCreateQuote();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [quoteDate, setQuoteDate] = useState(new Date().toISOString().split('T')[0]);
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [error, setError] = useState('');

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [...prev, { name: '', quantity: '1', unitPrice: '0' }]);
  }, []);

  const removeLineItem = useCallback((index: number) => {
    setLineItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateLineItem = useCallback((index: number, field: keyof LineItem, value: string) => {
    setLineItems((prev) => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }, []);

  const computeTotal = () => {
    return lineItems.reduce((sum, item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      return sum + qty * price;
    }, 0);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !quoteDate.trim()) {
      setError('Le nom et la date sont obligatoires');
      return;
    }
    try {
      const parsedLines = lineItems
        .filter((l) => l.name.trim())
        .map((l) => ({
          name: l.name.trim(),
          quantity: parseFloat(l.quantity) || 1,
          unitPrice: parseFloat(l.unitPrice) || 0,
        }));

      await createMutation.mutateAsync({
        name: name.trim(),
        quoteDate,
        validUntil: validUntil.trim() || undefined,
        notes: notes.trim() || undefined,
        assignedToId: user?.id,
        lineItems: parsedLines.length > 0 ? parsedLines : undefined,
      });
      router.back();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const total = computeTotal();

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Nouveau devis" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text variant="titleSmall" style={styles.sectionTitle}>Informations</Text>

        <TextInput
          label="Nom du devis *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Date du devis * (AAAA-MM-JJ)"
          value={quoteDate}
          onChangeText={setQuoteDate}
          mode="outlined"
          style={styles.input}
          placeholder="AAAA-MM-JJ"
        />
        <TextInput
          label="Valide jusqu'au (AAAA-MM-JJ)"
          value={validUntil}
          onChangeText={setValidUntil}
          mode="outlined"
          style={styles.input}
          placeholder="AAAA-MM-JJ"
        />
        <TextInput
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
        />

        <Divider style={styles.divider} />

        <View style={styles.lineHeader}>
          <Text variant="titleSmall" style={styles.sectionTitle}>Lignes de devis</Text>
          <Button
            mode="outlined"
            icon="plus"
            onPress={addLineItem}
            compact
            style={styles.addLineButton}
          >
            Ajouter une ligne
          </Button>
        </View>

        {lineItems.length === 0 && (
          <Text style={styles.emptyLines}>Aucune ligne. Appuyez sur "Ajouter une ligne".</Text>
        )}

        {lineItems.map((item, index) => {
          const lineTotal = (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0);
          return (
            <Card key={index} style={styles.lineCard}>
              <Card.Content>
                <View style={styles.lineCardHeader}>
                  <Text style={styles.lineCardTitle}>Ligne {index + 1}</Text>
                  <IconButton
                    icon="delete-outline"
                    size={18}
                    iconColor="#F44336"
                    onPress={() => removeLineItem(index)}
                  />
                </View>
                <TextInput
                  label="Description *"
                  value={item.name}
                  onChangeText={(v) => updateLineItem(index, 'name', v)}
                  mode="outlined"
                  style={styles.lineInput}
                  dense
                />
                <View style={styles.lineRow}>
                  <TextInput
                    label="Quantité"
                    value={item.quantity}
                    onChangeText={(v) => updateLineItem(index, 'quantity', v)}
                    mode="outlined"
                    style={[styles.lineInput, styles.halfInput]}
                    keyboardType="numeric"
                    dense
                  />
                  <TextInput
                    label="Prix unitaire"
                    value={item.unitPrice}
                    onChangeText={(v) => updateLineItem(index, 'unitPrice', v)}
                    mode="outlined"
                    style={[styles.lineInput, styles.halfInput]}
                    keyboardType="numeric"
                    dense
                  />
                </View>
                <Text style={styles.lineTotal}>
                  Total ligne : {formatAmount(lineTotal)}
                </Text>
              </Card.Content>
            </Card>
          );
        })}

        {lineItems.length > 0 && (
          <Card style={[styles.lineCard, styles.totalCard]}>
            <Card.Content>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total calculé</Text>
                <Text style={styles.totalValue}>{formatAmount(total)}</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          style={styles.submitButton}
          contentStyle={styles.submitContent}
        >
          Enregistrer
        </Button>
      </ScrollView>

      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}>
        {error}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  appbar: { backgroundColor: '#FFFFFF', elevation: 2 },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#1976D2', fontWeight: '600', marginBottom: 12 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  divider: { marginVertical: 16 },
  lineHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  addLineButton: { borderColor: '#1976D2' },
  emptyLines: { fontSize: 13, color: '#9E9E9E', textAlign: 'center', marginVertical: 16 },
  lineCard: { marginBottom: 12, elevation: 1, backgroundColor: '#FAFAFA' },
  lineCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  lineCardTitle: { fontSize: 13, fontWeight: '600', color: '#607D8B' },
  lineInput: { marginBottom: 8, backgroundColor: '#FFFFFF' },
  lineRow: { flexDirection: 'row', gap: 8 },
  halfInput: { flex: 1 },
  lineTotal: { fontSize: 13, color: '#1976D2', fontWeight: '600', textAlign: 'right', marginTop: 4 },
  totalCard: { backgroundColor: '#E3F2FD' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#212121' },
  totalValue: { fontSize: 18, fontWeight: '700', color: '#1976D2' },
  submitButton: { marginTop: 16, borderRadius: 8, backgroundColor: '#1976D2' },
  submitContent: { height: 48 },
});
