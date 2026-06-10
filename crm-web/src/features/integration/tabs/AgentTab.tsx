import { useEffect, useState } from 'react';
import {
  App,
  Alert,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { type AgentKey, type AgentKeyCreated, agentApi } from '@/api/agent';

const { Text, Paragraph, Title } = Typography;

function heartbeatStatus(lastHeartbeat: string | null): { color: string; label: string } {
  if (!lastHeartbeat) return { color: 'default', label: 'Jamais connecté' };
  const ageMs = Date.now() - new Date(lastHeartbeat).getTime();
  if (ageMs < 2 * 60 * 1000) return { color: 'green', label: 'En ligne' };
  if (ageMs < 10 * 60 * 1000) return { color: 'orange', label: 'Inactif' };
  return { color: 'red', label: 'Hors ligne' };
}

export default function AgentTab() {
  const { message } = App.useApp();
  const [keys, setKeys] = useState<AgentKey[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [newKey, setNewKey] = useState<AgentKeyCreated | null>(null);
  const [label, setLabel] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      setKeys(await agentApi.list());
    } catch {
      message.error('Erreur lors du chargement des agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreate = async () => {
    if (!label.trim()) {
      message.warning('Saisir un nom pour l\'agent');
      return;
    }
    try {
      const created = await agentApi.create(label.trim());
      setNewKey(created);
      setCreateOpen(false);
      setLabel('');
      refresh();
    } catch {
      message.error('Impossible de créer la clé');
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await agentApi.revoke(id);
      message.success('Clé révoquée');
      refresh();
    } catch {
      message.error('Erreur lors de la révocation');
    }
  };

  const copyKey = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey.rawKey);
    message.success('Clé copiée dans le presse-papier');
  };

  return (
    <Card
      title={
        <Space>
          <RobotOutlined />
          <span>Agents de synchronisation locale</span>
        </Space>
      }
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={refresh} loading={loading} />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
            Nouvel agent
          </Button>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Agent local de synchronisation Sage"
        description={
          <div>
            <Paragraph>
              Pour les déploiements SaaS, l'agent local tourne sur le réseau du client et
              relaie les données Sage vers OptiCRM via HTTPS. Téléchargez le JAR depuis le
              dépôt et installez-le comme service Windows avec la clé générée ici.
            </Paragraph>
            <Text type="secondary">
              Documentation : <code>opticrm-sync-agent/README.md</code>
            </Text>
          </div>
        }
      />

      <Table<AgentKey>
        rowKey="keyId"
        dataSource={keys}
        loading={loading}
        pagination={false}
        columns={[
          { title: 'Nom', dataIndex: 'label' },
          {
            title: 'Clé',
            dataIndex: 'keyPrefix',
            render: v => <code>{v}…</code>,
          },
          {
            title: 'Statut',
            dataIndex: 'lastHeartbeat',
            render: v => {
              const s = heartbeatStatus(v);
              return <Tag color={s.color}>{s.label}</Tag>;
            },
          },
          {
            title: 'Dernière activité',
            dataIndex: 'lastHeartbeat',
            render: v => (v ? new Date(v).toLocaleString('fr-FR') : '—'),
          },
          { title: 'Version', dataIndex: 'agentVersion', render: v => v || '—' },
          { title: 'IP', dataIndex: 'lastUsedIp', render: v => v || '—' },
          {
            title: 'État',
            dataIndex: 'enabled',
            render: (v, r) =>
              r.revokedAt ? (
                <Tag color="red">Révoqué</Tag>
              ) : v ? (
                <Tag color="green">Actif</Tag>
              ) : (
                <Tag>Désactivé</Tag>
              ),
          },
          {
            title: '',
            key: 'actions',
            render: (_, r) =>
              !r.revokedAt && (
                <Popconfirm
                  title="Révoquer cette clé ?"
                  description="L'agent ne pourra plus se connecter."
                  okText="Révoquer"
                  cancelText="Annuler"
                  onConfirm={() => handleRevoke(r.keyId)}
                >
                  <Button danger size="small" icon={<DeleteOutlined />} />
                </Popconfirm>
              ),
          },
        ]}
      />

      <Modal
        title="Créer une nouvelle clé d'agent"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={handleCreate}
        okText="Générer"
        cancelText="Annuler"
      >
        <Form layout="vertical">
          <Form.Item label="Nom de l'agent" required>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="ex. Agent siège Casablanca"
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Clé générée — à copier maintenant"
        open={!!newKey}
        onCancel={() => setNewKey(null)}
        footer={[
          <Button key="copy" type="primary" icon={<CopyOutlined />} onClick={copyKey}>
            Copier la clé
          </Button>,
          <Button key="close" onClick={() => setNewKey(null)}>
            J'ai sauvegardé la clé
          </Button>,
        ]}
        closable={false}
        maskClosable={false}
      >
        <Alert
          type="warning"
          showIcon
          message="Cette clé ne sera plus affichée."
          description="Copiez-la maintenant et collez-la dans agent-config.yml de l'agent local."
          style={{ marginBottom: 16 }}
        />
        {newKey && (
          <Input.TextArea
            value={newKey.rawKey}
            autoSize
            readOnly
            style={{ fontFamily: 'monospace' }}
          />
        )}
      </Modal>
    </Card>
  );
}
