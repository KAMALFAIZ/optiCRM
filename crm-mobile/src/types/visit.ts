export interface Visit {
  id: string;
  visitType: string;
  subject: string;
  description?: string;
  visitDate: string;
  visitEndDate?: string;
  duration?: number;
  status: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  checkInAt?: string;
  checkOutAt?: string;
  notes?: string;
  outcome?: string;
  nextAction?: string;
  objective?: string;
  interestLevel?: string;
  satisfaction?: number;
  competitorDetected?: string;
  productsPresented?: string;
  estimatedAmount?: number;
  samplesDelivered?: string;
  transportMode?: string;
  mileage?: number;
  expenses?: number;
  followUpDate?: string;
  followUpPriority?: string;
  nextVisitPlanned?: boolean;
  contact?: { id: string; fullName: string; email?: string };
  account?: { id: string; name: string };
  assignedTo?: { id: string; fullName: string; email: string };
  createdAt: string;
  updatedAt?: string;
}

export interface VisitListItem {
  id: string;
  visitType: string;
  subject: string;
  visitDate: string;
  duration?: number;
  status: string;
  address?: string;
  city?: string;
  outcome?: string;
  contactName?: string;
  accountName?: string;
  assignedToName?: string;
  checkInAt?: string;
  checkOutAt?: string;
  createdAt: string;
}

export interface CreateVisitRequest {
  contactId?: string;
  accountId?: string;
  visitType: string;
  subject: string;
  description?: string;
  visitDate: string;
  visitEndDate?: string;
  duration?: number;
  status?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  notes?: string;
  outcome?: string;
  nextAction?: string;
  assignedToId?: string;
  objective?: string;
  interestLevel?: string;
  satisfaction?: number;
  competitorDetected?: string;
  productsPresented?: string;
  estimatedAmount?: number;
  transportMode?: string;
  mileage?: number;
  expenses?: number;
  followUpDate?: string;
  followUpPriority?: string;
  nextVisitPlanned?: string;
}

export type UpdateVisitRequest = Partial<CreateVisitRequest>;

export const VISIT_TYPES = [
  { value: 'prospection', label: 'Prospection', color: '#2196F3', icon: 'account-search-outline' },
  { value: 'suivi', label: 'Suivi', color: '#4CAF50', icon: 'account-check-outline' },
  { value: 'livraison', label: 'Livraison', color: '#FF9800', icon: 'truck-delivery-outline' },
  { value: 'reclamation', label: 'Réclamation', color: '#F44336', icon: 'alert-circle-outline' },
];

export const VISIT_STATUSES = [
  { value: 'planned', label: 'Planifiée', color: '#2196F3' },
  { value: 'in_progress', label: 'En cours', color: '#FF9800' },
  { value: 'completed', label: 'Terminée', color: '#4CAF50' },
  { value: 'cancelled', label: 'Annulée', color: '#F44336' },
];

export const VISIT_OUTCOMES = [
  { value: 'positive', label: 'Positif', color: '#4CAF50' },
  { value: 'negative', label: 'Négatif', color: '#F44336' },
  { value: 'neutral', label: 'Neutre', color: '#607D8B' },
  { value: 'follow_up', label: 'Suivi requis', color: '#FF9800' },
];
