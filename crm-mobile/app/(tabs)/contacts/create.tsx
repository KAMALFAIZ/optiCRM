import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Snackbar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateContact } from '../../../src/hooks/useContacts';
import { handleApiError } from '../../../src/api/client';

export default function CreateContactScreen() {
  const router = useRouter();
  const createMutation = useCreateContact();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneMobile, setPhoneMobile] = useState('');
  const [phoneOffice, setPhoneOffice] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      setError('Le prenom et le nom sont obligatoires');
      return;
    }
    try {
      await createMutation.mutateAsync({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || undefined,
        phoneMobile: phoneMobile.trim() || undefined,
        phoneOffice: phoneOffice.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        department: department.trim() || undefined,
        addressCity: addressCity.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextInput label="Prenom *" value={firstName} onChangeText={setFirstName} mode="outlined" style={styles.input} />
        <TextInput label="Nom *" value={lastName} onChangeText={setLastName} mode="outlined" style={styles.input} />
        <TextInput label="Email" value={email} onChangeText={setEmail} mode="outlined" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <TextInput label="Tel. mobile" value={phoneMobile} onChangeText={setPhoneMobile} mode="outlined" style={styles.input} keyboardType="phone-pad" />
        <TextInput label="Tel. bureau" value={phoneOffice} onChangeText={setPhoneOffice} mode="outlined" style={styles.input} keyboardType="phone-pad" />
        <TextInput label="Fonction" value={jobTitle} onChangeText={setJobTitle} mode="outlined" style={styles.input} />
        <TextInput label="Departement" value={department} onChangeText={setDepartment} mode="outlined" style={styles.input} />
        <TextInput label="Ville" value={addressCity} onChangeText={setAddressCity} mode="outlined" style={styles.input} />

        <Button mode="contained" onPress={handleSubmit} loading={createMutation.isPending} disabled={createMutation.isPending} style={styles.button} contentStyle={styles.buttonContent}>
          Creer le contact
        </Button>
      </ScrollView>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}>{error}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 32 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: '#1976D2' },
  buttonContent: { height: 48 },
});
