export interface Quote {
  id: string;
  quoteNumber: string;
  name: string;
  status: QuoteStatus;
  account: AccountInfo;
  contact?: ContactInfo;
  opportunity?: OpportunityInfo;
  chantier?: ChantierInfo;
  assignedTo?: UserInfo;
  quoteDate: string;
  validUntil: string;
  currency: string;
  subtotal: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent: number;
  taxAmount: number;
  shippingAmount?: number;
  total: number;
  terms?: string;
  notes?: string;
  billingAddress?: string;
  shippingAddress?: string;
  lineItems: QuoteLineItem[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface QuoteListItem {
  id: string;
  quoteNumber: string;
  name: string;
  status: QuoteStatus;
  accountId: string;
  accountName: string;
  contactId?: string;
  contactName?: string;
  opportunityId?: string;
  opportunityName?: string;
  chantierId?: string;
  chantierNom?: string;
  assignedToId?: string;
  assignedToName?: string;
  quoteDate: string;
  validUntil: string;
  currency: string;
  subtotal: number;
  total: number;
  itemCount: number;
  createdAt: string;
}

export interface QuoteLineItem {
  id?: string;
  productId?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  lineTotal: number;
  sortOrder: number;
}

export type QuoteStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export const QUOTE_STATUS_CONFIG: Record<QuoteStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  SENT: { label: 'Envoyé', color: 'processing' },
  VIEWED: { label: 'Consulté', color: 'cyan' },
  ACCEPTED: { label: 'Accepté', color: 'success' },
  REJECTED: { label: 'Refusé', color: 'error' },
  EXPIRED: { label: 'Expiré', color: 'warning' },
  CANCELLED: { label: 'Annulé', color: 'default' },
};

export interface CreateQuoteRequest {
  name: string;
  accountId: string;
  contactId?: string;
  opportunityId?: string;
  chantierId?: string;
  assignedToId?: string;
  quoteDate?: string;
  validUntil: string;
  currency?: string;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  shippingAmount?: number;
  terms?: string;
  notes?: string;
  billingAddress?: string;
  shippingAddress?: string;
  lineItems?: LineItemRequest[];
  tags?: string[];
}

export interface UpdateQuoteRequest {
  name?: string;
  status?: QuoteStatus;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  chantierId?: string;
  assignedToId?: string;
  quoteDate?: string;
  validUntil?: string;
  currency?: string;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  shippingAmount?: number;
  terms?: string;
  notes?: string;
  billingAddress?: string;
  shippingAddress?: string;
  lineItems?: LineItemRequest[];
  tags?: string[];
}

export interface LineItemRequest {
  id?: string;
  productId?: string;
  name: string;
  description?: string;
  sku?: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discountPercent?: number;
  discountAmount?: number;
  taxPercent?: number;
  sortOrder?: number;
}

interface AccountInfo {
  id: string;
  name: string;
}

interface ChantierInfo {
  id: string;
  nom: string;
  ville?: string;
}

interface ContactInfo {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
}

interface OpportunityInfo {
  id: string;
  name: string;
}

interface UserInfo {
  id: string;
  fullName: string;
  email?: string;
}
