import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Select, Button, Card, Typography, message, Divider, Tag } from 'antd';
import { SendOutlined, HistoryOutlined } from '@ant-design/icons';
import { savPortalApi } from '@/api/sav';

const { Title, Text } = Typography;
const { TextArea } = Input;

const DOMAINES = [
  { value: 'SAGE100_GC', label: 'Sage 100 Gestion Commerciale' },
  { value: 'SAGE100_PAIE', label: 'Sage 100 Paie' },
  { value: 'SAGE100_COMPTA', label: 'Sage 100 Comptabilité' },
  { value: 'OPTICRM', label: 'OptiCRM' },
  { value: 'OPTIBOARD', label: 'OptiBoard' },
  { value: 'INFRA_SQL', label: 'Infrastructure / SQL Server' },
  { value: 'ERPNEXT', label: 'ERPNext' },
  { value: 'AUTRE', label: 'Autre' },
];

function getSavClient() {
  try {
    return JSON.parse(localStorage.getItem('sav_client') || '{}');
  } catch {
    return {};
  }
}

export default function SavNewTicketPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const client = getSavClient();
  const token = localStorage.getItem('sav_token') || '';

  if (!token) {
    navigate('/sav');
    return null;
  }

  const handleSubmit = async (values: { domaine: string; texte: string }) => {
    const texte = `[${values.domaine}] ${values.texte}`;
    setLoading(true);
    try {
      await savPortalApi.submitTicket(token, texte);
      message.success('Votre demande a été envoyée ! Traitement en cours...');
      form.resetFields();
      navigate('/sav/historique');
    } catch (err: any) {
      if (err.response?.status === 401) {
        navigate('/sav');
      } else {
        message.error('Erreur lors de l\'envoi. Réessayez.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg shadow-lg rounded-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <Title level={4} className="!mb-0">
              Bonjour {client.name} 👋
            </Title>
            <Text type="secondary">Décrivez votre problème</Text>
          </div>
          <Button
            icon={<HistoryOutlined />}
            onClick={() => navigate('/sav/historique')}
            className="rounded-lg"
          >
            Mes tickets
          </Button>
        </div>

        <Divider />

        <Form form={form} layout="vertical" onFinish={handleSubmit} size="large">
          <Form.Item
            label="Logiciel concerné"
            name="domaine"
            rules={[{ required: true, message: 'Sélectionnez le logiciel' }]}
          >
            <Select
              placeholder="Sélectionner le logiciel..."
              options={DOMAINES}
              className="rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label="Décrivez votre problème"
            name="texte"
            rules={[
              { required: true, message: 'Description requise' },
              { min: 20, message: 'Décrivez le problème en au moins 20 caractères' },
            ]}
          >
            <TextArea
              rows={5}
              placeholder="Exemple : Je ne peux pas valider ma facture, j'ai un message d'erreur 'période clôturée'..."
              showCount
              maxLength={2000}
              className="rounded-lg"
            />
          </Form.Item>

          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <Text type="secondary" className="text-sm">
              💡 Notre assistant IA va analyser votre demande et vous proposer une solution immédiatement dans 70-80% des cas.
            </Text>
          </div>

          <Form.Item className="mb-0">
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loading}
              icon={<SendOutlined />}
              className="rounded-lg h-12 text-base font-medium bg-blue-600"
            >
              Envoyer ma demande →
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
