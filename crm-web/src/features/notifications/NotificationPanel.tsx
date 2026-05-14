import React, { useEffect } from 'react';
import {
  Badge, Button, Dropdown, Empty, List, Space, Tag, Tooltip, Typography,
} from 'antd';
import {
  BellOutlined, CheckOutlined, DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  fetchNotifications,
  fetchUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from './notificationsSlice';
import type { Notification } from '@/types/notification';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/fr';

dayjs.extend(relativeTime);
dayjs.locale('fr');

const TYPE_COLORS: Record<string, string> = {
  LEAD: 'blue',
  OPPORTUNITY: 'gold',
  ACTIVITY: 'green',
  VISIT: 'cyan',
  TOUR: 'purple',
  SYSTEM: 'default',
};

interface Props {
  isDark?: boolean;
}

export default function NotificationPanel({ isDark }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { items, unreadCount, loading } = useAppSelector((state) => state.notifications);

  // Poll unread count every 60s
  useEffect(() => {
    dispatch(fetchUnreadCount());
    const interval = setInterval(() => dispatch(fetchUnreadCount()), 60_000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const handleOpen = (open: boolean) => {
    if (open) dispatch(fetchNotifications());
  };

  const handleClick = (n: Notification) => {
    if (!n.isRead) dispatch(markAsRead(n.id));
    if (n.link) navigate(n.link);
  };

  const handleMarkAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(markAllAsRead());
  };

  const panelContent = (
    <div style={{ width: 360, maxHeight: 480, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <Typography.Text strong style={{ fontSize: 14 }}>
          Notifications {unreadCount > 0 && <Badge count={unreadCount} style={{ marginLeft: 8 }} />}
        </Typography.Text>
        {unreadCount > 0 && (
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleMarkAll}
            style={{ padding: 0, fontSize: 12 }}
          >
            Tout marquer lu
          </Button>
        )}
      </div>

      {/* Liste */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {items.length === 0 && !loading ? (
          <Empty description="Aucune notification" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 24 }} />
        ) : (
          <List
            loading={loading}
            dataSource={items}
            renderItem={(n) => (
              <List.Item
                key={n.id}
                style={{
                  padding: '10px 16px',
                  cursor: n.link ? 'pointer' : 'default',
                  backgroundColor: n.isRead ? 'transparent' : '#e6f4ff',
                  borderLeft: n.isRead ? 'none' : '3px solid #1890ff',
                  transition: 'background 0.2s',
                }}
                onClick={() => handleClick(n)}
                extra={
                  <Tooltip title="Supprimer">
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={(e) => { e.stopPropagation(); dispatch(deleteNotification(n.id)); }}
                    />
                  </Tooltip>
                }
              >
                <List.Item.Meta
                  title={
                    <Space size={6}>
                      <Tag color={TYPE_COLORS[n.type] || 'default'} style={{ margin: 0, fontSize: 10 }}>
                        {n.type}
                      </Tag>
                      <Typography.Text strong={!n.isRead} style={{ fontSize: 13 }}>
                        {n.title}
                      </Typography.Text>
                    </Space>
                  }
                  description={
                    <div>
                      {n.message && (
                        <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                          {n.message}
                        </Typography.Text>
                      )}
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {dayjs(n.createdAt).fromNow()}
                      </Typography.Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: 6,
    fontSize: 18,
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
  };

  return (
    <Dropdown
      popupRender={() => panelContent}
      trigger={['click']}
      placement="bottomRight"
      onOpenChange={handleOpen}
    >
      <Tooltip title="Notifications">
        <button style={buttonStyle}>
          <Badge count={unreadCount} size="small" offset={[2, -2]} overflowCount={99}>
            <BellOutlined style={{ color: isDark ? '#b9c0c7' : '#495057', fontSize: 18 }} />
          </Badge>
        </button>
      </Tooltip>
    </Dropdown>
  );
}
