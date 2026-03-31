import { useState, useRef, useEffect } from 'react';
import {
  Card, Tabs, Button, Progress, Tag, Typography, Spin, Space,
  Alert, Input, Avatar, Divider, Row, Col, Form, Select, Descriptions,
} from 'antd';
import {
  RobotOutlined, HeartOutlined, LineChartOutlined,
  MessageOutlined, FileTextOutlined, SendOutlined,
  ReloadOutlined, CopyOutlined, CheckCircleOutlined,
  WarningOutlined, ExclamationCircleOutlined, ThunderboltOutlined,
  EnvironmentOutlined, CalendarOutlined, TeamOutlined,
  UserOutlined, FolderOpenOutlined, BarChartOutlined,
  NumberOutlined, ToolOutlined, AimOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import {
  chantiersApi, ChantierDto, ChantierHealthResponse, ChantierExtractResponse,
} from '@/api/chantiers';
import apiClient from '@/api/client';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  chantier: ChantierDto;
  onUpdate?: () => void; // callback pour recharger la fiche après calcul IA
}

// ── Labels helpers ────────────────────────────────────────────────────────────
const STADE_LABELS: Record<string, string> = {
  ETUDE_CONCEPTION: 'Étude / Conception', AUTORISATION: 'Autorisation',
  GROS_OEUVRE: 'Gros œuvre',             SECOND_OEUVRE: 'Second œuvre',
  PHASE_EQUIPEMENT: 'Phase équipement',   LIVRAISON: 'Livraison',
  CLOTURE: 'Clôturé',
};
const STATUT_COLORS: Record<string, string> = {
  ACTIF: 'green', PRIORITAIRE: 'red', GAGNE: 'blue', PERDU: 'default',
};
const NIVEAU_COLORS: Record<string, string> = {
  FERME: 'red', PARTIELLEMENT_OUVERT: 'orange', LIBRE: 'green',
};
const NIVEAU_LABELS: Record<string, string> = {
  FERME: 'Fermé', PARTIELLEMENT_OUVERT: 'Partiellement ouvert', LIBRE: 'Libre',
};

// ── Context Card : résumé chantier en haut du panel ───────────────────────────
function ChantierContextCard({ chantier }: { chantier: ChantierDto }) {
  return (
    <Card
      size="small"
      style={{ marginBottom: 16, background: '#f9f0ff', border: '1px solid #d3adf7' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 8, background: '#722ed1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <ApartmentOutlined style={{ fontSize: 20, color: '#fff' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14, color: '#531dab', marginBottom: 4 }}>
            {chantier.nom}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {chantier.ville && (
              <span style={{ fontSize: 12, color: '#595959' }}>
                <EnvironmentOutlined /> {chantier.ville}
                {chantier.prefecture ? ` — ${chantier.prefecture}` : ''}
              </span>
            )}
            {chantier.stadeChantier && (
              <Tag color="geekblue" style={{ fontSize: 11 }}>
                {STADE_LABELS[chantier.stadeChantier] || chantier.stadeChantier}
              </Tag>
            )}
            {chantier.statutChantier && (
              <Tag color={STATUT_COLORS[chantier.statutChantier] || 'default'} style={{ fontSize: 11 }}>
                {chantier.statutChantier}
              </Tag>
            )}
            {chantier.niveauOpportunite && (
              <Tag color={NIVEAU_COLORS[chantier.niveauOpportunite] || 'default'} style={{ fontSize: 11 }}>
                {NIVEAU_LABELS[chantier.niveauOpportunite] || chantier.niveauOpportunite}
              </Tag>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 6, fontSize: 11, color: '#8c8c8c' }}>
            {chantier.typeProjet && <span><FolderOpenOutlined /> {chantier.typeProjet.replace(/_/g, ' ')}</span>}
            {chantier.nombreUnites && <span><NumberOutlined /> {chantier.nombreUnites} unités ({chantier.segmentTaille})</span>}
            {chantier.account && <span><ApartmentOutlined /> {chantier.account.name}</span>}
            {chantier.assignedTo && (
              <span><TeamOutlined /> {chantier.assignedTo.fullName}</span>
            )}
            {chantier.dateProchaineAction && (
              <span><CalendarOutlined /> {new Date(chantier.dateProchaineAction).toLocaleDateString('fr-FR')}</span>
            )}
            {chantier.conversionProbability != null && (
              <span style={{ color: '#722ed1', fontWeight: 600 }}>
                <AimOutlined /> Conversion : {chantier.conversionProbability}%
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Health Score Section ──────────────────────────────────────────────────────
function HealthScoreSection({
  chantier, onUpdate,
}: { chantier: ChantierDto; onUpdate?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState<ChantierHealthResponse | null>(
    // Pré-charger depuis la fiche si score déjà calculé
    chantier.healthScore != null ? buildHealthFromScore(chantier.healthScore) : null,
  );

  const labelConfig: Record<string, { text: string; icon: React.ReactNode }> = {
    CRITIQUE:  { text: 'Critique',  icon: <ExclamationCircleOutlined /> },
    A_RISQUE:  { text: 'À risque',  icon: <WarningOutlined /> },
    ATTENTION: { text: 'Attention', icon: <WarningOutlined /> },
    BON:       { text: 'Bon',       icon: <CheckCircleOutlined /> },
    EXCELLENT: { text: 'Excellent', icon: <ThunderboltOutlined /> },
  };

  const colorMap: Record<string, string> = {
    red: '#ff4d4f', orange: '#fa8c16', gold: '#faad14',
    green: '#52c41a', cyan: '#13c2c2',
  };

  const compute = async () => {
    setLoading(true);
    try {
      const data = await chantiersApi.computeHealth(chantier.id);
      setHealth(data);
      onUpdate?.();
    } catch { /* global */ }
    finally { setLoading(false); }
  };

  if (!health) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px' }}>
        <HeartOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 16 }} />
        <br />
        <Text type="secondary">Calculez le score de santé de ce chantier</Text>
        <br /><br />
        <Button type="primary" icon={<HeartOutlined />} onClick={compute} loading={loading} size="large">
          Calculer le score
        </Button>
      </div>
    );
  }

  const cfg = labelConfig[health.label] || labelConfig.ATTENTION;
  const color = colorMap[health.color] || '#52c41a';

  return (
    <div>
      {/* Score principal */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Progress
          type="dashboard"
          percent={health.score}
          strokeColor={color}
          format={() => (
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color }}>{health.score}</div>
              <div style={{ fontSize: 11, color: '#8c8c8c' }}>/ 100</div>
            </div>
          )}
          size={160}
        />
        <br />
        <Tag color={health.color} style={{ fontSize: 14, padding: '4px 16px', marginTop: 8 }}>
          {cfg.icon} {cfg.text}
        </Tag>
        <br />
        <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>{health.detail}</Text>
      </div>

      {/* Détail */}
      <Divider>Détail du score</Divider>
      <Row gutter={[12, 12]}>
        {[
          { label: 'Visites',     score: health.scoreVisites,     max: 25, icon: <EnvironmentOutlined /> },
          { label: 'Pipeline',    score: health.scorePipeline,    max: 25, icon: <ApartmentOutlined /> },
          { label: 'Opportunité', score: health.scoreOpportunite, max: 25, icon: <AimOutlined /> },
          { label: 'Profil',      score: health.scoreProfil,      max: 25, icon: <FileTextOutlined /> },
        ].map(item => (
          <Col span={12} key={item.label}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 20 }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13 }}>{item.label}</div>
              <Progress
                percent={Math.round((item.score / item.max) * 100)}
                size="small"
                strokeColor={item.score >= 18 ? '#52c41a' : item.score >= 10 ? '#faad14' : '#ff4d4f'}
                format={() => `${item.score}/${item.max}`}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Infos chantier utiles */}
      <Divider style={{ marginTop: 16 }}>Données utilisées</Divider>
      <Descriptions size="small" column={2} bordered>
        <Descriptions.Item label="Stade">
          {chantier.stadeChantier ? STADE_LABELS[chantier.stadeChantier] || chantier.stadeChantier : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Opportunité">
          {chantier.niveauOpportunite ? NIVEAU_LABELS[chantier.niveauOpportunite] || chantier.niveauOpportunite : '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Statut">
          {chantier.statutChantier || '—'}
        </Descriptions.Item>
        <Descriptions.Item label="Segment">
          {chantier.segmentTaille || '—'}
          {chantier.nombreUnites ? ` (${chantier.nombreUnites} unités)` : ''}
        </Descriptions.Item>
        {chantier.dateProchaineAction && (
          <Descriptions.Item label="Prochaine action" span={2}>
            {new Date(chantier.dateProchaineAction).toLocaleDateString('fr-FR')}
            {chantier.actionSuivante ? ` — ${chantier.actionSuivante}` : ''}
          </Descriptions.Item>
        )}
      </Descriptions>

      <div style={{ textAlign: 'center', marginTop: 16 }}>
        <Button icon={<ReloadOutlined />} onClick={compute} loading={loading} size="small">
          Recalculer
        </Button>
        {chantier.lastAiAnalysisAt && (
          <Text type="secondary" style={{ marginLeft: 12, fontSize: 11 }}>
            Dernier calcul : {new Date(chantier.lastAiAnalysisAt).toLocaleDateString('fr-FR')}
          </Text>
        )}
      </div>
    </div>
  );
}

// ── AI Analysis Section ───────────────────────────────────────────────────────
function AnalysisSection({
  chantier, onUpdate,
}: { chantier: ChantierDto; onUpdate?: () => void }) {
  const [loading, setLoading] = useState(false);
  // Pré-charger l'analyse déjà stockée en base
  const [analysis, setAnalysis] = useState<string | null>(chantier.aiSummary || null);
  const [copied, setCopied] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const data = await chantiersApi.analyzeChantier(chantier.id);
      setAnalysis(data);
      onUpdate?.();
    } catch { /* global */ }
    finally { setLoading(false); }
  };

  const copy = () => {
    if (analysis) {
      navigator.clipboard.writeText(analysis);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Infos contextuelles affichées avant/après l'analyse
  const contextInfo = (
    <Card size="small" style={{ marginBottom: 12, background: '#fafafa' }}>
      <Row gutter={[8, 4]}>
        {chantier.account && (
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 11 }}>Compte client</Text>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{chantier.account.name}</div>
          </Col>
        )}
        {chantier.typeProjet && (
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 11 }}>Type projet</Text>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{chantier.typeProjet.replace(/_/g, ' ')}</div>
          </Col>
        )}
        {chantier.concurrentFerme && (
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 11 }}>Concurrent</Text>
            <div style={{ fontWeight: 600, fontSize: 12, color: '#cf1322' }}>{chantier.concurrentFerme}</div>
          </Col>
        )}
        {chantier.deciseur && (
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 11 }}>Déciseur</Text>
            <div style={{ fontWeight: 600, fontSize: 12 }}>{chantier.deciseur}</div>
          </Col>
        )}
        {chantier.conversionProbability != null && (
          <Col span={12}>
            <Text type="secondary" style={{ fontSize: 11 }}>Probabilité conversion</Text>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#722ed1' }}>
              {chantier.conversionProbability}%
            </div>
          </Col>
        )}
      </Row>
    </Card>
  );

  if (!analysis && !loading) {
    return (
      <div>
        {contextInfo}
        <div style={{ textAlign: 'center', padding: '24px 20px' }}>
          <LineChartOutlined style={{ fontSize: 48, color: '#bfbfbf', marginBottom: 12 }} />
          <br />
          <Text type="secondary">L'IA analysera ce chantier et proposera des recommandations</Text>
          <br /><br />
          <Button type="primary" icon={<RobotOutlined />} onClick={analyze} size="large">
            Analyser avec l'IA
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {contextInfo}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 32 }}>
          <Spin size="large" />
          <br /><br />
          <Text type="secondary">Analyse de <strong>{chantier.nom}</strong> en cours...</Text>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, gap: 8 }}>
            <Button size="small" icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />} onClick={copy}>
              {copied ? 'Copié !' : 'Copier'}
            </Button>
            <Button size="small" icon={<ReloadOutlined />} onClick={analyze} loading={loading}>
              Relancer
            </Button>
          </div>
          <div style={{
            background: '#fafafa', border: '1px solid #f0f0f0',
            borderRadius: 8, padding: '16px 20px',
            whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: 13,
          }}>
            {analysis}
          </div>
          {chantier.lastAiAnalysisAt && (
            <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 8, textAlign: 'right' }}>
              Analysé le {new Date(chantier.lastAiAnalysisAt).toLocaleString('fr-FR')}
            </Text>
          )}
        </>
      )}
    </div>
  );
}

// ── Chat Section ─────────────────────────────────────────────────────────────
interface ChatMsg { role: 'user' | 'assistant'; content: string; }

function ChatSection({ chantier }: { chantier: ChantierDto }) {
  const intro = [
    `👋 Bonjour ! Je suis votre assistant IA pour le chantier **${chantier.nom}**.`,
    chantier.ville ? `📍 Localisation : ${chantier.ville}${chantier.prefecture ? `, ${chantier.prefecture}` : ''}.` : '',
    chantier.stadeChantier ? `🏗️ Stade actuel : ${STADE_LABELS[chantier.stadeChantier] || chantier.stadeChantier}.` : '',
    chantier.niveauOpportunite ? `🎯 Niveau d'opportunité : ${NIVEAU_LABELS[chantier.niveauOpportunite] || chantier.niveauOpportunite}.` : '',
    `\nPosez-moi vos questions — statut, recommandations, rédaction d'email, analyse concurrentielle...`,
  ].filter(Boolean).join('\n');

  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'assistant', content: intro },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || streaming) return;

    const userMsg: ChatMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setStreaming(true);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const baseURL = (apiClient.defaults.baseURL || '/api/v1').replace(/\/$/, '');

      const response = await fetch(`${baseURL}/ai/chantier/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          chantierId: chantier.id,
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok || !response.body) throw new Error('Stream error');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '' || data === '[DONE]') continue;
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last.role === 'assistant') {
                updated[updated.length - 1] = { ...last, content: last.content + data };
              }
              return updated;
            });
          }
          if (line.startsWith('event: done')) break;
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === 'assistant' && last.content === '') {
          updated[updated.length - 1] = { ...last, content: '❌ Une erreur est survenue. Veuillez réessayer.' };
        }
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  // Suggestions contextuelles selon le chantier
  const suggestions = [
    chantier.niveauOpportunite === 'FERME'
      ? `Comment contrer ${chantier.concurrentFerme || 'le concurrent'} ?`
      : 'Analyse le niveau d\'opportunité',
    `Rédige un email de relance pour ${chantier.account?.name || 'le client'}`,
    'Quels sont les risques principaux ?',
    'Prochaines actions recommandées',
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 420 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 4px', marginBottom: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            display: 'flex',
            justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
            marginBottom: 10,
          }}>
            {msg.role === 'assistant' && (
              <Avatar
                icon={<RobotOutlined />}
                style={{ background: '#722ed1', flexShrink: 0, marginRight: 8, marginTop: 2 }}
                size="small"
              />
            )}
            <div style={{
              maxWidth: '82%',
              background: msg.role === 'user' ? '#1677ff' : '#f5f5f5',
              color: msg.role === 'user' ? '#fff' : '#000',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              padding: '8px 12px',
              fontSize: 13,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
              {msg.role === 'assistant' && streaming && i === messages.length - 1 && (
                <span style={{
                  display: 'inline-block', width: 8, height: 14,
                  background: '#722ed1', marginLeft: 2,
                  verticalAlign: 'text-bottom', borderRadius: 2,
                  animation: 'blink 1s infinite',
                }} />
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div style={{ marginBottom: 8 }}>
          <Space wrap size="small">
            {suggestions.map(s => (
              <Button key={s} size="small" onClick={() => setInput(s)} style={{ fontSize: 11 }}>
                {s}
              </Button>
            ))}
          </Space>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onPressEnter={sendMessage}
          placeholder={`Question sur ${chantier.nom}...`}
          disabled={streaming}
          style={{ borderRadius: 20 }}
        />
        <Button
          type="primary" icon={<SendOutlined />}
          onClick={sendMessage} loading={streaming}
          style={{ borderRadius: 20 }}
        />
      </div>
    </div>
  );
}

// ── Document Extraction Section ───────────────────────────────────────────────
function DocumentExtractSection({ chantier }: { chantier: ChantierDto }) {
  const [documentText, setDocumentText] = useState('');
  const [documentType, setDocumentType] = useState('AUTRE');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChantierExtractResponse | null>(null);

  const extract = async () => {
    if (!documentText.trim()) return;
    setLoading(true);
    try {
      const data = await chantiersApi.extractDocument(documentText, documentType);
      setResult(data);
    } catch { /* global */ }
    finally { setLoading(false); }
  };

  return (
    <div>
      {!result ? (
        <>
          <Alert
            type="info"
            message={`Collez le texte d'un document lié au chantier "${chantier.nom}" et l'IA en extraira les informations clés.`}
            style={{ marginBottom: 16 }}
            showIcon
          />
          <Form layout="vertical">
            <Form.Item label="Type de document">
              <Select value={documentType} onChange={setDocumentType}>
                <Select.Option value="CCTP">CCTP (Cahier des clauses techniques)</Select.Option>
                <Select.Option value="BON_COMMANDE">Bon de commande</Select.Option>
                <Select.Option value="CONTRAT">Contrat</Select.Option>
                <Select.Option value="PLAN">Plan / Notice descriptive</Select.Option>
                <Select.Option value="AUTRE">Autre document</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="Contenu du document">
              <TextArea
                value={documentText}
                onChange={e => setDocumentText(e.target.value)}
                rows={8}
                placeholder="Collez ici le texte du document..."
              />
            </Form.Item>
            <Button
              type="primary" icon={<RobotOutlined />}
              onClick={extract} loading={loading}
              disabled={!documentText.trim()}
              block
            >
              Extraire avec l'IA
            </Button>
          </Form>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'flex-end' }}>
            <Button size="small" onClick={() => setResult(null)}>Nouveau document</Button>
          </div>
          <Row gutter={[12, 12]}>
            {[
              { label: 'Nom du chantier',   value: result.nomChantier,             icon: <ApartmentOutlined /> },
              { label: 'Maître d\'ouvrage', value: result.maitrOuvrage,            icon: <UserOutlined /> },
              { label: 'Ville',             value: result.ville,                   icon: <EnvironmentOutlined /> },
              { label: 'Type de projet',    value: result.typeProjet,              icon: <FolderOpenOutlined /> },
              { label: 'Stade',             value: result.stadeChantier,           icon: <BarChartOutlined /> },
              { label: 'Nb unités',         value: result.nombreUnites?.toString(), icon: <NumberOutlined /> },
            ].filter(item => item.value).map(item => (
              <Col span={12} key={item.label}>
                <Card size="small">
                  <Text type="secondary" style={{ fontSize: 11 }}>{item.icon} {item.label}</Text>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{item.value}</div>
                </Card>
              </Col>
            ))}
          </Row>
          {result.productsDetected && (
            <Card size="small" style={{ marginTop: 12 }} title={<span><ToolOutlined /> Produits détectés</span>}>
              <Text>{result.productsDetected}</Text>
            </Card>
          )}
          {result.contacts && (
            <Card size="small" style={{ marginTop: 8 }} title={<span><TeamOutlined /> Contacts détectés</span>}>
              <Text>{result.contacts}</Text>
            </Card>
          )}
          {result.delais && (
            <Card size="small" style={{ marginTop: 8 }} title={<span><CalendarOutlined /> Délais</span>}>
              <Text>{result.delais}</Text>
            </Card>
          )}
          {result.rawSummary && (
            <Card size="small" style={{ marginTop: 8 }} title={<span><FileTextOutlined /> Résumé IA</span>}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{result.rawSummary}</Text>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ── Helper : construire un ChantierHealthResponse minimal depuis un score stocké ──
function buildHealthFromScore(score: number): ChantierHealthResponse {
  let label: ChantierHealthResponse['label'];
  let color: ChantierHealthResponse['color'];
  let detail: string;

  if (score >= 85)      { label = 'EXCELLENT'; color = 'cyan';   detail = 'Chantier très bien suivi avec un fort potentiel commercial.'; }
  else if (score >= 65) { label = 'BON';       color = 'green';  detail = 'Chantier en bonne santé. Quelques points d\'amélioration possibles.'; }
  else if (score >= 45) { label = 'ATTENTION'; color = 'gold';   detail = 'Chantier nécessitant une attention particulière.'; }
  else if (score >= 25) { label = 'A_RISQUE';  color = 'orange'; detail = 'Chantier à risque. Une action corrective est recommandée.'; }
  else                  { label = 'CRITIQUE';  color = 'red';    detail = 'Chantier en situation critique. Intervention urgente requise.'; }

  // On ne connaît pas le détail des sous-scores — on affiche 0 (recalcul recommandé)
  return { score, label, color, detail, scoreVisites: 0, scorePipeline: 0, scoreOpportunite: 0, scoreProfil: 0 };
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function ChantierAiPanel({ chantier, onUpdate }: Props) {
  // Guard: chantier peut être null pendant le chargement initial
  if (!chantier) return null;

  return (
    <Card
      style={{ borderRadius: 12 }}
      styles={{ body: { padding: '0 16px 16px' } }}
      title={
        <Space>
          <RobotOutlined style={{ color: '#722ed1' }} />
          <span style={{ color: '#722ed1' }}>Intelligence Artificielle</span>
          <Tag color="purple" style={{ fontSize: 10 }}>BETA</Tag>
          {chantier.healthScore != null && (
            <Tag
              color={chantier.healthScore >= 65 ? 'green' : chantier.healthScore >= 45 ? 'gold' : 'red'}
              style={{ fontSize: 11 }}
            >
              Score santé : {chantier.healthScore}/100
            </Tag>
          )}
        </Space>
      }
    >
      <ChantierContextCard chantier={chantier} />

      <Tabs
        defaultActiveKey="health"
        items={[
          {
            key: 'health',
            label: <span><HeartOutlined /> Santé</span>,
            children: <HealthScoreSection chantier={chantier} onUpdate={onUpdate} />,
          },
          {
            key: 'analysis',
            label: (
              <span>
                <LineChartOutlined /> Analyse
                {chantier.aiSummary && <Tag color="purple" style={{ marginLeft: 4, fontSize: 10 }}>✓</Tag>}
              </span>
            ),
            children: <AnalysisSection chantier={chantier} onUpdate={onUpdate} />,
          },
          {
            key: 'chat',
            label: <span><MessageOutlined /> Chat IA</span>,
            children: <ChatSection chantier={chantier} />,
          },
          {
            key: 'extract',
            label: <span><FileTextOutlined /> Documents</span>,
            children: <DocumentExtractSection chantier={chantier} />,
          },
        ]}
      />
    </Card>
  );
}
