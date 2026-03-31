export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  account: {
    id: string;
    name: string;
  };
  contactId?: string;
  quoteId?: string;
  orderId?: string;
  invoiceDate: string;
  dueDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  billingName?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  paymentTermsId?: string;
  notes?: string;
  pdfUrl?: string;
  createdBy?: {
    id: string;
    fullName: string;
  };
  lines: InvoiceLine[];
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  paidAt?: string;
}

export interface InvoiceListItem {
  id: string;
  invoiceNumber: string;
  invoiceType: InvoiceType;
  status: InvoiceStatus;
  accountName: string;
  accountId: string;
  invoiceDate: string;
  dueDate: string;
  total: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  createdByName?: string;
  overdue: boolean;
}

export interface InvoiceLine {
  id?: string;
  productId?: string;
  productCode?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  sortOrder?: number;
}

export interface CreateInvoiceRequest {
  invoiceType?: InvoiceType;
  accountId: string;
  contactId?: string;
  quoteId?: string;
  orderId?: string;
  invoiceDate: string;
  dueDate: string;
  discountAmount?: number;
  currency?: string;
  billingName?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  paymentTermsId?: string;
  notes?: string;
  lines?: InvoiceLine[];
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  contactId?: string;
  invoiceDate?: string;
  dueDate?: string;
  discountAmount?: number;
  currency?: string;
  billingName?: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingPostalCode?: string;
  billingCountry?: string;
  paymentTermsId?: string;
  notes?: string;
  lines?: InvoiceLine[];
}

export interface InvoiceStats {
  totalInvoices: number;
  totalInvoiced: number;
  totalPaid: number;
  totalDue: number;
  overdueCount: number;
  overdueAmount: number;
  draftCount: number;
  sentCount: number;
  paidCount: number;
}

export type InvoiceType = 'INVOICE' | 'CREDIT_NOTE' | 'PROFORMA';

export type InvoiceStatus =
  | 'DRAFT'
  | 'SENT'
  | 'PAID'
  | 'PARTIALLY_PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export const INVOICE_TYPE_CONFIG: Record<InvoiceType, { label: string; color: string }> = {
  INVOICE: { label: 'Facture', color: 'blue' },
  CREDIT_NOTE: { label: 'Avoir', color: 'orange' },
  PROFORMA: { label: 'Proforma', color: 'purple' },
};

export const INVOICE_STATUS_CONFIG: Record<InvoiceStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Brouillon', color: 'default' },
  SENT: { label: 'Envoyée', color: 'processing' },
  PAID: { label: 'Payée', color: 'success' },
  PARTIALLY_PAID: { label: 'Partiellement payée', color: 'warning' },
  OVERDUE: { label: 'En retard', color: 'error' },
  CANCELLED: { label: 'Annulée', color: 'default' },
};
