export interface Notification {
  id: string;
  type: string;
  title: string;
  message?: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  loading: boolean;
  total: number;
  page: number;
}
