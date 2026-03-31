export interface Permission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
}

export interface RolePermissions {
  [module: string]: Permission;
}

export interface RoleItem {
  id: string;
  name: string;
  description?: string;
  permissions: RolePermissions;
  isSystem: boolean;
  usersCount: number;
  createdAt?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: RolePermissions;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: RolePermissions;
}

// All available modules in the system
export const MODULES = [
  { key: 'crm', label: 'CRM (Contacts, Comptes, Pistes)' },
  { key: 'opportunities', label: 'Opportunités & Devis' },
  { key: 'stock', label: 'Stock & Inventaire' },
  { key: 'finance', label: 'Finance (Factures, Paiements)' },
  { key: 'planning', label: 'Planning & Activités' },
  { key: 'terrain', label: 'Terrain (Visites, Tournées)' },
  { key: 'projects', label: 'Projets & Tickets' },
  { key: 'marketing', label: 'Marketing (Campagnes, Email)' },
  { key: 'reporting', label: 'Rapports & KPIs' },
  { key: 'chantiers', label: 'Chantiers & Carte' },
  { key: 'admin', label: 'Administration' },
] as const;

export const ACTIONS = ['view', 'create', 'edit', 'delete'] as const;

export const ACTION_LABELS: Record<string, string> = {
  view: 'Voir',
  create: 'Créer',
  edit: 'Modifier',
  delete: 'Supprimer',
};

export const DEFAULT_PERMISSIONS: RolePermissions = MODULES.reduce((acc, mod) => {
  acc[mod.key] = { view: false, create: false, edit: false, delete: false };
  return acc;
}, {} as RolePermissions);
