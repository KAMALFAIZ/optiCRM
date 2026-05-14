import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { TextInput, Button, Chip, Text, Appbar, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import toursApi from '../../../src/api/tours';
import { useAuthStore } from '../../../src/stores/authStore';

const VEHICLE_TYPES = [
  { value: 'Voiture', label: 'Voiture' },
  { value: 'Camionnette', label: 'Camionnette' },
  { value: 'Moto', label: 'Moto' },
  { value: 'Camion', label: 'Camion' },
];

export default function CreateTourScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tourDate, setTourDate] = useState(new Date().toISOString().split('T')[0]);
  const [region, setRegion] = useState('');
  const [objective, setObjective] = useState('');
  const [vehicleType, setVehicleType] = useState('');
  const [startAddress, setStartAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Validation', 'Le nom de la tournée est obligatoire.');
      return;
    }
    if (!tourDate.trim()) {
      Alert.alert('Validation', 'La date est obligatoire.');
      return;
    }

    setIsLoading(true);
    try {
      await toursApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        tourDate: tourDate.trim(),
        region: region.trim() || undefined,
        objective: objective.trim() || undefined,
        vehicleType: vehicleType || undefined,
        startAddress: startAddress.trim() || undefined,
        assignedToId: user?.id,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de créer la tournée.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.appbar}>
        <Appbar.BackAction onPress={() => router.back()} color="#FFFFFF" />
        <Appbar.Content title="Nouvelle tournée" titleStyle={styles.appbarTitle} />
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text variant="titleSmall" style={styles.sectionTitle}>Informations générales</Text>

        <TextInput
          label="Nom de la tournée *"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
        />

        <TextInput
          label="Date de la tournée * (AAAA-MM-JJ)"
          value={tourDate}
          onChangeText={setTourDate}
          mode="outlined"
          style={styles.input}
          placeholder="AAAA-MM-JJ"
        />

        <TextInput
          label="Région"
          value={region}
          onChangeText={setRegion}
          mode="outlined"
          style={styles.input}
        />

        <TextInput
          label="Objectif"
          value={objective}
          onChangeText={setObjective}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={2}
        />

        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>Transport</Text>

        <Text variant="bodySmall" style={styles.label}>Type de véhicule</Text>
        <View style={styles.chipRow}>
          {VEHICLE_TYPES.map((v) => (
            <Chip
              key={v.value}
              selected={vehicleType === v.value}
              onPress={() => setVehicleType(vehicleType === v.value ? '' : v.value)}
              style={[styles.chip, vehicleType === v.value && { backgroundColor: '#1976D220' }]}
              selectedColor="#1976D2"
              compact
            >
              {v.label}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Adresse de départ"
          value={startAddress}
          onChangeText={setStartAddress}
          mode="outlined"
          style={styles.input}
        />

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={isLoading}
          disabled={isLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Enregistrer
        </Button>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  appbar: { backgroundColor: '#1976D2' },
  appbarTitle: { color: '#FFFFFF', fontWeight: '600' },
  scroll: { padding: 16, paddingBottom: 40 },
  sectionTitle: { color: '#1976D2', fontWeight: '600', marginBottom: 12 },
  label: { color: '#666', marginBottom: 6, marginTop: 4 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  divider: { marginVertical: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: { backgroundColor: '#F5F5F5' },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: '#1976D2' },
  buttonContent: { height: 48 },
});
