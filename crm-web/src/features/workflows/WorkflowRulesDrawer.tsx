/**
 * WorkflowRulesDrawer — Affiche les règles de gestion d'un workflow
 * en langage naturel (lisible par un utilisateur métier).
 *
 * Pour chaque étape :
 *  - Type d'action (icône + couleur)
 *  - Résumé de la configuration en français
 *  - Transitions sortantes avec conditions/labels
 */
import { useEffect, useState } from 'react';
import {
  Drawer, Spin, Tag, Typography, Space, Divider,
  Timeline, Badge, Alert, Descriptions,
} from 'antd';
import {
  MailOutlined, CheckSquareOutlined, CalendarOutlined, EditFilled,
  BellOutlined, ClockCircleOutlined, ForkOutlined, AuditOutlined,
  RobotOutlined, ApiOutlined, ArrowRightOutlined, ThunderboltOutlined,
  PlayCircleOutlined,
} from '@ant-design/icons';
import { workflowsApi } from '@/api/workflows';
import { Workflow, WorkflowStep, WorkflowTransition, STEP_TYPES, ENTITY_TYPES, TRIGGER_TYPES } from '@/types/workflow';

const { Text, Paragraph } = Typography;

// ── Icônes ────────────────────────────────────────────────────────────────────

const STEP_ICON: Record<string, React.ReactNode> = {
  SEND_EMAIL:          <MailOutlined />,
  CREATE_TASK:         <CheckSquareOutlined />,
  CREATE_ACTIVITY:     <CalendarOutlined />,
  UPDATE_ENTITY:       <EditFilled />,
  SEND_NOTIFICATION:   <BellOutlined />,
  DELAY:               <ClockCircleOutlined />,
  CONDITION:           <ForkOutlined />,
  APPROVAL:            <AuditOutlined />,
  AI_ACTION:           <RobotOutlined />,
  WEBHOOK:             <ApiOutlined />,
};

function stepColor(type: string) {
  return STEP_TYPES.find(s => s.value === type)?.color ?? '#8c8c8c';
}
function stepLabel(type: string) {
  return STEP_TYPES.find(s => s.value === type)?.label ?? type;
}

// ── Traduction opérateurs ─────────────────────────────────────────────────────

const OPS: Record<string, string> = {
  '>=': '≥', '<=': '≤', '>': '>', '<': '<',
  '=': '=', '==': '=', '!=': '≠', '<>': '≠',
  'contains': 'contient', 'startsWith': 'commence par', 'endsWith': 'finit par',
  'in': 'est parmi',
};

// ── Résumé lisible par type de step ──────────────────────────────────────────

function summarizeConfig(stepType: string, raw?: string): React.ReactNode[] {
  let cfg: Record<string, any> = {};
  try { cfg = raw ? JSON.parse(raw) : {}; } catch { return []; }

  const rows: React.ReactNode[] = [];
  const R = (label: string, value: React.ReactNode) =>
    rows.push(
      <div key={label} style={{ marginBottom: 3 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>{label} : </Text>
        <Text style={{ fontSize: 12 }}>{value}</Text>
      </div>
    );

  switch (stepType) {
    case 'CONDITION':
      if (cfg.field) R('Condition', <>
        <Tag>{cfg.field}</Tag>
        <Tag color="blue">{OPS[cfg.operator] ?? cfg.operator ?? '?'}</Tag>
        <Tag color="orange">{String(cfg.value ?? '')}</Tag>
      </>);
      break;

    case 'SEND_EMAIL':
      if (cfg.templateId) R('Template', <Tag>{cfg.templateId}</Tag>);
      if (cfg.subject)    R('Sujet', <em>"{cfg.subject}"</em>);
      if (cfg.to)         R('Destinataire', cfg.to);
      break;

    case 'CREATE_TASK':
      if (cfg.title)      R('Titre', <em>"{cfg.title}"</em>);
      if (cfg.assignTo)   R('Assigné à', <Tag>{cfg.assignTo}</Tag>);
      if (cfg.dueInDays)  R('Délai', `${cfg.dueInDays} jour(s)`);
      if (cfg.priority)   R('Priorité', cfg.priority);
      break;

    case 'CREATE_ACTIVITY':
      if (cfg.type)       R('Type', cfg.type);
      if (cfg.subject)    R('Objet', cfg.subject);
      if (cfg.assignTo)   R('Assigné à', <Tag>{cfg.assignTo}</Tag>);
      break;

    case 'UPDATE_ENTITY':
      Object.entries(cfg).forEach(([k, v]) =>
        R(`Champ "${k}"`, <Tag color="orange">{String(v)}</Tag>)
      );
      break;

    case 'SEND_NOTIFICATION':
      if (cfg.to)       R('Destinataire', <Tag>{cfg.to}</Tag>);
      if (cfg.channel)  R('Canal', <Tag color="purple">{cfg.channel}</Tag>);
      if (cfg.message)  R('Message', <em>"{cfg.message}"</em>);
      break;

    case 'DELAY':
      if (cfg.value && cfg.unit)
        R('Durée', <Tag color="default">{cfg.value} {cfg.unit}</Tag>);
      else if (cfg.minutes) R('Durée', `${cfg.minutes} minute(s)`);
      else if (cfg.hours)   R('Durée', `${cfg.hours} heure(s)`);
      else if (cfg.days)    R('Durée', `${cfg.days} jour(s)`);
      break;

    case 'APPROVAL':
      if (cfg.approverRole) R('Approbateur', <Tag>{cfg.approverRole}</Tag>);
      if (cfg.timeout)      R('Délai max.', `${cfg.timeout} heure(s)`);
      if (cfg.message)      R('Message', <em>"{cfg.message}"</em>);
      break;

    case 'AI_ACTION':
      if (cfg.model)  R('Modèle IA', <Tag color="purple">{cfg.model}</Tag>);
      if (cfg.prompt) R('Instruction', <em>"{cfg.prompt}"</em>);
      break;

    case 'WEBHOOK':
      if (cfg.method) R('Méthode', <Tag>{cfg.method}</Tag>);
      if (cfg.url)    R('URL', <Text code style={{ fontSize: 11 }}>{cfg.url}</Text>);
      break;

    default:
      Object.entries(cfg).forEach(([k, v]) => R(k, String(v)));
  }

  return rows;
}

// ── Résumé du déclencheur ─────────────────────────────────────────────────────

function TriggerSummary({ workflow }: { workflow: Workflow }) {
  const entityLabel  = ENTITY_TYPES.find(e => e.value === workflow.entityType)?.label  ?? workflow.entityType;
  const triggerLabel = TRIGGER_TYPES.find(t => t.value === workflow.triggerType)?.label ?? workflow.triggerType;
  let cfg: Record<string, any> = {};
  try { cfg = workflow.triggerConfig ? JSON.parse(workflow.triggerConfig) : {}; } catch { /* noop */ }

  return (
    <div style={{
      background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 8,
      padding: '12px 16px', marginBottom: 20,
    }}>
      <Space wrap>
        <PlayCircleOutlined style={{ color: '#52c41a', fontSize: 16 }} />
        <Text strong>Déclencheur</Text>
        <Tag color="blue">{entityLabel}</Tag>
        <Text type="secondary">—</Text>
        <Tag color="green">{triggerLabel}</Tag>
        {cfg.field && <>
          <Text type="secondary">si</Text>
          <Tag>{cfg.field}</Tag>
          {cfg.newValue && <><Text type="secondary">→</Text><Tag color="orange">{cfg.newValue}</Tag></>}
          {cfg.value    && <><Tag color="blue">{OPS[cfg.operator] ?? cfg.operator ?? '='}</Tag><Tag color="orange">{cfg.value}</Tag></>}
        </>}
      </Space>
    </div>
  );
}

// ── Carte d'une étape ─────────────────────────────────────────────────────────

function StepCard({
  step,
  index,
  transitions,
  allSteps,
}: {
  step: WorkflowStep;
  index: number;
  transitions: WorkflowTransition[];
  allSteps: WorkflowStep[];
}) {
  const color   = stepColor(step.stepType);
  const label   = stepLabel(step.stepType);
  const icon    = STEP_ICON[step.stepType] ?? <ApiOutlined />;
  const summary = summarizeConfig(step.stepType, step.actionConfig);

  // Transitions sortantes de cette étape
  const outgoing = transitions.filter(t => t.fromStepIndex === index);

  return (
    <div style={{
      border: `1.5px solid ${color}`,
      borderRadius: 10,
      marginBottom: 12,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        background: color,
        padding: '7px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ color: '#fff', fontSize: 14 }}>{icon}</span>
        <Text style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>
          {label}
        </Text>
        {step.isEntryPoint && (
          <Tag color="success" style={{ marginLeft: 'auto', fontSize: 10, padding: '0 6px' }}>
            Point d'entrée
          </Tag>
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px', background: '#fff' }}>
        <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
          {step.name || <span style={{ color: '#bfbfbf' }}>Sans nom</span>}
        </Text>

        {summary.length > 0 ? (
          <div style={{
            background: '#fafafa', borderRadius: 6, padding: '8px 10px', marginBottom: 8,
          }}>
            {summary}
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 8 }}>
            Aucune configuration définie
          </Text>
        )}

        {/* Transitions sortantes */}
        {outgoing.length > 0 && (
          <div>
            {outgoing.map((t, i) => {
              const nextStep = t.toStepIndex !== undefined ? allSteps[t.toStepIndex] : null;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: '#595959', marginTop: 4,
                }}>
                  <ArrowRightOutlined style={{ color }} />
                  {t.label && (
                    <Tag color="processing" style={{ fontSize: 11, margin: 0 }}>
                      {t.label}
                    </Tag>
                  )}
                  {t.conditionExpression && (
                    <Text code style={{ fontSize: 11 }}>{t.conditionExpression}</Text>
                  )}
                  {nextStep && (
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      → Étape {(t.toStepIndex ?? 0) + 1} : <strong>{nextStep.name}</strong>
                    </Text>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {outgoing.length === 0 && (
          <div style={{ fontSize: 11, color: '#52c41a', marginTop: 4 }}>
            ✓ Fin du workflow
          </div>
        )}
      </div>
    </div>
  );
}

// ── Drawer principal ──────────────────────────────────────────────────────────

interface Props {
  workflowId: string | null;
  open: boolean;
  onClose: () => void;
}

export default function WorkflowRulesDrawer({ workflowId, open, onClose }: Props) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    if (!open || !workflowId) return;
    setLoading(true);
    setError(null);
    setWorkflow(null);
    workflowsApi
      .getById(workflowId!)
      .then(wf => setWorkflow(wf))
      .catch(() => setError('Impossible de charger le workflow'))
      .finally(() => setLoading(false));
  }, [open, workflowId]);

  const steps       = workflow?.steps       ?? [];
  const transitions = workflow?.transitions ?? [];

  // Normalise les transitions : si backend renvoie fromStepId/toStepId, converti en index
  const normTrans: WorkflowTransition[] = transitions.map(t => {
    if (t.fromStepIndex !== undefined && t.toStepIndex !== undefined) return t;
    const from = steps.findIndex(s => s.id === t.fromStepId);
    const to   = steps.findIndex(s => s.id === t.toStepId);
    return { ...t, fromStepIndex: from >= 0 ? from : undefined, toStepIndex: to >= 0 ? to : undefined };
  });

  return (
    <Drawer
      title={
        <Space>
          <ThunderboltOutlined style={{ color: '#1890ff' }} />
          <span>Règles de gestion</span>
          {workflow && (
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              — {workflow.name}
            </Text>
          )}
        </Space>
      }
      open={open}
      onClose={onClose}
      width={520}
      styles={{ body: { padding: '16px 20px' } }}
    >
      {loading && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <Spin size="large" />
          <div style={{ marginTop: 12, color: '#8c8c8c' }}>Chargement des règles…</div>
        </div>
      )}

      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

      {workflow && !loading && (
        <>
          {/* Infos générales */}
          <Descriptions size="small" column={2} style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Version">
              <Tag>v{workflow.version}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Statut">
              <Badge
                status={workflow.isActive ? 'success' : 'default'}
                text={workflow.isActive ? 'Actif' : 'Inactif'}
              />
            </Descriptions.Item>
            <Descriptions.Item label="Étapes">{steps.length}</Descriptions.Item>
            <Descriptions.Item label="Transitions">{transitions.length}</Descriptions.Item>
          </Descriptions>

          {workflow.description && (
            <Paragraph type="secondary" style={{ fontSize: 13, marginBottom: 16 }}>
              {workflow.description}
            </Paragraph>
          )}

          {/* Déclencheur */}
          <TriggerSummary workflow={workflow} />

          {/* Étapes */}
          <Divider style={{ margin: '12px 0' }}>
            <Text style={{ fontSize: 13 }}>
              Étapes ({steps.length})
            </Text>
          </Divider>

          {steps.length === 0 ? (
            <Text type="secondary">Aucune étape configurée</Text>
          ) : (
            <Timeline
              items={steps.map((step, i) => ({
                color: stepColor(step.stepType),
                dot: (
                  <span style={{ color: stepColor(step.stepType), fontSize: 14 }}>
                    {STEP_ICON[step.stepType] ?? <ApiOutlined />}
                  </span>
                ),
                children: (
                  <StepCard
                    key={step.id ?? i}
                    step={step}
                    index={i}
                    transitions={normTrans}
                    allSteps={steps}
                  />
                ),
              }))}
            />
          )}
        </>
      )}
    </Drawer>
  );
}
