import { useMemo } from 'react';
import { useAppSelector } from '@/store';
import { selectUser } from '@/features/auth/authSlice';

/**
 * Mapping between sidebar menu keys and their required permission module.
 * Used to filter navigation items based on the user's role permissions.
 */
export const ROUTE_PERMISSION_MAP: Record<string, string> = {
  // CRM
  '/contacts': 'crm',
  '/accounts': 'crm',
  '/leads': 'crm',
  '/opportunities': 'opportunities',
  '/quotes': 'opportunities',
  '/competitors': 'crm',
  // Stock
  '/stock/products': 'stock',
  '/stock/inventory': 'stock',
  // Finance
  '/invoices': 'finance',
  '/payments': 'finance',
  '/orders': 'finance',
  '/aged-balance': 'finance',
  '/ventes-saisies': 'finance',
  // ODYSSEE
  '/chantiers': 'chantiers',
  '/map': 'chantiers',
  // Terrain
  '/activities': 'terrain',
  '/planning': 'planning',
  '/visits': 'terrain',
  '/tours': 'terrain',
  '/expense-reports': 'terrain',
  '/field-dashboard': 'terrain',
  // Projects & Support
  '/tickets': 'projects',
  '/projects': 'projects',
  // Marketing
  '/campaigns': 'marketing',
  '/email-templates': 'marketing',
  // Pilotage
  '/forecast': 'reporting',
  '/kpis': 'reporting',
  '/objectives': 'reporting',
  '/sales-tracking': 'reporting',
  '/reports': 'reporting',
  // Admin
  '/users': 'admin',
  '/admin/roles': 'admin',
  '/admin/pricing-categories': 'admin',
  '/integration': 'admin',
  '/integration/sage': 'admin',
  '/settings': 'admin',
};

/**
 * Mapping between parent menu group keys and their associated permission modules.
 * A group is visible if the user has view access to at least one of its modules.
 */
export const GROUP_PERMISSION_MAP: Record<string, string[]> = {
  crm: ['crm', 'opportunities'],
  inventory: ['stock'],
  finance: ['finance'],
  odyssee: ['chantiers'],
  terrain: ['terrain', 'planning'],
  projets: ['projects'],
  marketing: ['marketing'],
  pilotage: ['reporting'],
  admin: ['admin'],
};

/**
 * Maps frontend grouped module keys to the granular backend permission keys.
 * When the frontend asks "can view crm?", we also check contacts, accounts, leads.
 * This handles both: roles created via the frontend form (using grouped keys)
 * and roles seeded from the backend (using granular keys).
 */
const MODULE_ALIASES: Record<string, string[]> = {
  crm: ['crm', 'contacts', 'accounts', 'leads'],
  opportunities: ['opportunities', 'quotes'],
  stock: ['stock', 'products'],
  finance: ['finance', 'invoices', 'payments'],
  planning: ['planning', 'activities'],
  terrain: ['terrain', 'activities', 'visits', 'tours'],
  projects: ['projects', 'tickets'],
  marketing: ['marketing', 'campaigns'],
  reporting: ['reporting', 'reports'],
  chantiers: ['chantiers'],
  admin: ['admin', 'users', 'roles', 'teams', 'territories', 'settings'],
};

/**
 * Maps action aliases between frontend and backend naming conventions.
 * Frontend uses: view, create, edit, delete
 * Backend may use: read, create, update, delete
 */
const ACTION_ALIASES: Record<string, string[]> = {
  view: ['view', 'read'],
  create: ['create'],
  edit: ['edit', 'update'],
  delete: ['delete'],
};

export function usePermissions() {
  const user = useAppSelector(selectUser);

  const permissions = useMemo(() => {
    const roleName = user?.role?.name;
    const isSuperAdmin = roleName === 'SUPER_ADMIN';
    const isAdmin = roleName === 'ADMIN' || isSuperAdmin;
    const isManager = roleName === 'MANAGER' || isAdmin;

    const hasPermission = (module: string, action: string): boolean => {
      if (isSuperAdmin) return true;

      const perms = user?.role?.permissions;
      if (!perms) return isAdmin; // Admins get full access by default when no perms defined

      // 1) Check the primary (grouped) module key first.
      //    If it exists in permissions, it is AUTHORITATIVE — don't fall through to aliases.
      const primaryPerms = perms[module];
      if (primaryPerms && typeof primaryPerms === 'object') {
        const pp = primaryPerms as Record<string, boolean>;
        // Check exact action first (frontend convention: view, edit, create, delete)
        if (pp[action] === true) return true;
        if (pp[action] === false) return false; // Explicitly denied — STOP here
        // Action not present in this key — check backend alias (read/update)
        const actionAliases = ACTION_ALIASES[action] || [];
        for (const actKey of actionAliases) {
          if (actKey === action) continue; // Already checked
          if (pp[actKey] === true) return true;
        }
        // The grouped key exists but the action is false/missing → DENY.
        // Do NOT check granular aliases (they may be stale/conflicting).
        return false;
      }

      // 2) Grouped key doesn't exist → fall back to granular aliases.
      //    This handles roles that only have backend-seeded granular keys.
      const actionKeys = ACTION_ALIASES[action] || [action];
      const aliasKeys = MODULE_ALIASES[module] || [];
      for (const modKey of aliasKeys) {
        if (modKey === module) continue; // Already checked above
        const modulePerms = perms[modKey];
        if (!modulePerms || typeof modulePerms !== 'object') continue;
        const mp = modulePerms as Record<string, boolean>;
        for (const actKey of actionKeys) {
          if (mp[actKey] === true) return true;
        }
      }

      return false;
    };

    const canView = (module: string) => hasPermission(module, 'view');
    const canCreate = (module: string) => hasPermission(module, 'create');
    const canEdit = (module: string) => hasPermission(module, 'edit');
    const canDelete = (module: string) => hasPermission(module, 'delete');

    /**
     * Check if a route (menu key like '/contacts') is accessible to the current user.
     */
    const canAccessRoute = (routeKey: string): boolean => {
      if (isSuperAdmin) return true;
      // Dashboard is always accessible
      if (routeKey === '/') return true;
      const module = ROUTE_PERMISSION_MAP[routeKey];
      if (!module) return true; // No permission defined = accessible
      return canView(module);
    };

    /**
     * Check if a menu group (like 'crm', 'finance') has at least one accessible child.
     */
    const canAccessGroup = (groupKey: string): boolean => {
      if (isSuperAdmin) return true;
      const modules = GROUP_PERMISSION_MAP[groupKey];
      if (!modules) return true;
      return modules.some((mod) => canView(mod));
    };

    return {
      user,
      roleName,
      isSuperAdmin,
      isAdmin,
      isManager,
      hasPermission,
      canView,
      canCreate,
      canEdit,
      canDelete,
      canAccessRoute,
      canAccessGroup,
    };
  }, [user]);

  return permissions;
}

export default usePermissions;
