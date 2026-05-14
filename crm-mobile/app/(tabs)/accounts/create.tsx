import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Snackbar, SegmentedButtons } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateAccount } from '../../../src/hooks/useAccounts';
import { ACCOUNT_TYPES } from '../../../src/types/account';
import { handleApiError } from '../../../src/api/client';
import { useAuthStore } from '../../../src/stores/authStore';

export default function CreateAccountScreen() {
  const router = useRouter();
  const createMutation = useCreateAccount();
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState('Prospect');
  const [phone, setPhone] = useState('');
  const [billingCity, setBillingCity] = useState('');
  const [billingStreet, setBillingStreet] = useState('');
  const [website, setWebsite] = useState('');
  const [ice, setIce] = useState('');
  const [identifiantFiscal, setIdentifiantFiscal] = useState('');
  const [rc, setRc] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Le nom est obligatoire');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        accountType,
        phone: phone.trim() || undefined,
        billingCity: billingCity.trim() || undefined,
        billingStreet: billingStreet.trim() || undefined,
        website: website.trim() || undefined,
        ice: ice.trim() || undefined,
        identifiantFiscal: identifiantFiscal.trim() || undefined,
        rc: rc.trim() || undefined,
        assignedToId: user?.id,
      });
      router.back();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextInput
          label="Nom du compte *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <SegmentedButtons
          value={accountType}
          onValueChange={setAccountType}
          buttons={ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          style={styles.segment}
        />

        <TextInput label="Telephone" value={phone} onChangeText={setPhone} mode="outlined" style={styles.input} keyboardType="phone-pad" />
        <TextInput label="Ville" value={billingCity} onChangeText={setBillingCity} mode="outlined" style={styles.input} />
        <TextInput label="Adresse" value={billingStreet} onChangeText={setBillingStreet} mode="outlined" style={styles.input} />
        <TextInput label="Site web" value={website} onChangeText={setWebsite} mode="outlined" style={styles.input} keyboardType="url" autoCapitalize="none" />
        <TextInput label="ICE" value={ice} onChangeText={setIce} mode="outlined" style={styles.input} />
        <TextInput label="Identifiant Fiscal" value={identifiantFiscal} onChangeText={setIdentifiantFiscal} mode="outlined" style={styles.input} />
        <TextInput label="RC" value={rc} onChangeText={setRc} mode="outlined" style={styles.input} />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Creer le compte
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
  scroll: { padding: 16, paddingBottom: 32 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  segment: { marginBottom: 16 },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: '#1976D2' },
  buttonContent: { height: 48 },
});
