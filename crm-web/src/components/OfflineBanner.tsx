import { Alert, Badge, Button, Space, Spin } from 'antd';
import { WifiOutlined, DisconnectOutlined, SyncOutlined } from '@ant-design/icons';
import { useOfflineSync } from '@/hooks/useOfflineSync';

export default function OfflineBanner() {
  const { isOnline, pendingCount, syncing, syncNow } = useOfflineSync();

  if (isOnline && pendingCount === 0) return null;

  if (!isOnline) {
    return (
      <Alert
        type="warning"
        banner
        icon={<DisconnectOutlined />}
        message={
          <Space>
            <span>Mode hors-ligne</span>
            {pendingCount > 0 && (
              <Badge count={pendingCount} style={{ backgroundColor: '#faad14' }} />
            )}
            {pendingCount > 0 && (
              <span style={{ fontSize: 12, color: '#888' }}>
                {pendingCount} action{pendingCount > 1 ? 's' : ''} en attente de synchronisation
              </span>
            )}
          </Space>
        }
        style={{ borderRadius: 0 }}
      />
    );
  }

  // Online but has pending actions
  return (
    <Alert
      type="info"
      banner
      icon={syncing ? <Spin size="small" /> : <WifiOutlined />}
      message={
        <Space>
          <span>
            {syncing
              ? 'Synchronisation en cours…'
              : `${pendingCount} action${pendingCount > 1 ? 's' : ''} à synchroniser`}
          </span>
          {!syncing && (
            <Button
              size="small"
              icon={<SyncOutlined />}
              onClick={syncNow}
            >
              Synchroniser
            </Button>
          )}
        </Space>
      }
      style={{ borderRadius: 0 }}
    />
  );
}
