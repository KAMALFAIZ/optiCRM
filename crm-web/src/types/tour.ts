export interface Tour {
  id: string;
  name: string;
  description?: string;
  tourDate: string;
  status: string;
  region?: string;
  totalVisits: number;
  completedVisits: number;
  totalDistance?: number;
  startAddress?: string;
  startLatitude?: number;
  startLongitude?: number;
  endAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  notes?: string;
  // Champs avancés
  objective?: string;
  tourResult?: string;
  estimatedRevenue?: number;
  actualRevenue?: number;
  vehicleType?: string;
  fuelCost?: number;
  totalExpenses?: number;
  startTime?: string;
  endTime?: string;
  followUpNotes?: string;
  // Notes de frais
  expenseReportCount?: number;
  totalExpenseReportsAmount?: number;
  assignedTo?: {
    id: string;
    fullName: string;
    email: string;
  };
  visits?: TourVisitItem[];
  createdAt: string;
  updatedAt?: string;
}

export interface TourVisitItem {
  visitId: string;
  visitOrder: number;
  subject: string;
  visitType: string;
  status: string;
  address?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  accountName?: string;
  visitDate?: string;
}

export interface TourListItem {
  id: string;
  name: string;
  tourDate: string;
  status: string;
  region?: string;
  totalVisits: number;
  completedVisits: number;
  totalDistance?: number;
  assignedToName?: string;
  createdAt: string;
}

export interface CreateTourRequest {
  name: string;
  description?: string;
  tourDate: string;
  region?: string;
  startAddress?: string;
  startLatitude?: number;
  startLongitude?: number;
  endAddress?: string;
  endLatitude?: number;
  endLongitude?: number;
  notes?: string;
  assignedToId?: string;
  visitIds?: string[];
  // Champs avancés
  objective?: string;
  tourResult?: string;
  estimatedRevenue?: number;
  actualRevenue?: number;
  vehicleType?: string;
  fuelCost?: number;
  totalExpenses?: number;
  startTime?: string;
  endTime?: string;
  followUpNotes?: string;
}

export interface UpdateTourRequest extends Partial<CreateTourRequest> {
  status?: string;
}

export const TOUR_VEHICLE_TYPES = [
  { value: 'car', label: 'Voiture', color: 'blue' },
  { value: 'van', label: 'Fourgonnette', color: 'orange' },
  { value: 'truck', label: 'Camion', color: 'red' },
  { value: 'motorcycle', label: 'Moto', color: 'green' },
];

export const TOUR_STATUSES = [
  { value: 'draft', label: 'Brouillon', color: 'default' },
  { value: 'planned', label: 'Planifiée', color: 'blue' },
  { value: 'in_progress', label: 'En cours', color: 'orange' },
  { value: 'completed', label: 'Terminée', color: 'green' },
  { value: 'cancelled', label: 'Annulée', color: 'red' },
];
