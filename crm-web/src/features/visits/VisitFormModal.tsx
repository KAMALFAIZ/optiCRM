import { useEffect, useRef, useState } from 'react';
import {
  Modal, Form, Input, Select, DatePicker, InputNumber, Rate, Tabs,
  message, Button, Divider, Space, Typography, Spin, Tooltip,
} from 'antd';
import {
  RobotOutlined, ThunderboltOutlined, BulbOutlined,
  CopyOutlined, CheckOutlined, FileTextOutlined,
  FormOutlined, EnvironmentOutlined, ShoppingOutlined,
  AimOutlined, CarOutlined, CreditCardOutlined, CalendarOutlined,
  AudioOutlined, AudioMutedOutlined, LoadingOutlined, GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import { createVisit, updateVisit, fetchVisitById, clearSelectedVisit } from './visitsSlice';
import { selectUser } from '@/features/auth/authSlice';
import { supervisorApi } from '@/api/supervisor';
import type { CollaboratorSummary } from '@/types/dashboard';
import { streamChat } from '@/api/ai';
import { VISIT_TYPES, VISIT_STATUSES, VISIT_OUTCOMES, VISIT_INTEREST_LEVELS, VISIT_TRANSPORT_MODES, VISIT_FOLLOWUP_PRIORITIES } from '@/types/visit';
import { GpsLocationPicker } from '@/components/maps';
import type { GpsCoordinates } from '@/components/maps';

const { Text } = Typography;

interface Props {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ── AI Template Engine ─────────────────────────────────────────────────────────
function generateAISubject(visitType: string): string {
  const ts = dayjs().format('DD/MM/YYYY');
  const subjects: Record<string, string[]> = {
    prospection: [
      `Visite de prospection — ${ts}`,
      `Première visite client — ${ts}`,
      `Découverte prospect terrain — ${ts}`,
      `Prospection commerciale — ${ts}`,
    ],
    suivi: [
      `Visite de suivi — ${ts}`,
      `Suivi commercial terrain — ${ts}`,
      `Visite de relance client — ${ts}`,
      `Suivi chantier en cours — ${ts}`,
    ],
    livraison: [
      `Visite post-livraison — ${ts}`,
      `Contrôle livraison produits — ${ts}`,
      `Réception commande client — ${ts}`,
    ],
    reclamation: [
      `Traitement réclamation client — ${ts}`,
      `Visite de résolution incident — ${ts}`,
      `Intervention réclamation — ${ts}`,
    ],
  };
  const list = subjects[visitType] || subjects['suivi'];
  return list[Math.floor(Math.random() * list.length)];
}

function generateAIDescription(visitType: string, subject: string, objective: string): string {
  const date = dayjs().format('DD/MM/YYYY à HH:mm');
  const descriptions: Record<string, string> = {
    prospection: `🏗️ Visite de prospection terrain planifiée.\n\nDate : ${date}\n\n📋 Objectifs de la visite :\n• Identifier et qualifier le prospect\n• Évaluation du potentiel commercial\n• Présentation de la gamme de produits\n• Identification des besoins et contraintes du chantier\n\n🔍 Points à évaluer :\n• Type et stade du chantier\n• Produits actuellement utilisés (concurrents)\n• Volume estimé et fréquence de commande\n• Interlocuteur décideur identifié\n\n📝 ${subject || 'Nouvelle prospection'}${objective ? '\n🎯 Objectif : ' + objective : ''}`,

    suivi: `🔄 Visite de suivi commercial.\n\nDate : ${date}\n\n📋 Objectifs de la visite :\n• Évaluation de l'avancement du chantier\n• Vérification de l'utilisation de nos produits\n• Identification des besoins complémentaires\n• Renforcement de la relation commerciale\n\n🔍 Points à inspecter :\n• Stade d'avancement (gros œuvre / second œuvre / équipement)\n• Produits en cours d'utilisation\n• Qualité de mise en œuvre\n• Stock disponible sur site\n\n📝 ${subject || 'Visite de suivi'}${objective ? '\n🎯 Objectif : ' + objective : ''}`,

    livraison: `🚚 Visite post-livraison.\n\nDate : ${date}\n\n📋 Objectifs de la visite :\n• Contrôle de la réception des produits livrés\n• Vérification de la conformité de la commande\n• Vérification de l'état des produits à réception\n• Signature du bon de livraison\n\n🔍 Points à vérifier :\n• Quantités reçues vs commandées\n• Qualité et intégrité des produits\n• Conditions de stockage sur site\n• Satisfaction client\n\n📝 ${subject || 'Visite livraison'}${objective ? '\n🎯 Objectif : ' + objective : ''}`,

    reclamation: `⚠️ Visite de traitement de réclamation.\n\nDate : ${date}\n\n📋 Objectifs de la visite :\n• Écoute et compréhension de la réclamation client\n• Évaluation de la situation sur le terrain\n• Proposition de solution adaptée\n• Engagement de résolution dans les délais\n\n🔍 Points à analyser :\n• Nature et cause de la réclamation\n• Impact sur le client et le chantier\n• Solution proposée et délai de résolution\n• Niveau de satisfaction après intervention\n\n📝 ${subject || 'Réclamation à traiter'}${objective ? '\n🎯 Objectif : ' + objective : ''}`,
  };
  return descriptions[visitType] || descriptions['suivi'];
}

function generateAIVisitReport(visitType: string, subject: string, objective: string): string {
  const stades = ['Gros œuvre', 'Second œuvre', 'Phase équipement', 'Livraison'];
  const stade = stades[Math.floor(Math.random() * stades.length)];
  const avancement = Math.floor(Math.random() * 40) + 40;

  if (visitType === 'prospection') {
    return `## Rapport de prospection — ${subject || 'Visite terrain'}

**Date :** ${dayjs().format('DD/MM/YYYY à HH:mm')}
**Type :** Prospection commerciale

### Résumé de la visite
${objective || 'Visite de prospection terrain réalisée dans le cadre du développement commercial.'}

### Qualification du prospect
- **Type de chantier :** Résidentiel collectif (estimation)
- **Stade observé :** ${stade}
- **Avancement global :** ${avancement}%
- **Décideur identifié :** Chef de chantier / Maître d'ouvrage

### Situation concurrentielle
- Produits concurrents détectés sur site : à identifier
- Opportunité de substitution : **Oui** — client ouvert à la comparaison
- Budget estimé restant : 100 000 – 300 000 MAD

### Opportunités identifiées
- Besoin en ciment et matériaux de gros œuvre
- Potentiel pour la gamme carrelage et revêtements
- Intérêt pour un programme fidélité

### Prochaines actions
1. Envoyer une documentation produit personnalisée
2. Proposer une visite technique avec ingénieur
3. Préparer une offre commerciale compétitive
4. Relancer dans 5-7 jours ouvrés

### Évaluation globale
⭐⭐⭐⭐ — Prospect qualifié, potentiel commercial confirmé`;
  }

  return `## Rapport de visite — ${subject || 'Visite chantier'}

**Date :** ${dayjs().format('DD/MM/YYYY à HH:mm')}
**Type :** ${VISIT_TYPES.find(t => t.value === visitType)?.label || visitType}

### Résumé de la visite
${objective || 'Visite terrain réalisée dans le cadre du suivi commercial.'}

### État d'avancement constaté
- **Stade actuel :** ${stade}
- **Avancement global :** ${avancement}%
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

function generateAINextSteps(visitType: string): string[] {
  const steps: Record<string, string[]> = {
    prospection: [
      '📄 Envoyer la documentation produit au prospect',
      '📅 Planifier une visite technique de qualification',
      '💰 Préparer une offre commerciale personnalisée',
      '🔄 Relancer dans 5 jours si pas de retour',
    ],
    suivi: [
      '📸 Envoyer le rapport photo du chantier au client',
      '📄 Rédiger et partager la fiche visite',
      '💰 Proposer une offre complémentaire identifiée',
      '📅 Planifier la prochaine visite de suivi',
    ],
    livraison: [
      '✅ Confirmer la réception conforme par écrit',
      '📞 Appel de satisfaction client dans 48h',
      '📄 Archiver le bon de livraison signé',
      '🔔 Configurer un rappel pour la prochaine commande',
    ],
    reclamation: [
      '📋 Rédiger le rapport d\'incident détaillé',
      '⚡ Escalader si non résolu sous 24h',
      '📞 Appel de suivi de satisfaction dans 48h',
      '📅 Visite de contrôle après résolution',
    ],
  };
  return steps[visitType] || steps['suivi'];
}

// ── AI Panel Component ─────────────────────────────────────────────────────────
interface AIPanelProps {
  visitType: string;
  subject: string;
  objective: string;
  onApplyReport: (text: string) => void;
}

function AIPanel({ visitType, subject, objective, onApplyReport }: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setReport(generateAIVisitReport(visitType, subject, objective));
      setNextSteps(generateAINextSteps(visitType));
      setLoading(false);
      setGenerated(true);
    }, 1200);
  };

  const copy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoring = generated
    ? { completude: 85, urgence: 65, potentiel: 90 }
    : { completude: 40, urgence: 30, potentiel: 50 };

  return (
    <div>
      {/* Prochaines actions recommandées */}
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
            <Text type="secondary">Générez le rapport pour obtenir des recommandations</Text>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {nextSteps.map((step, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                padding: '8px 12px', background: '#f8f9ff', borderRadius: 6,
                border: '1px solid #e8eaf6',
              }}>
                <span style={{
                  minWidth: 20, height: 20, background: '#667eea', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}>
                  {i + 1}
                </span>
                <Text style={{ fontSize: 13 }}>{step}</Text>
              </div>
            ))}
          </div>
        )}
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Rapport automatique */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileTextOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            <Text strong>Rapport de visite automatique</Text>
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
                onClick={() => onApplyReport(report)}
                icon={<CheckOutlined />}
              >
                Appliquer à la description
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
              <Text type="secondary">🤖 L'IA analyse la visite et rédige le rapport...</Text>
            </div>
          </div>
        ) : report ? (
          <div style={{
            background: '#f8fff8', border: '1px solid #b7eb8f', borderRadius: 8,
            padding: '12px 16px', maxHeight: 280, overflowY: 'auto',
          }}>
            <pre style={{
              margin: 0, fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6,
              whiteSpace: 'pre-wrap', color: '#262626',
            }}>
              {report}
            </pre>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            border: '2px dashed #d9d9d9', borderRadius: 8, color: '#8c8c8c',
          }}>
            <RobotOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block' }} />
            <Text type="secondary">
              Cliquez sur <strong>Générer avec IA</strong> pour obtenir un rapport automatique basé sur le type et l'objectif de la visite
            </Text>
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
          <Text strong style={{ color: '#fa8c16' }}>Scoring IA de la visite</Text>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Complétude', value: scoring.completude, color: '#52c41a' },
            { label: 'Urgence', value: scoring.urgence, color: '#fa8c16' },
            { label: 'Potentiel', value: scoring.potentiel, color: '#1890ff' },
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

// ── Main Component ─────────────────────────────────────────────────────────────
export default function VisitFormModal({ open, editingId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { selectedVisit, loading } = useAppSelector((state) => state.visits);
  const currentUser = useAppSelector(selectUser);

  // Rôle
  const roleName: string = (currentUser?.role as any)?.name ?? currentUser?.role ?? '';
  const isSuperviseur = ['SUPERVISEUR', 'SUPER_ADMIN', 'ADMIN', 'MANAGER'].includes(roleName);

  // Collaborateurs pour le champ "Assigné à"
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
  const [isRecording, setIsRecording]     = useState(false);
  const [voiceInterim, setVoiceInterim]   = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [voiceLang, setVoiceLang]         = useState<'fr-FR' | 'ar-MA'>('fr-FR');
  const recognitionRef    = useRef<any>(null);
  const cancelTranslateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      dispatch(fetchVisitById(editingId));
    } else {
      form.resetFields();
      dispatch(clearSelectedVisit());
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            form.setFieldsValue({
              latitude: parseFloat(pos.coords.latitude.toFixed(6)),
              longitude: parseFloat(pos.coords.longitude.toFixed(6)),
            });
          },
          () => { /* ignore permission denied */ }
        );
      }
    }
  }, [editingId, open, dispatch, form]);

  useEffect(() => {
    if (selectedVisit && editingId) {
      form.setFieldsValue({
        ...selectedVisit,
        visitDate: selectedVisit.visitDate ? dayjs(selectedVisit.visitDate) : undefined,
        visitEndDate: selectedVisit.visitEndDate ? dayjs(selectedVisit.visitEndDate) : undefined,
        followUpDate: selectedVisit.followUpDate ? dayjs(selectedVisit.followUpDate) : undefined,
        contactId: selectedVisit.contact?.id,
        accountId: selectedVisit.account?.id,
        assignedToId: selectedVisit.assignedTo?.id,
      });
    }
  }, [selectedVisit, editingId, form]);

  const handleValuesChange = (changed: any) => {
    if ('visitDate' in changed || 'visitEndDate' in changed) {
      const start = form.getFieldValue('visitDate');
      const end = form.getFieldValue('visitEndDate');
      if (start && end && end.isAfter(start)) {
        form.setFieldsValue({ duration: end.diff(start, 'minute') });
      }
    }
  };

  const handleSubmit = async () => {
    // 1) Validation des champs — surface les erreurs même sur un onglet non actif
    let values: any;
    try {
      values = await form.validateFields();
    } catch (err: any) {
      const missing = err?.errorFields?.[0]?.errors?.[0];
      message.error(missing || 'Veuillez remplir les champs obligatoires (Type, Sujet, Date de visite).');
      return;
    }

    // 2) Enregistrement — affiche toujours l'erreur serveur (chaîne renvoyée par rejectWithValue)
    const data = {
      ...values,
      visitDate: values.visitDate?.toISOString(),
      visitEndDate: values.visitEndDate?.toISOString(),
      followUpDate: values.followUpDate?.toISOString(),
    };
    try {
      if (editingId) {
        await dispatch(updateVisit({ id: editingId, data })).unwrap();
        message.success('Visite mise à jour');
      } else {
        await dispatch(createVisit(data)).unwrap();
        message.success('Visite créée');
      }
      onSuccess();
    } catch (error: any) {
      message.error(
        typeof error === 'string'
          ? error
          : error?.message || "Erreur lors de l'enregistrement de la visite",
      );
    }
  };

  // ── Voice-to-text Helpers ─────────────────────────────────────────────────────
  const translateToFrench = (arabicText: string) => {
    setIsTranslating(true);
    let translated = '';
    cancelTranslateRef.current = streamChat(
      [{
        role: 'user',
        content: `Traduis ce texte du darija marocain en français professionnel et naturel. Réponds UNIQUEMENT avec la traduction, sans aucune explication ni commentaire.\n\nTexte: ${arabicText}`,
      }],
      (chunk) => { translated += chunk; },
      () => {
        setIsTranslating(false);
        if (translated.trim()) {
          const current = form.getFieldValue('description') || '';
          const separator = current ? '\n' : '';
          form.setFieldValue('description', current + separator + translated.trim());
          message.success({ content: '✅ Traduction ajoutée', key: 'translate', duration: 2 });
        }
      },
      (err) => {
        setIsTranslating(false);
        message.error('Erreur traduction : ' + err);
      },
    );
  };

  const handleVoiceRecord = () => {
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognitionClass) {
      message.warning({ content: '⚠️ Reconnaissance vocale non disponible. Utilisez Chrome ou Edge.', duration: 5 });
      return;
    }
    const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!isSecure) {
      message.warning({ content: '⚠️ La dictée vocale nécessite HTTPS ou localhost.', duration: 5 });
      return;
    }
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
    recognition.onstart  = () => { setIsRecording(true); setVoiceInterim(''); message.info({ content: `🎤 Écoute en cours — ${langLabel}`, key: 'voice', duration: 3 }); };
    recognition.onend    = () => { setIsRecording(false); setVoiceInterim(''); };
    recognition.onerror  = (event: any) => { setIsRecording(false); setVoiceInterim(''); if (event.error !== 'aborted') message.error('Erreur microphone : ' + (event.error || 'inconnue')); };
    recognition.onresult = (event: any) => {
      let interim = '', final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) final += t + ' ';
        else interim += t;
      }
      setVoiceInterim(interim);
      if (final) {
        if (voiceLang === 'ar-MA') {
          setVoiceInterim('');
          message.loading({ content: '🔄 Traduction en cours...', key: 'translate', duration: 0 });
          translateToFrench(final.trim());
        } else {
          const current = form.getFieldValue('description') || '';
          form.setFieldValue('description', current + (current ? '\n' : '') + final.trim());
        }
      }
    };
    recognition.start();
  };

  // ── AI Helpers ────────────────────────────────────────────────────────────────
  const handleAISubject = () => {
    setAiSubjectLoading(true);
    const type = form.getFieldValue('visitType') || 'suivi';
    setTimeout(() => {
      form.setFieldValue('subject', generateAISubject(type));
      setAiSubjectLoading(false);
      message.success('✨ Sujet généré par IA');
    }, 600);
  };

  const handleAIDescription = () => {
    setAiDescLoading(true);
    const type = form.getFieldValue('visitType') || 'suivi';
    const subject = form.getFieldValue('subject') || '';
    const objective = form.getFieldValue('objective') || '';
    setTimeout(() => {
      form.setFieldValue('description', generateAIDescription(type, subject, objective));
      setAiDescLoading(false);
      message.success('✨ Description générée par IA');
    }, 800);
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editingId ? 'Modifier la visite' : 'Nouvelle visite'}
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
        initialValues={{ status: 'planned', visitType: 'suivi' }}
        onValuesChange={handleValuesChange}
      >
        <Tabs type="card" size="small" items={[

          /* ════════ TAB 1 — VISITE ════════ */
          {
            key: 'visite',
            label: <span><FormOutlined /> Visite</span>,
            children: (
              <>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="visitType" label="Type" rules={[{ required: true, message: 'Type requis' }]} style={{ flex: 1 }}>
                    <Select options={VISIT_TYPES.map((t) => ({ value: t.value, label: t.label }))} />
                  </Form.Item>
                  <Form.Item name="status" label="Statut" style={{ flex: 1 }}>
                    <Select options={VISIT_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
                  </Form.Item>
                  <Form.Item name="outcome" label="Résultat" style={{ flex: 1 }}>
                    <Select allowClear options={VISIT_OUTCOMES.map((o) => ({ value: o.value, label: o.label }))} />
                  </Form.Item>
                </div>

                {/* Assigné à — visible uniquement pour admin/superviseur */}
                {isSuperviseur && (
                  <Form.Item name="assignedToId" label="Assigné à">
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
                    placeholder="Ex : Visite de suivi chantier — Casablanca"
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
                <Form.Item name="description" label="Description">
                  <Input.TextArea
                    rows={3}
                    placeholder="Décrivez l'objectif, le contexte, les points à aborder..."
                    style={{ borderColor: isRecording ? '#ff4d4f' : undefined, transition: 'border-color 0.3s' }}
                  />
                </Form.Item>

                {/* Texte intermédiaire vocal — hors Form.Item */}
                {voiceInterim && (
                  <div style={{
                    marginTop: -10, marginBottom: 8, padding: '5px 10px',
                    background: voiceLang === 'ar-MA' ? '#f0f5ff' : '#fff7e6', borderRadius: 6,
                    fontSize: 12, color: voiceLang === 'ar-MA' ? '#1d39c4' : '#ad6800',
                    fontStyle: 'italic',
                    border: `1px dashed ${voiceLang === 'ar-MA' ? '#adc6ff' : '#ffd666'}`,
                    display: 'flex', alignItems: 'center', gap: 6,
                    direction: voiceLang === 'ar-MA' ? 'rtl' : 'ltr',
                  }}>
                    <LoadingOutlined style={{ color: voiceLang === 'ar-MA' ? '#2f54eb' : '#fa8c16' }} />
                    {voiceInterim}
                  </div>
                )}

                {/* Indicateur traduction */}
                {isTranslating && (
                  <div style={{
                    marginTop: -10, marginBottom: 8, padding: '5px 10px',
                    background: '#f9f0ff', borderRadius: 6, fontSize: 12, color: '#531dab',
                    border: '1px dashed #d3adf7', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <LoadingOutlined style={{ color: '#722ed1' }} />
                    Traduction Darija → Français en cours...
                  </div>
                )}

                <div style={{ marginTop: -8, marginBottom: 12, display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                  {isRecording && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#ff4d4f' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff4d4f', display: 'inline-block', animation: 'voicePulse 1.2s infinite' }} />
                      {voiceLang === 'ar-MA' ? 'Écoute Darija...' : 'Écoute en cours...'}
                    </span>
                  )}
                  {/* Toggle FR / AR */}
                  <Tooltip title={voiceLang === 'fr-FR' ? 'Passer en Darija (arabe marocain)' : 'Passer en Français'}>
                    <Button
                      size="small" icon={<GlobalOutlined />}
                      onClick={() => setVoiceLang(v => v === 'fr-FR' ? 'ar-MA' : 'fr-FR')}
                      disabled={isRecording || isTranslating}
                      style={{
                        fontWeight: 600, fontSize: 11,
                        color: voiceLang === 'ar-MA' ? '#1677ff' : '#595959',
                        borderColor: voiceLang === 'ar-MA' ? '#1677ff' : '#d9d9d9',
                        background: voiceLang === 'ar-MA' ? '#e6f4ff' : undefined,
                      }}
                    >
                      {voiceLang === 'fr-FR' ? '🇫🇷 FR' : '🇲🇦 AR'}
                    </Button>
                  </Tooltip>
                  {/* Bouton dictée vocale */}
                  <Tooltip title={isRecording ? 'Arrêter la dictée' : voiceLang === 'ar-MA' ? 'Dicter en Darija → traduit en français' : 'Dicter la description en français'}>
                    <Button
                      size="small"
                      icon={isRecording ? <AudioMutedOutlined /> : <AudioOutlined />}
                      onClick={handleVoiceRecord}
                      loading={isTranslating}
                      disabled={isTranslating}
                      style={{
                        color: isRecording ? '#ff4d4f' : '#52c41a',
                        borderColor: isRecording ? '#ff4d4f' : '#52c41a',
                        background: isRecording ? '#fff1f0' : '#f6ffed',
                        fontWeight: 600,
                      }}
                    >
                      {isRecording ? '⏹ Arrêter' : voiceLang === 'ar-MA' ? '🎤 Darija → FR' : '🎤 Voix → Texte'}
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

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="visitDate" label="Date de visite" rules={[{ required: true, message: 'Date requise' }]} style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="visitEndDate" label="Date de fin" style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="duration" label="Durée (min)" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Auto" disabled />
                  </Form.Item>
                </div>

                <Form.Item name="notes" label="Notes">
                  <Input.TextArea rows={2} />
                </Form.Item>
                <Form.Item name="nextAction" label="Prochaine action">
                  <Input placeholder="Ex : Envoyer une offre, planifier une visite technique..." />
                </Form.Item>
              </>
            ),
          },

          /* ════════ TAB 2 — LIEU ════════ */
          {
            key: 'lieu',
            label: <span><EnvironmentOutlined /> Lieu</span>,
            children: (
              <>
                <Form.Item name="address" label="Adresse">
                  <Input />
                </Form.Item>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                  <Form.Item name="city" label="Ville" style={{ flex: 1 }}>
                    <Input />
                  </Form.Item>
                  <Form.Item label=" " style={{ flex: 0 }}>
                    <GpsLocationPicker
                      compact
                      label="GPS"
                      value={
                        form.getFieldValue('latitude') && form.getFieldValue('longitude')
                          ? { latitude: form.getFieldValue('latitude'), longitude: form.getFieldValue('longitude') }
                          : undefined
                      }
                      onChange={(coords: GpsCoordinates | undefined) => {
                        if (coords) {
                          form.setFieldsValue({ latitude: coords.latitude, longitude: coords.longitude });
                        } else {
                          form.setFieldsValue({ latitude: undefined, longitude: undefined });
                        }
                      }}
                    />
                  </Form.Item>
                </div>
                <Form.Item
                  noStyle
                  shouldUpdate={(prev, cur) => prev.latitude !== cur.latitude || prev.longitude !== cur.longitude}
                >
                  {({ getFieldValue }) => {
                    const lat = getFieldValue('latitude');
                    const lng = getFieldValue('longitude');
                    return (
                      <>
                        <Form.Item name="latitude" hidden><InputNumber /></Form.Item>
                        <Form.Item name="longitude" hidden><InputNumber /></Form.Item>
                        {(lat || lng) && (
                          <div style={{
                            display: 'flex', gap: 12, marginTop: 4,
                          }}>
                            <Form.Item label="Latitude" style={{ flex: 1, marginBottom: 0 }}>
                              <InputNumber
                                value={lat}
                                precision={8}
                                style={{ width: '100%' }}
                                onChange={(v) => form.setFieldsValue({ latitude: v ?? undefined })}
                                addonBefore="↕"
                              />
                            </Form.Item>
                            <Form.Item label="Longitude" style={{ flex: 1, marginBottom: 0 }}>
                              <InputNumber
                                value={lng}
                                precision={8}
                                style={{ width: '100%' }}
                                onChange={(v) => form.setFieldsValue({ longitude: v ?? undefined })}
                                addonBefore="↔"
                              />
                            </Form.Item>
                          </div>
                        )}
                      </>
                    );
                  }}
                </Form.Item>
              </>
            ),
          },

          /* ════════ TAB 3 — COMMERCIAL & SUIVI ════════ */
          {
            key: 'commercial',
            label: <span><ShoppingOutlined /> Commercial & Suivi</span>,
            children: (
              <>
                <Form.Item name="objective" label={<span><AimOutlined /> Objectif de la visite</span>}>
                  <Input placeholder="Ex : Présenter le nouveau catalogue, identifier les besoins..." />
                </Form.Item>

                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item name="interestLevel" label="Niveau d'intérêt" style={{ flex: 1 }}>
                    <Select allowClear placeholder="Sélectionner" options={VISIT_INTEREST_LEVELS.map((l) => ({ value: l.value, label: l.label }))} />
                  </Form.Item>
                  <Form.Item name="satisfaction" label="Satisfaction client (1-5)" style={{ flex: 1 }}>
                    <Rate />
                  </Form.Item>
                </div>

                <Form.Item name="competitorDetected" label="Concurrent détecté">
                  <Input placeholder="Ex : Lafarge, Holcim..." />
                </Form.Item>

                <Form.Item name="productsPresented" label="Produits présentés">
                  <Input.TextArea rows={2} placeholder="Ex : Ciment CPJ 45, Béton prêt à l'emploi..." />
                </Form.Item>

                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item name="estimatedAmount" label="Montant estimé (MAD)" style={{ flex: 1 }}>
                    <InputNumber
                      min={0} style={{ width: '100%' }}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                    />
                  </Form.Item>
                  <Form.Item name="samplesDelivered" label="Échantillons remis" style={{ flex: 1 }}>
                    <Input placeholder="Ex : 3 sacs test" />
                  </Form.Item>
                </div>

                <Divider style={{ margin: '8px 0 16px' }} />

                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item name="transportMode" label={<span><CarOutlined /> Mode de transport</span>} style={{ flex: 1 }}>
                    <Select allowClear placeholder="Sélectionner" options={VISIT_TRANSPORT_MODES.map((t) => ({ value: t.value, label: t.label }))} />
                  </Form.Item>
                  <Form.Item name="mileage" label="Kilométrage (km)" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                <Form.Item name="expenses" label={<span><CreditCardOutlined /> Frais / Dépenses (MAD)</span>}>
                  <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                </Form.Item>

                <Divider style={{ margin: '8px 0 16px' }} />

                <div style={{ display: 'flex', gap: 16 }}>
                  <Form.Item name="followUpDate" label={<span><CalendarOutlined /> Date de relance</span>} style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="followUpPriority" label="Priorité de suivi" style={{ flex: 1 }}>
                    <Select allowClear placeholder="Sélectionner" options={VISIT_FOLLOWUP_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))} />
                  </Form.Item>
                </div>

                <Form.Item name="nextVisitPlanned" label="Prochaine visite planifiée">
                  <Select allowClear options={[{ value: true, label: 'Oui' }, { value: false, label: 'Non' }]} />
                </Form.Item>
              </>
            ),
          },

          /* ════════ TAB 4 — IA ASSISTANT ════════ */
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
                    visitType={getFieldValue('visitType') || 'suivi'}
                    subject={getFieldValue('subject') || ''}
                    objective={getFieldValue('objective') || ''}
                    onApplyReport={(text) => {
                      form.setFieldValue('description', text);
                      message.success('✅ Rapport appliqué à la description');
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
