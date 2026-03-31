import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { TextInput, Button, Snackbar, Menu } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateOpportunity, useOpportunityStages } from '../../../src/hooks/useOpportunities';
import { useSearchAccounts } from '../../../src/hooks/useAccounts';
import { handleApiError } from '../../../src/api/client';

export default function CreateOpportunityScreen() {
  const router = useRouter();
  const createMutation = useCreateOpportunity();
  const { data: stages } = useOpportunityStages();

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [stageId, setStageId] = useState('');
  const [stageName, setStageName] = useState('');
  const [accountId, setAccountId] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [stageMenuVisible, setStageMenuVisible] = useState(false);
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);

  const { data: accountResults } = useSearchAccounts(accountSearch);

  const handleSubmit = async () => {
    if (!name.trim() || !stageId || !accountId) {
      setError('Nom, etape et compte sont obligatoires');
      return;
    }
    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        amount: amount ? parseFloat(amount) : undefined,
        stageId,
        accountId,
        closeDate: closeDate.trim() || undefined,
        description: description.trim() || undefined,
      });
      router.back();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextInput label="Nom de l'opportunite *" value={name} onChangeText={setName} mode="outlined" style={styles.input} />
        <TextInput label="Montant (MAD)" value={amount} onChangeText={setAmount} mode="outlined" style={styles.input} keyboardType="numeric" />

        {/* Stage Picker */}
        <Menu
          visible={stageMenuVisible}
          onDismiss={() => setStageMenuVisible(false)}
          anchor={
            <TextInput
              label="Etape *"
              value={stageName}
              mode="outlined"
              style={styles.input}
              editable={false}
              right={<TextInput.Icon icon="chevron-down" onPress={() => setStageMenuVisible(true)} />}
              onPressIn={() => setStageMenuVisible(true)}
            />
          }
        >
          {(stages || []).map((s) => (
            <Menu.Item
              key={s.id}
              title={s.name}
              onPress={() => {
                setStageId(s.id);
                setStageName(s.name);
                setStageMenuVisible(false);
              }}
            />
          ))}
        </Menu>

        {/* Account Picker */}
        <TextInput
          label="Compte *"
          value={accountSearch}
          onChangeText={(text) => {
            setAccountSearch(text);
            setAccountMenuVisible(true);
          }}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Icon icon="magnify" />}
        />
        {accountMenuVisible && accountResults && accountResults.length > 0 && (
          <View style={styles.suggestions}>
            {accountResults.slice(0, 5).map((acc) => (
              <Menu.Item
                key={acc.id}
                title={acc.name}
                onPress={() => {
                  setAccountId(acc.id);
                  setAccountSearch(acc.name);
                  setAccountMenuVisible(false);
                }}
              />
            ))}
          </View>
        )}

        <TextInput label="Date de cloture (AAAA-MM-JJ)" value={closeDate} onChangeText={setCloseDate} mode="outlined" style={styles.input} />
        <TextInput label="Description" value={description} onChangeText={setDescription} mode="outlined" style={styles.input} multiline numberOfLines={3} />

        <Button mode="contained" onPress={handleSubmit} loading={createMutation.isPending} disabled={createMutation.isPending} style={styles.button} contentStyle={styles.buttonContent}>
          Creer l'opportunite
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
  suggestions: { backgroundColor: '#FFFFFF', borderRadius: 8, elevation: 3, marginBottom: 12, marginTop: -8 },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: '#9C27B0' },
  buttonContent: { height: 48 },
});
