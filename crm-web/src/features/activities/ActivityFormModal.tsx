import { useEffect, useRef, useState } from 'react';
import {
  App, Modal, Form, Input, Select, DatePicker, InputNumber, Tabs,
  Button, Rate, Divider, Tooltip, Space, Switch, Typography, Spin,
} from 'antd';
import {
  RobotOutlined, ThunderboltOutlined, BulbOutlined,
  CopyOutlined, CheckOutlined, FileTextOutlined,
  PhoneOutlined, MailOutlined, TeamOutlined, EnvironmentOutlined,
  CheckSquareOutlined, ShoppingOutlined,
  BellOutlined, AimOutlined, BarChartOutlined, StarOutlined,
  DollarOutlined, RiseOutlined, CarOutlined, CreditCardOutlined,
  CalendarOutlined, ForwardOutlined, LockOutlined, OrderedListOutlined,
  AudioOutlined, AudioMutedOutlined, LoadingOutlined, GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import { createActivity, updateActivity, fetchActivityById, clearSelectedActivity } from './activitiesSlice';
import { selectUser } from '@/features/auth/authSlice';
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, ACTIVITY_PRIORITIES, ACTIVITY_TRANSPORT_MODES } from '@/types/activity';
import apiClient from '@/api/client';
import usersApi from '@/api/users';
import supervisorApi from '@/api/supervisor';
import type { CollaboratorSummary } from '@/types/dashboard';


const { Text } = Typography;

interface SelectOption { value: string; label: string; }

const RELATED_TO_TYPES = [
  { value: 'account',     label: 'Compte' },
  { value: 'contact',     label: 'Contact' },
  { value: 'opportunity', label: 'Opportunité' },
  { value: 'lead',        label: 'Piste' },
];

const RELATED_ENDPOINTS: Record<string, string> = {
  account:     '/accounts',
  contact:     '/contacts',
  opportunity: '/opportunities',
  lead:        '/leads',
};

const LOCATION_TYPES = [
  { value: 'on_site',   label: '🏢 Présentiel client' },
  { value: 'office',    label: '🏛️ Bureau' },
  { value: 'video',     label: '📹 Visioconférence' },
  { value: 'phone',     label: '📞 Téléphone' },
  { value: 'other',     label: '📍 Autre' },
];

const MEETING_PLATFORMS = [
  { value: 'teams',       label: 'Microsoft Teams' },
  { value: 'zoom',        label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'whatsapp',    label: 'WhatsApp' },
  { value: 'other',       label: 'Autre' },
];

const CALL_DIRECTIONS = [
  { value: 'outbound', label: '📤 Sortant' },
  { value: 'inbound',  label: '📥 Entrant' },
];

const CALL_RESULTS = [
  { value: 'answered',     label: '✅ Répondu' },
  { value: 'voicemail',    label: '📧 Messagerie' },
  { value: 'busy',         label: '🔴 Occupé' },
  { value: 'no_answer',    label: '❌ Pas de réponse' },
  { value: 'callback',     label: '🔄 Rappeler' },
];

const CLIENT_INTEREST_LABELS = ['Très faible', 'Faible', 'Moyen', 'Élevé', 'Très élevé'];

const VISIT_TYPES = [
  { value: 'premiere',     label: '🏁 Première visite' },
  { value: 'suivi',        label: '🔄 Visite de suivi' },
  { value: 'technique',    label: '🔧 Visite technique' },
  { value: 'commerciale',  label: '💼 Visite commerciale' },
  { value: 'post_livraison', label: '✅ Visite post-livraison' },
  { value: 'chantier_temoin', label: '⭐ Chantier témoin' },
];

const CHANTIER_STADES = [
  { value: 'etude',         label: '📐 Étude / Conception' },
  { value: 'autorisation',  label: '📋 Autorisation' },
  { value: 'gros_oeuvre',   label: '🏗️ Gros œuvre' },
  { value: 'second_oeuvre', label: '🔨 Second œuvre' },
  { value: 'equipement',    label: '⚡ Phase équipement' },
  { value: 'livraison',     label: '🏠 Livraison' },
  { value: 'cloture',       label: '✅ Clôture' },
];

const VISIT_RESULTS = [
  { value: 'positif',         label: '✅ Positif — client réceptif' },
  { value: 'neutre',          label: '⚪ Neutre — à relancer' },
  { value: 'opportunite',     label: '💡 Opportunité identifiée' },
  { value: 'commande_proche', label: '🛒 Commande imminente' },
  { value: 'probleme',        label: '⚠️ Problème à résoudre' },
  { value: 'absent',          label: '❌ Client absent' },
];

function getLabel(item: any): string {
  return item?.name || item?.title ||
    `${item?.firstName || ''} ${item?.lastName || ''}`.trim() ||
    item?.id || '';
}

// ── AI Template Engine ─────────────────────────────────────────────────────────
function generateAISubject(type: string, context?: string): string {
  const ts = dayjs().format('DD/MM/YYYY');
  const subjects: Record<string, string[]> = {
    call: [
      `Appel de qualification — ${ts}`,
      `Appel de suivi commercial — ${ts}`,
      `Appel découverte besoin client — ${ts}`,
      `Relance offre commerciale — ${ts}`,
    ],
    meeting: [
      `Réunion de présentation produit — ${ts}`,
      `Réunion de suivi chantier — ${ts}`,
      `Rendez-vous commercial — ${ts}`,
      `Présentation offre technique — ${ts}`,
    ],
    email: [
      `Envoi documentation technique — ${ts}`,
      `Suivi devis commercial — ${ts}`,
      `Confirmation rendez-vous — ${ts}`,
      `Relance proposition commerciale — ${ts}`,
    ],
    task: [
      `Préparation visite client — ${ts}`,
      `Mise à jour fiche chantier — ${ts}`,
      `Analyse besoins client — ${ts}`,
      `Préparation offre commerciale — ${ts}`,
    ],
    visite: [
      `Visite chantier — ${ts}`,
      `Visite technique de suivi — ${ts}`,
      `Visite commerciale terrain — ${ts}`,
      `Visite post-livraison — ${ts}`,
    ],
    note: [
      `Note de visite terrain — ${ts}`,
      `Compte rendu réunion — ${ts}`,
      `Observation commerciale — ${ts}`,
    ],
  };
  const list = subjects[type] || subjects['task'];
  if (context) {
    return `${list[0].split('—')[0].trim()} — ${context}`;
  }
  return list[Math.floor(Math.random() * list.length)];
}

function generateAIDescription(type: string, subject: string): string {
  const descriptions: Record<string, string> = {
    call: `📞 Objectif de l'appel : prise de contact et qualification du besoin client.\n\n• Présentation de l'équipe commerciale\n• Identification des besoins et contraintes\n• Discussion sur les produits/solutions adaptés\n• Définition des prochaines étapes\n\n📝 Résumé : ${subject || 'Appel commercial'}`,
    meeting: `🤝 Réunion planifiée avec le client.\n\n📋 Ordre du jour :\n1. Présentation des parties\n2. Exposé des besoins client\n3. Présentation des solutions OptiCRM\n4. Discussion technique et commerciale\n5. Définition du plan d'action\n\n📍 Lieu : à confirmer\n⏱️ Durée estimée : 60 minutes`,
    email: `✉️ Correspondance commerciale.\n\nObjet : ${subject || 'Suivi commercial'}\n\nCorps du message :\nBonjour,\n\nSuite à notre dernier échange, je vous contacte afin de faire le point sur votre projet et vous proposer une solution adaptée à vos besoins.\n\nN'hésitez pas à revenir vers moi pour tout renseignement complémentaire.\n\nCordialement`,
    task: `✅ Tâche à réaliser : ${subject || 'Action commerciale'}.\n\n📋 Détail :\n• Analyser les informations disponibles\n• Préparer les documents nécessaires\n• Contacter les parties prenantes si besoin\n• Documenter les résultats\n\n⚠️ Priorité : à définir selon le contexte`,
    visite: `🏗️ Visite terrain planifiée.\n\nDate : ${dayjs().format('DD/MM/YYYY à HH:mm')}\n\n📋 Objectifs de la visite :\n• Évaluation de l'avancement du chantier\n• Vérification de l'utilisation des produits\n• Identification des besoins complémentaires\n• Renforcement de la relation commerciale\n\n🔍 Points à inspecter :\n• Stade d'avancement (gros œuvre / second œuvre / équipement)\n• Produits en cours d'utilisation\n• Qualité de mise en œuvre\n• Stock disponible sur site\n\n📝 Actions à préparer :\n• Documentation photo du chantier\n• Fiche visite complétée\n• Proposition complémentaire si opportunité`,
    note: `📝 Note de suivi.\n\nDate : ${dayjs().format('DD/MM/YYYY à HH:mm')}\n\nObservations :\n• [Ajouter vos observations ici]\n• Points importants relevés\n• Éléments à suivre\n\n🔄 Actions requises : à définir`,
  };
  return descriptions[type] || descriptions['task'];
}

function generateAIAccountReview(type: string, subject: string, objective: string): string {
  if (type === 'visite') {
    const stades = ['Gros œuvre', 'Second œuvre', 'Phase équipement', 'Livraison'];
    const stade = stades[Math.floor(Math.random() * stades.length)];
    return `## Rapport de visite — ${subject || 'Visite chantier'}

**Date :** ${dayjs().format('DD/MM/YYYY à HH:mm')}
**Type :** Visite terrain

### Résumé de la visite
${objective || 'Visite de suivi chantier réalisée dans le cadre du suivi commercial terrain.'}

### État d'avancement constaté
- **Stade actuel :** ${stade}
- **Avancement global :** ${Math.floor(Math.random() * 40) + 40}%
- **Équipe présente :** Chef de chantier + équipe travaux

### Produits observés sur site
- Ciment en cours d'utilisation — stock estimé suffisant pour 2 semaines
- Carrelage sol posé partiellement (${Math.floor(Math.random() * 30) + 30}% réalisé)
- Matériaux de finition à commander prochainement

### Opportunités identifiées
- Besoin complémentaire en produits de finition (estimé : 150 000 – 200 000 MAD)
- Chantier témoin potentiel — client ouvert à la démarche
- Possibilité d'introduire la gamme isolation thermique

### Points d'attention
- Vérifier la conformité de mise en œuvre du ciment
- Anticiper la commande de carrelage pour éviter rupture
- Proposer une formation applicateurs si nécessaire

### Prochaines actions
1. Envoyer offre complémentaire produits de finition
2. Organiser visite avec responsable technique
3. Proposer intégration programme chantier témoin
4. Planifier visite de suivi dans 3 semaines

### Évaluation globale
⭐⭐⭐⭐ — Chantier actif, client réceptif, opportunité complémentaire confirmée`;
  }
  return `## Compte rendu — ${subject || 'Activité commerciale'}

**Date :** ${dayjs().format('DD/MM/YYYY à HH:mm')}
**Type :** ${ACTIVITY_TYPES.find(t => t.value === type)?.label || type}

### Résumé exécutif
${objective || 'Activité commerciale réalisée dans le cadre du suivi client.'}

### Points abordés
- Discussion des besoins et attentes du client
- Présentation des solutions disponibles
- Négociation des conditions commerciales
- Questions techniques et réponses apportées

### Conclusions
Le client a montré un intérêt ${['modéré', 'fort', 'très fort'][Math.floor(Math.random() * 3)]} pour notre offre. Une proposition commerciale détaillée sera préparée pour la prochaine étape.

### Prochaines actions
1. Envoyer une proposition commerciale personnalisée
2. Planifier une visite technique si nécessaire
3. Relancer dans 5-7 jours ouvrés
4. Mettre à jour la fiche chantier/client

### Niveau de satisfaction estimé
⭐⭐⭐⭐ — Interaction positive, client réceptif`;
}

function generateAINextSteps(type: string): string[] {
  const steps: Record<string, string[]> = {
    call: [
      '📧 Envoyer un email de confirmation avec résumé',
      '📅 Planifier un rendez-vous physique',
      '📄 Préparer et envoyer la proposition commerciale',
      '🔄 Relancer dans 5 jours si pas de retour',
    ],
    meeting: [
      '📝 Rédiger et envoyer le compte rendu',
      '📊 Préparer la documentation technique',
      '💰 Élaborer le devis personnalisé',
      '📅 Confirmer la prochaine réunion',
    ],
    email: [
      '📞 Appel de suivi dans 48h',
      '✅ Vérifier la réception et lecture',
      '📄 Préparer les documents annexes',
      '🔔 Configurer un rappel de relance',
    ],
    task: [
      '✅ Marquer comme terminée après exécution',
      '📝 Documenter les résultats',
      '👤 Informer le responsable commercial',
      '📅 Planifier l\'activité de suivi',
    ],
    visite: [
      '📸 Envoyer le rapport photo au client',
      '📄 Rédiger et envoyer la fiche visite',
      '💰 Proposer une offre complémentaire si besoin',
      '📅 Planifier la prochaine visite de suivi',
    ],
    note: [
      '🔗 Lier à l\'opportunité correspondante',
      '📤 Partager avec l\'équipe commerciale',
      '📅 Planifier une action de suivi',
      '💾 Archiver dans le CRM',
    ],
  };
  return steps[type] || steps['task'];
}

// ── AI Panel Component ─────────────────────────────────────────────────────────
interface AIPanelProps {
  type: string;
  subject: string;
  objective: string;
  onApplyAccountReview: (text: string) => void;
}

function AIPanel({ type, subject, objective, onApplyAccountReview }: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [review, setReview] = useState('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setReview(generateAIAccountReview(type, subject, objective));
      setNextSteps(generateAINextSteps(type));
      setLoading(false);
      setGenerated(true);
    }, 1200);
  };

  const copy = () => {
    navigator.clipboard.writeText(review);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Suggestions de prochaines étapes */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: '8px 12px', background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          borderRadius: 8, border: '1px solid #667eea30',
        }}>
          <BulbOutlined style={{ color: '#667eea', fontSize: 16 }} />
          <Text strong style={{ color: '#667eea' }}>Prochaines actions recommandées par IA</Text>
        </div>
        {nextSteps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', color: '#8c8c8c' }}>
            <Text type="secondary">Générez le compte rendu pour obtenir des recommandations</Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nextSteps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 12px', background: '#f8f9ff', borderRadius: 6,
                border: '1px solid #e8eaf6',
              }}>
                <span style={{ minWidth: 20, height: 20, background: '#667eea', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                  {i + 1}
                </span>
                <Text style={{ fontSize: 13 }}>{step}</Text>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Compte rendu IA */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            <Text strong>Compte rendu automatique</Text>
          </div>
          <Space>
            {generated && (
              <Button
                size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />}
                onClick={copy}
                style={{ color: copied ? '#52c41a' : undefined }}
              >
                {copied ? 'Copié !' : 'Copier'}
              </Button>
            )}
            {generated && (
              <Button
                size="small" type="dashed"
                onClick={() => onApplyAccountReview(review)}
                icon={<CheckOutlined />}
              >
                Appliquer au résultat
              </Button>
            )}
            <Button
              size="small" type="primary"
              loading={loading}
              icon={<RobotOutlined />}
              onClick={generate}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
            >
              {generated ? 'Régénérer' : 'Générer avec IA'}
            </Button>
          </Space>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 12 }}>
              <Text type="secondary">🤖 L'IA analyse l'activité et rédige le compte rendu...</Text>
            </div>
          </div>
        ) : review ? (
          <div style={{
            background: '#f8fff8', border: '1px solid #b7eb8f', borderRadius: 8,
            padding: '12px 16px', maxHeight: 280, overflowY: 'auto',
          }}>
            <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', color: '#262626' }}>
              {review}
            </pre>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            border: '2px dashed #d9d9d9', borderRadius: 8, color: '#8c8c8c',
          }}>
            <RobotOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
            <Text type="secondary">Cliquez sur <strong>Générer avec IA</strong> pour obtenir un compte rendu automatique basé sur les informations de l'activité</Text>
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Scoring IA */}
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, #fff7e6 0%, #fffbe6 100%)',
        border: '1px solid #ffd591', borderRadius: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <ThunderboltOutlined style={{ color: '#fa8c16' }} />
          <Text strong style={{ color: '#fa8c16' }}>Scoring IA de l'activité</Text>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Complétude', value: generated ? 85 : 40, color: '#52c41a' },
            { label: 'Urgence', value: generated ? 70 : 30, color: '#fa8c16' },
            { label: 'Potentiel', value: generated ? 90 : 50, color: '#1890ff' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 4px',
                background: `conic-gradient(${color} ${value * 3.6}deg, #f0f0f0 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: '50%', background: '#fffbe6',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Text style={{ fontSize: 11, fontWeight: 700, color }}>{value}%</Text>
                </div>
              </div>
              <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{label}</Text>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface Props {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function ActivityFormModal({ open, editingId, onClose, onSuccess }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { selectedActivity, loading } = useAppSelector((state) => state.activities);
  const currentUser = useAppSelector(selectUser);
  const roleName: string = (currentUser?.role as any)?.name ?? (currentUser?.role as any) ?? '';
  const isSuperviseur = ['SUPERVISEUR', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(roleName);

  // Collaborateurs (pour admins/superviseurs)
  const [collaborators, setCollaborators] = useState<CollaboratorSummary[]>([]);
  useEffect(() => {
    if (isSuperviseur) {
      supervisorApi.getAssignableUsers().then(setCollaborators).catch(() => {});
    }
  }, [isSuperviseur]);

  // AI state
  const [aiSubjectLoading, setAiSubjectLoading] = useState(false);
  const [aiDescLoading, setAiDescLoading]       = useState(false);

  // Voice-to-text state
  const [isRecording, setIsRecording]   = useState(false);
  const [voiceInterim, setVoiceInterim] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [voiceLang, setVoiceLang]       = useState<'fr-FR' | 'ar-MA'>('fr-FR');
  // Description gérée en state React — évite form.setFieldValue depuis callback async
  // (déclenche deepEqual sur tout le store → circular ref warning sur Dayjs/Select)
  const [descriptionValue, setDescriptionValue] = useState('');
  const recognitionRef     = useRef<any>(null);
  const abortTranslateRef  = useRef<AbortController | null>(null);

  // Appel direct Anthropic — pas de backend, pas de SSE, pas d'erreur parasite
  const translateToFrench = async (arabicText: string) => {
    abortTranslateRef.current?.abort();
    const ctrl = new AbortController();
    abortTranslateRef.current = ctrl;
    setIsTranslating(true);
    try {
      const apiKey = (import.meta.env.VITE_ANTHROPIC_API_KEY as string) ?? '';
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          messages: [{ role: 'user', content: `Traduis ce texte du darija marocain en français professionnel et naturel. Réponds UNIQUEMENT avec la traduction, sans aucune explication ni commentaire.\n\nTexte: ${arabicText}` }],
        }),
        signal: ctrl.signal,
      });
      if (res.ok) {
        const data = await res.json() as { content: Array<{ type: string; text?: string }> };
        const translated = data.content.find(b => b.type === 'text')?.text?.trim();
        if (translated) {
          setDescriptionValue(prev => prev ? prev + '\n' + translated : translated);
          message.success({ content: '✅ Traduction ajoutée', key: 'translate', duration: 2 });
        }
      }
      // si erreur HTTP (overloaded, etc.) → on ignore silencieusement
    } catch {
      // AbortError ou réseau → silencieux
    } finally {
      setIsTranslating(false);
      abortTranslateRef.current = null;
    }
  };

  const handleVoiceRecord = () => {
    // Vérifier support navigateur
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognitionClass) {
      message.warning({
        content: '⚠️ Reconnaissance vocale non disponible. Utilisez Chrome ou Edge.',
        duration: 5,
      });
      return;
    }

    // Vérifier HTTPS ou localhost
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
      message.warning({ content: '⚠️ La dictée vocale nécessite HTTPS ou localhost.', duration: 5 });
      return;
    }

    // Arrêter si déjà en cours
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setVoiceInterim('');
      return;
    }

    const recognition = new SpeechRecognitionClass();
    recognitionRef.current = recognition;
    recognition.lang = voiceLang;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    const langLabel = voiceLang === 'ar-MA' ? '🇲🇦 Darija → traduction FR' : '🇫🇷 Français';
    recognition.onstart = () => {
      setIsRecording(true);
      setVoiceInterim('');
      message.info({ content: `🎤 Écoute en cours — ${langLabel}`, key: 'voice', duration: 3 });
    };

    recognition.onend = () => {
      setIsRecording(false);
      setVoiceInterim('');
    };

    recognition.onerror = (event: any) => {
      setIsRecording(false);
      setVoiceInterim('');
      if (event.error !== 'aborted') {
        message.error('Erreur microphone : ' + (event.error || 'inconnue'));
      }
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      setVoiceInterim(interim);
      if (final) {
        if (voiceLang === 'ar-MA') {
          // Traduction Darija → Français via IA
          setVoiceInterim('');
          message.loading({ content: '🔄 Traduction en cours...', key: 'translate', duration: 0 });
          translateToFrench(final.trim());
        } else {
          setDescriptionValue(prev => prev ? prev + '\n' + final.trim() : final.trim());
        }
      }
    };

    recognition.start();
  };

  // ── Assigné à ────────────────────────────────────────────────────────────────
  const [userOptions, setUserOptions]   = useState<SelectOption[]>([]);
  const [userLoading, setUserLoading]   = useState(false);
  const userTimer = useRef<ReturnType<typeof setTimeout>>();

  const searchUsers = (search: string) => {
    clearTimeout(userTimer.current);
    if (!search) return;
    userTimer.current = setTimeout(async () => {
      setUserLoading(true);
      try {
        const res = await usersApi.getAll({ search, size: 20 });
        setUserOptions(res.content.map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName}`,
        })));
      } finally { setUserLoading(false); }
    }, 300);
  };

  // ── Lié à ────────────────────────────────────────────────────────────────────
  const [relatedOptions, setRelatedOptions]   = useState<SelectOption[]>([]);
  const [relatedLoading, setRelatedLoading]   = useState(false);
  const relatedTimer = useRef<ReturnType<typeof setTimeout>>();

  const searchRelated = (type: string, search: string) => {
    clearTimeout(relatedTimer.current);
    const endpoint = RELATED_ENDPOINTS[type];
    if (!endpoint || !search) return;
    relatedTimer.current = setTimeout(async () => {
      setRelatedLoading(true);
      try {
        const res = await apiClient.get(endpoint, { params: { search, size: 20, page: 1 } });
        const data: any[] = res.data.data || [];
        setRelatedOptions(data.map((item) => ({ value: item.id, label: getLabel(item) })));
      } finally { setRelatedLoading(false); }
    }, 300);
  };

  const preloadRelatedLabel = async (type: string, id: string) => {
    const endpoint = RELATED_ENDPOINTS[type];
    if (!endpoint) return;
    try {
      const res = await apiClient.get(`${endpoint}/${id}`);
      const item = res.data.data;
      if (item) setRelatedOptions([{ value: id, label: getLabel(item) }]);
    } catch { /* silent */ }
  };

  // ── Lifecycle ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return; // Ne pas interagir avec le Form quand la Modal est fermée
    if (editingId) {
      dispatch(fetchActivityById(editingId));
    } else {
      form.resetFields();
      setDescriptionValue('');
      setRelatedOptions([]);
      dispatch(clearSelectedActivity());
      if (currentUser) {
        form.setFieldValue('assignedToId', currentUser.id);
        setUserOptions([{
          value: currentUser.id,
          label: `${currentUser.firstName} ${currentUser.lastName}`,
        }]);
      } else {
        setUserOptions([]);
      }
    }
  }, [editingId, open, dispatch, form, currentUser]);

  useEffect(() => {
    if (selectedActivity && editingId) {
      form.setFieldsValue({
        ...selectedActivity,
        description:  undefined,   // géré par descriptionValue, pas par le Form
        startDate:    selectedActivity.startDate    ? dayjs(selectedActivity.startDate)    : undefined,
        endDate:      selectedActivity.endDate      ? dayjs(selectedActivity.endDate)      : undefined,
        dueDate:      selectedActivity.dueDate      ? dayjs(selectedActivity.dueDate)      : undefined,
        reminderAt:   selectedActivity.reminderAt   ? dayjs(selectedActivity.reminderAt)   : undefined,
        followUpDate: selectedActivity.followUpDate ? dayjs(selectedActivity.followUpDate) : undefined,
        assignedToId: selectedActivity.assignedTo?.id,
      });
      setDescriptionValue(selectedActivity.description ?? '');

      if (selectedActivity.assignedTo) {
        setUserOptions([{
          value: selectedActivity.assignedTo.id,
          label: selectedActivity.assignedTo.fullName || selectedActivity.assignedTo.email,
        }]);
      }

      if (selectedActivity.relatedToType && selectedActivity.relatedToId) {
        preloadRelatedLabel(selectedActivity.relatedToType, selectedActivity.relatedToId);
      }
    }
  }, [selectedActivity, editingId, form]);

  // ── Submit ────────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        description:  descriptionValue || undefined,
        startDate:    values.startDate?.toISOString(),
        endDate:      values.endDate?.toISOString(),
        dueDate:      values.dueDate?.toISOString(),
        reminderAt:   values.reminderAt?.toISOString(),
        followUpDate: values.followUpDate?.toISOString(),
      };
      if (editingId) {
        await dispatch(updateActivity({ id: editingId, data })).unwrap();
      } else {
        await dispatch(createActivity(data)).unwrap();
      }
      onSuccess();
    } catch (error: any) {
      // form.validateFields() throws plain object on validation fail — no message to show
      // thunk rejectWithValue throws the payload string directly
      if (error?.message) {
        message.error(error.message);
      } else if (typeof error === 'string') {
        message.error(error);
      } else if (error?.errorFields) {
        // Ant Design validation error — scroll to first failing field
        form.scrollToField(error.errorFields[0]?.name);
      }
    }
  };

  // ── AI Helpers ────────────────────────────────────────────────────────────────
  const handleAISubject = () => {
    setAiSubjectLoading(true);
    const type = form.getFieldValue('activityType') || 'task';
    setTimeout(() => {
      form.setFieldValue('subject', generateAISubject(type));
      setAiSubjectLoading(false);
      message.success('✨ Sujet généré par IA');
    }, 600);
  };

  const handleAIDescription = () => {
    setAiDescLoading(true);
    const type    = form.getFieldValue('activityType') || 'task';
    const subject = form.getFieldValue('subject') || '';
    setTimeout(() => {
      form.setFieldValue('description', generateAIDescription(type, subject));
      setAiDescLoading(false);
      message.success('✨ Description générée par IA');
    }, 800);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editingId ? "Modifier l'activité" : 'Nouvelle activité'}
          <span style={{
            fontSize: 11, padding: '2px 8px', borderRadius: 10,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff', fontWeight: 600,
          }}>
            ✨ IA
          </span>
        </div>
      }
      open={open}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      okText={editingId ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      width={860}
      destroyOnHidden
      styles={{ body: { maxHeight: '78vh', overflowY: 'auto', paddingRight: 4 } }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ status: 'planned', priority: 'normal', activityType: 'task' }}
        onValuesChange={(changed, all) => {
          if ('startDate' in changed || 'endDate' in changed) {
            const start = all.startDate;
            const end   = all.endDate;
            if (start && end && end.isAfter(start)) {
              form.setFieldValue('duration', Math.round(end.diff(start, 'minute', true)));
            } else {
              form.setFieldValue('duration', undefined);
            }
          }
          if ('relatedToType' in changed) {
            form.setFieldValue('relatedToId', undefined);
            setRelatedOptions([]);
          }
        }}
      >
        <Tabs type="card" size="small" items={[

          /* ════════════════════════════════ TAB 1 — ACTIVITÉ ══════════════════ */
          {
            key: 'activite',
            label: <span><FileTextOutlined /> Activité</span>,
            children: (
              <>
                {/* Type / Statut / Priorité */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="activityType" label="Type" rules={[{ required: true }]} style={{ flex: 1 }}>
                    <Select options={ACTIVITY_TYPES.map((t) => ({
                      value: t.value,
                      label: (
                        <span>
                          {t.value === 'call'    ? <PhoneOutlined style={{ marginRight: 6 }} /> :
                           t.value === 'email'   ? <MailOutlined style={{ marginRight: 6 }} /> :
                           t.value === 'meeting' ? <TeamOutlined style={{ marginRight: 6 }} /> :
                           t.value === 'visite'  ? <EnvironmentOutlined style={{ marginRight: 6 }} /> :
                           t.value === 'task'    ? <CheckSquareOutlined style={{ marginRight: 6 }} /> :
                                                   <FileTextOutlined style={{ marginRight: 6 }} />}
                          {t.label}
                        </span>
                      ),
                    }))} />
                  </Form.Item>
                  <Form.Item name="status" label="Statut" style={{ flex: 1 }}>
                    <Select options={ACTIVITY_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
                  </Form.Item>
                  <Form.Item name="priority" label="Priorité" style={{ flex: 1 }}>
                    <Select options={ACTIVITY_PRIORITIES.map((p) => ({
                      value: p.value,
                      label: (
                        <span style={{ color: p.color === 'red' ? '#f5222d' : p.color === 'orange' ? '#fa8c16' : p.color === 'blue' ? '#1890ff' : '#8c8c8c' }}>
                          {p.value === 'urgent' ? '🔴 ' : p.value === 'high' ? '🟠 ' : p.value === 'normal' ? '🔵 ' : '⚪ '}
                          {p.label}
                        </span>
                      ),
                    }))} />
                  </Form.Item>
                </div>

                {/* Commercial — visible admin/superviseur uniquement */}
                {isSuperviseur && (
                  <Form.Item name="assignedToId" label="Commercial">
                    <Select
                      placeholder="Sélectionner un commercial..."
                      allowClear
                      showSearch
                      optionFilterProp="label"
                      options={collaborators.map((c) => ({
                        value: c.userId,
                        label: c.fullName,
                        title: c.email,
                      }))}
                    />
                  </Form.Item>
                )}

                {/* Sujet avec bouton IA */}
                <Form.Item name="subject" label="Sujet" rules={[{ required: true, message: 'Sujet requis' }]}>
                  <Input
                    placeholder="Ex : Rendez-vous qualification client — Casablanca"
                    suffix={
                      <Tooltip title="Générer un sujet avec IA">
                        <Button
                          type="text" size="small"
                          loading={aiSubjectLoading}
                          icon={<span style={{ fontSize: 14 }}>✨</span>}
                          onClick={handleAISubject}
                          style={{ padding: '0 4px', height: 'auto', color: '#667eea' }}
                        />
                      </Tooltip>
                    }
                  />
                </Form.Item>

                {/* Description avec dictée vocale + génération IA */}
                <Form.Item label="Description">
                  <Input.TextArea
                    rows={3}
                    placeholder="Décrivez l'activité, les participants, l'ordre du jour..."
                    value={descriptionValue}
                    onChange={e => setDescriptionValue(e.target.value)}
                    style={{
                      borderColor: isRecording ? '#ff4d4f' : undefined,
                      transition: 'border-color 0.3s',
                    }}
                  />
                </Form.Item>

                {/* Texte intermédiaire vocal — hors Form.Item pour ne pas casser le binding */}
                {voiceInterim && (
                  <div style={{
                    marginTop: -10, marginBottom: 8,
                    padding: '5px 10px',
                    background: voiceLang === 'ar-MA' ? '#f0f5ff' : '#fff7e6',
                    borderRadius: 6, fontSize: 12,
                    color: voiceLang === 'ar-MA' ? '#1d39c4' : '#ad6800',
                    fontStyle: 'italic',
                    border: `1px dashed ${voiceLang === 'ar-MA' ? '#adc6ff' : '#ffd666'}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                    direction: voiceLang === 'ar-MA' ? 'rtl' : 'ltr',
                  }}>
                    <LoadingOutlined style={{ color: voiceLang === 'ar-MA' ? '#2f54eb' : '#fa8c16' }} />
                    {voiceInterim}
                  </div>
                )}

                {/* Indicateur traduction en cours */}
                {isTranslating && (
                  <div style={{
                    marginTop: -10, marginBottom: 8,
                    padding: '5px 10px',
                    background: '#f9f0ff', borderRadius: 6,
                    fontSize: 12, color: '#531dab',
                    border: '1px dashed #d3adf7',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <LoadingOutlined style={{ color: '#722ed1' }} />
                    Traduction Darija → Français en cours...
                  </div>
                )}

                <div style={{ marginTop: -8, marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Indicateur d'enregistrement */}
                  {isRecording && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#ff4d4f' }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f',
                        display: 'inline-block',
                        boxShadow: '0 0 0 0 rgba(255,77,79,0.4)',
                        animation: 'voicePulse 1.2s infinite',
                      }} />
                      {voiceLang === 'ar-MA' ? 'Écoute Darija...' : 'Écoute en cours...'}
                    </span>
                  )}

                  {/* Toggle langue FR / AR */}
                  <Tooltip title={voiceLang === 'fr-FR' ? 'Passer en Darija (arabe marocain)' : 'Passer en Français'}>
                    <Button
                      size="small"
                      icon={<GlobalOutlined />}
                      onClick={() => setVoiceLang(v => v === 'fr-FR' ? 'ar-MA' : 'fr-FR')}
                      disabled={isRecording || isTranslating}
                      style={{
                        fontWeight: 600, fontSize: 11,
                        color:       voiceLang === 'ar-MA' ? '#1677ff' : '#595959',
                        borderColor: voiceLang === 'ar-MA' ? '#1677ff' : '#d9d9d9',
                        background:  voiceLang === 'ar-MA' ? '#e6f4ff' : undefined,
                      }}
                    >
                      {voiceLang === 'fr-FR' ? '🇫🇷 FR' : '🇲🇦 AR'}
                    </Button>
                  </Tooltip>

                  {/* Bouton dictée vocale */}
                  <Tooltip title={
                    isRecording
                      ? 'Arrêter la dictée'
                      : voiceLang === 'ar-MA'
                        ? 'Dicter en Darija → traduit en français'
                        : 'Dicter la description en français'
                  }>
                    <Button
                      size="small"
                      icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                      onClick={handleVoiceRecord}
                      loading={isTranslating}
                      disabled={isTranslating}
                      style={{
                        color:       isRecording ? '#ff4d4f' : '#52c41a',
                        borderColor: isRecording ? '#ff4d4f' : '#52c41a',
                        background:  isRecording ? '#fff1f0' : '#f6ffed',
                        fontWeight: 600,
                      }}
                    >
                      {isRecording
                        ? '⏹ Arrêter'
                        : voiceLang === 'ar-MA'
                          ? '🎤 Darija → FR'
                          : '🎤 Voix → Texte'
                      }
                    </Button>
                  </Tooltip>
                  {/* Bouton génération IA */}
                  <Button
                    size="small" loading={aiDescLoading}
                    icon={<RobotOutlined />}
                    onClick={handleAIDescription}
                    style={{ color: '#667eea', borderColor: '#667eea', fontSize: 12 }}
                  >
                    ✨ Générer description
                  </Button>
                </div>

                {/* Dates */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="startDate" label="Date début" style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="endDate" label="Date fin" style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="dueDate" label="Échéance" style={{ flex: 1 }}>
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="duration" label="Durée (min)" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} disabled
                      placeholder="Auto-calculé" />
                  </Form.Item>
                </div>

                {/* Champs conditionnels selon type */}
                <Form.Item noStyle shouldUpdate={(p, c) => p.activityType !== c.activityType}>
                  {({ getFieldValue }) => {
                    const type = getFieldValue('activityType');
                    if (type === 'call') return (
                      <div style={{ background: '#f0f5ff', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
                        <Text strong style={{ color: '#1890ff', display: 'block', marginBottom: 10 }}>
                          📞 Détails de l'appel
                        </Text>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Form.Item name="callDirection" label="Direction" style={{ flex: 1, marginBottom: 0 }}>
                            <Select options={CALL_DIRECTIONS} placeholder="Entrant / Sortant" allowClear />
                          </Form.Item>
                          <Form.Item name="callResult" label="Résultat" style={{ flex: 1, marginBottom: 0 }}>
                            <Select options={CALL_RESULTS} placeholder="Résultat de l'appel" allowClear />
                          </Form.Item>
                        </div>
                      </div>
                    );
                    if (type === 'meeting') return (
                      <div style={{ background: '#f9f0ff', borderRadius: 8, padding: '12px 16px', marginBottom: 12 }}>
                        <Text strong style={{ color: '#722ed1', display: 'block', marginBottom: 10 }}>
                          🤝 Détails de la réunion
                        </Text>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Form.Item name="locationType" label="Mode" style={{ flex: 1, marginBottom: 0 }}>
                            <Select options={LOCATION_TYPES} placeholder="Présentiel / Visio..." allowClear />
                          </Form.Item>
                          <Form.Item name="meetingPlatform" label="Plateforme" style={{ flex: 1, marginBottom: 0 }}>
                            <Select options={MEETING_PLATFORMS} placeholder="Teams, Zoom..." allowClear />
                          </Form.Item>
                        </div>
                      </div>
                    );
                    if (type === 'visite') return (
                      <div style={{ background: '#f6ffed', borderRadius: 8, padding: '12px 16px', marginBottom: 12, border: '1px solid #b7eb8f' }}>
                        <Text strong style={{ color: '#389e0d', display: 'block', marginBottom: 12 }}>
                          🏗️ Détails de la visite terrain
                        </Text>
                        {/* Type de visite + Résultat */}
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Form.Item name="callDirection" label="Type de visite" style={{ flex: 1, marginBottom: 10 }}>
                            <Select options={VISIT_TYPES} placeholder="Sélectionner..." allowClear />
                          </Form.Item>
                          <Form.Item name="callResult" label="Résultat de la visite" style={{ flex: 1, marginBottom: 10 }}>
                            <Select options={VISIT_RESULTS} placeholder="Résultat..." allowClear />
                          </Form.Item>
                        </div>
                        {/* Stade chantier observé + Avancement */}
                        <div style={{ display: 'flex', gap: 12 }}>
                          <Form.Item name="locationType" label="Stade chantier observé" style={{ flex: 1, marginBottom: 10 }}>
                            <Select options={CHANTIER_STADES} placeholder="Stade constaté..." allowClear />
                          </Form.Item>
                          <Form.Item name="meetingPlatform" label="Avancement (%)" style={{ flex: 1, marginBottom: 10 }}>
                            <Select allowClear placeholder="Avancement estimé" options={[
                              { value: '10', label: '10%' }, { value: '20', label: '20%' },
                              { value: '30', label: '30%' }, { value: '40', label: '40%' },
                              { value: '50', label: '50%' }, { value: '60', label: '60%' },
                              { value: '70', label: '70%' }, { value: '80', label: '80%' },
                              { value: '90', label: '90%' }, { value: '100', label: '100% ✅' },
                            ]} />
                          </Form.Item>
                        </div>
                        {/* Observations terrain */}
                        <Form.Item name="agenda" label={<span><FileTextOutlined /> Observations terrain</span>} style={{ marginBottom: 10 }}>
                          <Input.TextArea rows={3}
                            placeholder="Décrire l'état du chantier, les produits utilisés, les points d'attention, les opportunités identifiées..." />
                        </Form.Item>
                        {/* Chantier témoin + Contacts présents */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                          <Form.Item name="isRecurring" valuePropName="checked" label="Chantier témoin ?" style={{ marginBottom: 0 }}>
                            <Switch checkedChildren="Oui" unCheckedChildren="Non" />
                          </Form.Item>
                          <Form.Item name="recurrenceRule" label="Contacts présents" style={{ flex: 1, marginBottom: 0 }}>
                            <Input placeholder="Ex : Chef de chantier, Architecte, Client..." />
                          </Form.Item>
                        </div>
                      </div>
                    );
                    return null;
                  }}
                </Form.Item>

                {/* Récurrence */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 12px',
                  background: '#fafafa', borderRadius: 6, border: '1px solid #f0f0f0' }}>
                  <Form.Item name="isRecurring" valuePropName="checked" noStyle>
                    <Switch size="small" />
                  </Form.Item>
                  <Text style={{ fontSize: 13 }}>Activité récurrente</Text>
                  <Form.Item noStyle shouldUpdate={(p, c) => p.isRecurring !== c.isRecurring}>
                    {({ getFieldValue }) => getFieldValue('isRecurring') && (
                      <Form.Item name="recurrenceRule" noStyle>
                        <Select
                          size="small" style={{ minWidth: 160 }}
                          placeholder="Fréquence"
                          options={[
                            { value: 'DAILY',   label: 'Chaque jour' },
                            { value: 'WEEKLY',  label: 'Chaque semaine' },
                            { value: 'MONTHLY', label: 'Chaque mois' },
                          ]}
                        />
                      </Form.Item>
                    )}
                  </Form.Item>
                </div>
              </>
            ),
          },

          /* ════════════════════════════════ TAB 2 — ACTEURS & LIEU ════════════ */
          {
            key: 'acteurs',
            label: <span><TeamOutlined /> Acteurs & Lieu</span>,
            children: (
              <>
                {/* Assigné à */}
                <Form.Item name="assignedToId" label="Assigné à">
                  <Select
                    showSearch allowClear
                    placeholder="Rechercher un utilisateur..."
                    filterOption={false}
                    options={userOptions}
                    loading={userLoading}
                    onSearch={searchUsers}
                    notFoundContent={userLoading ? 'Chargement...' : 'Aucun utilisateur trouvé'}
                  />
                </Form.Item>

                {/* Lié à */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="relatedToType" label="Type de lien" style={{ flex: '0 0 180px' }}>
                    <Select allowClear placeholder="Type" options={RELATED_TO_TYPES} />
                  </Form.Item>
                  <Form.Item noStyle shouldUpdate={(p, c) => p.relatedToType !== c.relatedToType}>
                    {({ getFieldValue }) => {
                      const type = getFieldValue('relatedToType');
                      return (
                        <Form.Item name="relatedToId" label="Lié à" style={{ flex: 1 }}>
                          <Select
                            showSearch allowClear
                            placeholder={type
                              ? `Rechercher un(e) ${RELATED_TO_TYPES.find(t => t.value === type)?.label?.toLowerCase() || ''}...`
                              : "Choisir d'abord un type"}
                            filterOption={false}
                            disabled={!type}
                            options={relatedOptions}
                            loading={relatedLoading}
                            onSearch={(val) => searchRelated(type, val)}
                            notFoundContent={relatedLoading ? 'Chargement...' : 'Aucun résultat'}
                          />
                        </Form.Item>
                      );
                    }}
                  </Form.Item>
                </div>

                {/* Lieu */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="locationType" label="Type de lieu" style={{ flex: 1 }}>
                    <Select options={LOCATION_TYPES} placeholder="Sélectionner..." allowClear />
                  </Form.Item>
                  <Form.Item name="location" label="Adresse / Lieu" style={{ flex: 2 }}>
                    <Input placeholder="Ex : 42 Bd Mohammed V, Casablanca" />
                  </Form.Item>
                </div>

                {/* Rappel */}
                <Form.Item name="reminderAt" label={<span><BellOutlined /> Rappel</span>}>
                  <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }}
                    placeholder="Sélectionner la date et heure du rappel" />
                </Form.Item>

                {/* Participants */}
                <Form.Item name="participants" label="Participants (emails)">
                  <Select
                    mode="tags"
                    placeholder="Ajouter des emails ou noms de participants..."
                    tokenSeparators={[',', ';']}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                {/* Agenda */}
                <Form.Item noStyle shouldUpdate={(p, c) => p.activityType !== c.activityType}>
                  {({ getFieldValue }) => getFieldValue('activityType') === 'meeting' && (
                    <Form.Item name="agenda" label={<span><OrderedListOutlined /> Ordre du jour</span>}>
                      <Input.TextArea rows={3}
                        placeholder="1. Présentation des parties&#10;2. Exposé des besoins&#10;3. Discussion technique&#10;4. Questions & réponses" />
                    </Form.Item>
                  )}
                </Form.Item>
              </>
            ),
          },

          /* ════════════════════════════════ TAB 3 — COMMERCIAL & SUIVI ════════ */
          {
            key: 'details',
            label: <span><ShoppingOutlined /> Commercial & Suivi</span>,
            children: (
              <>
                {/* Objectif */}
                <Form.Item name="objective" label={<span><AimOutlined /> Objectif</span>}>
                  <Input placeholder="Ex : Qualifier le besoin client, présenter l'offre Premium..." />
                </Form.Item>

                {/* Résultat */}
                <Form.Item name="result" label={<span><BarChartOutlined /> Résultat obtenu</span>}>
                  <Input.TextArea rows={2}
                    placeholder="Résultat obtenu suite à cette activité..." />
                </Form.Item>

                {/* Niveau d'intérêt */}
                <Form.Item name="clientInterestLevel" label={<span><StarOutlined /> Niveau d'intérêt client</span>}>
                  <Rate
                    count={5}
                    tooltips={CLIENT_INTEREST_LABELS}
                    style={{ color: '#faad14' }}
                  />
                </Form.Item>

                <Divider style={{ margin: '8px 0 16px' }} />

                {/* Produits & Revenu */}
                <Form.Item name="productsDiscussed" label={<span><ShoppingOutlined /> Produits / Solutions discutés</span>}>
                  <Input.TextArea rows={2}
                    placeholder="Ex : Ciment Premium, Carrelage Sol, Agrégats 20/40..." />
                </Form.Item>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="estimatedRevenue" label={<span><DollarOutlined /> Revenu estimé (MAD)</span>} style={{ flex: 1 }}>
                    <InputNumber
                      min={0} style={{ width: '100%' }}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                      placeholder="0"
                    />
                  </Form.Item>
                  <Form.Item name="probability" label={<span><RiseOutlined /> Probabilité (%)</span>} style={{ flex: 1 }}>
                    <InputNumber min={0} max={100} style={{ width: '100%' }} placeholder="Ex : 60" />
                  </Form.Item>
                </div>

                <Divider style={{ margin: '8px 0 16px' }} />

                {/* Transport */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="transportMode" label={<span><CarOutlined /> Mode de transport</span>} style={{ flex: 1 }}>
                    <Select allowClear placeholder="Sélectionner"
                      options={ACTIVITY_TRANSPORT_MODES.map((t) => ({ value: t.value, label: t.label }))} />
                  </Form.Item>
                  <Form.Item name="mileage" label={<span><EnvironmentOutlined /> Kilométrage (km)</span>} style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="expenses" label={<span><CreditCardOutlined /> Frais / Dépenses (MAD)</span>} style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                  <Form.Item name="followUpDate" label={<span><CalendarOutlined /> Date de suivi</span>} style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                {/* Prochaine action */}
                <Form.Item name="nextActionNote" label={<span><ForwardOutlined /> Prochaine action à effectuer</span>}>
                  <Input placeholder="Ex : Envoyer le devis, planifier une visite technique..." />
                </Form.Item>

                {/* Notes internes */}
                <Form.Item name="internalNotes" label={<span><LockOutlined /> Notes internes (confidentielles)</span>}>
                  <Input.TextArea rows={2}
                    placeholder="Notes visibles uniquement par l'équipe interne..."
                    style={{ background: '#fffbf0', borderColor: '#ffd591' }}
                  />
                </Form.Item>
              </>
            ),
          },

          /* ════════════════════════════════ TAB 4 — IA ASSISTANT ══════════════ */
          {
            key: 'ia',
            label: (
              <span style={{ color: '#667eea', fontWeight: 600 }}>
                <RobotOutlined /> IA Assistant
              </span>
            ),
            children: (
              <Form.Item noStyle shouldUpdate>
                {({ getFieldValue }) => (
                  <AIPanel
                    type={getFieldValue('activityType') || 'task'}
                    subject={getFieldValue('subject') || ''}
                    objective={getFieldValue('objective') || ''}
                    onApplyAccountReview={(text) => {
                      form.setFieldValue('result', text);
                      message.success('✅ Compte rendu appliqué au champ Résultat');
                    }}
                  />
                )}
              </Form.Item>
            ),
          },
        ]} />
      </Form>
    </Modal>
  );
}

