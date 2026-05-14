import { App } from 'antd';

/**
 * Hook to get Ant Design message/notification/modal APIs
 * that are context-aware (respect dynamic theme, App wrapper).
 * Use this instead of importing { message } directly from 'antd'.
 */
export function useMessage() {
  const { message, notification, modal } = App.useApp();
  return { message, notification, modal };
}
