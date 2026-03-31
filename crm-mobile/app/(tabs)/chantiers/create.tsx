import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  TouchableOpacity,
  TextInput as RNTextInput,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import chantiersApi from '../../../src/api/chantiers';
import { useAuthStore } from '../../../src/stores/authStore';
import { COLORS, SHADOW, RADIUS, SPACING } from '../../../src/config/theme';

// ─── Data ──────────────────────────────────────────────────────────────────────
const TYPE_PROJET = [
  { value: 'Résidentiel',   emoji: '🏠' },
  { value: 'Commercial',    emoji: '🏪' },
  { value: 'Industriel',    emoji: '🏭' },
  { value: 'Infrastructure',emoji: '🛣️' },
  { value: 'Hôtellerie',    emoji: '🏨' },
  { value: 'Autre',         emoji: '📋' },
];

const STADE_CHANTIER = [
  { value: 'Étude de projet',   color: '#8B5CF6' },
  { value: 'Autorisation',      color: '#3B82F6' },
  { value: 'Gros œuvre',        color: '#F59E0B' },
  { value: 'Second œuvre',      color: '#0D9488' },
  { value: 'Phase équipement',  color: '#EF4444' },
  { value: 'Livraison',         color: '#10B981' },
];

const NIVEAU_OPP = [
  { value: 'Faible',     color: '#64748B' },
  { value: 'Moyen',      color: '#F59E0B' },
  { value: 'Élevé',      color: '#EF4444' },
  { value: 'Très élevé', color: '#7C3AED' },
];

const STATUT = [
  { value: 'Actif',   color: '#10B981' },
  { value: 'Inactif', color: '#94A3B8' },
];

// ─── Components ────────────────────────────────────────────────────────────────
function Section({ emoji, title }: { emoji: string; title: string }) {
  return (
    <View style={f.section}>
      <View style={f.sectionDot} />
      <Text style={f.sectionEmoji}>{emoji}</Text>
      <Text style={f.sectionTitle}>{title}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  lines,
  numeric,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  lines?: number;
  numeric?: boolean;
  required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[f.field, focused && f.fieldFocused]}>
      <Text style={f.fieldLabel}>
        {label}
        {required && <Text style={{ color: COLORS.rose }}> *</Text>}
      </Text>
      <RNTextInput
        style={[f.fieldInput, multiline && { minHeight: (lines || 2) * 22, textAlignVertical: 'top' }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder || ''}
        placeholderTextColor={COLORS.text5}
        multiline={multiline}
        numberOfLines={lines}
        keyboardType={numeric ? 'numeric' : 'default'}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </View>
  );
}

function SelectChips({
  options,
  value,
  onChange,
}: {
  options: { value: string; color?: string; emoji?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={f.chipRow}>
      {options.map((o) => {
        const active = value === o.value;
        const color = o.color || COLORS.primary;
        return (
          <TouchableOpacity
            key={o.value}
            style={[
              f.chip,
              active && { backgroundColor: color + '18', borderColor: color },
            ]}
            onPress={() => onChange(active ? '' : o.value)}
            activeOpacity={0.7}
          >
            {o.emoji && <Text style={f.chipEmoji}>{o.emoji}</Text>}
            <Text style={[f.chipText, active && { color, fontWeight: '700' }]}>
              {o.value}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Screen ────────────────────────────────────────────────────────────────────
export default function CreateChantierScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [nom, setNom] = useState('');
  const [ville, setVille] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [adresse, setAdresse] = useState('');
  const [typeProjet, setTypeProjet] = useState('');
  const [sousTypeProjet, setSousTypeProjet] = useState('');
  const [nombreUnites, setNombreUnites] = useState('');
  const [stadeChantier, setStadeChantier] = useState('');
  const [niveauOpportunite, setNiveauOpportunite] = useState('');
  const [statutChantier, setStatutChantier] = useState('');
  const [actionSuivante, setActionSuivante] = useState('');
  const [concurrentFerme, setConcurrentFerme] = useState('');
  const [deciseur, setDeciseur] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nom.trim()) {
      Alert.alert('Validation', 'Le nom du chantier est obligatoire.');
      return;
    }
    setIsLoading(true);
    try {
      await chantiersApi.create({
        nom: nom.trim(),
        ville: ville.trim() || undefined,
        prefecture: prefecture.trim() || undefined,
        adresse: adresse.trim() || undefined,
        typeProjet: typeProjet || undefined,
        sousTypeProjet: sousTypeProjet.trim() || undefined,
        nombreUnites: nombreUnites ? parseInt(nombreUnites, 10) : undefined,
        stadeChantier: stadeChantier || undefined,
        niveauOpportunite: niveauOpportunite || undefined,
        statutChantier: statutChantier || undefined,
        actionSuivante: actionSuivante.trim() || undefined,
        concurrentFerme: concurrentFerme.trim() || undefined,
        deciseur: deciseur.trim() || undefined,
        assignedToId: user?.id,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Erreur', err?.response?.data?.message || 'Impossible de créer le chantier.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Informations générales ── */}
        <Section emoji="🏗️" title="Informations générales" />
        <View style={styles.card}>
          <Field label="Nom du chantier" value={nom} onChange={setNom} required />
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Field label="Ville" value={ville} onChange={setVille} />
            </View>
            <View style={{ flex: 1 }}>
              <Field label="Préfecture" value={prefecture} onChange={setPrefecture} />
            </View>
          </View>
          <Field label="Adresse complète" value={adresse} onChange={setAdresse} />
        </View>

        {/* ── Type de projet ── */}
        <Section emoji="🏛️" title="Type de projet" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Type de projet</Text>
          <SelectChips options={TYPE_PROJET} value={typeProjet} onChange={setTypeProjet} />
          <Field label="Sous-type de projet" value={sousTypeProjet} onChange={setSousTypeProjet} placeholder="Ex: Villas, Bureaux..." />
          <Field label="Nombre d'unités" value={nombreUnites} onChange={setNombreUnites} numeric placeholder="0" />
        </View>

        {/* ── Avancement ── */}
        <Section emoji="📊" title="Avancement" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Stade du chantier</Text>
          <SelectChips options={STADE_CHANTIER} value={stadeChantier} onChange={setStadeChantier} />

          <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Niveau d'opportunité</Text>
          <SelectChips options={NIVEAU_OPP} value={niveauOpportunite} onChange={setNiveauOpportunite} />

          <Text style={[styles.fieldLabel, { marginTop: 8 }]}>Statut</Text>
          <SelectChips options={STATUT} value={statutChantier} onChange={setStatutChantier} />
        </View>

        {/* ── Commercial ── */}
        <Section emoji="💼" title="Informations commerciales" />
        <View style={styles.card}>
          <Field label="Action suivante" value={actionSuivante} onChange={setActionSuivante} multiline lines={2} placeholder="Prochaine étape..." />
          <Field label="Concurrent fermé" value={concurrentFerme} onChange={setConcurrentFerme} placeholder="Nom du concurrent" />
          <Field label="Déciseur" value={deciseur} onChange={setDeciseur} placeholder="Nom du déciseur" />
        </View>

        {/* ── Submit ── */}
        <TouchableOpacity
          style={[styles.submitBtn, isLoading && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Text style={styles.submitText}>
            {isLoading ? 'Enregistrement...' : '✓  Enregistrer le chantier'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 16, paddingBottom: 40 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOW.sm,
  },

  row: { flexDirection: 'row', gap: 12 },

  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text3,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    ...SHADOW.teal,
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

// Field sub-styles
const f = StyleSheet.create({
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 8,
    paddingHorizontal: 2,
  },
  sectionDot: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  sectionEmoji: { fontSize: 18 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: COLORS.text1, letterSpacing: -0.3 },

  field: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  fieldFocused: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.text3,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  fieldInput: {
    fontSize: 15,
    color: COLORS.text1,
    paddingVertical: 2,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surface2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipEmoji: { fontSize: 14 },
  chipText: { fontSize: 13, fontWeight: '500', color: COLORS.text3 },
});
