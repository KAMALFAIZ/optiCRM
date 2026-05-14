import { useEffect, useState } from 'react';
import {
  Alert,
  App,
  Button,
  Card,
  Divider,
  Select,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from 'antd';
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { sageAutoSyncApi, type SageAutoSyncConfig } from '../../../api/sageAutoSync';

const { Text } = Typography;

const INTERVAL_OPTIONS = [
  { value: 'HOURLY', label: 'Toutes les heures' },
  { value: 'DAILY',  label: 'Une fois par jour (recommandé)' },
  { value: 'WEEKLY', label: 'Une fois par semaine' },
];

const INTERVAL_LABELS: Record<string, string> = {
  HOURLY: 'Toutes les heures',
  DAILY:  'Quotidienne',
  WEEKLY: 'Hebdomadaire',
};

export default function AutoSyncTab() {
  const { message } = App.useApp();
  const [config, setConfig]     = useState<SageAutoSyncConfig | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [running, setRunning]   = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  async function fetchConfig() {
    try {
      setLoading(true);
      const cfg = await sageAutoSyncApi.getConfig();
      setConfig(cfg);
    } catch {
      message.error('Impossible de charger la configuration auto-sync');
    } finally {
      setLoading(false);
    }
  }

  async function save(patch: Partial<SageAutoSyncConfig>) {
    if (!config) return;
    const updated = { ...config, ...patch };
    setSaving(true);
    try {
      const saved = await sageAutoSyncApi.saveConfig(updated);
      setConfig(saved);
      message.success('Configuration sauvegardée');
    } catch {
      message.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function runNow() {
    setRunning(true);
    try {
      const result = await sageAutoSyncApi.triggerAll();
      message.success('Synchronisation terminée : ' + result);
      await fetchConfig();
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Erreur lors de la synchronisation');
    } finally {
      setRunning(false);
    }
  }

  if (loading) return <Spin className="mt-8 flex justify-center" />;
  if (!config) return null;

  const hasEntities = config.syncAccounts || config.syncContacts;

  return (
    <div className="max-w-2xl space-y-6">
      <Alert
        type="info"
        showIcon
        message="Synchronisation automatique via SQL direct"
        description={
          <ul className="mt-1 mb-0 pl-4 text-sm">
            <li>OptiCRM se connecte directement à Sage SQL Server selon la fréquence choisie.</li>
            <li>Les données sont récupérées, comparées et appliquées <strong>sans intervention manuelle</strong>.</li>
            <li>Assurez-vous que la connexion Sage est configurée dans l'onglet <em>Configuration serveur</em>.</li>
          </ul>
        }
      />

      {/* ── Activation ── */}
      <Card size="small" title={<span><SyncOutlined className="mr-2 text-blue-500" />Activation</span>}>
        <div className="flex items-center justify-between">
          <div>
            <Text strong>Synchronisation automatique</Text>
            <br />
            <Text type="secondary" className="text-xs">
              Active la synchronisation périodique en arrière-plan
            </Text>
          </div>
          <Switch
            checked={config.enabled}
            loading={saving}
            onChange={checked => save({ enabled: checked })}
            checkedChildren="Activé"
            unCheckedChildren="Désactivé"
          />
        </div>
      </Card>

      {/* ── Fréquence ── */}
      <Card size="small" title={<span><ClockCircleOutlined className="mr-2 text-orange-500" />Fréquence</span>}>
        <Space direction="vertical" className="w-full" size="small">
          <Text type="secondary">Intervalle entre chaque synchronisation :</Text>
          <Select
            value={config.interval}
            options={INTERVAL_OPTIONS}
            className="w-full"
            disabled={saving}
            onChange={val => save({ interval: val })}
          />
          <Text type="secondary" className="text-xs">
            Le serveur vérifie toutes les 15 minutes si la prochaine sync est due.
          </Text>
        </Space>
      </Card>

      {/* ── Entités ── */}
      <Card size="small" title="Entités à synchroniser">
        <Space direction="vertical" size="middle" className="w-full">
          <div className="flex items-center justify-between">
            <div>
              <Text>Comptes clients (ACCOUNTS)</Text>
              <br />
              <Text type="secondary" className="text-xs">Table F_COMPTET / vue Clients</Text>
            </div>
            <Switch
              checked={config.syncAccounts}
              loading={saving}
              size="small"
              onChange={checked => save({ syncAccounts: checked })}
            />
          </div>
          <Divider className="my-0" />
          <div className="flex items-center justify-between">
            <div>
              <Text>Contacts (CONTACTS)</Text>
              <br />
              <Text type="secondary" className="text-xs">Table F_CONTACTT (avec email)</Text>
            </div>
            <Switch
              checked={config.syncContacts}
              loading={saving}
              size="small"
              onChange={checked => save({ syncContacts: checked })}
            />
          </div>
        </Space>
      </Card>

      {/* ── Dernière exécution ── */}
      <Card size="small" title="Dernière exécution">
        <Space direction="vertical" size="small" className="w-full">
          <div className="flex gap-4">
            <div>
              <Text type="secondary" className="text-xs">Date</Text>
              <br />
              <Text>
                {config.lastRunAt
                  ? new Date(config.lastRunAt).toLocaleString('fr-FR')
                  : '—'}
              </Text>
            </div>
            <div>
              <Text type="secondary" className="text-xs">Résultat</Text>
              <br />
              {config.lastRunStatus ? (
                <Tag color={config.lastRunStatus.includes('ERREUR') ? 'red' : 'green'}>
                  {config.lastRunStatus}
                </Tag>
              ) : (
                <Text type="secondary">—</Text>
              )}
            </div>
          </div>
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={fetchConfig}
            loading={loading}
          >
            Rafraîchir
          </Button>
        </Space>
      </Card>

      {/* ── Déclenchement manuel ── */}
      <Card size="small" title="Déclenchement manuel">
        <Space direction="vertical" size="small" className="w-full">
          <Text type="secondary">
            Lance immédiatement une synchronisation pour toutes les entités activées,
            sans attendre la prochaine échéance.
          </Text>
          {!hasEntities && (
            <Alert type="warning" showIcon message="Aucune entité activée. Activez au moins Comptes ou Contacts." />
          )}
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            loading={running}
            disabled={!hasEntities}
            onClick={runNow}
          >
            Synchroniser maintenant
          </Button>
          {config.enabled && (
            <Text type="secondary" className="text-xs">
              Prochaine sync automatique : {INTERVAL_LABELS[config.interval] ?? config.interval}
              {config.lastRunAt ? ` (dernière : ${new Date(config.lastRunAt).toLocaleString('fr-FR')})` : ''}
            </Text>
          )}
        </Space>
      </Card>
    </div>
  );
}
