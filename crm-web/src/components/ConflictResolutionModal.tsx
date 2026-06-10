import { useEffect, useState } from 'react';
import { Modal, Table, Button, Space, Tag, Typography, Divider } from 'antd';
import { WarningOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { PendingMutation } from '@/db/offlineDb';
import { getMutationsByStatus } from '@/db/offlineDb';
import { resolveConflictKeepLocal, resolveConflictKeepServer } from '@/db/syncService';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function ConflictResolutionModal({ open, onClose }: Props) {
  const [conflicts, setConflicts] = useState<PendingMutation[]>([]);
  const [_loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState<number | null>(null);

  const loadConflicts = async () => {
    setLoading(true);
    try {
      const items = await getMutationsByStatus('conflict');
      setConflicts(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadConflicts();
  }, [open]);

  const handleKeepLocal = async (id: number) => {
    setResolving(id);
    try {
      await resolveConflictKeepLocal(id);
      await loadConflicts();
    } finally {
      setResolving(null);
    }
  };

  const handleKeepServer = async (id: number) => {
    setResolving(id);
    try {
      await resolveConflictKeepServer(id);
      await loadConflicts();
    } finally {
      setResolving(null);
    }
  };

  const renderDiff = (mutation: PendingMutation) => {
    const local = mutation.body as Record<string, unknown> | undefined;
    const server = mutation.serverData as Record<string, unknown> | undefined;
    if (!local || !server) return null;

    const allKeys = new Set([...Object.keys(local), ...Object.keys(server)]);
    const diffKeys = Array.from(allKeys).filter(key => {
      if (key === 'version') return false;
      return JSON.stringify(local[key]) !== JSON.stringify(server[key]);
    });

    if (diffKeys.length === 0) {
      return <Text type="secondary">Aucune différence détectée dans les champs.</Text>;
    }

    const dataSource = diffKeys.map(key => ({
      key,
      field: key,
      local: local[key] !== undefined ? String(local[key]) : '—',
      server: server[key] !== undefined ? String(server[key]) : '—',
    }));

    return (
      <Table
        size="small"
        pagination={false}
        dataSource={dataSource}
        columns={[
          { title: 'Champ', dataIndex: 'field', key: 'field', width: 150 },
          {
            title: 'Vos modifications',
            dataIndex: 'local',
            key: 'local',
            render: (v: string) => <Text style={{ color: '#10B981' }}>{v}</Text>,
          },
          {
            title: 'Version serveur',
            dataIndex: 'server',
            key: 'server',
            render: (v: string) => <Text style={{ color: '#4F46E5' }}>{v}</Text>,
          },
        ]}
      />
    );
  };

  return (
    <Modal
      title={
        <Space>
          <WarningOutlined style={{ color: '#f7b84b' }} />
          <span>Résolution de conflits</span>
          <Tag color="orange">{conflicts.length}</Tag>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={720}
    >
      {conflicts.length === 0 ? (
        <Text type="secondary">Aucun conflit à résoudre.</Text>
      ) : (
        conflicts.map((mutation) => (
          <div key={mutation.id} style={{ marginBottom: 24 }}>
            <Space style={{ marginBottom: 8 }}>
              <Tag color="blue">{mutation.method}</Tag>
              <Text strong>{mutation.entityType ?? 'Entité'}</Text>
              <Text type="secondary">{mutation.url}</Text>
            </Space>

            {renderDiff(mutation)}

            <Divider style={{ margin: '12px 0' }} />

            <Space>
              <Button
                type="primary"
                icon={<CheckOutlined />}
                loading={resolving === mutation.id}
                onClick={() => handleKeepLocal(mutation.id!)}
              >
                Garder mes modifications
              </Button>
              <Button
                icon={<CloseOutlined />}
                loading={resolving === mutation.id}
                onClick={() => handleKeepServer(mutation.id!)}
              >
                Utiliser la version serveur
              </Button>
            </Space>
          </div>
        ))
      )}
    </Modal>
  );
}
