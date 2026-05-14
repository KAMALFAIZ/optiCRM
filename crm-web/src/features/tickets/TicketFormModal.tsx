import { useEffect, useState } from 'react';
import { Modal, Form, Input, Select, message, Spin, Button, Alert } from 'antd';
import { RobotOutlined } from '@ant-design/icons';
import { ticketsApi } from '@/api/tickets';
import { classifyTicket, type ClassifyTicketResponse } from '@/api/ai';

const { TextArea } = Input;

interface Props {
  open: boolean;
  ticketId?: string | null;
  defaultAccountId?: string;
  defaultContactId?: string;
  onClose: (refresh?: boolean) => void;
}

export default function TicketFormModal({ open, ticketId, defaultAccountId, defaultContactId, onClose }: Props) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<ClassifyTicketResponse | null>(null);
  const isEdit = Boolean(ticketId);

  useEffect(() => {
    if (!open) return;
    if (isEdit && ticketId) {
      setLoading(true);
      ticketsApi.getById(ticketId).then(t => {
        form.setFieldsValue({
          title: t.title,
          description: t.description,
          category: t.category,
          priority: t.priority,
          status: t.status,
          accountId: t.account?.id,
          contactId: t.contact?.id,
          assignedToId: t.assignedTo?.id,
        });
      }).finally(() => setLoading(false));
    } else {
      form.resetFields();
      setClassification(null);
      if (defaultAccountId) form.setFieldValue('accountId', defaultAccountId);
      if (defaultContactId) form.setFieldValue('contactId', defaultContactId);
    }
  }, [open, ticketId]);

  const handleClassify = async () => {
    const title = form.getFieldValue('title');
    if (!title || title.trim().length < 3) {
      message.warning('Saisissez un titre pour classifier automatiquement');
      return;
    }
    setClassifying(true);
    setClassification(null);
    try {
      const result = await classifyTicket({
        title,
        description: form.getFieldValue('description'),
      });
      setClassification(result);
      form.setFieldsValue({
        category: result.category,
        priority: result.priority,
      });
      message.success('Classification IA appliquée');
    } catch {
      message.error('Erreur lors de la classification IA');
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (isEdit && ticketId) {
        await ticketsApi.update(ticketId, values);
        message.success('Ticket mis à jour');
      } else {
        await ticketsApi.create(values);
        message.success('Ticket créé');
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
      title={isEdit ? 'Modifier le ticket' : 'Nouveau ticket'}
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
          <Form.Item name="title" label="Titre" rules={[{ required: true, message: 'Titre obligatoire' }]}>
            <Input placeholder="Décrivez le problème en une ligne" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={4} placeholder="Détails du problème..." />
          </Form.Item>

          {!isEdit && (
            <div style={{ marginBottom: 16 }}>
              <Button
                icon={<RobotOutlined />}
                loading={classifying}
                onClick={handleClassify}
                style={{ background: '#f5f0ff', borderColor: '#d3adf7', color: '#7c3aed' }}
                block
              >
                Classifier automatiquement avec l'IA
              </Button>
              {classification && (
                <Alert
                  type="info"
                  showIcon
                  icon={<RobotOutlined style={{ color: '#7c3aed' }} />}
                  style={{ marginTop: 8, borderColor: '#e9d5ff', background: '#faf5ff' }}
                  message={
                    <span style={{ fontSize: 12 }}>
                      <strong>IA :</strong> {classification.reasoning}
                    </span>
                  }
                />
              )}
            </div>
          )}

          <Form.Item name="category" label="Catégorie" initialValue="AUTRE">
            <Select options={[
              { value: 'SAV',         label: 'SAV' },
              { value: 'TECHNIQUE',   label: 'Technique' },
              { value: 'COMMERCIAL',  label: 'Commercial' },
              { value: 'FACTURATION', label: 'Facturation' },
              { value: 'LIVRAISON',   label: 'Livraison' },
              { value: 'AUTRE',       label: 'Autre' },
            ]} />
          </Form.Item>

          <Form.Item name="priority" label="Priorité" initialValue="NORMALE">
            <Select options={[
              { value: 'BASSE',    label: 'Basse' },
              { value: 'NORMALE',  label: 'Normale' },
              { value: 'HAUTE',    label: 'Haute' },
              { value: 'CRITIQUE', label: 'Critique' },
            ]} />
          </Form.Item>

          {isEdit && (
            <Form.Item name="status" label="Statut">
              <Select options={[
                { value: 'OUVERT',     label: 'Ouvert' },
                { value: 'EN_COURS',   label: 'En cours' },
                { value: 'EN_ATTENTE', label: 'En attente' },
                { value: 'RESOLU',     label: 'Résolu' },
                { value: 'FERME',      label: 'Fermé' },
              ]} />
            </Form.Item>
          )}
        </Form>
      )}
    </Modal>
  );
}
