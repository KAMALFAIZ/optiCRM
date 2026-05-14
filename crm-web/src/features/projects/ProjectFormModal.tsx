import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, DatePicker, InputNumber, message, Spin } from 'antd';
import dayjs from 'dayjs';
import { projectsApi } from '@/api/projects';

const { TextArea } = Input;

interface Props {
  open: boolean;
  projectId?: string | null;
  onClose: (refresh?: boolean) => void;
}

export default function ProjectFormModal({ open, projectId, onClose }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(projectId);

  useEffect(() => {
    if (!open) return;
    if (isEdit && projectId) {
      setLoading(true);
      projectsApi.getById(projectId).then(p => {
        form.setFieldsValue({
          name: p.name,
          description: p.description,
          status: p.status,
          startDate: p.startDate ? dayjs(p.startDate) : null,
          endDate: p.endDate ? dayjs(p.endDate) : null,
          budget: p.budget,
          accountId: p.account?.id,
          managerId: p.manager?.id,
        });
      }).finally(() => setLoading(false));
    } else {
      form.resetFields();
    }
  }, [open, projectId]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : undefined,
        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : undefined,
      };
      if (isEdit && projectId) {
        await projectsApi.update(projectId, payload);
        message.success('Projet mis à jour');
      } else {
        await projectsApi.create(payload);
        message.success('Projet créé');
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
      title={isEdit ? 'Modifier le projet' : 'Nouveau projet'}
      open={open}
      onCancel={() => onClose(false)}
      onOk={handleSubmit}
      okText={isEdit ? 'Enregistrer' : 'Créer'}
      cancelText="Annuler"
      confirmLoading={submitting}
      width={600}
      destroyOnHidden
    >
      {loading ? <Spin style={{ display: 'block', textAlign: 'center' }} /> : (
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Nom du projet" rules={[{ required: true, message: 'Nom obligatoire' }]}>
            <Input placeholder="Ex: Refonte site web client ABC" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Objectifs, périmètre..." />
          </Form.Item>

          {isEdit && (
            <Form.Item name="status" label="Statut">
              <Select options={[
                { value: 'DRAFT',    label: 'Brouillon' },
                { value: 'ACTIF',    label: 'Actif' },
                { value: 'EN_PAUSE', label: 'En pause' },
                { value: 'TERMINE',  label: 'Terminé' },
                { value: 'ANNULE',   label: 'Annulé' },
              ]} />
            </Form.Item>
          )}

          <Form.Item label="Période" style={{ marginBottom: 0 }}>
            <Form.Item name="startDate" style={{ display: 'inline-block', width: 'calc(50% - 8px)', marginRight: 16 }}>
              <DatePicker placeholder="Date début" format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="endDate" style={{ display: 'inline-block', width: 'calc(50% - 8px)' }}>
              <DatePicker placeholder="Date fin" format="DD/MM/YYYY" style={{ width: '100%' }} />
            </Form.Item>
          </Form.Item>

          <Form.Item name="budget" label="Budget (MAD)">
            <InputNumber
              style={{ width: '100%' }}
              placeholder="Budget estimé"
              formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}
              min={0}
            />
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
}
