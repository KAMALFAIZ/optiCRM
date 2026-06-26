import { useCallback, useEffect, useState } from 'react';
import {
  Card, Form, Input, InputNumber, Switch, Button, Typography,
  Alert, Tabs, Space, Divider, Spin, Tag, Modal, Badge,
  Table, Popconfirm, message, Select,
} from 'antd';
import {
  MailOutlined, SaveOutlined, ApiOutlined, RobotOutlined, KeyOutlined,
  SettingOutlined, PlusOutlined, EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined,
  CheckSquareOutlined, BorderOutlined,
} from '@ant-design/icons';
import { settingsApi, type SmtpSettings, type AiSettings } from '@/api/settings';
import GoogleCalendarConnect from '@/features/googleCalendar/GoogleCalendarConnect';
import {
  referenceDataApi,
  CATEGORY_LABELS,
  type ReferenceDataItem,
  type ReferenceDataMap,
} from '@/api/referenceData';
import { customFieldsApi, type CustomFieldDef } from '@/api/customFields';
import { handleApiError } from '@/api/client';
import { useAppSelector } from '@/store';
import { selectUser } from '@/features/auth/authSlice';

const { Title, Text } = Typography;

const MASKED = '••••••••';

export default function SettingsPage() {
  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>Paramètres</Title>
        <Text type="secondary">Configuration générale de l'application</Text>
      </div>
      <Tabs
        items={[
          {
            key: 'smtp',
            label: (
              <span>
                <MailOutlined style={{ marginRight: 6 }} />
                Email SMTP
              </span>
            ),
            children: <SmtpTab />,
          },
          {
            key: 'ai',
            label: (
              <span>
                <RobotOutlined style={{ marginRight: 6 }} />
                Intelligence Artificielle
              </span>
            ),
            children: <AiTab />,
          },
          {
            key: 'integrations',
            label: (
              <span>
                <ApiOutlined style={{ marginRight: 6 }} />
                Intégrations
              </span>
            ),
            children: (
              <div style={{ paddingTop: 8 }}>
                <GoogleCalendarConnect />
              </div>
            ),
          },
          {
            key: 'parametrage',
            label: (
              <span>
                <SettingOutlined style={{ marginRight: 6 }} />
                Paramétrage
              </span>
            ),
            children: <ParametrageTab />,
          },
        ]}
      />
    </div>
  );
}

function SmtpTab() {
  const [form] = Form.useForm<SmtpSettings>();
  const currentUser = useAppSelector(selectUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [smtpEnabled, setSmtpEnabled] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  useEffect(() => {
    settingsApi.getSmtp()
      .then((data) => {
        form.setFieldsValue(data);
        setSmtpEnabled(data.enabled);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          setError('Accès refusé. Cette page est réservée aux administrateurs.');
        } else {
          setError(handleApiError(err) ?? 'Impossible de charger la configuration SMTP.');
        }
      })
      .finally(() => setLoading(false));
  }, [form]);

  const onSave = async (values: SmtpSettings) => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await settingsApi.saveSmtp(values);
      form.setFieldsValue(updated);
      setSmtpEnabled(updated.enabled);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setError(handleApiError(err) ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const onTest = () => {
    setTestEmail(currentUser?.email ?? '');
    setTestModalOpen(true);
  };

  const onTestConfirm = async () => {
    setTesting(true);
    setTestResult(null);
    setTestModalOpen(false);
    try {
      await settingsApi.testSmtp(testEmail);
      setTestResult({ ok: true, msg: `Email de test envoyé à ${testEmail}` });
    } catch (err: unknown) {
      setTestResult({ ok: false, msg: handleApiError(err) ?? 'Échec de la connexion SMTP.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <MailOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
        <div>
          <Title level={5} style={{ margin: 0 }}>Configuration SMTP</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Serveur d'envoi pour les emails système (réinitialisation de mot de passe, etc.)
          </Text>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError(null)}
          style={{ marginBottom: 20 }} />
      )}
      {saveSuccess && (
        <Alert message="Configuration sauvegardée avec succès." type="success" showIcon
          style={{ marginBottom: 20 }} />
      )}
      {testResult && (
        <Alert
          message={testResult.msg}
          type={testResult.ok ? 'success' : 'error'}
          showIcon
          closable
          onClose={() => setTestResult(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onSave}
        initialValues={{ port: 587, starttls: true, auth: true, enabled: false }}
      >
        {/* Activer SMTP */}
        <Form.Item name="enabled" valuePropName="checked" label="Activer l'envoi d'emails">
          <Switch
            checkedChildren="Activé"
            unCheckedChildren="Désactivé"
            onChange={setSmtpEnabled}
          />
        </Form.Item>

        {smtpEnabled && (
          <>
            <Divider orientation="left" plain style={{ fontSize: 12, color: '#878a99' }}>
              Serveur
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px', gap: 16 }}>
              <Form.Item
                name="host"
                label="Hôte SMTP"
                rules={[{ required: smtpEnabled, message: 'Requis' }]}
              >
                <Input placeholder="smtp.gmail.com" />
              </Form.Item>
              <Form.Item
                name="port"
                label="Port"
                rules={[{ required: smtpEnabled, message: 'Requis' }]}
              >
                <InputNumber style={{ width: '100%' }} min={1} max={65535} />
              </Form.Item>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item name="username" label="Nom d'utilisateur (login)">
                <Input placeholder="user@example.com" autoComplete="off" />
              </Form.Item>
              <Form.Item name="password" label="Mot de passe">
                <Input.Password
                  placeholder={MASKED}
                  autoComplete="new-password"
                  visibilityToggle
                />
              </Form.Item>
            </div>

            <Divider orientation="left" plain style={{ fontSize: 12, color: '#878a99' }}>
              Expéditeur
            </Divider>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Form.Item
                name="from"
                label="Adresse email expéditeur"
                rules={[
                  { required: smtpEnabled, message: 'Requis' },
                  { type: 'email', message: 'Email invalide' },
                ]}
              >
                <Input prefix={<MailOutlined style={{ color: '#878a99' }} />}
                  placeholder="noreply@kasoft.ma" />
              </Form.Item>
              <Form.Item name="fromName" label="Nom expéditeur">
                <Input placeholder="OptiCRM" />
              </Form.Item>
            </div>

            <Divider orientation="left" plain style={{ fontSize: 12, color: '#878a99' }}>
              Sécurité
            </Divider>

            <Space size={32}>
              <Form.Item name="starttls" valuePropName="checked" label="STARTTLS" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
              <Form.Item name="auth" valuePropName="checked" label="Authentification SMTP" style={{ marginBottom: 0 }}>
                <Switch />
              </Form.Item>
            </Space>

            <div style={{ marginTop: 8 }}>
              <SmtpPresets onSelect={(preset) => form.setFieldsValue(preset)} />
            </div>
          </>
        )}

        <Divider style={{ margin: '20px 0' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            icon={<ApiOutlined />}
            onClick={onTest}
            loading={testing}
            disabled={!smtpEnabled}
          >
            Tester la connexion
          </Button>

          <Button
            type="primary"
            htmlType="submit"
            icon={<SaveOutlined />}
            loading={saving}
            style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
          >
            Enregistrer
          </Button>
        </div>
      </Form>

      <Modal
        title="Tester la connexion SMTP"
        open={testModalOpen}
        onOk={onTestConfirm}
        onCancel={() => setTestModalOpen(false)}
        okText="Envoyer"
        cancelText="Annuler"
        okButtonProps={{ disabled: !testEmail }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Un email de test va être envoyé à l'adresse ci-dessous.<br />
            Assurez-vous d'avoir sauvegardé la configuration avant de tester.
          </Text>
        </div>
        <Input
          prefix={<MailOutlined style={{ color: '#878a99' }} />}
          placeholder="adresse@exemple.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          onPressEnter={testEmail ? onTestConfirm : undefined}
          autoFocus
        />
      </Modal>
    </Card>
  );
}

// ─── Presets SMTP courants ──────────────────────────────────────────────────
interface Preset { label: string; host: string; port: number; starttls: boolean }

const PRESETS: Preset[] = [
  { label: 'Gmail',     host: 'smtp.gmail.com',       port: 587, starttls: true },
  { label: 'Outlook',   host: 'smtp-mail.outlook.com', port: 587, starttls: true },
  { label: 'OVH',       host: 'ssl0.ovh.net',          port: 587, starttls: true },
  { label: 'Mailo',     host: 'smtp.mailo.com',         port: 587, starttls: true },
  { label: 'Amazon SES',host: 'email-smtp.eu-west-1.amazonaws.com', port: 587, starttls: true },
];

function SmtpPresets({ onSelect }: { onSelect: (p: Partial<SmtpSettings>) => void }) {
  return (
    <div style={{ marginTop: 12 }}>
      <Text type="secondary" style={{ fontSize: 12, marginRight: 8 }}>Presets :</Text>
      {PRESETS.map((p) => (
        <Tag
          key={p.label}
          style={{ cursor: 'pointer', marginBottom: 4 }}
          onClick={() => onSelect({ host: p.host, port: p.port, starttls: p.starttls, auth: true })}
        >
          {p.label}
        </Tag>
      ))}
    </div>
  );
}

// ─── Onglet Intelligence Artificielle ───────────────────────────────────────

function AiTab() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    settingsApi.getAi()
      .then((data) => {
        setSettings(data);
        setApiKey(data.apiKey);
      })
      .catch((err: unknown) => {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) {
          setError('Accès refusé. Cette page est réservée aux administrateurs.');
        } else {
          setError(handleApiError(err) ?? 'Impossible de charger la configuration IA.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    setSaving(true);
    setError(null);
    setSaveSuccess(false);
    try {
      const updated = await settingsApi.saveAi({ apiKey });
      setSettings(updated);
      setApiKey(updated.apiKey);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setError(handleApiError(err) ?? 'Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const onTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      await settingsApi.testAi();
      setTestResult({ ok: true, msg: 'Connexion Anthropic établie avec succès.' });
    } catch (err: unknown) {
      setTestResult({ ok: false, msg: handleApiError(err) ?? 'Échec de la connexion à l\'API Anthropic.' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card bordered={false} style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <RobotOutlined style={{ fontSize: 20, color: '#4F46E5' }} />
        <div>
          <Title level={5} style={{ margin: 0 }}>Configuration Intelligence Artificielle</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Clé API Anthropic pour les fonctionnalités IA (analyse, génération d'emails, assistant)
          </Text>
        </div>
      </div>

      <Divider style={{ margin: '16px 0' }} />

      {/* Statut */}
      <div style={{ marginBottom: 20 }}>
        <Space>
          <Text type="secondary">Statut :</Text>
          {settings?.keyConfigured ? (
            <Badge status="success" text={<Text style={{ color: '#52c41a' }}>Clé API configurée</Text>} />
          ) : (
            <Badge status="error" text={<Text type="secondary">Aucune clé configurée</Text>} />
          )}
        </Space>
        {settings?.model && (
          <div style={{ marginTop: 4 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Modèle : <Tag color="blue" style={{ fontSize: 12 }}>{settings.model}</Tag>
            </Text>
          </div>
        )}
      </div>

      {error && (
        <Alert message={error} type="error" showIcon closable onClose={() => setError(null)}
          style={{ marginBottom: 20 }} />
      )}
      {saveSuccess && (
        <Alert message="Clé API sauvegardée avec succès." type="success" showIcon
          style={{ marginBottom: 20 }} />
      )}
      {testResult && (
        <Alert
          message={testResult.msg}
          type={testResult.ok ? 'success' : 'error'}
          showIcon closable
          onClose={() => setTestResult(null)}
          style={{ marginBottom: 20 }}
        />
      )}

      <div style={{ marginBottom: 24 }}>
        <Text strong style={{ display: 'block', marginBottom: 6 }}>
          <KeyOutlined style={{ marginRight: 6 }} />
          Clé API Anthropic
        </Text>
        <Input.Password
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="sk-ant-api03-..."
          autoComplete="new-password"
          visibilityToggle
          style={{ maxWidth: 480 }}
        />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
          Obtenez votre clé sur{' '}
          <a href="https://console.anthropic.com" target="_blank" rel="noreferrer">
            console.anthropic.com
          </a>
        </Text>
      </div>

      <Divider style={{ margin: '20px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          icon={<ApiOutlined />}
          onClick={onTest}
          loading={testing}
          disabled={!settings?.keyConfigured}
        >
          Tester la connexion
        </Button>

        <Button
          type="primary"
          icon={<SaveOutlined />}
          onClick={onSave}
          loading={saving}
          disabled={!apiKey || apiKey === settings?.apiKey}
          style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
        >
          Enregistrer
        </Button>
      </div>
    </Card>
  );
}

// ─── Onglet Paramétrage ─────────────────────────────────────────────────────

const CATEGORIES = ['CATEGORIE_CLIENT', 'SOCIETE_AFFECTATION', 'TYPE_COMPTE', 'TYPE_COMPTE_ODYSSEE', 'TYPE_PROJET'];

function ParametrageTab() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReferenceDataMap>({});
  const [error, setError] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const result = await referenceDataApi.getAll();
      setData(result);
    } catch (err: unknown) {
      setError(handleApiError(err) ?? 'Impossible de charger les données de référence.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 60 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <Alert message={error} type="error" showIcon />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {CATEGORIES.map((cat) => (
        <ReferenceGrid
          key={cat}
          category={cat}
          title={CATEGORY_LABELS[cat] ?? cat}
          items={data[cat] ?? []}
          onRefresh={loadAll}
        />
      ))}

      <Divider style={{ margin: '8px 0' }} />
      <CustomFieldsGrid />
    </div>
  );
}

// ─── Grille éditable pour une catégorie ─────────────────────────────────────

interface ReferenceGridProps {
  category: string;
  title: string;
  items: ReferenceDataItem[];
  onRefresh: () => void;
}

function ReferenceGrid({ category, title, items, onRefresh }: ReferenceGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [adding, setAdding] = useState(false);
  const [addForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const startEdit = (record: ReferenceDataItem) => {
    editForm.setFieldsValue(record);
    setEditingId(record.id);
  };

  const cancelEdit = () => {
    setEditingId(null);
    editForm.resetFields();
  };

  const saveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      await referenceDataApi.update(editingId!, {
        value: values.value,
        label: values.label,
        color: values.color || null,
        sortOrder: values.sortOrder,
        active: values.active,
      });
      message.success('Modifié avec succès');
      setEditingId(null);
      onRefresh();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(handleApiError(err) ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setSaving(true);
      await referenceDataApi.create({
        category,
        value: values.value,
        label: values.label,
        color: values.color || undefined,
        sortOrder: values.sortOrder ?? (items.length + 1),
        active: true,
      });
      message.success('Ajouté avec succès');
      setAdding(false);
      addForm.resetFields();
      onRefresh();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(handleApiError(err) ?? 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await referenceDataApi.delete(id);
      message.success('Supprimé');
      onRefresh();
    } catch (err: unknown) {
      message.error(handleApiError(err) ?? 'Erreur');
    }
  };

  const columns = [
    {
      title: 'Ordre',
      dataIndex: 'sortOrder',
      width: 80,
      render: (val: number, record: ReferenceDataItem) =>
        editingId === record.id ? (
          <Form.Item name="sortOrder" style={{ margin: 0 }} rules={[{ required: true }]}>
            <InputNumber min={0} size="small" style={{ width: 60 }} />
          </Form.Item>
        ) : val,
    },
    {
      title: 'Valeur',
      dataIndex: 'value',
      render: (val: string, record: ReferenceDataItem) =>
        editingId === record.id ? (
          <Form.Item name="value" style={{ margin: 0 }} rules={[{ required: true, message: 'Requis' }]}>
            <Input size="small" />
          </Form.Item>
        ) : val,
    },
    {
      title: 'Libellé',
      dataIndex: 'label',
      render: (val: string, record: ReferenceDataItem) =>
        editingId === record.id ? (
          <Form.Item name="label" style={{ margin: 0 }} rules={[{ required: true, message: 'Requis' }]}>
            <Input size="small" />
          </Form.Item>
        ) : val,
    },
    {
      title: 'Couleur',
      dataIndex: 'color',
      width: 100,
      render: (val: string | undefined, record: ReferenceDataItem) =>
        editingId === record.id ? (
          <Form.Item name="color" style={{ margin: 0 }}>
            <Input size="small" placeholder="blue" />
          </Form.Item>
        ) : val ? <Tag color={val}>{val}</Tag> : '-',
    },
    {
      title: 'Actif',
      dataIndex: 'active',
      width: 80,
      render: (val: boolean, record: ReferenceDataItem) =>
        editingId === record.id ? (
          <Form.Item name="active" valuePropName="checked" style={{ margin: 0 }}>
            <Switch size="small" />
          </Form.Item>
        ) : (
          val
            ? <CheckSquareOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            : <BorderOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
        ),
    },
    {
      title: 'Actions',
      width: 100,
      render: (_: unknown, record: ReferenceDataItem) =>
        editingId === record.id ? (
          <Space size={4}>
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={saveEdit} loading={saving} />
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
          </Space>
        ) : (
          <Space size={4}>
            <Button
              type="link"
              size="small"
              icon={<EditOutlined />}
              onClick={() => startEdit(record)}
              disabled={editingId !== null}
            />
            <Popconfirm
              title="Supprimer cette valeur ?"
              onConfirm={() => handleDelete(record.id)}
              okText="Oui"
              cancelText="Non"
            >
              <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={editingId !== null} />
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          {title}
        </span>
      }
      extra={
        !adding && (
          <Button
            size="small"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              addForm.resetFields();
              addForm.setFieldsValue({ sortOrder: (items.length + 1) });
              setAdding(true);
            }}
            style={{ background: '#4F46E5', borderColor: '#4F46E5' }}
          >
            Ajouter
          </Button>
        )
      }
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
    >
      <Form form={editForm} component={false}>
        <Table
          dataSource={items}
          columns={columns}
          rowKey="id"
          size="small"
          pagination={false}
          bordered
        />
      </Form>

      {adding && (
        <Form form={addForm} layout="inline" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
          <Form.Item name="sortOrder" rules={[{ required: true }]}>
            <InputNumber placeholder="Ordre" min={0} size="small" style={{ width: 70 }} />
          </Form.Item>
          <Form.Item name="value" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Valeur" size="small" style={{ width: 150 }} />
          </Form.Item>
          <Form.Item name="label" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Libellé" size="small" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item name="color">
            <Input placeholder="Couleur" size="small" style={{ width: 100 }} />
          </Form.Item>
          <Form.Item>
            <Space size={4}>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleAdd} loading={saving}
                style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
                OK
              </Button>
              <Button size="small" icon={<CloseOutlined />} onClick={() => { setAdding(false); addForm.resetFields(); }}>
                Annuler
              </Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
}

// ─── Grille Informations libres (Custom Fields) ─────────────────────────────

const FIELD_TYPES = [
  { value: 'TEXT', label: 'Texte' },
  { value: 'NUMBER', label: 'Nombre' },
  { value: 'DATE', label: 'Date' },
  { value: 'SELECT', label: 'Liste déroulante' },
  { value: 'BOOLEAN', label: 'Oui / Non' },
];

function CustomFieldsGrid() {
  const [fields, setFields] = useState<CustomFieldDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm] = Form.useForm();
  const [adding, setAdding] = useState(false);
  const [addForm] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const loadFields = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customFieldsApi.getAllFields();
      setFields(data);
    } catch { /* ignore */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFields(); }, [loadFields]);

  const startEdit = (record: CustomFieldDef) => {
    editForm.setFieldsValue({
      ...record,
      optionsText: record.options?.join(', ') ?? '',
    });
    setEditingId(record.id);
  };

  const cancelEdit = () => { setEditingId(null); editForm.resetFields(); };

  const saveEdit = async () => {
    try {
      const values = await editForm.validateFields();
      setSaving(true);
      await customFieldsApi.updateField(editingId!, {
        fieldName: values.fieldName,
        fieldType: values.fieldType,
        options: values.optionsText ? values.optionsText.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        sortOrder: values.sortOrder,
        required: values.required ?? false,
        active: values.active,
      });
      message.success('Champ modifié');
      setEditingId(null);
      loadFields();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(handleApiError(err) ?? 'Erreur');
    } finally { setSaving(false); }
  };

  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      setSaving(true);
      await customFieldsApi.createField({
        fieldName: values.fieldName,
        fieldKey: values.fieldKey,
        fieldType: values.fieldType,
        options: values.optionsText ? values.optionsText.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        sortOrder: values.sortOrder ?? (fields.length + 1),
        required: values.required ?? false,
        active: true,
      });
      message.success('Champ ajouté');
      setAdding(false);
      addForm.resetFields();
      loadFields();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      message.error(handleApiError(err) ?? 'Erreur');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await customFieldsApi.deleteField(id);
      message.success('Champ supprimé');
      loadFields();
    } catch (err: unknown) {
      message.error(handleApiError(err) ?? 'Erreur');
    }
  };

  const columns = [
    {
      title: 'Ordre',
      dataIndex: 'sortOrder',
      width: 70,
      render: (val: number, record: CustomFieldDef) =>
        editingId === record.id ? (
          <Form.Item name="sortOrder" style={{ margin: 0 }} rules={[{ required: true }]}>
            <InputNumber min={0} size="small" style={{ width: 60 }} />
          </Form.Item>
        ) : val,
    },
    {
      title: 'Nom du champ',
      dataIndex: 'fieldName',
      render: (val: string, record: CustomFieldDef) =>
        editingId === record.id ? (
          <Form.Item name="fieldName" style={{ margin: 0 }} rules={[{ required: true, message: 'Requis' }]}>
            <Input size="small" />
          </Form.Item>
        ) : val,
    },
    {
      title: 'Clé',
      dataIndex: 'fieldKey',
      width: 140,
      render: (val: string) => <Tag>{val}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'fieldType',
      width: 130,
      render: (val: string, record: CustomFieldDef) =>
        editingId === record.id ? (
          <Form.Item name="fieldType" style={{ margin: 0 }} rules={[{ required: true }]}>
            <Select size="small" options={FIELD_TYPES} style={{ width: 120 }} />
          </Form.Item>
        ) : (
          <Tag color="blue">{FIELD_TYPES.find(t => t.value === val)?.label ?? val}</Tag>
        ),
    },
    {
      title: 'Options (SELECT)',
      dataIndex: 'options',
      width: 180,
      render: (val: string[], record: CustomFieldDef) =>
        editingId === record.id ? (
          <Form.Item name="optionsText" style={{ margin: 0 }}>
            <Input size="small" placeholder="opt1, opt2, opt3" />
          </Form.Item>
        ) : val?.length ? val.join(', ') : '-',
    },
    {
      title: 'Obligatoire',
      dataIndex: 'required',
      width: 90,
      render: (val: boolean, record: CustomFieldDef) =>
        editingId === record.id ? (
          <Form.Item name="required" valuePropName="checked" style={{ margin: 0 }}>
            <Switch size="small" />
          </Form.Item>
        ) : (
          val
            ? <CheckSquareOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            : <BorderOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
        ),
    },
    {
      title: 'Actif',
      dataIndex: 'active',
      width: 70,
      render: (val: boolean, record: CustomFieldDef) =>
        editingId === record.id ? (
          <Form.Item name="active" valuePropName="checked" style={{ margin: 0 }}>
            <Switch size="small" />
          </Form.Item>
        ) : (
          val
            ? <CheckSquareOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            : <BorderOutlined style={{ color: '#bfbfbf', fontSize: 16 }} />
        ),
    },
    {
      title: 'Actions',
      width: 100,
      render: (_: unknown, record: CustomFieldDef) =>
        editingId === record.id ? (
          <Space size={4}>
            <Button type="link" size="small" icon={<CheckOutlined />} onClick={saveEdit} loading={saving} />
            <Button type="link" size="small" icon={<CloseOutlined />} onClick={cancelEdit} />
          </Space>
        ) : (
          <Space size={4}>
            <Button type="link" size="small" icon={<EditOutlined />}
              onClick={() => startEdit(record)} disabled={editingId !== null} />
            <Popconfirm title="Supprimer ce champ et toutes ses valeurs ?"
              onConfirm={() => handleDelete(record.id)} okText="Oui" cancelText="Non">
              <Button type="link" size="small" danger icon={<DeleteOutlined />} disabled={editingId !== null} />
            </Popconfirm>
          </Space>
        ),
    },
  ];

  return (
    <Card
      size="small"
      title={
        <span>
          <SettingOutlined style={{ marginRight: 8, color: '#4F46E5' }} />
          Informations libres (champs personnalisés)
        </span>
      }
      extra={
        !adding && (
          <Button size="small" type="primary" icon={<PlusOutlined />}
            onClick={() => { addForm.resetFields(); addForm.setFieldsValue({ sortOrder: fields.length + 1, fieldType: 'TEXT' }); setAdding(true); }}
            style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>
            Ajouter un champ
          </Button>
        )
      }
      style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}
      loading={loading}
    >
      <Form form={editForm} component={false}>
        <Table dataSource={fields} columns={columns} rowKey="id" size="small" pagination={false} bordered
          scroll={{ x: 900 }} />
      </Form>

      {adding && (
        <Form form={addForm} layout="inline" style={{ marginTop: 12, gap: 8, flexWrap: 'wrap' }}>
          <Form.Item name="sortOrder" rules={[{ required: true }]}>
            <InputNumber placeholder="Ordre" min={0} size="small" style={{ width: 70 }} />
          </Form.Item>
          <Form.Item name="fieldKey" rules={[{ required: true, message: 'Requis' }, { pattern: /^[a-z][a-z0-9_]*$/, message: 'Minuscules, chiffres, _' }]}>
            <Input placeholder="cle_technique" size="small" style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="fieldName" rules={[{ required: true, message: 'Requis' }]}>
            <Input placeholder="Nom du champ" size="small" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="fieldType" rules={[{ required: true }]}>
            <Select placeholder="Type" size="small" options={FIELD_TYPES} style={{ width: 130 }} />
          </Form.Item>
          <Form.Item name="optionsText">
            <Input placeholder="Options (opt1, opt2)" size="small" style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="required" valuePropName="checked">
            <Switch size="small" checkedChildren="Obligatoire" unCheckedChildren="Optionnel" />
          </Form.Item>
          <Form.Item>
            <Space size={4}>
              <Button type="primary" size="small" icon={<CheckOutlined />} onClick={handleAdd} loading={saving}
                style={{ background: '#4F46E5', borderColor: '#4F46E5' }}>OK</Button>
              <Button size="small" icon={<CloseOutlined />} onClick={() => { setAdding(false); addForm.resetFields(); }}>Annuler</Button>
            </Space>
          </Form.Item>
        </Form>
      )}
    </Card>
  );
}
