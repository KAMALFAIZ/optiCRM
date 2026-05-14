import type { User } from '../types/auth';

type Module = 'contacts' | 'accounts' | 'leads' | 'opportunities' | 'activities' | 'visits' | 'quotes' | 'invoices' | 'payments';
type Action = 'read' | 'create' | 'update' | 'delete';

const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

export function hasPermission(user: User | null, module: Module, action: Action): boolean {
  if (!user) return false;
  const roleName = user.role?.name;
  if (!roleName) return false;
  if (ADMIN_ROLES.includes(roleName)) return true;
  if (roleName === 'READ_ONLY') return action === 'read';
  // MANAGER, SUPERVISEUR and COMMERCIAL: check permissions from role object
  const permissions = user.role?.permissions;
  if (permissions && permissions[module]) {
    return permissions[module][action] === true;
  }
  // Default: MANAGER, SUPERVISEUR and COMMERCIAL can do most things
  if (roleName === 'MANAGER' || roleName === 'SUPERVISEUR' || roleName === 'COMMERCIAL') {
    return true;
  }
  return false;
}

export function canCreate(user: User | null, module: Module): boolean {
  return hasPermission(user, module, 'create');
}

export function canEdit(user: User | null, module: Module): boolean {
  return hasPermission(user, module, 'update');
}

export function canDelete(user: User | null, module: Module): boolean {
  return hasPermission(user, module, 'delete');
}
