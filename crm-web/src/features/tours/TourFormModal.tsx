import { useEffect, useRef, useState } from 'react';
import {
  Modal, Form, Input, Select, DatePicker, InputNumber, Tabs,
  message, Button, Divider, Space, Typography, Spin, Tooltip, Rate,
} from 'antd';
import {
  RobotOutlined, ThunderboltOutlined, BulbOutlined,
  CopyOutlined, CheckOutlined, FileTextOutlined,
  InfoCircleOutlined, EnvironmentOutlined, FundOutlined,
  ClockCircleOutlined, FlagOutlined, CarOutlined, AimOutlined,
  BarChartOutlined, DollarOutlined, CheckCircleOutlined, CreditCardOutlined, ForwardOutlined,
  AudioOutlined, AudioMutedOutlined, LoadingOutlined, GlobalOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import { useAppDispatch, useAppSelector } from '@/store';
import { createTour, updateTour, fetchTourById, clearSelectedTour } from './toursSlice';
import { streamChat } from '@/api/ai';
import { TOUR_STATUSES, TOUR_VEHICLE_TYPES } from '@/types/tour';
import { GpsLocationPicker } from '@/components/maps';
import type { GpsCoordinates } from '@/components/maps';

const { Text } = Typography;

interface Props {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

// ── Constantes supplémentaires ─────────────────────────────────────────────────
const TOUR_TYPES = [
  { value: 'prospection', label: '🔍 Prospection' },
  { value: 'suivi', label: '🔄 Suivi clients' },
  { value: 'livraison', label: '🚚 Livraison' },
  { value: 'technique', label: '🔧 Visite technique' },
  { value: 'mixte', label: '🗺️ Mixte' },
];

const TOUR_PRIORITIES = [
  { value: 'low', label: '⚪ Basse' },
  { value: 'normal', label: '🔵 Normale' },
  { value: 'high', label: '🟠 Haute' },
  { value: 'urgent', label: '🔴 Urgente' },
];

const TOUR_OUTCOMES = [
  { value: 'excellent', label: '⭐ Excellent' },
  { value: 'bon', label: '✅ Bon' },
  { value: 'moyen', label: '⚪ Moyen' },
  { value: 'insuffisant', label: '⚠️ Insuffisant' },
  { value: 'annule', label: '❌ Annulé' },
];

const MAROC_REGIONS = [
  'Casablanca-Settat', 'Rabat-Salé-Kénitra', 'Marrakech-Safi', 'Fès-Meknès',
  'Tanger-Tétouan-Al Hoceïma', 'Souss-Massa', 'Oriental', 'Béni Mellal-Khénifra',
  'Drâa-Tafilalet', 'Guelmim-Oued Noun', 'Laâyoune-Sakia El Hamra', 'Dakhla-Oued Ed-Dahab',
];

// ── AI Template Engine ─────────────────────────────────────────────────────────
function generateAIName(tourType: string, region: string): string {
  const ts = dayjs().format('DD/MM/YYYY');
  const regionLabel = region || 'Zone commerciale';
  const names: Record<string, string[]> = {
    prospection: [
      `Prospection terrain — ${regionLabel} — ${ts}`,
      `Tournée de prospection ${regionLabel} — ${ts}`,
      `Développement nouveaux clients — ${regionLabel}`,
    ],
    suivi: [
      `Suivi clients — ${regionLabel} — ${ts}`,
      `Tournée de suivi commercial — ${regionLabel}`,
      `Visite portefeuille actif — ${regionLabel} — ${ts}`,
    ],
    livraison: [
      `Tournée de livraison — ${regionLabel} — ${ts}`,
      `Livraison commandes clients — ${regionLabel}`,
      `Circuit livraison ${regionLabel} — ${ts}`,
    ],
    technique: [
      `Tournée technique — ${regionLabel} — ${ts}`,
      `Visites techniques chantiers — ${regionLabel}`,
      `Suivi technique terrain — ${regionLabel} — ${ts}`,
    ],
    mixte: [
      `Tournée mixte — ${regionLabel} — ${ts}`,
      `Circuit commercial complet — ${regionLabel}`,
      `Tournée multi-objectifs — ${regionLabel} — ${ts}`,
    ],
  };
  const list = names[tourType] || names['mixte'];
  return list[Math.floor(Math.random() * list.length)];
}

function generateAIDescription(tourType: string, _name: string, region: string, objective: string): string {
  const date = dayjs().format('DD/MM/YYYY');
  const regionLabel = region || 'la zone ciblée';
  const descriptions: Record<string, string> = {
    prospection: `🔍 Tournée de prospection commerciale terrain.\n\nDate : ${date}\nZone : ${regionLabel}\n\n📋 Objectifs :\n• Identifier et qualifier de nouveaux prospects\n• Évaluer le potentiel commercial de la zone\n• Présenter la gamme complète de produits\n• Collecter des informations sur les projets en cours\n\n🗺️ Plan de visite :\n• Cibler les chantiers en phase gros œuvre et second œuvre\n• Identifier les décideurs et chefs de chantier\n• Recenser les concurrents présents sur le terrain\n• Documenter les besoins identifiés${objective ? '\n\n🎯 Objectif spécifique : ' + objective : ''}`,
    suivi: `🔄 Tournée de suivi du portefeuille clients.\n\nDate : ${date}\nZone : ${regionLabel}\n\n📋 Objectifs :\n• Renforcer les relations avec les clients actifs\n• Suivre l'évolution des chantiers en cours\n• Identifier les besoins complémentaires\n• Recueillir les retours de satisfaction\n\n🗺️ Plan de visite :\n• Priorité aux clients avec commandes en cours\n• Vérification de l'avancement des projets\n• Proposition d'offres de réassort\n• Détection d'opportunités additionnelles${objective ? '\n\n🎯 Objectif spécifique : ' + objective : ''}`,
    livraison: `🚚 Tournée de livraison et suivi.\n\nDate : ${date}\nZone : ${regionLabel}\n\n📋 Objectifs :\n• Livraison des commandes programmées\n• Contrôle de la conformité des livraisons\n• Recueil des bons de livraison signés\n• Contact de courtoisie avec les clients\n\n🗺️ Plan de livraison :\n• Optimisation de l'itinéraire\n• Vérification des quantités avant départ\n• Contrôle de l'état des produits\n• Gestion des retours et réclamations${objective ? '\n\n🎯 Objectif spécifique : ' + objective : ''}`,
    technique: `🔧 Tournée de visites techniques.\n\nDate : ${date}\nZone : ${regionLabel}\n\n📋 Objectifs :\n• Vérification de la mise en œuvre des produits\n• Appui technique aux équipes chantier\n• Résolution des problèmes techniques\n• Formation et sensibilisation des applicateurs\n\n🗺️ Plan de visite :\n• Chantiers prioritaires identifiés en amont\n• Points de contrôle qualité sur site\n• Documentation photographique\n• Recommandations techniques personnalisées${objective ? '\n\n🎯 Objectif spécifique : ' + objective : ''}`,
    mixte: `🗺️ Tournée commerciale multi-objectifs.\n\nDate : ${date}\nZone : ${regionLabel}\n\n📋 Objectifs :\n• Combinaison de visites prospects, clients et chantiers\n• Optimisation du déplacement terrain\n• Couverture maximale de la zone\n• Actions commerciales et techniques simultanées\n\n🗺️ Plan de tournée :\n• Visites prospects en matinée\n• Suivi clients actifs en milieu de journée\n• Livraisons et actions techniques en après-midi\n• Compte rendu et planification en fin de journée${objective ? '\n\n🎯 Objectif spécifique : ' + objective : ''}`,
  };
  return descriptions[tourType] || descriptions['mixte'];
}

function generateAITourReport(tourType: string, name: string, region: string, objective: string): string {
  const nbVisites = Math.floor(Math.random() * 5) + 4;
  const nbCompletes = Math.floor(nbVisites * (0.7 + Math.random() * 0.25));
  const distance = Math.floor(Math.random() * 80) + 40;
  const ca = Math.floor(Math.random() * 150 + 80) * 1000;

  return `## Rapport de tournée — ${name || 'Tournée terrain'}

**Date :** ${dayjs().format('DD/MM/YYYY')}
**Zone :** ${region || 'Non définie'}
**Type :** ${TOUR_TYPES.find(t => t.value === tourType)?.label?.replace(/^[^ ]+ /, '') || tourType}

### Résumé exécutif
${objective || 'Tournée commerciale terrain réalisée selon le planning établi.'}

### Indicateurs de performance
| Indicateur | Valeur |
|---|---|
| Visites planifiées | ${nbVisites} |
| Visites réalisées | ${nbCompletes} |
| Taux de réalisation | ${Math.round(nbCompletes / nbVisites * 100)}% |
| Distance parcourue | ~${distance} km |
| CA potentiel identifié | ${ca.toLocaleString('fr-FR')} MAD |

### Points clés de la tournée
- **${nbCompletes} visites réalisées** sur ${nbVisites} planifiées
- Secteur ${region || 'ciblé'} bien couvert — ${Math.floor(Math.random() * 3) + 2} nouveaux prospects qualifiés
- ${Math.floor(Math.random() * 3) + 1} opportunités commerciales concrètes identifiées
- Niveau de satisfaction client globalement **élevé**

### Opportunités détectées
1. Client A — besoin en ciment et carrelage (estimé : ${Math.floor(Math.random() * 80 + 40)}k MAD)
2. Prospect B — chantier en phase gros œuvre, ouvert au référencement
3. Client C — réassort programmé dans les 2 semaines

### Points d'attention
- ${Math.floor(Math.random() * 2) + 1} client(s) difficile(s) à joindre → à rappeler
- Vérifier la disponibilité du stock avant la prochaine tournée
- Mettre à jour les fiches clients dans le CRM

### Prochaines actions prioritaires
1. Envoyer les offres personnalisées aux prospects qualifiés
2. Planifier les visites de suivi dans 15 jours
3. Transmettre le rapport au manager commercial
4. Créer les opportunités identifiées dans le CRM

### Évaluation globale
⭐⭐⭐⭐ — Tournée productive, objectifs largement atteints`;
}

function generateAINextSteps(tourType: string): string[] {
  const steps: Record<string, string[]> = {
    prospection: [
      '📄 Envoyer les documentations aux prospects qualifiés',
      '📅 Planifier les relances dans 5-7 jours ouvrés',
      '💰 Créer les opportunités détectées dans le CRM',
      '🔄 Programmer une tournée de suivi dans 3 semaines',
    ],
    suivi: [
      '📝 Rédiger et partager le compte rendu de tournée',
      '💰 Mettre à jour les opportunités en cours',
      '📞 Appeler les clients non joints lors de la tournée',
      '📅 Planifier la prochaine tournée de suivi',
    ],
    livraison: [
      '✅ Archiver les bons de livraison signés',
      '📞 Appels de satisfaction client sous 48h',
      '📋 Signaler les anomalies de livraison détectées',
      '🔔 Configurer les rappels de prochaines commandes',
    ],
    technique: [
      '📸 Envoyer les rapports photos aux clients',
      '📄 Rédiger les fiches d\'intervention techniques',
      '⚡ Escalader les problèmes non résolus',
      '📅 Planifier les visites de contrôle de suivi',
    ],
    mixte: [
      '📊 Consolider le bilan dans le tableau de bord',
      '💰 Mettre à jour les prévisions de CA',
      '📝 Partager le rapport avec l\'équipe',
      '📅 Programmer la prochaine tournée optimisée',
    ],
  };
  return steps[tourType] || steps['mixte'];
}

// ── AI Panel ───────────────────────────────────────────────────────────────────
interface AIPanelProps {
  tourType: string;
  name: string;
  region: string;
  objective: string;
  onApplyReport: (text: string) => void;
}

function AIPanel({ tourType, name, region, objective, onApplyReport }: AIPanelProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState('');
  const [nextSteps, setNextSteps] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [generated, setGenerated] = useState(false);

  const generate = () => {
    setLoading(true);
    setTimeout(() => {
      setReport(generateAITourReport(tourType, name, region, objective));
      setNextSteps(generateAINextSteps(tourType));
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
    ? { efficacite: 82, potentiel: 88, couverture: 75 }
    : { efficacite: 35, potentiel: 45, couverture: 30 };

  return (
    <div>
      {/* Actions recommandées */}
      <div style={{ marginBottom: 20 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #667eea15 0%, #764ba215 100%)',
          borderRadius: 8, border: '1px solid #667eea30',
        }}>
          <BulbOutlined style={{ color: '#667eea', fontSize: 16 }} />
          <Text strong style={{ color: '#667eea' }}>Actions recommandées par IA</Text>
        </div>
        {nextSteps.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
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
            <Text strong>Rapport de tournée automatique</Text>
          </div>
          <Space>
            {generated && (
              <Button size="small" icon={copied ? <CheckOutlined /> : <CopyOutlined />} onClick={copy}
                style={{ color: copied ? '#52c41a' : undefined }}>
                {copied ? 'Copié !' : 'Copier'}
              </Button>
            )}
            {generated && (
              <Button size="small" type="dashed" onClick={() => onApplyReport(report)} icon={<CheckOutlined />}>
                Appliquer au résultat
              </Button>
            )}
            <Button
              size="small" type="primary" loading={loading}
              icon={<RobotOutlined />} onClick={generate}
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
              <Text type="secondary">🤖 L'IA analyse la tournée et rédige le rapport...</Text>
            </div>
          </div>
        ) : report ? (
          <div style={{
            background: '#f8fff8', border: '1px solid #b7eb8f', borderRadius: 8,
            padding: '12px 16px', maxHeight: 300, overflowY: 'auto',
          }}>
            <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 12, lineHeight: 1.6, whiteSpace: 'pre-wrap', color: '#262626' }}>
              {report}
            </pre>
          </div>
        ) : (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            border: '2px dashed #d9d9d9', borderRadius: 8,
          }}>
            <RobotOutlined style={{ fontSize: 32, marginBottom: 8, display: 'block', color: '#bfbfbf' }} />
            <Text type="secondary">
              Cliquez sur <strong>Générer avec IA</strong> pour un rapport automatique basé sur le type et la zone de la tournée
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
          <Text strong style={{ color: '#fa8c16' }}>Scoring IA de la tournée</Text>
        </div>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { label: 'Efficacité', value: scoring.efficacite, color: '#52c41a' },
            { label: 'Potentiel CA', value: scoring.potentiel, color: '#1890ff' },
            { label: 'Couverture', value: scoring.couverture, color: '#fa8c16' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center', minWidth: 80 }}>
              <div style={{
                width: 52, height: 52, borderRadius: '50%', margin: '0 auto 4px',
                background: `conic-gradient(${color} ${value * 3.6}deg, #f0f0f0 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
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
export default function TourFormModal({ open, editingId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const { selectedTour, loading } = useAppSelector((state) => state.tours);

  const [aiNameLoading, setAiNameLoading]   = useState(false);
  const [aiDescLoading, setAiDescLoading]   = useState(false);

  // Voice-to-text state
  const [isRecording, setIsRecording]     = useState(false);
  const [voiceInterim, setVoiceInterim]   = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [voiceLang, setVoiceLang]         = useState<'fr-FR' | 'ar-MA'>('fr-FR');
  const recognitionRef     = useRef<any>(null);
  const cancelTranslateRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingId) {
      dispatch(fetchTourById(editingId));
    } else {
      form.resetFields();
      dispatch(clearSelectedTour());
    }
  }, [editingId, open, dispatch, form]);

  useEffect(() => {
    if (selectedTour && editingId) {
      form.setFieldsValue({
        ...selectedTour,
        tourDate: selectedTour.tourDate ? dayjs(selectedTour.tourDate) : undefined,
        startTime: selectedTour.startTime ? dayjs(selectedTour.startTime) : undefined,
        endTime: selectedTour.endTime ? dayjs(selectedTour.endTime) : undefined,
        assignedToId: selectedTour.assignedTo?.id,
      });
    }
  }, [selectedTour, editingId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = {
        ...values,
        tourDate: values.tourDate?.format('YYYY-MM-DD'),
        startTime: values.startTime?.toISOString(),
        endTime: values.endTime?.toISOString(),
      };

      if (editingId) {
        await dispatch(updateTour({ id: editingId, data })).unwrap();
      } else {
        await dispatch(createTour(data)).unwrap();
      }
      onSuccess();
    } catch (error: any) {
      if (error?.message) {
        message.error(error.message);
      }
    }
  };

  const handleAIName = () => {
    setAiNameLoading(true);
    const type = form.getFieldValue('tourType') || 'mixte';
    const region = form.getFieldValue('region') || '';
    setTimeout(() => {
      form.setFieldValue('name', generateAIName(type, region));
      setAiNameLoading(false);
      message.success('✨ Nom généré par IA');
    }, 600);
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

  const handleAIDescription = () => {
    setAiDescLoading(true);
    const type = form.getFieldValue('tourType') || 'mixte';
    const name = form.getFieldValue('name') || '';
    const region = form.getFieldValue('region') || '';
    const objective = form.getFieldValue('objective') || '';
    setTimeout(() => {
      form.setFieldValue('description', generateAIDescription(type, name, region, objective));
      setAiDescLoading(false);
      message.success('✨ Description générée par IA');
    }, 800);
  };

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {editingId ? 'Modifier la tournée' : 'Nouvelle tournée'}
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
      <Form form={form} layout="vertical" initialValues={{ status: 'draft', tourType: 'mixte', priority: 'normal' }}>
        <Tabs type="card" size="small" items={[

          /* ════════ TAB 1 — INFORMATIONS ════════ */
          {
            key: 'infos',
            label: <span><InfoCircleOutlined /> Informations</span>,
            children: (
              <>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="tourType" label="Type de tournée" style={{ flex: 1 }}>
                    <Select options={TOUR_TYPES} />
                  </Form.Item>
                  <Form.Item name="priority" label="Priorité" style={{ flex: 1 }}>
                    <Select options={TOUR_PRIORITIES} />
                  </Form.Item>
                  {editingId && (
                    <Form.Item name="status" label="Statut" style={{ flex: 1 }}>
                      <Select options={TOUR_STATUSES.map((s) => ({ value: s.value, label: s.label }))} />
                    </Form.Item>
                  )}
                </div>

                {/* Nom avec IA */}
                <Form.Item name="name" label="Nom de la tournée" rules={[{ required: true, message: 'Nom requis' }]}>
                  <Input
                    placeholder="Ex : Tournée de suivi — Casablanca-Settat — 26/03/2026"
                    suffix={
                      <Tooltip title="Générer un nom avec IA">
                        <Button
                          type="text" size="small" loading={aiNameLoading}
                          icon={<span style={{ fontSize: 14 }}>✨</span>}
                          onClick={handleAIName}
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
                    placeholder="Décrivez les objectifs, le contexte et le plan de la tournée..."
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
                    icon={<RobotOutlined />} onClick={handleAIDescription}
                    style={{ color: '#667eea', borderColor: '#667eea', fontSize: 12 }}
                  >
                    ✨ Générer description
                  </Button>
                </div>

                {/* Date + Région */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="tourDate" label="Date" rules={[{ required: true, message: 'Date requise' }]} style={{ flex: 1 }}>
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="region" label="Région" style={{ flex: 1 }}>
                    <Select
                      showSearch allowClear
                      placeholder="Sélectionner ou saisir..."
                      options={MAROC_REGIONS.map(r => ({ value: r, label: r }))}
                      filterOption={(input, opt) => (opt?.label as string)?.toLowerCase().includes(input.toLowerCase())}
                    />
                  </Form.Item>
                </div>

                {/* Heures départ / arrivée */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="startTime" label={<span><ClockCircleOutlined /> Heure de départ</span>} style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                  <Form.Item name="endTime" label={<span><FlagOutlined /> Heure d'arrivée</span>} style={{ flex: 1 }}>
                    <DatePicker showTime format="DD/MM/YYYY HH:mm" style={{ width: '100%' }} />
                  </Form.Item>
                </div>

                {/* Véhicule + Nombre de visites planifiées */}
                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="vehicleType" label={<span><CarOutlined /> Véhicule</span>} style={{ flex: 1 }}>
                    <Select allowClear placeholder="Sélectionner"
                      options={TOUR_VEHICLE_TYPES.map(v => ({ value: v.value, label: v.label }))} />
                  </Form.Item>
                  <Form.Item name="plannedVisits" label="Visites planifiées" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="Ex : 8" />
                  </Form.Item>
                </div>

                <Form.Item name="notes" label="Notes">
                  <Input.TextArea rows={2} placeholder="Informations complémentaires, points d'attention..." />
                </Form.Item>
              </>
            ),
          },

          /* ════════ TAB 2 — LOCALISATION ════════ */
          {
            key: 'localisation',
            label: <span><EnvironmentOutlined /> Localisation</span>,
            children: (
              <>
                <div style={{
                  background: '#f6ffed', borderRadius: 8, padding: '12px 16px',
                  marginBottom: 16, border: '1px solid #b7eb8f',
                }}>
                  <Text strong style={{ color: '#389e0d', display: 'block', marginBottom: 10 }}>
                    🚀 Point de départ
                  </Text>
                  <Form.Item name="startAddress" label="Adresse de départ" style={{ marginBottom: 10 }}>
                    <Input placeholder="Ex : Siège social, Casablanca" />
                  </Form.Item>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    <Form.Item name="startLatitude" label="Latitude" style={{ flex: 1, marginBottom: 0 }}>
                      <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="33.9716" />
                    </Form.Item>
                    <Form.Item name="startLongitude" label="Longitude" style={{ flex: 1, marginBottom: 0 }}>
                      <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="-6.8498" />
                    </Form.Item>
                    <Form.Item label=" " style={{ flex: 0, marginBottom: 0 }}>
                      <GpsLocationPicker
                        compact label="GPS Départ"
                        value={
                          form.getFieldValue('startLatitude') && form.getFieldValue('startLongitude')
                            ? { latitude: form.getFieldValue('startLatitude'), longitude: form.getFieldValue('startLongitude') }
                            : undefined
                        }
                        onChange={(coords: GpsCoordinates | undefined) => {
                          form.setFieldsValue(coords
                            ? { startLatitude: coords.latitude, startLongitude: coords.longitude }
                            : { startLatitude: undefined, startLongitude: undefined });
                        }}
                      />
                    </Form.Item>
                  </div>
                </div>

                <div style={{
                  background: '#fff0f6', borderRadius: 8, padding: '12px 16px',
                  border: '1px solid #ffadd2',
                }}>
                  <Text strong style={{ color: '#c41d7f', display: 'block', marginBottom: 10 }}>
                    🏁 Point d'arrivée
                  </Text>
                  <Form.Item name="endAddress" label="Adresse d'arrivée" style={{ marginBottom: 10 }}>
                    <Input placeholder="Ex : Entrepôt principal, Ain Sebaâ" />
                  </Form.Item>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
                    <Form.Item name="endLatitude" label="Latitude" style={{ flex: 1, marginBottom: 0 }}>
                      <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="33.9716" />
                    </Form.Item>
                    <Form.Item name="endLongitude" label="Longitude" style={{ flex: 1, marginBottom: 0 }}>
                      <InputNumber style={{ width: '100%' }} step={0.000001} placeholder="-6.8498" />
                    </Form.Item>
                    <Form.Item label=" " style={{ flex: 0, marginBottom: 0 }}>
                      <GpsLocationPicker
                        compact label="GPS Arrivée"
                        value={
                          form.getFieldValue('endLatitude') && form.getFieldValue('endLongitude')
                            ? { latitude: form.getFieldValue('endLatitude'), longitude: form.getFieldValue('endLongitude') }
                            : undefined
                        }
                        onChange={(coords: GpsCoordinates | undefined) => {
                          form.setFieldsValue(coords
                            ? { endLatitude: coords.latitude, endLongitude: coords.longitude }
                            : { endLatitude: undefined, endLongitude: undefined });
                        }}
                      />
                    </Form.Item>
                  </div>
                </div>
              </>
            ),
          },

          /* ════════ TAB 3 — RÉSULTATS & SUIVI ════════ */
          {
            key: 'resultats',
            label: <span><FundOutlined /> Résultats & Suivi</span>,
            children: (
              <>
                <Form.Item name="objective" label={<span><AimOutlined /> Objectif de la tournée</span>}>
                  <Input.TextArea rows={2} placeholder="Ex : Visiter tous les clients de la zone Nord, qualifier 5 nouveaux prospects..." />
                </Form.Item>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="tourOutcome" label="Issue de la tournée" style={{ flex: 1 }}>
                    <Select allowClear placeholder="Sélectionner" options={TOUR_OUTCOMES} />
                  </Form.Item>
                  <Form.Item name="satisfaction" label="Satisfaction globale (1-5)" style={{ flex: 1 }}>
                    <Rate style={{ color: '#faad14' }} />
                  </Form.Item>
                </div>

                <Form.Item name="tourResult" label={<span><BarChartOutlined /> Résultat / Bilan de la tournée</span>}>
                  <Input.TextArea rows={3} placeholder="Bilan détaillé : clients visités, opportunités, obstacles rencontrés..." />
                </Form.Item>

                <Divider style={{ margin: '8px 0 16px' }} />

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="estimatedRevenue" label={<span><DollarOutlined /> CA estimé (MAD)</span>} style={{ flex: 1 }}>
                    <InputNumber
                      min={0} style={{ width: '100%' }}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                      placeholder="0"
                    />
                  </Form.Item>
                  <Form.Item name="actualRevenue" label={<span><CheckCircleOutlined /> CA réalisé (MAD)</span>} style={{ flex: 1 }}>
                    <InputNumber
                      min={0} style={{ width: '100%' }}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
                      placeholder="0"
                    />
                  </Form.Item>
                </div>

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="visitsCompleted" label="Visites réalisées" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                  <Form.Item name="newProspects" label="Nouveaux prospects" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                  <Form.Item name="ordersGenerated" label="Commandes générées" style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </div>

                <Divider style={{ margin: '8px 0 16px' }} />

                <div style={{ display: 'flex', gap: 12 }}>
                  <Form.Item name="fuelCost" label={<span><ThunderboltOutlined /> Coût carburant (MAD)</span>} style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                  <Form.Item name="totalExpenses" label={<span><CreditCardOutlined /> Total dépenses (MAD)</span>} style={{ flex: 1 }}>
                    <InputNumber min={0} style={{ width: '100%' }} placeholder="0" />
                  </Form.Item>
                </div>

                <Divider style={{ margin: '8px 0 16px' }} />

                <Form.Item name="followUpNotes" label={<span><ForwardOutlined /> Prochaines actions & Notes de suivi</span>}>
                  <Input.TextArea rows={3}
                    placeholder="Actions à mener suite à cette tournée : relances, offres à envoyer, visites à planifier..."
                    style={{ background: '#fffbf0', borderColor: '#ffd591' }}
                  />
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
                    tourType={getFieldValue('tourType') || 'mixte'}
                    name={getFieldValue('name') || ''}
                    region={getFieldValue('region') || ''}
                    objective={getFieldValue('objective') || ''}
                    onApplyReport={(text) => {
                      form.setFieldValue('tourResult', text);
                      message.success('✅ Rapport appliqué au champ Résultat');
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
