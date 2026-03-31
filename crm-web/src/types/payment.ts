export interface Payment {
  id: string;
  paymentNumber: string;
  account: {
    id: string;
    name: string;
  };
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  bankAccount?: string;
  status: PaymentStatus;
  notes?: string;
  createdBy?: {
    id: string;
    fullName: string;
  };
  allocations: PaymentAllocation[];
  allocatedAmount: number;
  unallocatedAmount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentListItem {
  id: string;
  paymentNumber: string;
  accountName: string;
  accountId: string;
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  status: PaymentStatus;
  allocatedAmount: number;
  unallocatedAmount: number;
  createdByName?: string;
}

export interface PaymentAllocation {
  id: string;
  paymentId: string;
  invoiceId: string;
  invoiceNumber?: string;
  amount: number;
  createdAt: string;
}

export interface CreatePaymentRequest {
  accountId: string;
  paymentDate: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  reference?: string;
  bankAccount?: string;
  status?: PaymentStatus;
  notes?: string;
}

export interface UpdatePaymentRequest extends CreatePaymentRequest {}

export interface CreateAllocationRequest {
  invoiceId: string;
  amount: number;
}

export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  monthlyAmount: number;
  monthlyPayments: number;
  pendingPayments: number;
  pendingAmount: number;
}

export type PaymentMethod =
  | 'CASH'
  | 'CHECK'
  | 'BANK_TRANSFER'
  | 'CREDIT_CARD'
  | 'DIRECT_DEBIT'
  | 'MOBILE_PAYMENT'
  | 'OTHER';

export type PaymentStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'DEPOSITED'
  | 'CONFIRMED'
  | 'RETURNED'
  | 'CANCELLED';

export const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, { label: string; color: string }> = {
  CASH: { label: 'Espèces', color: 'green' },
  CHECK: { label: 'Chèque', color: 'blue' },
  BANK_TRANSFER: { label: 'Virement', color: 'purple' },
  CREDIT_CARD: { label: 'Carte bancaire', color: 'cyan' },
  DIRECT_DEBIT: { label: 'Prélèvement', color: 'geekblue' },
  MOBILE_PAYMENT: { label: 'Paiement mobile', color: 'magenta' },
  OTHER: { label: 'Autre', color: 'default' },
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { label: string; color: string }> = {
  PENDING: { label: 'En attente', color: 'orange' },
  RECEIVED: { label: 'Reçu', color: 'blue' },
  DEPOSITED: { label: 'Déposé', color: 'cyan' },
  CONFIRMED: { label: 'Confirmé', color: 'green' },
  RETURNED: { label: 'Retourné', color: 'red' },
  CANCELLED: { label: 'Annulé', color: 'default' },
};

export const CURRENCIES = [
  { value: 'MAD', label: 'MAD - Dirham marocain' },
  { value: 'EUR', label: 'EUR - Euro' },
  { value: 'USD', label: 'USD - Dollar américain' },
];
