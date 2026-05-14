import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Snackbar, Text, Divider, Appbar, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreatePayment } from '../../../src/hooks/usePayments';
import { PAYMENT_METHODS } from '../../../src/api/payments';
import type { PaymentMethod } from '../../../src/api/payments';
import { handleApiError } from '../../../src/api/client';

export default function CreatePaymentScreen() {
  const router = useRouter();
  const createMutation = useCreatePayment();

  const [accountId, setAccountId] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('MAD');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!accountId.trim()) {
      setError('Le compte est obligatoire');
      return;
    }
    if (!paymentDate.trim()) {
      setError('La date est obligatoire');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!amount.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Le montant doit être supérieur à zéro');
      return;
    }
    try {
      await createMutation.mutateAsync({
        accountId: accountId.trim(),
        paymentDate,
        amount: parsedAmount,
        currency: currency.trim() || 'MAD',
        paymentMethod,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Nouveau paiement" />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        <Text variant="titleSmall" style={styles.sectionTitle}>Informations</Text>

        <TextInput
          label="Compte *"
          value={accountId}
          onChangeText={setAccountId}
          mode="outlined"
          style={styles.input}
          placeholder="Identifiant ou nom du compte"
        />
        <TextInput
          label="Date du paiement * (AAAA-MM-JJ)"
          value={paymentDate}
          onChangeText={setPaymentDate}
          mode="outlined"
          style={styles.input}
          placeholder="AAAA-MM-JJ"
        />

        <View style={styles.row}>
          <TextInput
            label="Montant *"
            value={amount}
            onChangeText={setAmount}
            mode="outlined"
            style={[styles.input, styles.flexTwo]}
            keyboardType="numeric"
          />
          <TextInput
            label="Devise"
            value={currency}
            onChangeText={setCurrency}
            mode="outlined"
            style={[styles.input, styles.flexOne]}
          />
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>Méthode de paiement</Text>
        <View style={styles.methodChips}>
          {PAYMENT_METHODS.map((m) => (
            <Chip
              key={m.value}
              selected={paymentMethod === m.value}
              onPress={() => setPaymentMethod(m.value)}
              icon={m.icon}
              style={[
                styles.methodChip,
                paymentMethod === m.value && { backgroundColor: '#1976D222' },
              ]}
              selectedColor="#1976D2"
              compact
            >
              {m.label}
            </Chip>
          ))}
        </View>

        <Divider style={styles.divider} />

        <Text variant="titleSmall" style={styles.sectionTitle}>Informations complémentaires</Text>

        <TextInput
          label="Référence"
          value={reference}
          onChangeText={setReference}
          mode="outlined"
          style={styles.input}
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
  row: { flexDirection: 'row', gap: 12 },
  flexTwo: { flex: 2 },
  flexOne: { flex: 1 },
  divider: { marginVertical: 16 },
  methodChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  methodChip: { backgroundColor: '#F5F5F5' },
  submitButton: { marginTop: 16, borderRadius: 8, backgroundColor: '#1976D2' },
  submitContent: { height: 48 },
});
