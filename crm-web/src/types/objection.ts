export interface Objection {
  id: string;
  code: string;
  title: string;
  description?: string;
  category?: ObjectionCategory;
  response?: string;
  contact?: {
    id: string;
    name: string;
  };
  account?: {
    id: string;
    name: string;
  };
  opportunity?: {
    id: string;
    name: string;
  };
  status: ObjectionStatus;
  priority: ObjectionPriority;
  source?: ObjectionSource;
  createdBy?: {
    id: string;
    fullName: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
  };
  resolvedAt?: string;
  resolvedBy?: {
    id: string;
    fullName: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ObjectionListItem {
  id: string;
  code: string;
  title: string;
  category?: ObjectionCategory;
  status: ObjectionStatus;
  priority: ObjectionPriority;
  source?: ObjectionSource;
  accountName?: string;
  accountId?: string;
  contactName?: string;
  contactId?: string;
  assignedToName?: string;
  assignedToId?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface CreateObjectionRequest {
  title: string;
  description?: string;
  category?: ObjectionCategory;
  response?: string;
  contactId?: string;
  accountId?: string;
  opportunityId?: string;
  status?: ObjectionStatus;
  priority?: ObjectionPriority;
  source?: ObjectionSource;
  assignedToId?: string;
}

export interface UpdateObjectionRequest extends CreateObjectionRequest {}

export interface ResolveObjectionRequest {
  response: string;
}

export interface ObjectionStats {
  totalObjections: number;
  openObjections: number;
  inProgressObjections: number;
  resolvedObjections: number;
  escalatedObjections: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
}

export type ObjectionCategory =
  | 'PRICE'
  | 'QUALITY'
  | 'DELIVERY'
  | 'COMPETITION'
  | 'TIMING'
  | 'FEATURES'
  | 'SUPPORT'
  | 'OTHER';

export type ObjectionStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED';

export type ObjectionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ObjectionSource =
  | 'PHONE'
  | 'EMAIL'
  | 'MEETING'
  | 'DEMO'
  | 'WEBSITE'
  | 'OTHER';

export const OBJECTION_CATEGORY_CONFIG: Record<ObjectionCategory, { label: string; color: string }> = {
  PRICE: { label: 'Prix', color: 'gold' },
  QUALITY: { label: 'Qualité', color: 'blue' },
  DELIVERY: { label: 'Livraison', color: 'cyan' },
  COMPETITION: { label: 'Concurrence', color: 'purple' },
  TIMING: { label: 'Timing', color: 'orange' },
  FEATURES: { label: 'Fonctionnalités', color: 'geekblue' },
  SUPPORT: { label: 'Support', color: 'lime' },
  OTHER: { label: 'Autre', color: 'default' },
};

export const OBJECTION_STATUS_CONFIG: Record<ObjectionStatus, { label: string; color: string }> = {
  OPEN: { label: 'Ouverte', color: 'blue' },
  IN_PROGRESS: { label: 'En cours', color: 'orange' },
  RESOLVED: { label: 'Résolue', color: 'green' },
  CLOSED: { label: 'Fermée', color: 'default' },
  ESCALATED: { label: 'Escaladée', color: 'red' },
};

export const OBJECTION_PRIORITY_CONFIG: Record<ObjectionPriority, { label: string; color: string }> = {
  LOW: { label: 'Basse', color: 'default' },
  MEDIUM: { label: 'Moyenne', color: 'blue' },
  HIGH: { label: 'Haute', color: 'orange' },
  URGENT: { label: 'Urgente', color: 'red' },
};

export const OBJECTION_SOURCE_CONFIG: Record<ObjectionSource, { label: string; color: string }> = {
  PHONE: { label: 'Téléphone', color: 'blue' },
  EMAIL: { label: 'Email', color: 'cyan' },
  MEETING: { label: 'Réunion', color: 'purple' },
  DEMO: { label: 'Démo', color: 'green' },
  WEBSITE: { label: 'Site web', color: 'geekblue' },
  OTHER: { label: 'Autre', color: 'default' },
};
