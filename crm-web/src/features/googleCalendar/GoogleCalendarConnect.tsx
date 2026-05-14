import { useEffect, useState } from 'react';
import {
  Button, Card, Tag, Typography, Space, Popconfirm, Alert,
  Spin, Form, Input, Divider, Tooltip,
} from 'antd';
import {
  CheckCircleOutlined, DisconnectOutlined, CalendarOutlined,
  LinkOutlined, SaveOutlined, LockOutlined, InfoCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useLocation } from 'react-router-dom';
import { message } from 'antd';

import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchGoogleCalendarStatus,
  connectGoogleCalendar,
  disconnectGoogleCalendar,
} from './googleCalendarSlice';
import googleCalendarApi, { type GoogleCalendarConfig } from '@/api/googleCalendar';
import { selectUser } from '@/features/auth/authSlice';

const { Text, Link } = Typography;
const MASKED = '••••••••';

export default function GoogleCalendarConnect() {
  const dispatch   = useAppDispatch();
  const { status, loading } = useAppSelector((s) => s.googleCalendar);
  const currentUser = useAppSelector(selectUser);
  const location   = useLocation();
  const isAdmin    = ['SUPER_ADMIN', 'ADMIN'].includes(currentUser?.role?.name ?? '');

  const [config, setConfig]         = useState<GoogleCalendarConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [form]                      = Form.useForm();

  // ── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    dispatch(fetchGoogleCalendarStatus());
    if (isAdmin) loadConfig();
  }, [dispatch, isAdmin]);

  const loadConfig = async () => {
    setConfigLoading(true);
    try {
      const data = await googleCalendarApi.getConfig();
      setConfig(data);
      form.setFieldsValue({
        clientId:       data.clientId,
        clientSecret:   data.secretConfigured ? MASKED : '',
        redirectUri:    data.redirectUri,
        frontendBaseUrl: data.frontendBaseUrl,
      });
    } catch {
      /* silencieux si pas admin */
    } finally {
      setConfigLoading(false);
    }
  };

  // ── Retour OAuth2 Google ──────────────────────────────────────────────────

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const result = params.get('google_calendar');
    if (result === 'success') {
      message.success('Google Calendar connecté avec succès');
      dispatch(fetchGoogleCalendarStatus());
      window.history.replaceState({}, '', location.pathname + '?tab=integrations');
    } else if (result === 'error') {
      const reason = params.get('reason');
      message.error(
        reason === 'access_denied'
          ? 'Autorisation refusée par l\'utilisateur'
          : 'Échec de la connexion Google Calendar',
      );
      window.history.replaceState({}, '', location.pathname + '?tab=integrations');
    }
  }, [location.search, dispatch]);

  // ── Sauvegarde config ─────────────────────────────────────────────────────

  const handleSaveConfig = async (values: any) => {
    setSaving(true);
    try {
      const updated = await googleCalendarApi.saveConfig({
        clientId:        values.clientId ?? '',
        clientSecret:    values.clientSecret === MASKED ? '' : (values.clientSecret ?? ''),
        redirectUri:     values.redirectUri ?? '',
        frontendBaseUrl: values.frontendBaseUrl ?? '',
      });
      setConfig(updated);
      message.success('Configuration Google Calendar sauvegardée');
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  // ── Connect / Disconnect ──────────────────────────────────────────────────

  const handleConnect = () => {
    if (!config?.configured) {
      message.warning('Configurez d\'abord le Client ID et le Client Secret');
      return;
    }
    dispatch(connectGoogleCalendar());
  };

  const handleDisconnect = async () => {
    await dispatch(disconnectGoogleCalendar()).unwrap();
    message.success('Google Calendar déconnecté');
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={20}>

      {/* ── Section configuration (admin seulement) ─────────────────────── */}
      {isAdmin && (
        <Card
          title={
            <Space>
              <SettingOutlined style={{ color: '#4285F4' }} />
              <span>Configuration OAuth2 Google</span>
              <Tag color={config?.configured ? 'success' : 'warning'}>
                {config?.configured ? 'Configuré' : 'Non configuré'}
              </Tag>
            </Space>
          }
          size="small"
        >
          <Spin spinning={configLoading}>
            <Alert
              type="info"
              style={{ marginBottom: 16 }}
              showIcon
              message="Comment obtenir vos identifiants Google"
              description={
                <ol style={{ margin: '4px 0 0', paddingLeft: 18, lineHeight: '1.8' }}>
                  <li>
                    Allez sur{' '}
                    <Link href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer">
                      console.cloud.google.com
                    </Link>
                  </li>
                  <li>Créez un projet → Activez l'API <strong>Google Calendar</strong></li>
                  <li>Créez des identifiants → <strong>ID client OAuth 2.0</strong> (type : Application Web)</li>
                  <li>Ajoutez l'URI de redirection autorisée (voir champ ci-dessous)</li>
                  <li>Copiez le <strong>Client ID</strong> et le <strong>Client Secret</strong></li>
                </ol>
              }
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSaveConfig}
              requiredMark={false}
            >
              <Form.Item
                name="clientId"
                label="Client ID"
                rules={[{ required: true, message: 'Obligatoire' }]}
              >
                <Input
                  placeholder="123456789-abc.apps.googleusercontent.com"
                  allowClear
                />
              </Form.Item>

              <Form.Item
                name="clientSecret"
                label={
                  <Space size={4}>
                    Client Secret
                    {config?.secretConfigured && (
                      <Tooltip title="Un secret est déjà enregistré. Saisissez une nouvelle valeur pour le remplacer.">
                        <LockOutlined style={{ color: '#52c41a' }} />
                      </Tooltip>
                    )}
                  </Space>
                }
              >
                <Input.Password
                  placeholder={config?.secretConfigured ? MASKED : 'Coller le client secret ici'}
                  onFocus={(e) => {
                    if (e.target.value === MASKED) form.setFieldValue('clientSecret', '');
                  }}
                />
              </Form.Item>

              <Form.Item
                name="redirectUri"
                label={
                  <Space size={4}>
                    URI de redirection
                    <Tooltip title="Copiez cette valeur dans Google Cloud Console → Identifiants OAuth → URI de redirection autorisées">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                }
                rules={[{ required: true, message: 'Obligatoire' }]}
              >
                <Input placeholder="https://votre-domaine.com/api/v1/google-calendar/callback" />
              </Form.Item>

              <Form.Item
                name="frontendBaseUrl"
                label="URL du frontend"
                tooltip="Utilisé pour la redirection après connexion OAuth2"
              >
                <Input placeholder="https://votre-domaine.com" />
              </Form.Item>

              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SaveOutlined />}
                  loading={saving}
                >
                  Sauvegarder la configuration
                </Button>
              </Form.Item>
            </Form>
          </Spin>
        </Card>
      )}

      {/* ── Section connexion (tous les utilisateurs) ────────────────────── */}
      <Card
        title={
          <Space>
            <CalendarOutlined style={{ color: '#34A853' }} />
            <span>Connexion Google Calendar</span>
            {status?.connected && (
              <Tag color="success" icon={<CheckCircleOutlined />}>Connecté</Tag>
            )}
          </Space>
        }
      >
        <Spin spinning={loading}>
          {!config?.configured && !status?.connected && (
            <Alert
              type="warning"
              showIcon
              message="Configuration requise"
              description={
                isAdmin
                  ? 'Renseignez le Client ID et le Client Secret dans la section ci-dessus avant de vous connecter.'
                  : 'Google Calendar n\'est pas encore configuré par l\'administrateur.'
              }
              style={{ marginBottom: 16 }}
            />
          )}

          {status?.connected ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Alert
                type="success"
                showIcon
                message="Synchronisation active"
                description={
                  <span>
                    Connecté en tant que <strong>{status.googleEmail}</strong>.
                    Vos activités (réunions, appels, rendez-vous) sont synchronisées
                    automatiquement dans Google Calendar.
                  </span>
                }
              />

              <Divider style={{ margin: '12px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary">
                  Calendrier cible : <code>{status.calendarId || 'primary'}</code>
                </Text>
                <Popconfirm
                  title="Déconnecter Google Calendar ?"
                  description="Vos futurs événements ne seront plus synchronisés. Les événements existants restent dans Google Calendar."
                  onConfirm={handleDisconnect}
                  okText="Déconnecter"
                  cancelText="Annuler"
                  okButtonProps={{ danger: true }}
                >
                  <Button danger icon={<DisconnectOutlined />} loading={loading}>
                    Déconnecter
                  </Button>
                </Popconfirm>
              </div>
            </Space>
          ) : (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Text type="secondary">
                Connectez votre compte Google pour synchroniser vos activités OptiCRM
                directement dans Google Calendar.
              </Text>

              <ul style={{ color: '#595959', paddingLeft: 20, margin: '8px 0 16px' }}>
                <li>Création automatique des activités (réunions, appels, tâches)</li>
                <li>Mise à jour lors de la replanification par glisser-déposer</li>
                <li>Affichage des événements Google (en vert) sur le calendrier OptiCRM</li>
              </ul>

              <Button
                type="primary"
                icon={<LinkOutlined />}
                onClick={handleConnect}
                loading={loading}
                disabled={!config?.configured}
                style={
                  config?.configured
                    ? { backgroundColor: '#4285F4', borderColor: '#4285F4' }
                    : {}
                }
              >
                Connecter avec Google
              </Button>
            </Space>
          )}
        </Spin>
      </Card>
    </Space>
  );
}
