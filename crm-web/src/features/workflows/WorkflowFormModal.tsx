import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, Button, Space, message, Divider, Card, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { createWorkflow, updateWorkflow, fetchWorkflowById, clearSelectedWorkflow } from './workflowsSlice';
import { ENTITY_TYPES, TRIGGER_TYPES, STEP_TYPES, WorkflowStep } from '@/types/workflow';

interface Props {
  open: boolean;
  editingId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function WorkflowFormModal({ open, editingId, onClose, onSuccess }: Props) {
  const dispatch = useAppDispatch();
  const { selectedWorkflow } = useAppSelector(s => s.workflows);
  const [form] = Form.useForm();
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingId && open) {
      dispatch(fetchWorkflowById(editingId));
    } else {
      dispatch(clearSelectedWorkflow());
      form.resetFields();
      setSteps([]);
    }
  }, [editingId, open, dispatch, form]);

  useEffect(() => {
    if (selectedWorkflow && editingId) {
      form.setFieldsValue({
        name: selectedWorkflow.name,
        description: selectedWorkflow.description,
        entityType: selectedWorkflow.entityType,
        triggerType: selectedWorkflow.triggerType,
        triggerConfig: selectedWorkflow.triggerConfig,
      });
      setSteps(selectedWorkflow.steps || []);
    }
  }, [selectedWorkflow, editingId, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const stepsPayload = steps.map((s, i) => ({
        name: s.name,
        stepType: s.stepType,
        actionConfig: s.actionConfig,
        stepOrder: i,
        positionX: s.positionX || i * 200,
        positionY: s.positionY || 100,
        isEntryPoint: i === 0,
      }));

      // Build simple linear transitions
      const transitionsPayload = steps.slice(0, -1).map((_, i) => ({
        fromStepIndex: i,
        toStepIndex: i + 1,
        label: 'Suivant',
      }));

      const data = {
        ...values,
        steps: stepsPayload,
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
      if (err?.message) message.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const addStep = () => {
    setSteps([...steps, {
      name: '',
      stepType: 'SEND_NOTIFICATION',
      actionConfig: '{}',
      stepOrder: steps.length,
    }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, field: keyof WorkflowStep, value: any) => {
    const updated = [...steps];
    updated[index] = { ...updated[index], [field]: value };
    setSteps(updated);
  };

  return (
    <Modal
      title={editingId ? 'Modifier le workflow' : 'Nouveau workflow'}
      open={open}
      onCancel={onClose}
      width={720}
      footer={[
        <Button key="cancel" onClick={onClose}>Annuler</Button>,
        <Button key="submit" type="primary" loading={saving} onClick={handleSubmit}>
          {editingId ? 'Enregistrer' : 'Créer'}
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="name" label="Nom du workflow" rules={[{ required: true, message: 'Le nom est obligatoire' }]}>
          <Input placeholder="Ex: Nurturing de lead" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Description du workflow..." />
        </Form.Item>

        <Space size="large" className="w-full" style={{ display: 'flex' }}>
          <Form.Item name="entityType" label="Type d'entité" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select placeholder="Sélectionner..." options={ENTITY_TYPES} />
          </Form.Item>
          <Form.Item name="triggerType" label="Déclencheur" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select placeholder="Sélectionner..." options={TRIGGER_TYPES} />
          </Form.Item>
        </Space>

        <Form.Item name="triggerConfig" label="Configuration du déclencheur (JSON)">
          <Input.TextArea rows={2} placeholder='{"field": "status", "newValue": "qualified"}' />
        </Form.Item>
      </Form>

      <Divider>Étapes du workflow</Divider>

      {steps.map((step, index) => (
        <Card
          key={index}
          size="small"
          className="mb-3"
          title={
            <Space>
              <Tag color="blue">{index + 1}</Tag>
              {STEP_TYPES.find(st => st.value === step.stepType)?.label || step.stepType}
            </Space>
          }
          extra={
            <Button type="text" danger icon={<DeleteOutlined />} onClick={() => removeStep(index)} size="small" />
          }
        >
          <Space direction="vertical" className="w-full">
            <Input
              placeholder="Nom de l'étape"
              value={step.name}
              onChange={e => updateStep(index, 'name', e.target.value)}
            />
            <Select
              value={step.stepType}
              onChange={v => updateStep(index, 'stepType', v)}
              options={STEP_TYPES.map(st => ({ value: st.value, label: st.label }))}
              style={{ width: '100%' }}
            />
            <Input.TextArea
              rows={2}
              placeholder='Configuration JSON: {"templateId": "...", "userId": "..."}'
              value={step.actionConfig}
              onChange={e => updateStep(index, 'actionConfig', e.target.value)}
            />
          </Space>
        </Card>
      ))}

      <Button type="dashed" onClick={addStep} icon={<PlusOutlined />} block>
        Ajouter une étape
      </Button>
    </Modal>
  );
}
