import { useState } from 'react';
import { Alert, Button, Card, Form, Input, Steps, Typography, message, Spin } from 'antd';
import { DatabaseOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Step } = Steps;

/**
 * On-premise first-run setup wizard.
 * Shown when GET /api/v1/public/setup-status returns { configured: false }.
 */
export default function SetupWizardPage() {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(false);
  const [dbInitLoading, setDbInitLoading] = useState(false);
  const [dbInitDone, setDbInitDone] = useState(false);
  const [dbInitError, setDbInitError] = useState<string | null>(null);
  const [form] = Form.useForm();

  const steps = [
    { title: 'Base de données' },
    { title: 'Licence' },
    { title: 'Administrateur' },
    { title: 'Entreprise' },
  ];

  const handleInitDatabases = async () => {
    setDbInitLoading(true);
    setDbInitError(null);
    try {
      const res = await fetch('/api/v1/public/init-databases', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setDbInitDone(true);
        message.success('Bases opticrm_system et opticrm_default créées avec succès');
      } else {
        setDbInitError(data.error || (data.errors ? data.errors.join(', ') : 'Erreur inconnue'));
      }
    } catch {
      setDbInitError('Impossible de contacter le serveur');
    } finally {
      setDbInitLoading(false);
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/public/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (res.ok) {
        message.success('Configuration terminée ! Redirection vers la connexion…');
        setTimeout(() => navigate('/login'), 1500);
      } else {
        const err = await res.json();
        message.error(err.error?.message || 'Erreur lors de la configuration');
      }
    } catch {
      message.error('Impossible de contacter le serveur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5' }}>
      <Card style={{ width: 560, borderRadius: 12 }}>
        <Title level={3} style={{ textAlign: 'center', marginBottom: 8 }}>
          Configuration OptiCRM On-Premise
        </Title>
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24 }}>
          Cette procédure ne s'affiche qu'au premier démarrage.
        </Text>

        <Steps current={current} style={{ marginBottom: 32 }}>
          {steps.map((s) => <Step key={s.title} title={s.title} />)}
        </Steps>

        <Form form={form} layout="vertical" onFinish={handleFinish}>
          {/* Étape 0 : Base de données */}
          {current === 0 && (
            <>
              <Alert
                message="Initialisation des bases de données SQL Server"
                description="Cette étape crée les bases opticrm_system et opticrm_default sur votre serveur SQL Server. À exécuter une seule fois avant le premier démarrage."
                type="info"
                showIcon
                style={{ marginBottom: 20 }}
              />
              {dbInitError && (
                <Alert message={dbInitError} type="error" showIcon closable
                  onClose={() => setDbInitError(null)} style={{ marginBottom: 16 }} />
              )}
              {dbInitDone ? (
                <Alert
                  icon={<CheckCircleOutlined />}
                  message="Bases de données créées avec succès"
                  description="opticrm_system et opticrm_default sont prêtes. Vous pouvez passer à l'étape suivante."
                  type="success"
                  showIcon
                  style={{ marginBottom: 16 }}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <DatabaseOutlined style={{ fontSize: 48, color: '#4F46E5', marginBottom: 16 }} />
                  <div style={{ marginBottom: 16, color: '#595959' }}>
                    Cliquez sur le bouton ci-dessous pour créer automatiquement les bases de données nécessaires.
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    icon={dbInitLoading ? <Spin size="small" /> : <DatabaseOutlined />}
                    loading={dbInitLoading}
                    onClick={handleInitDatabases}
                    style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
                  >
                    Créer opticrm_default
                  </Button>
                </div>
              )}
            </>
          )}

          {/* Étape 1 : Licence */}
          {current === 1 && (
            <>
              <Alert
                message="Clé de licence optionnelle"
                description="Sans clé de licence, OptiCRM fonctionne en mode communautaire avec les fonctionnalités de base. Contactez support@kasoft.ma pour obtenir une licence."
                type="info"
                showIcon
                style={{ marginBottom: 16 }}
              />
              <Form.Item label="Clé de licence" name="licenseKey">
                <Input.TextArea rows={3} placeholder="Coller votre clé de licence ici (optionnel)" />
              </Form.Item>
            </>
          )}

          {/* Étape 2 : Admin */}
          {current === 2 && (
            <>
              <Form.Item label="Prénom" name="firstName" rules={[{ required: true }]}>
                <Input placeholder="Mohamed" />
              </Form.Item>
              <Form.Item label="Nom" name="lastName" rules={[{ required: true }]}>
                <Input placeholder="Alami" />
              </Form.Item>
              <Form.Item label="Email" name="adminEmail" rules={[{ required: true, type: 'email' }]}>
                <Input placeholder="admin@monentreprise.ma" />
              </Form.Item>
              <Form.Item label="Mot de passe" name="password" rules={[{ required: true, min: 8 }]}>
                <Input.Password placeholder="Minimum 8 caractères" />
              </Form.Item>
            </>
          )}

          {/* Étape 3 : Entreprise */}
          {current === 3 && (
            <>
              <Form.Item label="Nom de l'entreprise" name="companyName" rules={[{ required: true }]}>
                <Input placeholder="Mon Entreprise SARL" />
              </Form.Item>
            </>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
            {current > 0 && (
              <Button onClick={() => setCurrent(current - 1)}>Précédent</Button>
            )}
            {current === 0 && (
              <Button
                type="primary"
                disabled={!dbInitDone}
                onClick={() => setCurrent(1)}
                style={dbInitDone ? { background: '#4F46E5', borderColor: '#4F46E5' } : {}}
              >
                Suivant
              </Button>
            )}
            {current > 0 && current < steps.length - 1 && (
              <Button type="primary" onClick={() => form.validateFields().then(() => setCurrent(current + 1))}>
                Suivant
              </Button>
            )}
            {current === steps.length - 1 && (
              <Button type="primary" htmlType="submit" loading={loading}>
                Terminer la configuration
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
