import { useEffect, useState } from 'react';
import { Drawer, List, Button, Space, Tag, Typography, Progress, Empty } from 'antd';
import { DeleteOutlined, ReloadOutlined, WarningOutlined } from '@ant-design/icons';
import type { PendingMutation } from '@/db/offlineDb';
import { getMutationsByStatus } from '@/db/offlineDb';
import { discardFailedMutation, retryFailedMutation } from '@/db/syncService';

const { Text } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  syncProgress?: { phase: string; total: number; completed: number };
}

export default function SyncStatusPanel({ open, onClose, syncProgress }: Props) {
  const [failedMutations, setFailedMutations] = useState<PendingMutation[]>([]);
  const [loading, setLoading] = useState(false);

  const loadFailed = async () => {
    setLoading(true);
    try {
      const items = await getMutationsByStatus('failed');
      setFailedMutations(items);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) loadFailed();
  }, [open]);

  const handleRetry = async (id: number) => {
    await retryFailedMutation(id);
    await loadFailed();
  };

  const handleDiscard = async (id: number) => {
    await discardFailedMutation(id);
    await loadFailed();
  };

  const isSyncing = syncProgress?.phase === 'syncing';
  const percent = syncProgress && syncProgress.total > 0
    ? Math.round((syncProgress.completed / syncProgress.total) * 100)
    : 0;

  return (
    <Drawer
      title="Synchronisation"
      placement="right"
      open={open}
      onClose={onClose}
      width={400}
    >
      {isSyncing && (
        <div style={{ marginBottom: 24 }}>
          <Text strong>Synchronisation en cours...</Text>
          <Progress
            percent={percent}
            status="active"
            format={() => `${syncProgress!.completed}/${syncProgress!.total}`}
            style={{ marginTop: 8 }}
          />
        </div>
      )}

      <Text strong style={{ fontSize: 14, marginBottom: 12, display: 'block' }}>
        <WarningOutlined style={{ color: '#f06548', marginRight: 8 }} />
        Modifications en erreur ({failedMutations.length})
      </Text>

      {failedMutations.length === 0 ? (
        <Empty description="Aucune erreur" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          loading={loading}
          size="small"
          dataSource={failedMutations}
          renderItem={(mutation) => (
            <List.Item
              actions={[
                <Button
                  key="retry"
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => handleRetry(mutation.id!)}
                >
                  Réessayer
                </Button>,
                <Button
                  key="discard"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDiscard(mutation.id!)}
                >
                  Supprimer
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color="red">{mutation.method}</Tag>
                    <Text>{mutation.entityType ?? 'Entité'}</Text>
                  </Space>
                }
                description={
                  <Text type="secondary" ellipsis style={{ maxWidth: 200 }}>
                    {mutation.errorMessage ?? mutation.url}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Drawer>
  );
}
