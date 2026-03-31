import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import {
  TextInput, Button, Snackbar,
  Chip, Text, Divider,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useCreateLead } from '../../../src/hooks/useLeads';
import {
  LEAD_STATUSES, LEAD_SOURCES, LEAD_RATINGS,
} from '../../../src/types/lead';
import { handleApiError } from '../../../src/api/client';
import { useAuthStore } from '../../../src/stores/authStore';

// Secteurs d'activité
const INDUSTRIES = [
  { value: 'construction', label: '🏗️ BTP' },
  { value: 'immobilier', label: '🏠 Immobilier' },
  { value: 'industrie', label: '🏭 Industrie' },
  { value: 'commerce', label: '🛒 Commerce' },
  { value: 'services', label: '💼 Services' },
  { value: 'administration', label: '🏛️ Admin.' },
  { value: 'autre', label: '📋 Autre' },
];

const PRIORITIES = [
  { value: 'low', label: 'Basse', color: '#607D8B' },
  { value: 'normal', label: 'Normale', color: '#2196F3' },
  { value: 'high', label: 'Haute', color: '#FF9800' },
  { value: 'urgent', label: 'Urgente', color: '#F44336' },
];

export default function CreateLeadScreen() {
  const router = useRouter();
  const createMutation = useCreateLead();
  const { user } = useAuthStore();

  // ── Contact ──────────────────────────────────────────────────────────────
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [mobile, setMobile] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');

  // ── Entreprise ───────────────────────────────────────────────────────────
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [city, setCity] = useState('');
  const [website, setWebsite] = useState('');

  // ── Qualification ────────────────────────────────────────────────────────
  const [status, setStatus] = useState('new');
  const [source, setSource] = useState('');
  const [rating, setRating] = useState('');
  const [priority, setPriority] = useState('');
  const [description, setDescription] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  // ── Plus de champs ───────────────────────────────────────────────────────
  const [showMore, setShowMore] = useState(false);
  const [budgetRange, setBudgetRange] = useState('');
  const [decisionTimeframe, setDecisionTimeframe] = useState('');

  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!lastName.trim()) { setError('Le nom est obligatoire'); return; }
    try {
      const toISO = (d: string) => d.trim()
        ? (d.includes('T') ? d : `${d}T00:00:00Z`)
        : undefined;

      await createMutation.mutateAsync({
        lastName: lastName.trim(),
        firstName: firstName.trim() || undefined,
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        mobile: mobile.trim() || undefined,
        jobTitle: jobTitle.trim() || undefined,
        linkedinUrl: linkedinUrl.trim() || undefined,
        companyName: companyName.trim() || undefined,
        city: city.trim() || undefined,
        website: website.trim() || undefined,
        status: status || undefined,
        source: source || undefined,
        rating: rating || undefined,
        priority: priority || undefined,
        description: description.trim() || undefined,
        nextFollowUpDate: toISO(nextFollowUpDate),
        budgetRange: budgetRange.trim() || undefined,
        decisionTimeframe: decisionTimeframe.trim() || undefined,
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

        {/* ── Section : Contact ── */}
        <Text variant="titleSmall" style={styles.sectionTitle}>👤 Contact</Text>

        <TextInput label="Nom *" value={lastName} onChangeText={setLastName} mode="outlined" style={styles.input} />
        <TextInput label="Prénom" value={firstName} onChangeText={setFirstName} mode="outlined" style={styles.input} />

        <View style={styles.row}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            style={[styles.input, styles.half]}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            label="Téléphone"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            style={[styles.input, styles.half]}
            keyboardType="phone-pad"
          />
        </View>

        <TextInput
          label="Mobile"
          value={mobile}
          onChangeText={setMobile}
          mode="outlined"
          style={styles.input}
          keyboardType="phone-pad"
        />
        <TextInput label="Fonction / Poste" value={jobTitle} onChangeText={setJobTitle} mode="outlined" style={styles.input} />
        <TextInput
          label="LinkedIn (URL)"
          value={linkedinUrl}
          onChangeText={setLinkedinUrl}
          mode="outlined"
          style={styles.input}
          autoCapitalize="none"
          keyboardType="url"
        />

        {/* ── Section : Entreprise ── */}
        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>🏢 Entreprise</Text>

        <TextInput label="Nom de l'entreprise" value={companyName} onChangeText={setCompanyName} mode="outlined" style={styles.input} />

        <Text variant="bodySmall" style={styles.label}>Secteur d'activité</Text>
        <View style={styles.chipRow}>
          {INDUSTRIES.map((ind) => (
            <Chip
              key={ind.value}
              selected={industry === ind.value}
              onPress={() => setIndustry(industry === ind.value ? '' : ind.value)}
              style={styles.chip}
            >
              {ind.label}
            </Chip>
          ))}
        </View>

        <View style={styles.row}>
          <TextInput label="Ville" value={city} onChangeText={setCity} mode="outlined" style={[styles.input, styles.half]} />
          <TextInput
            label="Site web"
            value={website}
            onChangeText={setWebsite}
            mode="outlined"
            style={[styles.input, styles.half]}
            autoCapitalize="none"
            keyboardType="url"
          />
        </View>

        {/* ── Section : Qualification ── */}
        <Divider style={styles.divider} />
        <Text variant="titleSmall" style={styles.sectionTitle}>🎯 Qualification</Text>

        <Text variant="bodySmall" style={styles.label}>Statut</Text>
        <View style={styles.chipRow}>
          {LEAD_STATUSES.map((s) => (
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

        <Text variant="bodySmall" style={styles.label}>Température</Text>
        <View style={styles.chipRow}>
          {LEAD_RATINGS.map((r) => (
            <Chip
              key={r.value}
              selected={rating === r.value}
              onPress={() => setRating(rating === r.value ? '' : r.value)}
              style={[styles.chip, rating === r.value && { backgroundColor: r.color + '22' }]}
              selectedColor={r.color}
            >
              {r.label}
            </Chip>
          ))}
        </View>

        <Text variant="bodySmall" style={styles.label}>Priorité</Text>
        <View style={styles.chipRow}>
          {PRIORITIES.map((p) => (
            <Chip
              key={p.value}
              selected={priority === p.value}
              onPress={() => setPriority(priority === p.value ? '' : p.value)}
              style={[styles.chip, priority === p.value && { backgroundColor: p.color + '22' }]}
              selectedColor={p.color}
            >
              {p.label}
            </Chip>
          ))}
        </View>

        <Text variant="bodySmall" style={styles.label}>Source</Text>
        <View style={styles.chipRow}>
          {LEAD_SOURCES.map((s) => (
            <Chip
              key={s.value}
              selected={source === s.value}
              onPress={() => setSource(source === s.value ? '' : s.value)}
              style={styles.chip}
            >
              {s.label}
            </Chip>
          ))}
        </View>

        <TextInput
          label="Description / Besoin"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          multiline
          numberOfLines={3}
        />
        <TextInput
          label="Prochain suivi (AAAA-MM-JJ)"
          value={nextFollowUpDate}
          onChangeText={setNextFollowUpDate}
          mode="outlined"
          style={styles.input}
          placeholder="2026-04-06"
        />

        {/* ── Plus de champs ── */}
        <Button
          mode="text"
          icon={showMore ? 'chevron-up' : 'chevron-down'}
          onPress={() => setShowMore(!showMore)}
          style={styles.moreBtn}
        >
          {showMore ? 'Moins de champs' : 'Budget & Délai décision'}
        </Button>

        {showMore && (
          <>
            <Divider style={styles.divider} />
            <Text variant="titleSmall" style={styles.sectionTitle}>💰 Budget & Décision</Text>
            <TextInput
              label="Budget estimé (ex: 100k-500k MAD)"
              value={budgetRange}
              onChangeText={setBudgetRange}
              mode="outlined"
              style={styles.input}
            />
            <TextInput
              label="Délai de décision (ex: 1-3 mois)"
              value={decisionTimeframe}
              onChangeText={setDecisionTimeframe}
              mode="outlined"
              style={styles.input}
            />
          </>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={createMutation.isPending}
          disabled={createMutation.isPending}
          style={styles.button}
          contentStyle={styles.buttonContent}
        >
          Créer le lead
        </Button>
      </ScrollView>
      <Snackbar visible={!!error} onDismiss={() => setError('')} duration={4000}>{error}</Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { padding: 16, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  input: { marginBottom: 12, backgroundColor: '#FFFFFF' },
  sectionTitle: { color: '#FF9800', fontWeight: '600', marginBottom: 8 },
  label: { color: '#666', marginBottom: 6, marginTop: 4 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { backgroundColor: '#F5F5F5' },
  divider: { marginVertical: 16 },
  moreBtn: { marginBottom: 4, alignSelf: 'flex-start' },
  button: { marginTop: 8, borderRadius: 8, backgroundColor: '#FF9800' },
  buttonContent: { height: 48 },
});
