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
  objective?: string;
  result?: string;
  productsDiscussed?: string;
  estimatedRevenue?: number;
  expenses?: number;
  transportMode?: string;
  mileage?: number;
  followUpDate?: string;
  assignedTo?: { id: string; fullName: string; email: string };
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
  objective?: string;
  result?: string;
  productsDiscussed?: string;
  estimatedRevenue?: number;
  expenses?: number;
  transportMode?: string;
  mileage?: number;
  followUpDate?: string;
}

export type UpdateActivityRequest = Partial<CreateActivityRequest>;

export const ACTIVITY_TYPES = [
  { value: 'call', label: 'Appel', color: '#2196F3', icon: 'phone-outline' },
  { value: 'email', label: 'Email', color: '#00BCD4', icon: 'email-outline' },
  { value: 'meeting', label: 'Réunion', color: '#9C27B0', icon: 'account-group-outline' },
  { value: 'task', label: 'Tâche', color: '#FF9800', icon: 'check-circle-outline' },
  { value: 'note', label: 'Note', color: '#607D8B', icon: 'note-text-outline' },
];

export const ACTIVITY_STATUSES = [
  { value: 'planned', label: 'Planifiée', color: '#2196F3' },
  { value: 'in_progress', label: 'En cours', color: '#FF9800' },
  { value: 'completed', label: 'Terminée', color: '#4CAF50' },
  { value: 'cancelled', label: 'Annulée', color: '#F44336' },
];

export const ACTIVITY_PRIORITIES = [
  { value: 'low', label: 'Basse', color: '#607D8B' },
  { value: 'normal', label: 'Normale', color: '#2196F3' },
  { value: 'high', label: 'Haute', color: '#FF9800' },
  { value: 'urgent', label: 'Urgente', color: '#F44336' },
];
