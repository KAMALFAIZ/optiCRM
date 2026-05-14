import { useEffect, useState } from 'react';
import { Drawer, Timeline, Tag, Spin, Empty, Pagination } from 'antd';
import {
  UserAddOutlined,
  EditOutlined,
  CheckCircleOutlined,
  StopOutlined,
  LockOutlined,
  UnlockOutlined,
  CameraOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { UserActivity, ACTIVITY_LABELS } from '../../types/user';
import usersApi from '../../api/users';

interface UserActivityDrawerProps {
  open: boolean;
  userId: string | null;
  userName?: string;
  onClose: () => void;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  USER_CREATED: <UserAddOutlined />,
  USER_UPDATED: <EditOutlined />,
  USER_ACTIVATED: <CheckCircleOutlined />,
  USER_DEACTIVATED: <StopOutlined />,
  PASSWORD_CHANGED: <LockOutlined />,
  USER_UNLOCKED: <UnlockOutlined />,
  AVATAR_UPDATED: <CameraOutlined />,
};

export default function UserActivityDrawer({ open, userId, userName, onClose }: UserActivityDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (open && userId) {
      loadActivities(1);
    }
  }, [open, userId]);

  const loadActivities = async (p: number) => {
    if (!userId) return;
    setLoading(true);
    try {
      const result = await usersApi.getActivities(userId, p, 15);
      setActivities(result.content);
      setTotal(result.totalElements);
      setPage(p);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={`Historique${userName ? ` — ${userName}` : ''}`}
      open={open}
      onClose={onClose}
      width={420}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : activities.length === 0 ? (
        <Empty description="Aucune activit\u00e9" />
      ) : (
        <>
          <Timeline
            items={activities.map((a) => {
              const meta = ACTIVITY_LABELS[a.action] || { label: a.action, color: 'default' };
              return {
                dot: <ClockCircleOutlined style={{ fontSize: 14 }} />,
                children: (
                  <div>
                    <div style={{ marginBottom: 4 }}>
                      <Tag color={meta.color} icon={ACTION_ICONS[a.action]}>
                        {meta.label}
                      </Tag>
                      <span style={{ fontSize: 12, color: '#999' }}>
                        {new Date(a.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {a.details && (
                      <div style={{ fontSize: 13, color: '#555' }}>{a.details}</div>
                    )}
                  </div>
                ),
              };
            })}
          />
          {total > 15 && (
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <Pagination
                current={page}
                total={total}
                pageSize={15}
                size="small"
                onChange={loadActivities}
                showTotal={(t) => `${t} actions`}
              />
            </div>
          )}
        </>
      )}
    </Drawer>
  );
}
