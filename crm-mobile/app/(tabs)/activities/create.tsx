import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import {
  TextInput, Button, Snackbar, SegmentedButtons,
  Chip, Text, Divider, ActivityIndicator,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateActivity } from '../../../src/hooks/useActivities';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, ACTIVITY_PRIORITIES } from '../../../src/types/activity';
import { handleApiError } from '../../../src/api/client';
import { useAuthStore } from '../../../src/stores/authStore';
import { generateMeetingSummary, suggestFollowUps } from '../../../src/hooks/useAI';

// ─── Constantes locales ──────────────────────────────────────────────────────
const LOCATION_TYPES = [
  { value: 'on_site', label: 'Client',    icon: 'domain' },
  { value: 'office',  label: 'Bureau',    icon: 'office-building-outline' },
  { value: 'video',   label: 'Visio',     icon: 'video-outline' },
  { value: 'phone',   label: 'Téléphone', icon: 'phone-outline' },
  { value: 'other',   label: 'Autre',     icon: 'map-marker-outline' },
];

const CALL_DIRECTIONS = [
  { value: 'outbound', label: 'Sortant', icon: 'phone-outgoing-outline' },
  { value: 'inbound',  label: 'Entrant', icon: 'phone-incoming-outline' },
];

const CALL_RESULTS = [
  { value: 'answered',  label: 'Répondu',        icon: 'check-circle-outline' },
  { value: 'voicemail', label: 'Messagerie',      icon: 'voicemail' },
  { value: 'busy',      label: 'Occupé',          icon: 'phone-off-outline' },
  { value: 'no_answer', label: 'Pas de réponse',  icon: 'phone-missed-outline' },
  { value: 'callback',  label: 'Rappeler',        icon: 'phone-sync-outline' },
];

const TRANSPORT_MODES = [
  { value: 'voiture',   label: 'Voiture', icon: 'car-outline' },
  { value: 'moto',      label: 'Moto',    icon: 'motorbike' },
  { value: 'transport', label: 'TC',      icon: 'bus-outline' },
  { value: 'pied',      label: 'À pied',  icon: 'walk' },
];

// ─── Générateur IA local (fallback sans backend) ─────────────────────────────
function generateLocalDescription(type: string, subject: string): string {
  const d = new Date().toLocaleDateString('fr-FR');
  const templates: Record<string, string> = {
    call: `📞 Appel commercial du ${d}\n\nObjectif : ${subject || 'Qualification client'}\n\n• Présentation de l'offre\n• Identification des besoins\n• Définition des prochaines étapes`,
    meeting: `🤝 Réunion du ${d}\n\nOrdre du jour :\n1. Présentation des parties\n2. Besoins client\n3. Solutions proposées\n4. Plan d'action\n\nDurée estimée : 60 min`,
    email: `✉️ ${subject || 'Correspondance commerciale'}\n\nSuite à notre échange, je reviens vers vous concernant votre projet.\n\nN'hésitez pas à me contacter pour toute question.\n\nCordialement`,
    task: `✅ ${subject || 'Tâche commerciale'}\n\n• Analyser les informations\n• Préparer les documents\n• Documenter les résultats`,
    note: `📝 Note du ${d}\n\nObservations :\n• [Ajouter ici]\n\nActions requises : à définir`,
  };
  return templates[type] ?? templates['task'];
}

// ─── Composant principal ─────────────────────────────────────────────────────
export default function CreateActivityScreen() {
  const router = useRouter();
  const createMutation = useCreateActivity();
  const { user } = useAuthStore();

  // Type
  const [activityType, setActivityType] = useState('task');

  // Informations
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('planned');
  const [priority, setPriority] = useState('normal');
  const [dueDate, setDueDate] = useState('');
  const [duration, setDuration] = useState('');
  const [location, setLocation] = useState('');
  const [locationType, setLocationType] = useState('');
  const [objective, setObjective] = useState('');

  // Description + IA
  const [description, setDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Appel (call-specific)
  const [callDirection, setCallDirection] = useState('');
  const [callResult, setCallResult] = useState('');

  // Résultat
  const [result, setResult] = useState('');
  const [productsDiscussed, setProductsDiscussed] = useState('');
  const [estimatedRevenue, setEstimatedRevenue] = useState('');

  // Suivi
  const [followUpDate, setFollowUpDate] = useState('');
  const [nextActionNote, setNextActionNote] = useState('');

  // Plus de champs (transport)
  const [showMore, setShowMore] = useState(false);
  const [transportMode, setTransportMode] = useState('');
  const [mileage, setMileage] = useState('');
  const [expenses, setExpenses] = useState('');

  const [error, setError] = useState('');

  // ── IA : résumé ──────────────────────────────────────────────────────────
  const handleAISummary = async () => {
    const context = [objective, description, result].filter(Boolean).join('\n');
    if (!context.trim() && !subject.trim()) {
      Alert.alert('IA', 'Remplissez au moins le sujet ou l\'objectif pour générer un résumé.');
      return;
    }
    setAiLoading(true);
    try {
      const res = await generateMeetingSummary({
        notes: context || subject,
        meetingType: activityType,
        date: dueDate || undefined,
      });
      setDescription(res);
    } catch {
      // Fallback local si backend IA indisponible
      setDescription(generateLocalDescription(activityType, subject));
    } finally {
      setAiLoading(false);
    }
  };

  // ── IA : suivi ───────────────────────────────────────────────────────────
  const handleAISuggestFollowUp = async () => {
    const context = [objective, description, result].filter(Boolean).join('\n');
    setAiLoading(true);
    try {
      const res = await suggestFollowUps({
        contactName: 'Client',
        lastInteraction: subject || activityType,
        lastInteractionDate: dueDate || undefined,
        notes: context || undefined,
      });
      setNextActionNote(res);
      if (!followUpDate) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setFollowUpDate(d.toISOString().split('T')[0]);
      }
    } catch {
      setNextActionNote('Relancer le client dans 7 jours — préparer une proposition commerciale');
      if (!followUpDate) {
        const d = new Date();
        d.setDate(d.getDate() + 7);
        setFollowUpDate(d.toISOString().split('T')[0]);
      }
    } finally {
      setAiLoading(false);
    }
  };

  // ── Soumission ───────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!subject.trim()) { setError('Le sujet est obligatoire'); return; }
    try {
      const toISO = (d: string) => d.trim()
        ? (d.trim().includes('T') ? d.trim() : `${d.trim()}T00:00:00Z`)
        : undefined;

      await createMutation.mutateAsync({
        activityType,
        subject: subject.trim(),
        description: description.trim() || undefined,
        dueDate: toISO(dueDate),
        followUpDate: toISO(followUpDate),
        duration: duration ? parseInt(duration) : undefined,
        location: location.trim() || undefined,
        locationType: locationType || undefined,
        status: status || undefined,
        priority: priority || undefined,
        callDirection: activityType === 'call' ? callDirection || undefined : undefined,
        callResult: activityType === 'call' ? callResult || undefined : undefined,
        objective: objective.trim() || undefined,
        result: result.trim() || undefined,
        productsDiscussed: productsDiscussed.trim() || undefined,
        estimatedRevenue: estimatedRevenue ? parseFloat(estimatedRevenue) : undefined,
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

  // ── Rendu ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* ── Type ── */}
        <SegmentedButtons
          value={activityType}
          onValueChange={setActivityType}
          buttons={ACTIVITY_TYPES.map((t) => ({ value: t.value, label: t.label, icon: t.icon }))}
          style={styles.segment}
          multiSelect={false}
        />

        {/* ── Section : Informations ── */}
        <Text variant="titleSmall" style={styles.sectionTitle}>Informations</Text>

        <TextInput label="Sujet *" value={subject} onChangeText={setSubject} mode="outlined" style={styles.input} />

        <Text variant="bodySmall" style={styles.label}>Statut</Text>
        <View style={styles.chipRow}>
          {ACTIVITY_STATUSES.map((s) => (
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

        <Text variant="bodySmall" style={styles.label}>Priorité</Text>
        <View style={styles.chipRow}>
          {ACTIVITY_PRIORITIES.map((p) => (
            <Chip
              key={p.value}
              selected={priority === p.value}
              onPress={() => setPriority(p.value)}
              style={[styles.chip, priority === p.value && { backgroundColor: p.color + '22' }]}
              selectedColor={p.color}
            >
              {p.label}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Date d'échéance (AAAA-MM-JJ)"
          value={dueDate}
          onChangeText={setDueDate}
          mode="outlined"
          style={styles.input}
          placeholder="2026-03-30"
        />

        <TextInput
          label="Durée (minutes)"
          value={duration}
          onChangeText={setDuration}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
        />

        <TextInput label="Lieu" value={location} onChangeText={setLocation} mode="outlined" style={styles.input} />

        <Text variant="bodySmall" style={styles.label}>Type de lieu</Text>
        <View style={styles.chipRow}>
          {LOCATION_TYPES.map((l) => (
            <Chip
              key={l.value}
              icon={l.icon}
              selected={locationType === l.value}
              onPress={() => setLocationType(locationType === l.value ? '' : l.value)}
              style={styles.chip}
            >
              {l.label}
            </Chip>
          ))}
        </View>

        <TextInput label="Objectif" value={objective} onChangeText={setObjective} mode="outlined" style={styles.input} />

        {/* ── Section : Description + IA ── */}
        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>Description</Text>

        <TextInput
          label="Description / Compte rendu"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={4}
        />
        <View style={styles.aiButtons}>
          <Button
            mode="outlined"
            icon="auto-fix"
            onPress={handleAISummary}
            disabled={aiLoading}
            style={styles.aiBtn}
            labelStyle={styles.aiBtnLabel}
          >
            Résumé IA
          </Button>
          <Button
            mode="outlined"
            icon="lightbulb-outline"
            onPress={handleAISuggestFollowUp}
            disabled={aiLoading}
            style={styles.aiBtn}
            labelStyle={styles.aiBtnLabel}
          >
            Suivi IA
          </Button>
          {aiLoading && <ActivityIndicator size="small" style={{ marginLeft: 8 }} />}
        </View>

        {/* ── Champs spécifiques Appel ── */}
        {activityType === 'call' && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleSmall" style={styles.sectionTitle}>Détails de l'appel</Text>

            <Text variant="bodySmall" style={styles.label}>Direction</Text>
            <View style={styles.chipRow}>
              {CALL_DIRECTIONS.map((d) => (
                <Chip
                  key={d.value}
                  icon={d.icon}
                  selected={callDirection === d.value}
                  onPress={() => setCallDirection(callDirection === d.value ? '' : d.value)}
                  style={styles.chip}
                >
                  {d.label}
                </Chip>
              ))}
            </View>

            <Text variant="bodySmall" style={styles.label}>Résultat de l'appel</Text>
            <View style={styles.chipRow}>
              {CALL_RESULTS.map((r) => (
                <Chip
                  key={r.value}
                  icon={r.icon}
                  selected={callResult === r.value}
                  onPress={() => setCallResult(callResult === r.value ? '' : r.value)}
                  style={styles.chip}
                >
                  {r.label}
                </Chip>
              ))}
            </View>
          </>
        )}

        {/* ── Section : Résultat ── */}
        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>Résultat & Opportunité</Text>

        <TextInput
          label="Résultat / Compte rendu"
          value={result}
          onChangeText={setResult}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        <TextInput
          label="Produits discutés"
          value={productsDiscussed}
          onChangeText={setProductsDiscussed}
          mode="outlined"
          style={styles.input}
        />
        <TextInput
          label="Revenu estimé (MAD)"
          value={estimatedRevenue}
          onChangeText={setEstimatedRevenue}
          mode="outlined"
          style={styles.input}
          keyboardType="numeric"
        />

        {/* ── Section : Suivi ── */}
        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>Suivi & Prochaine étape</Text>

        <TextInput
          label="Date de suivi (AAAA-MM-JJ)"
          value={followUpDate}
          onChangeText={setFollowUpDate}
          mode="outlined"
          style={styles.input}
          placeholder="2026-04-06"
        />
        <TextInput
          label="Note / Prochaine action"
          value={nextActionNote}
          onChangeText={setNextActionNote}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={2}
        />

        {/* ── Plus de champs : Transport ── */}
        <Button
          mode="text"
          icon={showMore ? 'chevron-up' : 'chevron-down'}
          onPress={() => setShowMore(!showMore)}
          style={styles.moreBtn}
        >
          {showMore ? 'Moins de champs' : 'Transport & Frais'}
        </Button>

        {showMore && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleSmall" style={styles.sectionTitle}>Transport & Frais</Text>

            <Text variant="bodySmall" style={styles.label}>Mode de transport</Text>
            <View style={styles.chipRow}>
              {TRANSPORT_MODES.map((t) => (
                <Chip
                  key={t.value}
                  icon={t.icon}
                  selected={transportMode === t.value}
                  onPress={() => setTransportMode(transportMode === t.value ? '' : t.value)}
                  style={styles.chip}
                >
                  {t.label}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Kilométrage (km)"
              value={mileage}
              onChangeText={setMileage}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              label="Frais (MAD)"
              value={expenses}
              onChangeText={setExpenses}
              mode="outlined"
              style={styles.input}
              keyboardType="numeric"
            />
          </>
        )}

        {/* ── Bouton créer ── */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          disabled={createMutation.isPending || aiLoading}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Créer l'activité
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
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  sectionTitle: { color: '#1976D2', fontWeight: '600', marginBottom: 8 },
  label: { color: '#666', marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#F5F5F5' },
  divider: { marginVertical: 16 },
  aiButtons: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 },
  aiBtn: { borderColor: '#7C4DFF', flex: 1 },
  aiBtnLabel: { fontSize: 12, color: '#7C4DFF' },
  moreBtn: { marginBottom: 4, alignSelf: 'flex-start' },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: '#FF9800' },
  buttonContent: { height: 48 },
});
