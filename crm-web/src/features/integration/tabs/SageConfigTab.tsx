import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Result,
  Row,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CloudServerOutlined,
  CodeOutlined,
  DatabaseOutlined,
  InfoCircleOutlined,
  LockOutlined,
  PlayCircleOutlined,
  SaveOutlined,
  UserOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { type SageServerConfig, sageConfigApi } from '@/api/sageConfig';
import { sageQueryApi } from '@/api/sageQuery';
import { integrationApi, type ImportResultDto } from '@/api/integration';

const { Text, Title } = Typography;
const PWD_MASK = '••••••••';

export default function SageConfigTab() {
  const [form] = Form.useForm<SageServerConfig>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [pwdTouched, setPwdTouched] = useState(false);
  const [execResult, setExecResult] = useState<ImportResultDto | null>(null);

  useEffect(() => {
    setLoading(true);
    sageConfigApi
      .get()
      .then(cfg => {
        form.setFieldsValue(cfg);
        setEnabled(cfg.enabled);
      })
      .catch(() => message.error('Erreur lors du chargement de la configuration'))
      .finally(() => setLoading(false));
  }, [form]);

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      await sageQueryApi.testConnection();
      message.success('Connexion Sage SQL Server établie avec succès !');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Connexion échouée. Vérifiez les paramètres.');
    } finally {
      setTesting(false);
    }
  };

  const handleExecuteQuery = async () => {
    const sqlQuery = form.getFieldValue('customQuery') as string;
    if (!sqlQuery?.trim()) {
      message.warning('Veuillez saisir une requête SQL avant d\'exécuter.');
      return;
    }
    setExecuting(true);
    try {
      const result = await integrationApi.executeQuery(sqlQuery.trim());
      setExecResult(result);
    } catch (e: any) {
      message.error(e?.response?.data?.error?.message || 'Erreur lors de l\'exécution de la requête.');
    } finally {
      setExecuting(false);
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      // Ne pas envoyer le masque si le mot de passe n'a pas été modifié
      if (!pwdTouched && values.password === PWD_MASK) {
        values.password = PWD_MASK;
      }
      setSaving(true);
      await sageConfigApi.save(values);
      message.success('Configuration Sage sauvegardée');
      setPwdTouched(false);
    } catch {
      // validation antd ou erreur réseau
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 760 }}>
      <Alert
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        style={{ marginBottom: 24 }}
        message="Connexion serveur Sage 100"
        description={
          <>
            Renseignez les paramètres de connexion à la base de données SQL Server de Sage 100.
            Ces informations sont utilisées pour identifier le serveur lors des exports manuels
            et préparer une future synchronisation directe.
          </>
        }
      />

      <Card loading={loading}>
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

          <Divider orientation="left">
            <Space>
              <CodeOutlined />
              Requête d'import
            </Space>
          </Divider>

          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message="Requête SQL personnalisée"
            description={
              <>
                Saisissez une requête <strong>SELECT</strong> à exécuter sur le serveur SQL Server configuré ci-dessus.
                Les colonnes retournées doivent correspondre aux <em>champs source</em> définis dans le mapping de la page Intégrations.
                Cliquez sur <strong>Exécuter et importer</strong> pour lancer l'import.
              </>
            }
          />

          <Form.Item name="customQuery" label="Requête SQL">
            <Input.TextArea
              rows={8}
              placeholder={`SELECT CT_Num, CT_Intitule, CT_Email, CT_Telephone\nFROM [dbo].[F_COMPTET]\nWHERE CT_Type = 0`}
              style={{ fontFamily: 'monospace', fontSize: 13 }}
              disabled={!enabled}
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleExecuteQuery}
              loading={executing}
              disabled={!enabled}
            >
              Exécuter et importer
            </Button>
          </Form.Item>
        </Form>
      </Card>

      {/* Modal résultat exécution */}
      <Modal
        open={!!execResult}
        onOk={() => setExecResult(null)}
        onCancel={() => setExecResult(null)}
        cancelButtonProps={{ style: { display: 'none' } }}
        title="Résultat de l'import"
      >
        {execResult && (
          <Result
            status={execResult.errors > 0 ? 'warning' : 'success'}
            title={execResult.message}
            subTitle={
              <Space direction="vertical" size={4}>
                <Text>Total lignes : <strong>{execResult.total}</strong></Text>
                <Text style={{ color: '#52c41a' }}>Créés : <strong>{execResult.created}</strong></Text>
                <Text style={{ color: '#1890ff' }}>Mis à jour : <strong>{execResult.updated}</strong></Text>
                {execResult.errors > 0 && (
                  <Text type="danger">Erreurs : <strong>{execResult.errors}</strong></Text>
                )}
              </Space>
            }
          />
        )}
      </Modal>

      {/* Aide */}
      <Card
        size="small"
        style={{ marginTop: 16, background: '#fafafa' }}
        title={<Space><InfoCircleOutlined /> Comment trouver ces informations ?</Space>}
      >
        <Row gutter={24}>
          <Col span={12}>
            <Title level={5} style={{ fontSize: 13 }}>Sur le serveur Sage 100</Title>
            <ul style={{ paddingLeft: 16, fontSize: 13, color: '#555' }}>
              <li>Ouvrir <Text code>Gestionnaire de configuration Sage</Text></li>
              <li>Rubrique <Text code>Données &gt; SQL Server</Text></li>
              <li>L'adresse du serveur et le nom de la base y sont indiqués</li>
            </ul>
          </Col>
          <Col span={12}>
            <Title level={5} style={{ fontSize: 13 }}>Port SQL Server</Title>
            <ul style={{ paddingLeft: 16, fontSize: 13, color: '#555' }}>
              <li>Port par défaut : <Text code>1433</Text></li>
              <li>Vérifier dans SQL Server Configuration Manager</li>
              <li>Autoriser le port dans le pare-feu Windows</li>
            </ul>
          </Col>
        </Row>
      </Card>
    </div>
  );
}
