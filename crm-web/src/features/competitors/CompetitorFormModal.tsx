import { useEffect } from 'react';
import { Modal, Form, Input, Switch, message } from 'antd';

import { useAppDispatch } from '@/store';
import { createCompetitor, updateCompetitor } from './competitorsSlice';
import { Competitor } from '@/types/competitor';

interface Props {
  open: boolean;
  competitor: Competitor | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CompetitorFormModal({ open, competitor, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const isEdit = !!competitor;

  useEffect(() => {
    if (open) {
      if (competitor) {
        form.setFieldsValue({
          name: competitor.name,
          website: competitor.website,
          description: competitor.description,
          strengths: competitor.strengths,
          weaknesses: competitor.weaknesses,
          isActive: competitor.isActive,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, competitor, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      if (isEdit) {
        await dispatch(updateCompetitor({ id: competitor!.id, data: values })).unwrap();
        message.success('Concurrent mis à jour');
      } else {
        await dispatch(createCompetitor(values)).unwrap();
        message.success('Concurrent créé');
      }
      onSuccess();
    } catch {
      // validation errors handled by antd
    }
  };

  return (
    <Modal
      title={isEdit ? 'Modifier le concurrent' : 'Ajouter un concurrent'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" initialValues={{ isActive: true }}>
        <Form.Item name="name" label="Nom" rules={[{ required: true, message: 'Le nom est obligatoire' }]}>
          <Input placeholder="Nom du concurrent" />
        </Form.Item>

        <Form.Item name="website" label="Site web">
          <Input placeholder="https://www.exemple.com" />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={2} placeholder="Description du concurrent" />
        </Form.Item>

        <Form.Item name="strengths" label="Points forts">
          <Input.TextArea rows={3} placeholder="Forces, avantages compétitifs..." />
        </Form.Item>

        <Form.Item name="weaknesses" label="Points faibles">
          <Input.TextArea rows={3} placeholder="Faiblesses, inconvénients..." />
        </Form.Item>

        {isEdit && (
          <Form.Item name="isActive" label="Actif" valuePropName="checked">
            <Switch checkedChildren="Actif" unCheckedChildren="Inactif" />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
