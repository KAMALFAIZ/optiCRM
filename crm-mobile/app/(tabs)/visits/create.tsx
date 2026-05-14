import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  TextInput, Button, Snackbar, SegmentedButtons,
  Chip, Text, Divider, ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useCreateVisit } from '../../../src/hooks/useVisits';
import { useSearchAccounts } from '../../../src/hooks/useAccounts';
import { useSearchContacts } from '../../../src/hooks/useContacts';
import { VISIT_TYPES, VISIT_STATUSES, VISIT_OUTCOMES } from '../../../src/types/visit';
import { handleApiError } from '../../../src/api/client';
import { useAuthStore } from '../../../src/stores/authStore';
import { generateMeetingSummary, suggestFollowUps } from '../../../src/hooks/useAI';

const INTEREST_LEVELS = [
  { value: 'faible', label: 'Faible' },
  { value: 'moyen', label: 'Moyen' },
  { value: 'élevé', label: 'Élevé' },
];

const FOLLOW_UP_PRIORITIES = [
  { value: 'low', label: 'Basse' },
  { value: 'medium', label: 'Moyenne' },
  { value: 'high', label: 'Haute' },
];

const TRANSPORT_MODES = [
  { value: 'voiture', label: '🚗 Voiture' },
  { value: 'moto', label: '🏍️ Moto' },
  { value: 'transport', label: '🚌 TC' },
  { value: 'pied', label: '🚶 Pied' },
];

const SATISFACTION_LABELS = ['', '⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];

export default function CreateVisitScreen() {
  const router = useRouter();
  const createMutation = useCreateVisit();
  const { user } = useAuthStore();

  // ── Core ─────────────────────────────────────────────────────────────────
  const [visitType, setVisitType] = useState('suivi');
  const [status, setStatus] = useState('planned');
  const [subject, setSubject] = useState('');
  const [visitDate, setVisitDate] = useState('');

  // ── Compte + Contact ─────────────────────────────────────────────────────
  const [accountId, setAccountId] = useState('');
  const [accountSearch, setAccountSearch] = useState('');
  const [accountMenuVisible, setAccountMenuVisible] = useState(false);
  const [contactId, setContactId] = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [contactMenuVisible, setContactMenuVisible] = useState(false);

  // ── Localisation ─────────────────────────────────────────────────────────
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>();
  const [longitude, setLongitude] = useState<number | undefined>();

  // ── Objectif + Description ───────────────────────────────────────────────
  const [objective, setObjective] = useState('');
  const [description, setDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // ── Résultat ─────────────────────────────────────────────────────────────
  const [outcome, setOutcome] = useState('');
  const [interestLevel, setInterestLevel] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [competitorDetected, setCompetitorDetected] = useState('');
  const [productsPresented, setProductsPresented] = useState('');
  const [notes, setNotes] = useState('');

  // ── Suivi ────────────────────────────────────────────────────────────────
  const [nextAction, setNextAction] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState('');
  const [estimatedAmount, setEstimatedAmount] = useState('');
  const [nextVisitPlanned, setNextVisitPlanned] = useState('');

  // ── Transport (collapsible) ───────────────────────────────────────────────
  const [showMore, setShowMore] = useState(false);
  const [transportMode, setTransportMode] = useState('');
  const [mileage, setMileage] = useState('');
  const [expenses, setExpenses] = useState('');

  const [error, setError] = useState('');

  const { data: accountResults } = useSearchAccounts(accountSearch);
  const { data: contactResults } = useSearchContacts(contactSearch, accountId || undefined);

  useEffect(() => {
    (async () => {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLatitude(loc.coords.latitude);
        setLongitude(loc.coords.longitude);
      }
    })();
    setVisitDate(new Date().toISOString().split('T')[0]);
  }, []);

  // ── IA : résumé ──────────────────────────────────────────────────────────
  const handleAISummary = async () => {
    const ctx = [objective, description, notes].filter(Boolean).join('\n');
    if (!ctx.trim()) {
      Alert.alert('IA', 'Remplissez l\'objectif ou la description pour générer un résumé.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await generateMeetingSummary({
        notes: ctx,
        meetingType: visitType,
        accountName: accountSearch || undefined,
        date: visitDate || undefined,
      });
      setDescription(res);
    } catch {
      setError('Erreur IA — réessayez plus tard');
    } finally {
      setAiLoading(false);
    }
  };

  // ── IA : suivi ───────────────────────────────────────────────────────────
  const handleAISuggestFollowUp = async () => {
    const ctx = [objective, description, notes].filter(Boolean).join('\n');
    if (!ctx.trim() && !accountSearch.trim()) {
      Alert.alert('IA', 'Remplissez le compte ou l\'objectif pour obtenir des suggestions.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await suggestFollowUps({
        contactName: contactSearch || accountSearch || 'Client',
        company: accountSearch || undefined,
        lastInteraction: subject || visitType,
        lastInteractionDate: visitDate || undefined,
        notes: ctx || undefined,
      });
      setNextAction(res);
      if (!followUpDate) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setFollowUpDate(d.toISOString().split('T')[0]);
      }
    } catch {
      setError('Erreur IA — réessayez plus tard');
    } finally {
      setAiLoading(false);
    }
  };

  // ── Soumission ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!subject.trim() || !visitDate.trim()) {
      setError('Le sujet et la date sont obligatoires');
      return;
    }
    try {
      const toISO = (d: string) => d.trim()
        ? (d.includes('T') ? d : `${d}T00:00:00Z`)
        : undefined;

      await createMutation.mutateAsync({
        visitType,
        status: status || undefined,
        subject: subject.trim(),
        description: description.trim() || undefined,
        visitDate: toISO(visitDate)!,
        accountId: accountId || undefined,
        contactId: contactId || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        latitude,
        longitude,
        objective: objective.trim() || undefined,
        outcome: outcome || undefined,
        interestLevel: interestLevel || undefined,
        satisfaction: satisfaction > 0 ? satisfaction : undefined,
        competitorDetected: competitorDetected.trim() || undefined,
        productsPresented: productsPresented.trim() || undefined,
        notes: notes.trim() || undefined,
        nextAction: nextAction.trim() || undefined,
        followUpDate: toISO(followUpDate),
        followUpPriority: followUpPriority || undefined,
        estimatedAmount: estimatedAmount ? parseFloat(estimatedAmount) : undefined,
        nextVisitPlanned: nextVisitPlanned.trim() || undefined,
        transportMode: transportMode || undefined,
        mileage: mileage ? parseFloat(mileage) : undefined,
        expenses: expenses ? parseFloat(expenses) : undefined,
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

        {/* ── Type de visite ── */}
        <SegmentedButtons
          value={visitType}
          onValueChange={setVisitType}
          buttons={VISIT_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
          style={styles.segment}
          multiSelect={false}
        />

        {/* ── Statut ── */}
        <Text variant="bodySmall" style={styles.label}>Statut</Text>
        <View style={styles.chipRow}>
          {VISIT_STATUSES.map((s) => (
            <Chip
              key={s.value}
              selected={status === s.value}
              onPress={() => setStatus(s.value)}
              style={[styles.chip, status === s.value && { backgroundColor: s.color + '22' }]}
              selectedColor={s.color}
            >
              {s.label}
            </Chip>
          ))}
        </View>

        {/* ── Informations de base ── */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Informations</Text>

        <TextInput label="Sujet *" value={subject} onChangeText={setSubject} mode="outlined" style={styles.input} />

        {/* Compte */}
        <TextInput
          label="Compte"
          value={accountSearch}
          onChangeText={(t) => { setAccountSearch(t); setAccountMenuVisible(true); if (!t) { setAccountId(''); setContactId(''); setContactSearch(''); } }}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Icon icon="magnify" />}
        />
        {accountMenuVisible && accountResults && accountResults.length > 0 && (
          <View style={styles.suggestions}>
            {accountResults.slice(0, 5).map((acc) => (
              <Button key={acc.id} mode="text" onPress={() => { setAccountId(acc.id); setAccountSearch(acc.name); setAccountMenuVisible(false); }} style={styles.suggestionItem} contentStyle={styles.suggestionContent} labelStyle={styles.suggestionLabel}>
                {acc.name}
              </Button>
            ))}
          </View>
        )}

        {/* Contact (filtré par compte si sélectionné) */}
        <TextInput
          label="Contact"
          value={contactSearch}
          onChangeText={(t) => { setContactSearch(t); setContactMenuVisible(true); if (!t) setContactId(''); }}
          mode="outlined"
          style={styles.input}
          right={<TextInput.Icon icon="account-search-outline" />}
        />
        {contactMenuVisible && contactResults && contactResults.length > 0 && (
          <View style={styles.suggestions}>
            {contactResults.slice(0, 5).map((c) => (
              <Button key={c.id} mode="text" onPress={() => { setContactId(c.id); setContactSearch(`${c.firstName || ''} ${c.lastName}`.trim()); setContactMenuVisible(false); }} style={styles.suggestionItem} contentStyle={styles.suggestionContent} labelStyle={styles.suggestionLabel}>
                {`${c.firstName || ''} ${c.lastName}`.trim()}{c.accountName ? ` — ${c.accountName}` : ''}
              </Button>
            ))}
          </View>
        )}

        <TextInput label="Date de visite *" value={visitDate} onChangeText={setVisitDate} mode="outlined" style={styles.input} placeholder="AAAA-MM-JJ" />

        <View style={styles.row}>
          <TextInput label="Adresse" value={address} onChangeText={setAddress} mode="outlined" style={[styles.input, styles.twoThird]} />
          <TextInput label="Ville" value={city} onChangeText={setCity} mode="outlined" style={[styles.input, styles.oneThird]} />
        </View>

        <TextInput label="Objectif" value={objective} onChangeText={setObjective} mode="outlined" style={styles.input} />

        {/* ── Description + IA ── */}
        <TextInput
          label="Description / Résumé"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        <View style={styles.aiButtons}>
          <Button mode="outlined" icon="auto-fix" onPress={handleAISummary} disabled={aiLoading} style={styles.aiBtn} labelStyle={styles.aiBtnLabel}>
            Résumé IA
          </Button>
          <Button mode="outlined" icon="lightbulb-outline" onPress={handleAISuggestFollowUp} disabled={aiLoading} style={styles.aiBtn} labelStyle={styles.aiBtnLabel}>
            Suivi IA
          </Button>
          {aiLoading && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}
        </View>

        {/* GPS */}
        {latitude != null && longitude != null && (
          <TextInput label="GPS" value={`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`} mode="outlined" style={styles.input} disabled />
        )}

        {/* ── Résultat de la visite ── */}
        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>Résultat de la visite</Text>

        <Text variant="bodySmall" style={styles.label}>Issue</Text>
        <View style={styles.chipRow}>
          {VISIT_OUTCOMES.map((o) => (
            <Chip key={o.value} selected={outcome === o.value} onPress={() => setOutcome(outcome === o.value ? '' : o.value)} style={[styles.chip, outcome === o.value && { backgroundColor: o.color + '33' }]} selectedColor={o.color}>
              {o.label}
            </Chip>
          ))}
        </View>

        <Text variant="bodySmall" style={styles.label}>Niveau d'intérêt</Text>
        <View style={styles.chipRow}>
          {INTEREST_LEVELS.map((l) => (
            <Chip key={l.value} selected={interestLevel === l.value} onPress={() => setInterestLevel(interestLevel === l.value ? '' : l.value)} style={styles.chip}>
              {l.label}
            </Chip>
          ))}
        </View>

        {/* Satisfaction (étoiles simulées par chips) */}
        <Text variant="bodySmall" style={styles.label}>Satisfaction client</Text>
        <View style={styles.chipRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Chip
              key={star}
              selected={satisfaction >= star}
              onPress={() => setSatisfaction(satisfaction === star ? 0 : star)}
              style={[styles.chip, satisfaction >= star && { backgroundColor: '#FFC10722' }]}
              selectedColor="#FFC107"
            >
              {SATISFACTION_LABELS[star]}
            </Chip>
          ))}
        </View>

        <TextInput label="Concurrent détecté" value={competitorDetected} onChangeText={setCompetitorDetected} mode="outlined" style={styles.input} />
        <TextInput label="Produits présentés" value={productsPresented} onChangeText={setProductsPresented} mode="outlined" style={styles.input} multiline numberOfLines={2} />
        <TextInput label="Notes internes" value={notes} onChangeText={setNotes} mode="outlined" style={styles.input} multiline numberOfLines={2} />

        {/* ── Suivi & Actions ── */}
        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>Suivi & Actions</Text>

        <TextInput label="Prochaine action" value={nextAction} onChangeText={setNextAction} mode="outlined" style={styles.input} multiline numberOfLines={2} />
        <TextInput label="Date de suivi (AAAA-MM-JJ)" value={followUpDate} onChangeText={setFollowUpDate} mode="outlined" style={styles.input} placeholder="AAAA-MM-JJ" />

        <Text variant="bodySmall" style={styles.label}>Priorité du suivi</Text>
        <View style={styles.chipRow}>
          {FOLLOW_UP_PRIORITIES.map((p) => (
            <Chip key={p.value} selected={followUpPriority === p.value} onPress={() => setFollowUpPriority(followUpPriority === p.value ? '' : p.value)} style={styles.chip}>
              {p.label}
            </Chip>
          ))}
        </View>

        <TextInput label="Montant estimé (MAD)" value={estimatedAmount} onChangeText={setEstimatedAmount} mode="outlined" style={styles.input} keyboardType="numeric" />
        <TextInput label="Prochaine visite prévue (date)" value={nextVisitPlanned} onChangeText={setNextVisitPlanned} mode="outlined" style={styles.input} placeholder="AAAA-MM-JJ" />

        {/* ── Plus de champs : Transport ── */}
        <Button mode="text" icon={showMore ? 'chevron-up' : 'chevron-down'} onPress={() => setShowMore(!showMore)} style={styles.moreBtn}>
          {showMore ? 'Moins de champs' : 'Transport & Frais'}
        </Button>

        {showMore && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleSmall" style={styles.sectionTitle}>Transport & Déplacement</Text>
            <Text variant="bodySmall" style={styles.label}>Mode de transport</Text>
            <View style={styles.chipRow}>
              {TRANSPORT_MODES.map((t) => (
                <Chip key={t.value} selected={transportMode === t.value} onPress={() => setTransportMode(transportMode === t.value ? '' : t.value)} style={styles.chip}>
                  {t.label}
                </Chip>
              ))}
            </View>
            <View style={styles.row}>
              <TextInput label="Kilométrage (km)" value={mileage} onChangeText={setMileage} mode="outlined" style={[styles.input, styles.half]} keyboardType="numeric" />
              <TextInput label="Frais (MAD)" value={expenses} onChangeText={setExpenses} mode="outlined" style={[styles.input, styles.half]} keyboardType="numeric" />
            </View>
          </>
        )}

        <Button mode="contained" onPress={handleSubmit} loading={createMutation.isPending} disabled={createMutation.isPending || aiLoading} style={styles.button} contentStyle={styles.buttonContent}>
          Créer la visite
        </Button>
      </ScrollView>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}>{error}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 40 },
  segment: { marginBottom: 16 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  twoThird: { flex: 2 },
  oneThird: { flex: 1 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  suggestions: { backgroundColor: '#FFFFFF', borderRadius: 8, elevation: 3, marginBottom: 12, marginTop: -8, borderWidth: 1, borderColor: '#E0E0E0' },
  suggestionItem: { justifyContent: 'flex-start' },
  suggestionContent: { justifyContent: 'flex-start' },
  suggestionLabel: { textAlign: 'left', color: '#212121' },
  aiButtons: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  aiBtn: { borderColor: '#7C4DFF', flex: 1 },
  aiBtnLabel: { fontSize: 12, color: '#7C4DFF' },
  sectionTitle: { color: '#1976D2', fontWeight: '600', marginBottom: 8 },
  label: { color: '#666', marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#F5F5F5' },
  divider: { marginVertical: 16 },
  moreBtn: { marginBottom: 4, alignSelf: 'flex-start' },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: '#1976D2' },
  buttonContent: { height: 48 },
});
