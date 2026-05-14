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
  // Champs avancés
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
  contact?: {
    id: string;
    fullName: string;
    email?: string;
  };
  account?: {
    id: string;
    name: string;
  };
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
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
  // Champs avancés
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
}

export interface UpdateVisitRequest extends Partial<CreateVisitRequest> {}

export const VISIT_TYPES = [
  { value: 'prospection', label: 'Prospection', color: 'blue' },
  { value: 'suivi', label: 'Suivi', color: 'green' },
  { value: 'livraison', label: 'Livraison', color: 'orange' },
  { value: 'reclamation', label: 'Réclamation', color: 'red' },
];

export const VISIT_STATUSES = [
  { value: 'planned', label: 'Planifiée', color: 'blue' },
  { value: 'in_progress', label: 'En cours', color: 'orange' },
  { value: 'completed', label: 'Terminée', color: 'green' },
  { value: 'cancelled', label: 'Annulée', color: 'red' },
];

export const VISIT_OUTCOMES = [
  { value: 'positive', label: 'Positif', color: 'green' },
  { value: 'negative', label: 'Négatif', color: 'red' },
  { value: 'neutral', label: 'Neutre', color: 'default' },
  { value: 'follow_up', label: 'Suivi requis', color: 'orange' },
];

export const VISIT_INTEREST_LEVELS = [
  { value: 'hot', label: 'Chaud', color: 'red' },
  { value: 'warm', label: 'Tiède', color: 'orange' },
  { value: 'cold', label: 'Froid', color: 'blue' },
];

export const VISIT_TRANSPORT_MODES = [
  { value: 'car', label: 'Voiture', color: 'blue' },
  { value: 'motorcycle', label: 'Moto', color: 'orange' },
  { value: 'public', label: 'Transport public', color: 'green' },
  { value: 'foot', label: 'À pied', color: 'default' },
];

export const VISIT_FOLLOWUP_PRIORITIES = [
  { value: 'low', label: 'Basse', color: 'default' },
  { value: 'normal', label: 'Normale', color: 'blue' },
  { value: 'high', label: 'Haute', color: 'orange' },
  { value: 'urgent', label: 'Urgente', color: 'red' },
];
