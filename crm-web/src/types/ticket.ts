export type TicketCategory = 'SAV' | 'TECHNIQUE' | 'COMMERCIAL' | 'FACTURATION' | 'LIVRAISON' | 'AUTRE';
export type TicketPriority = 'BASSE' | 'NORMALE' | 'HAUTE' | 'CRITIQUE';
export type TicketStatus   = 'OUVERT' | 'EN_COURS' | 'EN_ATTENTE' | 'RESOLU' | 'FERME';

export interface TicketRelated { id: string; name: string; }
export interface TicketUser    { id: string; fullName: string; email: string; }

export interface TicketComment {
  id: string;
  content: string;
  internal: boolean;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
}

export interface Ticket {
  id: string;
  reference: string;
  title: string;
  description: string | null;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  slaDeadline: string | null;
  slaBreached: boolean;
  resolvedAt: string | null;
  closedAt: string | null;
  account: TicketRelated | null;
  contact: TicketRelated | null;
  assignedTo: TicketUser | null;
  createdBy: TicketUser | null;
  comments: TicketComment[];
  createdAt: string;
  updatedAt: string | null;
}

export interface TicketListItem {
  id: string;
  reference: string;
  title: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  slaDeadline: string | null;
  slaBreached: boolean;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  contactName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  commentsCount: number;
  createdAt: string;
  resolvedAt: string | null;
}

export interface TicketStats {
  total: number;
  ouverts: number;
  enCours: number;
  enAttente: number;
  resolus: number;
  fermes: number;
  slaBreached: number;
  critiques: number;
  parCategorie: Record<string, number>;
  parPriorite: Record<string, number>;
}

export interface CreateTicketPayload {
  title: string;
  description?: string;
  category?: TicketCategory;
  priority?: TicketPriority;
  accountId?: string;
  contactId?: string;
  assignedToId?: string;
}

export interface UpdateTicketPayload extends CreateTicketPayload {
  status?: TicketStatus;
}
