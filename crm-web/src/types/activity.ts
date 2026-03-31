export interface Activity {
  id: string;
  activityType: string;
  subject: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  completedAt?: string;
  duration?: number;
  location?: string;
  locationType?: string;
  status: string;
  priority: string;
  relatedToType?: string;
  relatedToId?: string;
  callDirection?: string;
  callResult?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  reminderAt?: string;
  // Champs avancés
  objective?: string;
  result?: string;
  productsDiscussed?: string;
  estimatedRevenue?: number;
  expenses?: number;
  transportMode?: string;
  mileage?: number;
  followUpDate?: string;
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface ActivityListItem {
  id: string;
  activityType: string;
  subject: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  status: string;
  priority: string;
  location?: string;
  assignedToName?: string;
  relatedToType?: string;
  relatedToId?: string;
  createdAt: string;
}

export interface CreateActivityRequest {
  activityType: string;
  subject: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  dueDate?: string;
  duration?: number;
  location?: string;
  locationType?: string;
  status?: string;
  priority?: string;
  relatedToType?: string;
  relatedToId?: string;
  callDirection?: string;
  callResult?: string;
  assignedToId?: string;
  isRecurring?: boolean;
  recurrenceRule?: string;
  reminderAt?: string;
  // Champs avancés
  objective?: string;
  result?: string;
  productsDiscussed?: string;
  estimatedRevenue?: number;
  expenses?: number;
  transportMode?: string;
  mileage?: number;
  followUpDate?: string;
}

export interface UpdateActivityRequest extends Partial<CreateActivityRequest> {}

export const ACTIVITY_TYPES = [
  { value: 'call',    label: 'Appel',   color: 'blue'    },
  { value: 'email',   label: 'Email',   color: 'cyan'    },
  { value: 'meeting', label: 'Réunion', color: 'purple'  },
  { value: 'visite',  label: 'Visite',  color: 'green'   },
  { value: 'task',    label: 'Tâche',   color: 'orange'  },
  { value: 'note',    label: 'Note',    color: 'default' },
];

export const ACTIVITY_STATUSES = [
  { value: 'planned', label: 'Planifiée', color: 'blue' },
  { value: 'in_progress', label: 'En cours', color: 'orange' },
  { value: 'completed', label: 'Terminée', color: 'green' },
  { value: 'cancelled', label: 'Annulée', color: 'red' },
];

export const ACTIVITY_PRIORITIES = [
  { value: 'low', label: 'Basse', color: 'default' },
  { value: 'normal', label: 'Normale', color: 'blue' },
  { value: 'high', label: 'Haute', color: 'orange' },
  { value: 'urgent', label: 'Urgente', color: 'red' },
];

export const ACTIVITY_TRANSPORT_MODES = [
  { value: 'car', label: 'Voiture', color: 'blue' },
  { value: 'motorcycle', label: 'Moto', color: 'orange' },
  { value: 'public', label: 'Transport public', color: 'green' },
  { value: 'foot', label: 'À pied', color: 'default' },
];
