import { useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  CloudServerOutlined,
  DatabaseOutlined,
  LockOutlined,
  SaveOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { type SageServerConfig, sageConfigApi } from '@/api/sageConfig';
import { sageQueryApi } from '@/api/sageQuery';

const { Text } = Typography;
const PWD_MASK = '••••••••';

export default function SageConfigTab() {
  const { message } = App.useApp();
  const [form] = Form.useForm<SageServerConfig>();
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);

  useEffect(() => {
    sageConfigApi
      .get()
      .then(cfg => {
        form.setFieldsValue(cfg);
        setEnabled(cfg.enabled);
      })
      .catch(() => message.error('Erreur lors du chargement de la configuration'));
  }, [form]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await sageQueryApi.testConnection();
      message.success('Connexion Sage SQL Server établie avec succès !');
    } catch (e: any) {
      const err = e?.response?.data?.error;
      const detail = typeof err === 'string' ? err : err?.message || e?.response?.data?.message || 'Connexion échouée. Vérifiez les paramètres.';
      message.error(detail);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (!pwdTouched && values.password === PWD_MASK) {
        values.password = PWD_MASK;
      }
      setSaving(true);
      await sageConfigApi.save(values);
      message.success('Configuration Sage sauvegardée');
      setPwdTouched(false);
    } catch (e: any) {
      console.error('Erreur de sauvegarde:', e);
      if (e?.errorFields) {
        message.error('Veuillez remplir tous les champs obligatoires');
      } else {
        const errMsg = e?.response?.data?.message || e?.message || 'Erreur réseau';
        message.error('Erreur lors de la sauvegarde : ' + errMsg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{ port: 1433, enabled: false }}
        >
          {/* Activation */}
          <Form.Item name="enabled" valuePropName="checked" label="Connexion Sage activée">
            <Switch
              checked={enabled}
              onChange={val => {
                setEnabled(val);
                form.setFieldValue('enabled', val);
              }}
              checkedChildren="Activé"
              unCheckedChildren="Désactivé"
            />
          </Form.Item>

          <Divider orientation="left">
            <Space>
              <CloudServerOutlined />
              Serveur SQL Server
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="host"
                label="Adresse du serveur (IP ou hostname)"
                rules={[{ required: enabled, message: 'Adresse obligatoire si activé' }]}
              >
                <Input
                  prefix={<CloudServerOutlined style={{ color: '#bbb' }} />}
                  placeholder="192.168.1.100 ou sage-server.local"
                  disabled={!enabled}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="port"
                label="Port"
                rules={[{ required: enabled, message: 'Port obligatoire' }]}
              >
                <InputNumber
                  min={1}
                  max={65535}
                  style={{ width: '100%' }}
                  placeholder="1433"
                  disabled={!enabled}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="database"
                label="Nom de la base de données"
                rules={[{ required: enabled, message: 'Base de données obligatoire' }]}
              >
                <Input
                  prefix={<DatabaseOutlined style={{ color: '#bbb' }} />}
                  placeholder="GESCOM"
                  disabled={!enabled}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="dossier"
                label={
                  <Space>
                    Code dossier Sage
                    <Tag color="blue" style={{ fontWeight: 'normal' }}>Optionnel</Tag>
                  </Space>
                }
              >
                <Input
                  placeholder="EX: MASCIM"
                  disabled={!enabled}
                  style={{ textTransform: 'uppercase' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              <UserOutlined />
              Authentification SQL Server
            </Space>
          </Divider>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="username"
                label="Identifiant SQL Server"
                rules={[{ required: enabled, message: 'Identifiant obligatoire' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#bbb' }} />}
                  placeholder="sa"
                  disabled={!enabled}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="password"
                label="Mot de passe SQL Server"
                rules={[{ required: enabled && pwdTouched, message: 'Mot de passe obligatoire' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#bbb' }} />}
                  placeholder={enabled ? 'Mot de passe' : '—'}
                  disabled={!enabled}
                  onChange={() => setPwdTouched(true)}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* Info chaîne de connexion */}
          {enabled && (
            <Form.Item noStyle shouldUpdate>
              {() => {
                const host = form.getFieldValue('host');
                const port = form.getFieldValue('port');
                const db = form.getFieldValue('database');
                if (!host || !db) return null;
                const jdbc = `jdbc:sqlserver://${host}:${port || 1433};databaseName=${db};encrypt=false`;
                return (
                  <Alert
                    type="success"
                    style={{ marginBottom: 16 }}
                    message={
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>Chaîne de connexion JDBC générée :</Text>
                        <Text code copyable style={{ fontSize: 11, wordBreak: 'break-all' }}>
                          {jdbc}
                        </Text>
                      </Space>
                    }
                  />
                );
              }}
            </Form.Item>
          )}

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSave}
                loading={saving}
              >
                Sauvegarder la configuration
              </Button>
              {enabled && (
                <Button
                  icon={<CheckCircleOutlined />}
                  onClick={handleTestConnection}
                  loading={testing}
                >
                  Tester la connexion
                </Button>
              )}
            </Space>
          </Form.Item>

        </Form>
      </Card>
    </div>
  );
}
