import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message } from 'antd';
import dayjs from 'dayjs';
import { tasksApi } from '@/api/projects';

const { TextArea } = Input;

interface Props {
  open: boolean;
  projectId: string;
  taskId?: string | null;
  milestones?: { id: string; name: string }[];
  onClose: (refresh?: boolean) => void;
}

export default function TaskFormModal({ open, projectId, taskId, milestones = [], onClose }: Props) {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(taskId);

  useEffect(() => {
    if (!open) return;
    if (isEdit && taskId) {
      tasksApi.getById(taskId).then(t => {
        form.setFieldsValue({
          title: t.title,
          description: t.description,
          priority: t.priority,
          type: t.type,
          status: t.status,
          milestoneId: t.milestoneId,
          estimatedHours: t.estimatedHours,
          actualHours: t.actualHours,
          startDate: t.startDate ? dayjs(t.startDate) : null,
          dueDate: t.dueDate ? dayjs(t.dueDate) : null,
        });
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ projectId });
    }
  }, [open, taskId]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        projectId,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : undefined,
      };
      if (isEdit && taskId) {
        await tasksApi.update(taskId, payload);
        message.success('Tâche mise à jour');
      } else {
        await tasksApi.create(payload);
        message.success('Tâche créée');
      }
      onClose(true);
    } catch {
      message.error('Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Modifier la tâche' : 'Nouvelle tâche'}
      open={open}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      okText={isEdit ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      confirmLoading={submitting}
      width={560}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Form.Item name="title" label="Titre" rules={[{ required: true, message: 'Titre obligatoire' }]}>
          <Input placeholder="Nom de la tâche" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <TextArea rows={2} placeholder="Détails..." />
        </Form.Item>

        <Form.Item label="Type / Priorité" style={{ marginBottom: 0 }}>
          <Form.Item name="type" initialValue="TACHE" style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginRight: 16 }}>
            <Select options={[
              { value: 'TACHE',    label: 'Tâche' },
              { value: 'LIVRABLE', label: 'Livrable' },
              { value: 'REUNION',  label: 'Réunion' },
              { value: 'BUG',      label: 'Bug' },
              { value: 'FEATURE',  label: 'Fonctionnalité' },
            ]} placeholder="Type" />
          </Form.Item>
          <Form.Item name="priority" initialValue="NORMALE" style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}>
            <Select options={[
              { value: 'BASSE',    label: 'Basse' },
              { value: 'NORMALE',  label: 'Normale' },
              { value: 'HAUTE',    label: 'Haute' },
              { value: 'CRITIQUE', label: 'Critique' },
            ]} placeholder="Priorité" />
          </Form.Item>
        </Form.Item>

        {milestones.length > 0 && (
          <Form.Item name="milestoneId" label="Milestone">
            <Select allowClear placeholder="Milestone (optionnel)"
              options={milestones.map(m => ({ value: m.id, label: m.name }))} />
          </Form.Item>
        )}

        <Form.Item label="Dates" style={{ marginBottom: 0 }}>
          <Form.Item name="startDate" style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginRight: 16 }}>
            <DatePicker placeholder="Début" format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dueDate" style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}>
            <DatePicker placeholder="Échéance" format="DD/MM/YYYY" style={{ width: '100%' }} />
          </Form.Item>
        </Form.Item>

        <Form.Item name="estimatedHours" label="Heures estimées">
          <InputNumber placeholder="Ex: 8" min={0} step={0.5} style={{ width: '100%' }} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
