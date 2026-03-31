import { useEffect, useRef, useState } from 'react';
import { Alert, Badge, Button, Space, Tooltip, Progress } from 'antd';
import {
  WifiOutlined,
  DisconnectOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { getPendingCount, getConflictCount, getFailedCount } from '@/db/offlineDb';
import { syncPendingMutations } from '@/db/syncService';
import { syncEmitter, type SyncProgress, INITIAL_SYNC_STATE } from '@/db/syncState';
import { showSyncSuccess, showConflictDetected, showSyncError } from '@/utils/offlineToast';
import ConflictResolutionModal from './ConflictResolutionModal';
import SyncStatusPanel from './SyncStatusPanel';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [justCameBack, setJustCameBack] = useState(false);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>(INITIAL_SYNC_STATE);
  const [conflictModalOpen, setConflictModalOpen] = useState(false);
  const [syncPanelOpen, setSyncPanelOpen] = useState(false);
  const prevOnline = useRef(isOnline);

  // Rafraîchit les compteurs
  const refreshCounts = async () => {
    const [pending, conflicts, failed] = await Promise.all([
      getPendingCount(),
      getConflictCount(),
      getFailedCount(),
    ]);
    setPendingCount(pending);
    setConflictCount(conflicts);
    setFailedCount(failed);
  };

  useEffect(() => {
    refreshCounts();
    const interval = setInterval(refreshCounts, 10000);
    return () => clearInterval(interval);
  }, []);

  // Écouter la progression de la sync
  useEffect(() => {
    const unsub = syncEmitter.subscribe((progress) => {
      setSyncProgress(progress);
      if (progress.phase === 'done') {
        refreshCounts();
        if (progress.completed > 0) showSyncSuccess(progress.completed);
        if (progress.conflicts > 0) showConflictDetected();
        if (progress.errors > 0) showSyncError(progress.errors);
      }
    });
    return unsub;
  }, []);

  // Quand on revient en ligne : sync automatique
  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      setJustCameBack(true);
      handleSync();
      setTimeout(() => setJustCameBack(false), 4000);
    }
    prevOnline.current = isOnline;
  }, [isOnline]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncPendingMutations();
      await refreshCounts();
    } finally {
      setSyncing(false);
    }
  };

  const totalIssues = pendingCount + conflictCount + failedCount;

  // En ligne, rien en attente, pas de conflits — rien à afficher
  if (isOnline && totalIssues === 0 && !justCameBack && syncProgress.phase === 'idle') return null;

  // Message de retour de connexion
  if (isOnline && justCameBack && totalIssues === 0) {
    return (
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Connexion rétablie"
          style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
        />
      </div>
    );
  }

  const isSyncing = syncProgress.phase === 'syncing';
  const syncPercent = syncProgress.total > 0
    ? Math.round((syncProgress.completed / syncProgress.total) * 100)
    : 0;

  return (
    <>
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, maxWidth: 400 }}>
        {!isOnline ? (
          // Hors ligne
          <Alert
            type="error"
            showIcon
            icon={<DisconnectOutlined />}
            message={
              <Space>
                <span>Mode hors ligne</span>
                {pendingCount > 0 && (
                  <Tooltip title="Ces modifications seront synchronisées au retour du réseau">
                    <Badge count={pendingCount} size="small" />
                    <span style={{ marginLeft: 4, fontSize: 12 }}>en attente</span>
                  </Tooltip>
                )}
                <WifiOutlined style={{ color: '#ff4d4f' }} />
              </Space>
            }
            style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          />
        ) : (
          // En ligne mais avec des éléments à traiter
          <Alert
            type={conflictCount > 0 ? 'error' : failedCount > 0 ? 'error' : 'warning'}
            showIcon
            message={
              <Space direction="vertical" size={4} style={{ width: '100%' }}>
                {/* Barre de progression pendant la sync */}
                {isSyncing && (
                  <Progress
                    percent={syncPercent}
                    size="small"
                    status="active"
                    format={() => `${syncProgress.completed}/${syncProgress.total}`}
                  />
                )}

                <Space wrap>
                  {/* Compteur pending */}
                  {pendingCount > 0 && (
                    <Space size={4}>
                      <Badge count={pendingCount} size="small" />
                      <span style={{ fontSize: 12 }}>en attente</span>
                    </Space>
                  )}

                  {/* Compteur conflits */}
                  {conflictCount > 0 && (
                    <Tooltip title="Conflits de version à résoudre">
                      <Button
                        size="small"
                        danger
                        icon={<WarningOutlined />}
                        onClick={() => setConflictModalOpen(true)}
                      >
                        {conflictCount} conflit{conflictCount > 1 ? 's' : ''}
                      </Button>
                    </Tooltip>
                  )}

                  {/* Compteur erreurs */}
                  {failedCount > 0 && (
                    <Tooltip title="Modifications en erreur">
                      <Button
                        size="small"
                        danger
                        icon={<ExclamationCircleOutlined />}
                        onClick={() => setSyncPanelOpen(true)}
                      >
                        {failedCount} erreur{failedCount > 1 ? 's' : ''}
                      </Button>
                    </Tooltip>
                  )}

                  {/* Bouton sync */}
                  {pendingCount > 0 && (
                    <Button
                      size="small"
                      type="primary"
                      icon={<SyncOutlined spin={syncing} />}
                      loading={syncing}
                      onClick={handleSync}
                    >
                      Synchroniser
                    </Button>
                  )}
                </Space>
              </Space>
            }
            style={{ borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
          />
        )}
      </div>

      {/* Modal de résolution de conflits */}
      <ConflictResolutionModal
        open={conflictModalOpen}
        onClose={() => {
          setConflictModalOpen(false);
          refreshCounts();
        }}
      />

      {/* Panneau de détail sync / erreurs */}
      <SyncStatusPanel
        open={syncPanelOpen}
        onClose={() => {
          setSyncPanelOpen(false);
          refreshCounts();
        }}
        syncProgress={syncProgress}
      />
    </>
  );
}
