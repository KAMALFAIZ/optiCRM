import { ReactNode } from 'react';
import { Result } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  module: string;
  action: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Conditionally renders children based on the current user's permissions.
 * If the user lacks the required permission, shows a fallback or nothing.
 */
export function PermissionGuard({ module, action, children, fallback }: PermissionGuardProps) {
  const { hasPermission } = usePermissions();

  if (hasPermission(module, action)) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
}

/**
 * Full-page guard that shows an access denied message.
 */
export function PermissionPage({ module, action, children }: Omit<PermissionGuardProps, 'fallback'>) {
  const { hasPermission } = usePermissions();

  if (hasPermission(module, action)) {
    return <>{children}</>;
  }

  return (
    <Result
      status="403"
      title="Accès refusé"
      subTitle="Vous n'avez pas les droits nécessaires pour accéder à cette page."
    />
  );
}

export default PermissionGuard;
