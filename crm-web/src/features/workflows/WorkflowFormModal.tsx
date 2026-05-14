/**
 * WorkflowFormModal — Création / modification d'un workflow.
 *
 * Structure :
 *  - En-tête : métadonnées (nom, description, entité, déclencheur)
 *  - Corps   : WorkflowBuilderCanvas (éditeur visuel)
 *
 * Le canvas gère ses propres steps/transitions en interne ;
 * on récupère les valeurs finales via le callback `onChange`.
 */
import { useEffect, useRef, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, Row, Col, Divider, Typography, Tooltip } from 'antd';
import { NodeIndexOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { WorkflowStep, WorkflowTransition } from '@/types/workflow';
import { useAppDispatch, useAppSelector } from '@/store';
import { createWorkflow, updateWorkflow, fetchWorkflowById, clearSelectedWorkflow } from './workflowsSlice';
import { ENTITY_TYPES, TRIGGER_TYPES } from '@/types/workflow';
import WorkflowBuilderCanvas from './WorkflowBuilderCanvas';
import { useMessage } from '@/hooks/useMessage';

const { Text } = Typography;

interface Props {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkflowFormModal({ open, editingId, onClose, onSuccess }: Props) {
  const dispatch = useAppDispatch();
  const { selectedWorkflow } = useAppSelector(s => s.workflows);
  const { message } = useMessage();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Holds the latest steps/transitions produced by the canvas
  const stepsRef = useRef<WorkflowStep[]>([]);
  const transitionsRef = useRef<WorkflowTransition[]>([]);

  // Key to force canvas re-mount when editing a different workflow
  const [canvasKey, setCanvasKey] = useState(0);
  const [initialSteps, setInitialSteps] = useState<WorkflowStep[]>([]);
  const [initialTransitions, setInitialTransitions] = useState<WorkflowTransition[]>([]);

  // ── Load workflow for edit ──────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;                         // Form not mounted until Modal opens
    if (editingId) {
      dispatch(fetchWorkflowById(editingId));
    } else {
      dispatch(clearSelectedWorkflow());
      form.resetFields();
      setInitialSteps([]);
      setInitialTransitions([]);
      stepsRef.current = [];
      transitionsRef.current = [];
      setCanvasKey(k => k + 1);
    }
  }, [editingId, open, dispatch, form]);

  useEffect(() => {
    if (!open) return;                         // guard: Modal not yet rendered
    if (selectedWorkflow && editingId) {
      form.setFieldsValue({
        name:          selectedWorkflow.name,
        description:   selectedWorkflow.description,
        entityType:    selectedWorkflow.entityType,
        triggerType:   selectedWorkflow.triggerType,
        triggerConfig: selectedWorkflow.triggerConfig,
      });

      // Normalize transitions — backend may use fromStepId/toStepId instead of indices
      const wfSteps = selectedWorkflow.steps ?? [];
      const wfTransitions = (selectedWorkflow.transitions ?? []).map(t => {
        // If backend returns indices already, use them; otherwise map IDs → indices
        if (t.fromStepIndex !== undefined && t.toStepIndex !== undefined) return t;
        const from = wfSteps.findIndex(s => s.id === t.fromStepId);
        const to   = wfSteps.findIndex(s => s.id === t.toStepId);
        return { ...t, fromStepIndex: from >= 0 ? from : undefined, toStepIndex: to >= 0 ? to : undefined };
      });

      setInitialSteps(wfSteps);
      setInitialTransitions(wfTransitions);
      stepsRef.current = wfSteps;
      transitionsRef.current = wfTransitions;
      setCanvasKey(k => k + 1);
    }
  }, [selectedWorkflow, editingId, form]);

  // ── Callback from canvas ────────────────────────────────────────────────────
  const handleCanvasChange = (steps: WorkflowStep[], transitions: WorkflowTransition[]) => {
    stepsRef.current = steps;
    transitionsRef.current = transitions;
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const stepsPayload = stepsRef.current.map((s, i) => ({
        name:        s.name || `Étape ${i + 1}`,
        stepType:    s.stepType,
        actionConfig: s.actionConfig ?? '{}',
        stepOrder:   i,
        positionX:   Math.round(s.positionX ?? i * 200),
        positionY:   Math.round(s.positionY ?? 100),
        isEntryPoint: i === 0,
      }));

      const transitionsPayload = transitionsRef.current
        .filter(t => t.fromStepIndex !== undefined && t.toStepIndex !== undefined)
        .map(t => ({
          fromStepIndex:      t.fromStepIndex!,
          toStepIndex:        t.toStepIndex!,
          label:              t.label ?? 'Suivant',
          conditionExpression: t.conditionExpression,
          evalOrder:          t.evalOrder,
        }));

      const data = {
        ...values,
        steps:       stepsPayload,
        transitions: transitionsPayload,
      };

      if (editingId) {
        await dispatch(updateWorkflow({ id: editingId, data })).unwrap();
        message.success('Workflow mis à jour');
      } else {
        await dispatch(createWorkflow(data)).unwrap();
        message.success('Workflow créé');
      }

      onSuccess();
    } catch (err: any) {
      if (err?.errorFields || err?.message === undefined) return; // form validation
      message.error(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Demo workflow ───────────────────────────────────────────────────────────
  /**
   * Scénario : "Qualification & Nurturing de Lead"
   * Déclencheur : changement de statut du lead
   * Flow :
   *   [CONDITION] Score ≥ 60 ?
   *      ├─ OUI → [SEND_EMAIL] Email haute priorité
   *      └─ NON → [CREATE_TASK] Tâche de relance commerciale
   *                  ↘
   *               [DELAY] Attendre 3 jours
   *                  ↓
   *          [SEND_NOTIFICATION] Notifier le manager
   */
  const DEMO_STEPS: WorkflowStep[] = [
    {
      name: 'Vérifier le score du lead',
      stepType: 'CONDITION',
      actionConfig: JSON.stringify({ field: 'score', operator: '>=', value: 60 }, null, 2),
      stepOrder: 0, isEntryPoint: true,
      positionX: 240, positionY: 30,
    },
    {
      name: 'Email haute priorité',
      stepType: 'SEND_EMAIL',
      actionConfig: JSON.stringify({ templateId: 'lead-hot', subject: 'Votre demande est prioritaire !' }, null, 2),
      stepOrder: 1, isEntryPoint: false,
      positionX: 30, positionY: 200,
    },
    {
      name: 'Tâche de relance commerciale',
      stepType: 'CREATE_TASK',
      actionConfig: JSON.stringify({ title: 'Relance lead froid', assignTo: 'commercial', dueInDays: 2 }, null, 2),
      stepOrder: 2, isEntryPoint: false,
      positionX: 450, positionY: 200,
    },
    {
      name: 'Attendre 3 jours',
      stepType: 'DELAY',
      actionConfig: JSON.stringify({ unit: 'days', value: 3 }, null, 2),
      stepOrder: 3, isEntryPoint: false,
      positionX: 240, positionY: 370,
    },
    {
      name: 'Notifier le responsable',
      stepType: 'SEND_NOTIFICATION',
      actionConfig: JSON.stringify({ channel: 'email', to: 'manager', message: 'Lead qualifié en attente de traitement' }, null, 2),
      stepOrder: 4, isEntryPoint: false,
      positionX: 240, positionY: 540,
    },
  ];

  const DEMO_TRANSITIONS: WorkflowTransition[] = [
    { fromStepIndex: 0, toStepIndex: 1, label: 'Score ≥ 60' },
    { fromStepIndex: 0, toStepIndex: 2, label: 'Score < 60' },
    { fromStepIndex: 1, toStepIndex: 3, label: 'Suivant' },
    { fromStepIndex: 2, toStepIndex: 3, label: 'Suivant' },
    { fromStepIndex: 3, toStepIndex: 4, label: 'Après délai' },
  ];

  const loadDemo = () => {
    form.setFieldsValue({
      name:          'Qualification & Nurturing de Lead',
      description:   'Évalue le score du lead et déclenche un email prioritaire ou une tâche de relance, puis notifie le manager après 3 jours.',
      entityType:    'LEAD',
      triggerType:   'STATUS_CHANGED',
      triggerConfig: JSON.stringify({ field: 'status', newValue: 'NEW' }, null, 2),
    });
    setInitialSteps([...DEMO_STEPS]);
    setInitialTransitions([...DEMO_TRANSITIONS]);
    stepsRef.current = [...DEMO_STEPS];
    transitionsRef.current = [...DEMO_TRANSITIONS];
    setCanvasKey(k => k + 1);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <Modal
      title={
        <Space>
          <NodeIndexOutlined style={{ color: '#1890ff' }} />
          {editingId ? 'Modifier le workflow' : 'Nouveau workflow'}
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={1120}
      style={{ top: 24 }}
      styles={{ body: { maxHeight: 'calc(100vh - 180px)', overflowY: 'auto', paddingTop: 8 } }}
      footer={[
        <Button key="cancel" onClick={onClose}>Annuler</Button>,
        <Button key="submit" type="primary" loading={saving} onClick={handleSubmit}>
          {editingId ? 'Enregistrer' : 'Créer le workflow'}
        </Button>,
      ]}
      destroyOnHidden
    >
      {/* ── Metadata ─────────────────────────────────────────────────────── */}
      <Form form={form} layout="vertical">
        <Row gutter={16}>
          <Col span={10}>
            <Form.Item
              name="name"
              label="Nom du workflow"
              rules={[{ required: true, message: 'Le nom est obligatoire' }]}
            >
              <Input placeholder="Ex : Nurturing de lead" />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="entityType" label="Type d'entité" rules={[{ required: true }]}>
              <Select placeholder="Sélectionner…" options={ENTITY_TYPES} />
            </Form.Item>
          </Col>
          <Col span={7}>
            <Form.Item name="triggerType" label="Déclencheur" rules={[{ required: true }]}>
              <Select placeholder="Sélectionner…" options={TRIGGER_TYPES} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={14}>
            <Form.Item name="description" label="Description" style={{ marginBottom: 8 }}>
              <Input.TextArea rows={2} placeholder="Description du workflow…" />
            </Form.Item>
          </Col>
          <Col span={10}>
            <Form.Item name="triggerConfig" label="Config. déclencheur (JSON)" style={{ marginBottom: 8 }}>
              <Input.TextArea
                rows={2}
                placeholder='{"field":"status","newValue":"qualified"}'
                style={{ fontFamily: 'monospace', fontSize: 12 }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {/* ── Visual canvas ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', margin: '8px 0 12px', gap: 12 }}>
        <Divider style={{ flex: 1, margin: 0 }}>
          <Space size={4}>
            <NodeIndexOutlined />
            <Text style={{ fontSize: 13, fontWeight: 600 }}>Éditeur de flux visuel</Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              (glisser · connecter · Suppr pour effacer)
            </Text>
          </Space>
        </Divider>

        {!editingId && (
          <Tooltip title="Charge un workflow de démonstration «&nbsp;Qualification de Lead&nbsp;» avec 5 étapes connectées">
            <Button
              size="small"
              icon={<ThunderboltOutlined />}
              onClick={loadDemo}
              style={{ flexShrink: 0, borderColor: '#722ed1', color: '#722ed1' }}
            >
              Charger démo
            </Button>
          </Tooltip>
        )}
      </div>

      <WorkflowBuilderCanvas
        key={canvasKey}
        initialSteps={initialSteps}
        initialTransitions={initialTransitions}
        onChange={handleCanvasChange}
      />
    </Modal>
  );
}
