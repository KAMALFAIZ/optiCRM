import { useEffect, useState, useCallback } from 'react';
import {
  Modal, Form, Input, Select, Row, Col, Divider, message,
  Collapse, Button, Space, Typography, Spin,
} from 'antd';
import { RobotOutlined, ThunderboltOutlined } from '@ant-design/icons';

import { useAppDispatch } from '@/store';
import {
  createEmailTemplate,
  updateEmailTemplate,
  fetchEmailTemplateById,
} from './emailTemplatesSlice';
import { EMAIL_CATEGORIES } from '@/types/emailTemplate';
import { generateEmail } from '@/api/ai';

const { Text } = Typography;

interface Props {
  open: boolean;
  templateId: string | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORY_OPTIONS = EMAIL_CATEGORIES.map((cat) => ({
  value: cat.value,
  label: cat.label,
}));

const TONE_OPTIONS = [
  { value: 'professional', label: 'Professionnel' },
  { value: 'friendly', label: 'Amical' },
  { value: 'formal', label: 'Formel' },
];

export default function EmailTemplateFormModal({ open, templateId, onClose, onSuccess }: Props) {
  const [form] = Form.useForm();
  const dispatch = useAppDispatch();
  const isEdit = !!templateId;

  const [loading, setLoading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiContext, setAiContext] = useState('');
  const [aiTone, setAiTone] = useState<'professional' | 'friendly' | 'formal'>('professional');

  const loadTemplate = useCallback(async () => {
    if (templateId) {
      setLoading(true);
      try {
        const result = await dispatch(fetchEmailTemplateById(templateId)).unwrap();
        if (result) {
          form.setFieldsValue({
            name: result.name,
            subject: result.subject,
            category: result.category,
            bodyHtml: result.bodyHtml,
            bodyText: result.bodyText,
            availableVariables: result.availableVariables,
          });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
  }, [templateId, dispatch, form]);

  useEffect(() => {
    if (open) {
      if (isEdit) {
        loadTemplate();
      } else {
        form.resetFields();
      }
      setAiContext('');
      setAiTone('professional');
    }
  }, [open, isEdit, form, loadTemplate]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();

      const payload = { ...values };

      if (isEdit) {
        await dispatch(updateEmailTemplate({ id: templateId!, data: payload })).unwrap();
        message.success('Modèle mis à jour');
      } else {
        await dispatch(createEmailTemplate(payload)).unwrap();
        message.success('Modèle créé');
      }
      onSuccess();
    } catch {
      // validation errors handled by antd
    }
  };

  const handleGenerateWithAI = async () => {
    const subject = form.getFieldValue('subject');
    if (!subject) {
      message.warning('Veuillez d\'abord saisir le sujet de l\'email');
      return;
    }
    setAiGenerating(true);
    try {
      const result = await generateEmail({
        subject,
        context: aiContext || undefined,
        tone: aiTone,
      });
      // Wrap the generated text in basic HTML for the bodyHtml field
      const htmlContent = `<html>\n<body>\n${result.split('\n').map(line => line ? `<p>${line}</p>` : '').join('\n')}\n</body>\n</html>`;
      form.setFieldValue('bodyHtml', htmlContent);
      form.setFieldValue('bodyText', result);
      message.success('Contenu généré avec succès !');
    } catch {
      message.error('Erreur lors de la génération IA');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Modifier le modèle' : 'Nouveau modèle d\'email'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText={isEdit ? 'Mettre à jour' : 'Créer'}
      cancelText="Annuler"
      width={800}
      destroyOnHidden
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Divider orientation="left" plain>Informations</Divider>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Nom du modèle"
              rules={[{ required: true, message: 'Le nom est obligatoire' }]}
            >
              <Input placeholder="Nom du modèle" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="category"
              label="Catégorie"
            >
              <Select
                placeholder="Sélectionner une catégorie"
                options={CATEGORY_OPTIONS}
                allowClear
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="subject"
          label="Sujet de l'email"
          rules={[{ required: true, message: 'Le sujet est obligatoire' }]}
        >
          <Input placeholder="Sujet de l'email (ex: Bienvenue {{prenom}} !)" />
        </Form.Item>

        {/* ── Génération IA ── */}
        <Collapse
          ghost
          size="small"
          style={{ marginBottom: 12, border: '1px solid #e9d5ff', borderRadius: 6 }}
          items={[{
            key: 'ai',
            label: (
              <Space>
                <RobotOutlined style={{ color: '#7c3aed' }} />
                <Text style={{ color: '#7c3aed', fontWeight: 500 }}>Générer le contenu avec l'IA</Text>
              </Space>
            ),
            children: (
              <div style={{ paddingBottom: 4 }}>
                <Row gutter={12} style={{ marginBottom: 8 }}>
                  <Col span={16}>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Contexte / instructions</Text>
                    </div>
                    <Input.TextArea
                      rows={2}
                      placeholder="Ex: Email de relance après une démo produit, client intéressé par le module facturation..."
                      value={aiContext}
                      onChange={(e) => setAiContext(e.target.value)}
                      style={{ fontSize: 13 }}
                    />
                  </Col>
                  <Col span={8}>
                    <div style={{ marginBottom: 4 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Ton</Text>
                    </div>
                    <Select
                      value={aiTone}
                      onChange={(v) => setAiTone(v)}
                      options={TONE_OPTIONS}
                      style={{ width: '100%' }}
                      size="small"
                    />
                  </Col>
                </Row>
                <Button
                  type="primary"
                  size="small"
                  icon={aiGenerating ? <Spin size="small" /> : <ThunderboltOutlined />}
                  loading={aiGenerating}
                  onClick={handleGenerateWithAI}
                  style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
                >
                  {aiGenerating ? 'Génération en cours...' : 'Générer le contenu'}
                </Button>
                <Text type="secondary" style={{ fontSize: 11, marginLeft: 8 }}>
                  Le contenu sera inséré dans les champs Corps HTML et Corps texte
                </Text>
              </div>
            ),
          }]}
        />

        <Divider orientation="left" plain>Contenu</Divider>

        <Form.Item
          name="bodyHtml"
          label="Corps HTML"
          rules={[{ required: true, message: 'Le contenu HTML est obligatoire' }]}
        >
          <Input.TextArea
            rows={12}
            placeholder="<html><body><h1>Bonjour {{prenom}}</h1><p>Votre contenu ici...</p></body></html>"
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Form.Item>

        <Form.Item
          name="bodyText"
          label="Corps texte (version alternative)"
        >
          <Input.TextArea
            rows={4}
            placeholder="Version texte brut de l'email"
          />
        </Form.Item>

        <Divider orientation="left" plain>Variables</Divider>

        <Form.Item
          name="availableVariables"
          label="Variables disponibles"
        >
          <Input.TextArea
            rows={3}
            placeholder={'Format JSON des variables utilisables dans le modèle.\nEx: {"prenom": "Prénom du contact", "nom": "Nom du contact", "entreprise": "Nom de l\'entreprise"}'}
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
